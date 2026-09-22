import { getCollections, type SchoolDocument, serializeDocument } from '@club/database'
import { createSchoolSchema } from '@club/schemas'
import type { FastifyInstance } from 'fastify'
import type { Filter } from 'mongodb'
import { randomUUID } from 'node:crypto'

import { escapeRegex, getListQuery, getOrganizationParams, paginated, parseBody } from '../../lib/request'

export async function schoolRoutes(app: FastifyInstance) {
  app.get('/organizations/:organizationId/schools', async (request) => {
    const { organizationId } = getOrganizationParams(request.params)
    const { schools } = await getCollections()
    const query = getListQuery(request.query)
    const filter: Filter<SchoolDocument> = {
      organizationId,
      ...(query.active === undefined ? {} : { active: query.active }),
      ...(query.search ? {
        $or: [
          { name: { $regex: escapeRegex(query.search), $options: 'i' } },
          { address: { $regex: escapeRegex(query.search), $options: 'i' } },
          { contactEmail: { $regex: escapeRegex(query.search), $options: 'i' } },
        ],
      } : {}),
    }
    const [documents, total] = await Promise.all([
      schools.find(filter).sort({ name: 1 }).skip(query.skip).limit(query.pageSize).toArray(),
      schools.countDocuments(filter),
    ])

    return paginated(documents.map(serializeDocument), total, query.page, query.pageSize)
  })

  app.post('/schools', async (request, reply) => {
    const input = parseBody(createSchoolSchema, request.body, reply)
    if (!input) return

    const { schools } = await getCollections()
    const school = {
      _id: randomUUID(),
      ...input,
      address: input.address ?? null,
      contactEmail: input.contactEmail ?? null,
      active: true,
      createdAt: new Date(),
    }

    await schools.insertOne(school)
    return reply.code(201).send(serializeDocument(school))
  })

  app.put('/schools/:schoolId', async (request, reply) => {
    const input = parseBody(createSchoolSchema, request.body, reply)
    if (!input) return

    const { schoolId } = request.params as { schoolId: string }
    const { schools } = await getCollections()
    const updated = await schools.findOneAndUpdate(
      { _id: schoolId, organizationId: input.organizationId },
      { $set: { name: input.name, address: input.address ?? null, contactEmail: input.contactEmail ?? null } },
      { returnDocument: 'after' },
    )

    if (!updated) return reply.code(404).send({ error: 'School not found' })
    return serializeDocument(updated)
  })
}
