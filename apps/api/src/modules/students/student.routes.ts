import { getCollections, serializeDocument, type StudentDocument } from '@club/database'
import { createStudentSchema } from '@club/schemas'
import type { FastifyInstance } from 'fastify'
import type { Filter } from 'mongodb'
import { randomUUID } from 'node:crypto'

import { escapeRegex, getListQuery, getOrganizationParams, paginated, parseBody } from '../../lib/request'

export async function studentRoutes(app: FastifyInstance) {
  app.get('/organizations/:organizationId/students', async (request) => {
    const { organizationId } = getOrganizationParams(request.params)
    const { students } = await getCollections()
    const query = getListQuery(request.query)
    const filter: Filter<StudentDocument> = {
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
    const [documents, total] = await Promise.all([
      students.find(filter).sort({ lastName: 1, firstName: 1 }).skip(query.skip).limit(query.pageSize).toArray(),
      students.countDocuments(filter),
    ])

    return paginated(documents.map((document) => ({
      ...serializeDocument(document),
      foodIntolerances: document.foodIntolerances ?? [],
      status: document.status ?? (document.active ? 'active' : 'inactive'),
    })), total, query.page, query.pageSize)
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
      { $set: { schoolId: input.schoolId, firstName: input.firstName, lastName: input.lastName, birthDate: input.birthDate ?? null, notes: input.notes ?? null, foodIntolerances: input.foodIntolerances, status: input.status, active: input.status === 'active' } },
      { returnDocument: 'after' },
    )

    if (!updated) return reply.code(404).send({ error: 'Student not found' })
    return serializeDocument(updated)
  })
}
