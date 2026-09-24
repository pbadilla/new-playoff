import { z } from "zod";

const uuid = z.uuid();
const requiredText = z.string().trim().min(1);
const optionalText = z.string().trim().min(1).optional();
const time = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Expected HH:mm");

export const organizationIdSchema = uuid;

export const createSchoolSchema = z.object({
  organizationId: uuid,
  name: requiredText,
  address: optionalText,
  contactEmail: z.email().optional(),
});

export const createTeacherSchema = z.object({
  organizationId: uuid,
  firstName: requiredText,
  lastName: requiredText,
  email: z.email(),
  phone: optionalText,
  schoolIds: z.array(uuid).default([]),
});

export const createStudentSchema = z.object({
  organizationId: uuid,
  schoolId: uuid,
  firstName: requiredText,
  lastName: requiredText,
  birthDate: z.string().date().optional(),
  notes: optionalText,
  foodIntolerances: z.array(requiredText).default([]),
  scholarships: z
    .array(
      z.object({
        academicYear: z.string().regex(/^\d{4}\/\d{4}$/, "Expected YYYY/YYYY"),
        activityType: requiredText,
        percentage: z.number().min(0).max(100),
        approved: z.boolean(),
      }),
    )
    .default([]),
  status: z.enum(["active", "inactive", "paused"]).default("active"),
});

export const studentPaymentSettingsSchema = z.object({
  organizationId: uuid,
  method: z.enum(["card", "direct-debit", "cash", "bizum", "transfer"]),
  accountHolder: optionalText,
  last4: z
    .string()
    .regex(/^\d{4}$/)
    .optional(),
  cardBrand: optionalText,
  phone: optionalText,
  reference: optionalText,
});

export const studentGuardiansSchema = z.object({
  organizationId: uuid,
  guardians: z
    .array(
      z.object({
        firstName: requiredText,
        lastName: requiredText,
        relationship: requiredText,
        phone: requiredText,
        email: z.email().optional(),
        isPrimary: z.boolean().default(false),
      }),
    )
    .max(10),
});

export const createActivitySchema = z.object({
  organizationId: uuid,
  name: requiredText,
  description: optionalText,
  category: optionalText,
  minimumAge: z.number().int().min(0).max(21).optional(),
  maximumAge: z.number().int().min(0).max(21).optional(),
});

export const updateActivitySchema = createActivitySchema.partial().extend({
  active: z.boolean().optional(),
});

export const weeklyScheduleSchema = z.object({
  dayOfWeek: z.number().int().min(1).max(7),
  startsAt: time,
  endsAt: time,
});

const activityGroupFields = z.object({
  organizationId: uuid,
  activityId: uuid,
  name: requiredText,
  scope: z.enum(["school", "external"]),
  schoolId: uuid.optional(),
  venueId: uuid.optional(),
  teacherIds: z.array(uuid).default([]),
  capacity: z.number().int().positive().max(1000),
  schedule: z.array(weeklyScheduleSchema).default([]),
});

export const createActivityGroupSchema = activityGroupFields.refine(
  (value) => value.scope !== "school" || value.schoolId,
  {
    message: "schoolId is required for school groups",
    path: ["schoolId"],
  },
);

export const updateActivityGroupSchema = z
  .object({
    organizationId: uuid,
    activityId: uuid.optional(),
    name: requiredText.optional(),
    scope: z.enum(["school", "external"]).optional(),
    schoolId: uuid.optional(),
    venueId: uuid.optional(),
    teacherIds: z.array(uuid).optional(),
    capacity: z.number().int().positive().max(1000).optional(),
    schedule: z.array(weeklyScheduleSchema).optional(),
    studentIds: z.array(uuid).optional(),
  })
  .refine((value) => value.scope !== "school" || value.schoolId, {
    message: "schoolId is required for school groups",
    path: ["schoolId"],
  });

export const createSessionSchema = z.object({
  organizationId: uuid,
  groupId: uuid,
  date: z.string().date(),
  startsAt: time,
  endsAt: time,
  venueId: uuid.optional(),
  notes: optionalText,
});

export type CreateSchoolInput = z.infer<typeof createSchoolSchema>;
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type CreateActivityInput = z.infer<typeof createActivitySchema>;
export type UpdateActivityInput = z.infer<typeof updateActivitySchema>;
export type CreateActivityGroupInput = z.infer<
  typeof createActivityGroupSchema
>;
export type UpdateActivityGroupInput = z.infer<
  typeof updateActivityGroupSchema
>;
export type CreateSessionInput = z.infer<typeof createSessionSchema>;
