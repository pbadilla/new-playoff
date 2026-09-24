import { getCollections, serializeDocument, type StudentDocument } from '@club/database'
import { createStudentSchema, studentGuardiansSchema, studentPaymentSettingsSchema } from '@club/schemas'
import type { FastifyInstance } from 'fastify'
import type { Filter } from 'mongodb'
import { randomUUID } from 'node:crypto'

import { escapeRegex, getListQuery, getOrganizationParams, paginated, parseBody } from '../../lib/request'

export async function studentRoutes(app: FastifyInstance) {
  app.get('/organizations/:organizationId/students', async (request) => {
    const { organizationId } = getOrganizationParams(request.params)
    const { students } = await getCollections()
    const query = getListQuery(request.query)
    const baseFilter: Filter<StudentDocument> = {
      organizationId,
      ...(query.schoolId ? { schoolId: query.schoolId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.active === undefined ? {} : { active: query.active }),
      ...(query.search ? {
        $or: [
          { firstName: { $regex: escapeRegex(query.search), $options: 'i' } },
          { lastName: { $regex: escapeRegex(query.search), $options: 'i' } },
        ],
      } : {}),
    }
    const filter: Filter<StudentDocument> = {
      ...baseFilter,
      ...(query.initial ? { firstName: { $regex: `^${escapeRegex(query.initial)}`, $options: 'i' } } : {}),
    }
    const [documents, total, initialRows] = await Promise.all([
      students.find(filter).collation({ locale: 'es', strength: 1 }).sort({ firstName: 1, lastName: 1 }).skip(query.skip).limit(query.pageSize).toArray(),
      students.countDocuments(filter),
      students.aggregate<{ _id: string }>([
        { $match: baseFilter },
        { $project: { initial: { $toUpper: { $substrCP: [{ $convert: { input: '$firstName', to: 'string', onError: '', onNull: '' } }, 0, 1] } } } },
        { $group: { _id: '$initial' } },
      ]).toArray(),
    ])

    return {
      ...paginated(documents.map((document) => ({
        ...serializeDocument(document),
        foodIntolerances: document.foodIntolerances ?? [],
        scholarships: document.scholarships ?? [],
        status: document.status ?? (document.active ? 'active' : 'inactive'),
      })), total, query.page, query.pageSize),
      availableInitials: initialRows.map((row) => row._id),
    }
  })

  app.post('/students', async (request, reply) => {
    const input = parseBody(createStudentSchema, request.body, reply)
    if (!input) return

    const { schools, students } = await getCollections()
    const school = await schools.findOne({
      _id: input.schoolId,
      organizationId: input.organizationId,
      active: true,
    })

    if (!school) return reply.code(400).send({ error: 'School does not belong to the organization' })

    const student = {
      _id: randomUUID(),
      ...input,
      birthDate: input.birthDate ?? null,
      notes: input.notes ?? null,
      foodIntolerances: input.foodIntolerances,
      scholarships: input.scholarships,
      status: input.status,
      active: input.status === 'active',
      createdAt: new Date(),
    }

    await students.insertOne(student)
    return reply.code(201).send(serializeDocument(student))
  })

  app.put('/students/:studentId', async (request, reply) => {
    const input = parseBody(createStudentSchema, request.body, reply)
    if (!input) return

    const { studentId } = request.params as { studentId: string }
    const { schools, students } = await getCollections()
    const school = await schools.findOne({ _id: input.schoolId, organizationId: input.organizationId, active: true })

    if (!school) return reply.code(400).send({ error: 'School does not belong to the organization' })

    const updated = await students.findOneAndUpdate(
      { _id: studentId, organizationId: input.organizationId },
      { $set: { schoolId: input.schoolId, firstName: input.firstName, lastName: input.lastName, birthDate: input.birthDate ?? null, notes: input.notes ?? null, foodIntolerances: input.foodIntolerances, scholarships: input.scholarships, status: input.status, active: input.status === 'active' } },
      { returnDocument: 'after' },
    )

    if (!updated) return reply.code(404).send({ error: 'Student not found' })
    return serializeDocument(updated)
  })

  app.get('/students/:studentId/payment-settings', async (request, reply) => {
    const { studentId } = request.params as { studentId: string }
    const { organizationId } = request.query as { organizationId: string }
    const { students, studentPaymentSettings } = await getCollections()
    if (!await students.findOne({ _id: studentId, organizationId })) return reply.code(404).send({ error: 'Student not found' })

    return await studentPaymentSettings.findOne({ studentId, organizationId }) ?? null
  })

  app.put('/students/:studentId/payment-settings', async (request, reply) => {
    const input = parseBody(studentPaymentSettingsSchema, request.body, reply)
    if (!input) return
    const { studentId } = request.params as { studentId: string }
    const { students, studentPaymentSettings } = await getCollections()
    if (!await students.findOne({ _id: studentId, organizationId: input.organizationId })) return reply.code(404).send({ error: 'Student not found' })

    const updated = await studentPaymentSettings.findOneAndUpdate(
      { studentId, organizationId: input.organizationId },
      { $set: { ...input, studentId, accountHolder: input.accountHolder ?? null, last4: input.last4 ?? null, cardBrand: input.cardBrand ?? null, phone: input.phone ?? null, reference: input.reference ?? null, updatedAt: new Date() }, $setOnInsert: { _id: randomUUID() } },
      { upsert: true, returnDocument: 'after' },
    )
    return serializeDocument(updated!)
  })

  app.delete('/students/:studentId/payment-settings', async (request, reply) => {
    const { studentId } = request.params as { studentId: string }
    const { organizationId } = request.query as { organizationId: string }
    const { studentPaymentSettings } = await getCollections()
    await studentPaymentSettings.deleteOne({ studentId, organizationId })
    return reply.code(204).send()
  })

  app.get('/students/:studentId/guardians', async (request, reply) => {
    const { studentId } = request.params as { studentId: string }
    const { organizationId } = request.query as { organizationId: string }
    const { students, guardians, studentGuardians } = await getCollections()
    if (!await students.findOne({ _id: studentId, organizationId })) return reply.code(404).send({ error: 'Student not found' })
    const links = await studentGuardians.find({ studentId, organizationId }).toArray()
    const documents = await guardians.find({ _id: { $in: links.map((link) => link.guardianId) }, organizationId }).toArray()

    return links.map((link) => {
      const guardian = documents.find((document) => document._id === link.guardianId)!
      return { ...serializeDocument(guardian), relationship: link.relationship, isPrimary: link.isPrimary }
    })
  })

  app.put('/students/:studentId/guardians', async (request, reply) => {
    const input = parseBody(studentGuardiansSchema, request.body, reply)
    if (!input) return
    const { studentId } = request.params as { studentId: string }
    const { students, guardians, studentGuardians } = await getCollections()
    if (!await students.findOne({ _id: studentId, organizationId: input.organizationId })) return reply.code(404).send({ error: 'Student not found' })
    if (new Set(input.guardians.map((guardian) => guardian.phone)).size !== input.guardians.length) return reply.code(400).send({ error: 'Guardian phones must be unique' })

    const links = []
    for (const guardianInput of input.guardians) {
      const guardian = await guardians.findOneAndUpdate(
        { organizationId: input.organizationId, phone: guardianInput.phone },
        { $set: { firstName: guardianInput.firstName, lastName: guardianInput.lastName, email: guardianInput.email ?? null }, $setOnInsert: { _id: randomUUID(), organizationId: input.organizationId, phone: guardianInput.phone, createdAt: new Date() } },
        { upsert: true, returnDocument: 'after' },
      )
      links.push({ _id: randomUUID(), organizationId: input.organizationId, studentId, guardianId: guardian!._id, relationship: guardianInput.relationship, isPrimary: guardianInput.isPrimary })
    }
    await studentGuardians.deleteMany({ studentId, organizationId: input.organizationId })
    if (links.length) await studentGuardians.insertMany(links)
    return input.guardians
  })
}
