import {
  type ActivityDocument,
  getCollections,
  serializeDocument,
} from "@club/database";
import {
  createActivityGroupSchema,
  createActivitySchema,
  createSessionSchema,
  updateActivityGroupSchema,
  updateActivitySchema,
} from "@club/schemas";
import type { FastifyInstance } from "fastify";
import type { Filter } from "mongodb";
import { randomUUID } from "node:crypto";

import {
  escapeRegex,
  getListQuery,
  getOrganizationParams,
  paginated,
  parseBody,
} from "../../lib/request";

export async function activityRoutes(app: FastifyInstance) {
  app.get("/organizations/:organizationId/activities", async (request) => {
    const { organizationId } = getOrganizationParams(request.params);
    const { activities, activityGroups, groupTeachers, enrollments } =
      await getCollections();
    const query = getListQuery(request.query);
    const filter: Filter<ActivityDocument> = {
      organizationId,
      ...(query.active === undefined ? {} : { active: query.active }),
      ...(query.categoryGroup === "casals"
        ? { category: { $regex: "^casal", $options: "i" } }
        : query.categoryGroup === "extraescolares"
          ? { category: { $regex: "^extraescolar", $options: "i" } }
          : query.categoryGroup === "otros"
            ? {
                $nor: [
                  { category: { $regex: "^casal", $options: "i" } },
                  { category: { $regex: "^extraescolar", $options: "i" } },
                ],
              }
            : {}),
      ...(query.search
        ? {
            $or: [
              { name: { $regex: escapeRegex(query.search), $options: "i" } },
              {
                description: {
                  $regex: escapeRegex(query.search),
                  $options: "i",
                },
              },
              {
                category: { $regex: escapeRegex(query.search), $options: "i" },
              },
            ],
          }
        : {}),
    };
    const [documents, total] = await Promise.all([
      activities
        .find(filter)
        .sort({ name: 1 })
        .skip(query.skip)
        .limit(query.pageSize)
        .toArray(),
      activities.countDocuments(filter),
    ]);

    const activityIds = documents.map((activity) => activity._id);
    const [groups, assignments, activeEnrollments] = await Promise.all([
      activityGroups
        .find({ organizationId, activityId: { $in: activityIds } })
        .toArray(),
      groupTeachers.find({ organizationId }).toArray(),
      enrollments.find({ organizationId, status: "active" }).toArray(),
    ]);

    const items = documents.map((activity) => {
      const activityGroups = groups.filter(
        (group) => group.activityId === activity._id,
      );
      const groupIds = new Set(activityGroups.map((group) => group._id));
      const teacherIds = new Set(
        assignments
          .filter((assignment) => groupIds.has(assignment.groupId))
          .map((assignment) => assignment.teacherId),
      );
      const participantIds = new Set(
        activeEnrollments
          .filter((enrollment) => groupIds.has(enrollment.groupId))
          .map((enrollment) => enrollment.studentId),
      );
      const schoolIds = new Set(
        activityGroups.flatMap((group) =>
          group.schoolId ? [group.schoolId] : [],
        ),
      );

      return {
        ...serializeDocument(activity),
        groupCount: activityGroups.length,
        teacherCount: teacherIds.size,
        participantCount: participantIds.size,
        schoolCount: schoolIds.size,
      };
    });

    return paginated(items, total, query.page, query.pageSize);
  });

  app.post("/activities", async (request, reply) => {
    const input = parseBody(createActivitySchema, request.body, reply);
    if (!input) return;

    const { activities } = await getCollections();
    const activity = {
      _id: randomUUID(),
      ...input,
      description: input.description ?? null,
      category: input.category ?? null,
      minimumAge: input.minimumAge ?? null,
      maximumAge: input.maximumAge ?? null,
      active: true,
      createdAt: new Date(),
    };

    await activities.insertOne(activity);
    return reply.code(201).send(serializeDocument(activity));
  });

  app.put("/activities/:activityId", async (request, reply) => {
    const { organizationId } = getOrganizationParams(
      request.body as { organizationId?: string },
    );
    const { activityId } = request.params as { activityId: string };
    const input = parseBody(updateActivitySchema, request.body, reply);
    if (!input) return;

    const { activities } = await getCollections();
    const result = await activities.findOneAndUpdate(
      { _id: activityId, organizationId },
      { $set: input },
      { returnDocument: "after" },
    );

    if (!result)
      return reply.code(404).send({ error: "Actividad no encontrada" });
    return serializeDocument(result);
  });

  app.delete("/activities/:activityId", async (request, reply) => {
    const { organizationId } = getOrganizationParams(
      request.body as { organizationId?: string },
    );
    const { activityId } = request.params as { activityId: string };
    const { activities } = await getCollections();
    const result = await activities.findOneAndUpdate(
      { _id: activityId, organizationId },
      { $set: { active: false } },
      { returnDocument: "after" },
    );

    if (!result)
      return reply.code(404).send({ error: "Actividad no encontrada" });
    return serializeDocument(result);
  });

  app.get("/organizations/:organizationId/activity-groups", async (request) => {
    const { organizationId } = getOrganizationParams(request.params);
    const { activities, activityGroups, enrollments, groupTeachers } =
      await getCollections();
    const [groups, activityRecords, assignments, activeEnrollments] =
      await Promise.all([
        activityGroups
          .find({ organizationId, active: true })
          .sort({ name: 1 })
          .toArray(),
        activities.find({ organizationId, active: true }).toArray(),
        groupTeachers.find({ organizationId }).toArray(),
        enrollments.find({ organizationId, status: "active" }).toArray(),
      ]);

    return groups.map((group) => ({
      ...serializeDocument(group),
      activityName:
        activityRecords.find((activity) => activity._id === group.activityId)
          ?.name ?? "Actividad",
      teacherIds: assignments
        .filter((assignment) => assignment.groupId === group._id)
        .map((assignment) => assignment.teacherId),
      studentIds: activeEnrollments
        .filter((enrollment) => enrollment.groupId === group._id)
        .map((enrollment) => enrollment.studentId),
      participantCount: activeEnrollments.filter(
        (enrollment) => enrollment.groupId === group._id,
      ).length,
    }));
  });

  app.post("/activity-groups", async (request, reply) => {
    const input = parseBody(createActivityGroupSchema, request.body, reply);
    if (!input) return;

    const collections = await getCollections();
    const [activity, teacherCount, school] = await Promise.all([
      collections.activities.findOne({
        _id: input.activityId,
        organizationId: input.organizationId,
        active: true,
      }),
      collections.teachers.countDocuments({
        _id: { $in: input.teacherIds },
        organizationId: input.organizationId,
        active: true,
      }),
      input.schoolId
        ? collections.schools.findOne({
            _id: input.schoolId,
            organizationId: input.organizationId,
            active: true,
          })
        : null,
    ]);

    if (!activity)
      return reply
        .code(400)
        .send({ error: "Activity does not belong to the organization" });
    if (input.scope === "school" && !school)
      return reply
        .code(400)
        .send({ error: "School does not belong to the organization" });
    if (teacherCount !== new Set(input.teacherIds).size)
      return reply
        .code(400)
        .send({
          error: "One or more teachers do not belong to the organization",
        });

    const { teacherIds, ...groupInput } = input;
    const group = {
      _id: randomUUID(),
      ...groupInput,
      schoolId: groupInput.schoolId ?? null,
      venueId: groupInput.venueId ?? null,
      active: true,
      createdAt: new Date(),
    };

    await collections.activityGroups.insertOne(group);

    if (teacherIds.length) {
      await collections.groupTeachers.insertMany(
        teacherIds.map((teacherId, index) => ({
          _id: randomUUID(),
          organizationId: group.organizationId,
          groupId: group._id,
          teacherId,
          role: index === 0 ? "lead" : "assistant",
        })),
      );
    }

    return reply.code(201).send({ ...serializeDocument(group), teacherIds });
  });

  app.put("/activity-groups/:groupId", async (request, reply) => {
    const { organizationId } = getOrganizationParams(
      request.body as { organizationId?: string },
    );
    const { groupId } = request.params as { groupId: string };
    const input = parseBody(updateActivityGroupSchema, request.body, reply);
    if (!input) return;

    const collections = await getCollections();
    const current = await collections.activityGroups.findOne({
      _id: groupId,
      organizationId,
    });
    if (!current) return reply.code(404).send({ error: "Grupo no encontrado" });

    const { teacherIds, studentIds, ...groupInput } = input;
    if (input.activityId) {
      const activity = await collections.activities.findOne({
        _id: input.activityId,
        organizationId,
        active: true,
      });
      if (!activity)
        return reply
          .code(400)
          .send({
            error: "La actividad seleccionada no pertenece a la organización",
          });
    }
    if (input.schoolId) {
      const school = await collections.schools.findOne({
        _id: input.schoolId,
        organizationId,
        active: true,
      });
      if (!school)
        return reply
          .code(400)
          .send({
            error: "El centro seleccionado no pertenece a la organización",
          });
    }
    if (teacherIds) {
      const teacherCount = await collections.teachers.countDocuments({
        _id: { $in: teacherIds },
        organizationId,
        active: true,
      });
      if (teacherCount !== new Set(teacherIds).size)
        return reply
          .code(400)
          .send({
            error: "Uno o más profesores no pertenecen a la organización",
          });
      await collections.groupTeachers.deleteMany({ organizationId, groupId });
      if (teacherIds.length)
        await collections.groupTeachers.insertMany(
          teacherIds.map((teacherId, index) => ({
            _id: randomUUID(),
            organizationId,
            groupId,
            teacherId,
            role: index === 0 ? ("lead" as const) : ("assistant" as const),
          })),
        );
    }
    if (studentIds) {
      const studentCount = await collections.students.countDocuments({
        _id: { $in: studentIds },
        organizationId,
        active: true,
      });
      if (studentCount !== new Set(studentIds).size)
        return reply
          .code(400)
          .send({ error: "Uno o más alumnos no pertenecen a la organización" });
      await collections.enrollments.deleteMany({ organizationId, groupId });
      if (studentIds.length)
        await collections.enrollments.insertMany(
          studentIds.map((studentId) => ({
            _id: randomUUID(),
            organizationId,
            groupId,
            studentId,
            status: "active" as const,
            enrolledAt: new Date(),
          })),
        );
    }

    const updated = Object.keys(groupInput).length
      ? await collections.activityGroups.findOneAndUpdate(
          { _id: groupId, organizationId },
          { $set: groupInput },
          { returnDocument: "after" },
        )
      : current;
    return serializeDocument(updated ?? current);
  });

  app.delete("/activity-groups/:groupId", async (request, reply) => {
    const { organizationId } = getOrganizationParams(
      request.body as { organizationId?: string },
    );
    const { groupId } = request.params as { groupId: string };
    const { activityGroups } = await getCollections();
    const result = await activityGroups.findOneAndUpdate(
      { _id: groupId, organizationId },
      { $set: { active: false } },
      { returnDocument: "after" },
    );
    if (!result) return reply.code(404).send({ error: "Grupo no encontrado" });
    return serializeDocument(result);
  });

  app.get("/organizations/:organizationId/sessions", async (request) => {
    const { organizationId } = getOrganizationParams(request.params);
    const { groupId } = request.query as { groupId?: string };
    const { sessions } = await getCollections();
    const documents = await sessions
      .find({ organizationId, ...(groupId ? { groupId } : {}) })
      .sort({ date: 1, startsAt: 1 })
      .toArray();

    return documents.map(serializeDocument);
  });

  app.post("/sessions", async (request, reply) => {
    const input = parseBody(createSessionSchema, request.body, reply);
    if (!input) return;

    const { activityGroups, sessions } = await getCollections();
    const group = await activityGroups.findOne({
      _id: input.groupId,
      organizationId: input.organizationId,
      active: true,
    });

    if (!group)
      return reply
        .code(400)
        .send({ error: "Activity group does not belong to the organization" });

    const session = {
      _id: randomUUID(),
      ...input,
      venueId: input.venueId ?? group.venueId ?? null,
      notes: input.notes ?? null,
      status: "scheduled" as const,
      createdAt: new Date(),
    };

    await sessions.insertOne(session);
    return reply.code(201).send(serializeDocument(session));
  });
}
