import { getCollections } from '@club/database'
import { createSchoolSchema, createStudentSchema, createTeacherSchema } from '@club/schemas'
import type { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'
import * as XLSX from 'xlsx'

type Entity = 'schools' | 'teachers' | 'students'

function isEntity(value: string): value is Entity {
  return ['schools', 'teachers', 'students'].includes(value)
}

function text(row: Record<string, unknown>, key: string) {
  const value = row[key]
  return value === undefined || value === null ? '' : String(value).trim()
}

function studentStatus(row: Record<string, unknown>) {
  const value = text(row, 'status').toLowerCase()
  const statuses = { active: 'active', activo: 'active', inactive: 'inactive', inactivo: 'inactive', paused: 'paused', pausado: 'paused' } as const

  return statuses[value as keyof typeof statuses] ?? 'active'
}

export async function communicationRoutes(app: FastifyInstance) {
  app.get('/organizations/:organizationId/export/:entity', async (request, reply) => {
    const { organizationId, entity } = request.params as { organizationId: string; entity: string }
    const { format = 'csv' } = request.query as { format?: 'csv' | 'xlsx' }
    if (!isEntity(entity) || !['csv', 'xlsx'].includes(format)) return reply.code(400).send({ error: 'Invalid export request' })

    const collections = await getCollections()
    const schools = await collections.schools.find({ organizationId }).sort({ name: 1 }).toArray()
    const schoolNames = new Map(schools.map((school) => [school._id, school.name]))
    let rows: Record<string, unknown>[]

    if (entity === 'schools') {
      rows = schools.map((school) => ({ name: school.name, address: school.address ?? '', contactEmail: school.contactEmail ?? '', active: school.active }))
    } else if (entity === 'teachers') {
      const [teachers, assignments] = await Promise.all([
        collections.teachers.find({ organizationId }).sort({ lastName: 1 }).toArray(),
        collections.teacherSchoolAssignments.find({ organizationId }).toArray(),
      ])
      rows = teachers.map((teacher) => ({ firstName: teacher.firstName, lastName: teacher.lastName, email: teacher.email, phone: teacher.phone ?? '', schoolNames: assignments.filter((assignment) => assignment.teacherId === teacher._id).map((assignment) => schoolNames.get(assignment.schoolId)).filter(Boolean).join('; ') }))
    } else {
      const students = await collections.students.find({ organizationId }).sort({ lastName: 1 }).toArray()
      rows = students.map((student) => ({ firstName: student.firstName, lastName: student.lastName, birthDate: student.birthDate ?? '', schoolName: schoolNames.get(student.schoolId) ?? '', foodIntolerances: (student.foodIntolerances ?? []).join('; '), status: student.status ?? (student.active ? 'active' : 'inactive'), notes: student.notes ?? '' }))
    }

    const sheet = XLSX.utils.json_to_sheet(rows)
    const filename = `${entity}-${new Date().toISOString().slice(0, 10)}.${format}`
    reply.header('Content-Disposition', `attachment; filename="${filename}"`)

    if (format === 'csv') {
      reply.type('text/csv; charset=utf-8')
      return `\uFEFF${XLSX.utils.sheet_to_csv(sheet)}`
    }

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, sheet, entity)
    reply.type('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
    return reply.send(XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' }))
  })

  app.post('/organizations/:organizationId/import', async (request, reply) => {
    const { organizationId } = request.params as { organizationId: string }
    const { entity, rows } = request.body as { entity?: string; rows?: Record<string, unknown>[] }
    if (!entity || !isEntity(entity) || !Array.isArray(rows) || rows.length > 5000) return reply.code(400).send({ error: 'Invalid import request or too many rows' })

    const collections = await getCollections()
    let created = 0
    let updated = 0
    const errors: { row: number; message: string }[] = []

    for (const [index, row] of rows.entries()) {
      try {
        if (entity === 'schools') {
          const parsed = createSchoolSchema.parse({ organizationId, name: text(row, 'name'), address: text(row, 'address') || undefined, contactEmail: text(row, 'contactEmail') || undefined })
          const result = await collections.schools.updateOne(
            { organizationId, name: parsed.name },
            { $set: { address: parsed.address ?? null, contactEmail: parsed.contactEmail ?? null, active: true }, $setOnInsert: { _id: randomUUID(), organizationId, name: parsed.name, createdAt: new Date() } },
            { upsert: true },
          )
          if (result.upsertedCount) created++
          else updated++
        } else if (entity === 'teachers') {
          const names = text(row, 'schoolNames').split(';').map((name) => name.trim()).filter(Boolean)
          const schools = names.length ? await collections.schools.find({ organizationId, name: { $in: names } }).toArray() : []
          if (schools.length !== new Set(names).size) throw new Error('One or more school names do not exist')
          const parsed = createTeacherSchema.parse({ organizationId, firstName: text(row, 'firstName'), lastName: text(row, 'lastName'), email: text(row, 'email'), phone: text(row, 'phone') || undefined, schoolIds: schools.map((school) => school._id) })
          const existing = await collections.teachers.findOne({ organizationId, email: parsed.email })
          const teacherId = existing?._id ?? randomUUID()
          await collections.teachers.updateOne({ _id: teacherId }, { $set: { organizationId, firstName: parsed.firstName, lastName: parsed.lastName, email: parsed.email, phone: parsed.phone ?? null, active: true }, $setOnInsert: { createdAt: new Date() } }, { upsert: true })
          await collections.teacherSchoolAssignments.deleteMany({ organizationId, teacherId })
          if (schools.length) await collections.teacherSchoolAssignments.insertMany(schools.map((school) => ({ _id: randomUUID(), organizationId, teacherId, schoolId: school._id, createdAt: new Date() })))
          if (existing) updated++
          else created++
        } else {
          const school = await collections.schools.findOne({ organizationId, name: text(row, 'schoolName') })
          if (!school) throw new Error('School name does not exist')
          const parsed = createStudentSchema.parse({ organizationId, schoolId: school._id, firstName: text(row, 'firstName'), lastName: text(row, 'lastName'), birthDate: text(row, 'birthDate') || undefined, notes: text(row, 'notes') || undefined, foodIntolerances: text(row, 'foodIntolerances').split(';').map((item) => item.trim()).filter(Boolean), status: studentStatus(row) })
          const existing = await collections.students.findOne({ organizationId, schoolId: school._id, firstName: parsed.firstName, lastName: parsed.lastName, birthDate: parsed.birthDate ?? null })
          await collections.students.updateOne(
            { _id: existing?._id ?? randomUUID() },
            { $set: { ...parsed, birthDate: parsed.birthDate ?? null, notes: parsed.notes ?? null, active: parsed.status === 'active' }, $setOnInsert: { createdAt: new Date() } },
            { upsert: true },
          )
          if (existing) updated++
          else created++
        }
      } catch (error) {
        errors.push({ row: index + 2, message: error instanceof Error ? error.message : 'Invalid row' })
      }
    }

    return { total: rows.length, created, updated, rejected: errors.length, errors: errors.slice(0, 100) }
  })
}
