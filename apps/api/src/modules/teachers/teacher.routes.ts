import { getCollections, serializeDocument, type TeacherDocument } from '@club/database'
import { createTeacherSchema } from '@club/schemas'
import type { FastifyInstance } from 'fastify'
import type { Filter } from 'mongodb'
import { randomUUID } from 'node:crypto'

import { escapeRegex, getListQuery, getOrganizationParams, paginated, parseBody } from '../../lib/request'

export async function teacherRoutes(app: FastifyInstance) {
  app.get('/organizations/:organizationId/teachers', async (request) => {
    const { organizationId } = getOrganizationParams(request.params)
    const { teachers, teacherSchoolAssignments } = await getCollections()
    const query = getListQuery(request.query)
    const schoolAssignments = query.schoolId
      ? await teacherSchoolAssignments.find({ organizationId, schoolId: query.schoolId }).toArray()
      : []
    const filter: Filter<TeacherDocument> = {
      organizationId,
      ...(query.active === undefined ? {} : { active: query.active }),
      ...(query.schoolId ? { _id: { $in: schoolAssignments.map((assignment) => assignment.teacherId) } } : {}),
      ...(query.search ? {
        $or: [
          { firstName: { $regex: escapeRegex(query.search), $options: 'i' } },
          { lastName: { $regex: escapeRegex(query.search), $options: 'i' } },
          { email: { $regex: escapeRegex(query.search), $options: 'i' } },
        ],
      } : {}),
    }
    const [documents, total] = await Promise.all([
      teachers.find(filter).sort({ lastName: 1, firstName: 1 }).skip(query.skip).limit(query.pageSize).toArray(),
      teachers.countDocuments(filter),
    ])
    const assignments = documents.length
      ? await teacherSchoolAssignments.find({ organizationId, teacherId: { $in: documents.map((teacher) => teacher._id) } }).toArray()
      : []

    const items = documents.map((teacher) => ({
      ...serializeDocument(teacher),
      schoolIds: assignments
        .filter((assignment) => assignment.teacherId === teacher._id)
        .map((assignment) => assignment.schoolId),
    }))

    return paginated(items, total, query.page, query.pageSize)
  })

  app.post('/teachers', async (request, reply) => {
    const input = parseBody(createTeacherSchema, request.body, reply)
    if (!input) return

    const { teachers, schools, teacherSchoolAssignments } = await getCollections()
    const schoolCount = await schools.countDocuments({
      _id: { $in: input.schoolIds },
      organizationId: input.organizationId,
      active: true,
    })

    if (schoolCount !== new Set(input.schoolIds).size) {
      return reply.code(400).send({ error: 'One or more schools do not belong to the organization' })
    }

    const { schoolIds, ...profile } = input
    const teacher = {
      _id: randomUUID(),
      ...profile,
      phone: profile.phone ?? null,
      active: true,
      createdAt: new Date(),
    }

    await teachers.insertOne(teacher)

    if (schoolIds.length) {
      await teacherSchoolAssignments.insertMany(schoolIds.map((schoolId) => ({
        _id: randomUUID(),
        organizationId: teacher.organizationId,
        teacherId: teacher._id,
        schoolId,
        createdAt: new Date(),
      })))
    }

    return reply.code(201).send({ ...serializeDocument(teacher), schoolIds })
  })

  app.put('/teachers/:teacherId', async (request, reply) => {
    const input = parseBody(createTeacherSchema, request.body, reply)
    if (!input) return

    const { teacherId } = request.params as { teacherId: string }
    const { teachers, schools, teacherSchoolAssignments } = await getCollections()
    const schoolCount = await schools.countDocuments({ _id: { $in: input.schoolIds }, organizationId: input.organizationId, active: true })

    if (schoolCount !== new Set(input.schoolIds).size) return reply.code(400).send({ error: 'One or more schools do not belong to the organization' })

    const updated = await teachers.findOneAndUpdate(
      { _id: teacherId, organizationId: input.organizationId },
      { $set: { firstName: input.firstName, lastName: input.lastName, email: input.email, phone: input.phone ?? null } },
      { returnDocument: 'after' },
    )

    if (!updated) return reply.code(404).send({ error: 'Teacher not found' })

    await teacherSchoolAssignments.deleteMany({ organizationId: input.organizationId, teacherId })
    if (input.schoolIds.length) {
      await teacherSchoolAssignments.insertMany(input.schoolIds.map((schoolId) => ({ _id: randomUUID(), organizationId: input.organizationId, teacherId, schoolId, createdAt: new Date() })))
    }

    return { ...serializeDocument(updated), schoolIds: input.schoolIds }
  })
}
