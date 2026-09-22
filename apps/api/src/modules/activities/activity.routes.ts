import { getCollections, serializeDocument } from '@club/database'
import { createActivityGroupSchema, createActivitySchema, createSessionSchema } from '@club/schemas'
import type { FastifyInstance } from 'fastify'
import { randomUUID } from 'node:crypto'

import { getOrganizationParams, parseBody } from '../../lib/request'

export async function activityRoutes(app: FastifyInstance) {
  app.get('/organizations/:organizationId/activities', async (request) => {
    const { organizationId } = getOrganizationParams(request.params)
    const { activities } = await getCollections()
    const documents = await activities.find({ organizationId }).sort({ name: 1 }).toArray()

    return documents.map(serializeDocument)
  })

  app.post('/activities', async (request, reply) => {
    const input = parseBody(createActivitySchema, request.body, reply)
    if (!input) return

    const { activities } = await getCollections()
    const activity = {
      _id: randomUUID(),
      ...input,
      description: input.description ?? null,
      category: input.category ?? null,
      minimumAge: input.minimumAge ?? null,
      maximumAge: input.maximumAge ?? null,
      active: true,
      createdAt: new Date(),
    }

    await activities.insertOne(activity)
    return reply.code(201).send(serializeDocument(activity))
  })

  app.get('/organizations/:organizationId/activity-groups', async (request) => {
    const { organizationId } = getOrganizationParams(request.params)
    const { activityGroups, groupTeachers } = await getCollections()
    const [groups, assignments] = await Promise.all([
      activityGroups.find({ organizationId }).sort({ name: 1 }).toArray(),
      groupTeachers.find({ organizationId }).toArray(),
    ])

    return groups.map((group) => ({
      ...serializeDocument(group),
      teacherIds: assignments
        .filter((assignment) => assignment.groupId === group._id)
        .map((assignment) => assignment.teacherId),
    }))
  })

  app.post('/activity-groups', async (request, reply) => {
    const input = parseBody(createActivityGroupSchema, request.body, reply)
    if (!input) return

    const collections = await getCollections()
    const [activity, teacherCount, school] = await Promise.all([
      collections.activities.findOne({ _id: input.activityId, organizationId: input.organizationId, active: true }),
      collections.teachers.countDocuments({ _id: { $in: input.teacherIds }, organizationId: input.organizationId, active: true }),
      input.schoolId ? collections.schools.findOne({ _id: input.schoolId, organizationId: input.organizationId, active: true }) : null,
    ])

    if (!activity) return reply.code(400).send({ error: 'Activity does not belong to the organization' })
    if (input.scope === 'school' && !school) return reply.code(400).send({ error: 'School does not belong to the organization' })
    if (teacherCount !== new Set(input.teacherIds).size) return reply.code(400).send({ error: 'One or more teachers do not belong to the organization' })

    const { teacherIds, ...groupInput } = input
    const group = {
      _id: randomUUID(),
      ...groupInput,
      schoolId: groupInput.schoolId ?? null,
      venueId: groupInput.venueId ?? null,
      active: true,
      createdAt: new Date(),
    }

    await collections.activityGroups.insertOne(group)

    if (teacherIds.length) {
      await collections.groupTeachers.insertMany(teacherIds.map((teacherId, index) => ({
        _id: randomUUID(),
        organizationId: group.organizationId,
        groupId: group._id,
        teacherId,
        role: index === 0 ? 'lead' : 'assistant',
      })))
    }

    return reply.code(201).send({ ...serializeDocument(group), teacherIds })
  })

  app.get('/organizations/:organizationId/sessions', async (request) => {
    const { organizationId } = getOrganizationParams(request.params)
    const { groupId } = request.query as { groupId?: string }
    const { sessions } = await getCollections()
    const documents = await sessions
      .find({ organizationId, ...(groupId ? { groupId } : {}) })
      .sort({ date: 1, startsAt: 1 })
      .toArray()

    return documents.map(serializeDocument)
  })

  app.post('/sessions', async (request, reply) => {
    const input = parseBody(createSessionSchema, request.body, reply)
    if (!input) return

    const { activityGroups, sessions } = await getCollections()
    const group = await activityGroups.findOne({
      _id: input.groupId,
      organizationId: input.organizationId,
      active: true,
    })

    if (!group) return reply.code(400).send({ error: 'Activity group does not belong to the organization' })

    const session = {
      _id: randomUUID(),
      ...input,
      venueId: input.venueId ?? group.venueId ?? null,
      notes: input.notes ?? null,
      status: 'scheduled' as const,
      createdAt: new Date(),
    }

    await sessions.insertOne(session)
    return reply.code(201).send(serializeDocument(session))
  })
}
