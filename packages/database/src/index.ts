import { type Db, MongoClient } from 'mongodb'

interface TenantDocument {
  organizationId: string
}

interface NamedDocument extends TenantDocument {
  _id: string
  name: string
  createdAt: Date
}

export interface OrganizationDocument {
  _id: string
  name: string
  createdAt: Date
}

export interface UserDocument {
  _id: string
  email: string
  displayName: string
  createdAt: Date
}

export interface OrganizationUserDocument extends TenantDocument {
  _id: string
  userId: string
  role: 'admin' | 'coordinator' | 'teacher'
  createdAt: Date
}

export interface SchoolDocument extends NamedDocument {
  address?: string | null
  contactEmail?: string | null
  active: boolean
}

export interface TeacherDocument extends TenantDocument {
  _id: string
  firstName: string
  lastName: string
  email: string
  phone?: string | null
  active: boolean
  createdAt: Date
}

export interface TeacherSchoolAssignmentDocument extends TenantDocument {
  _id: string
  teacherId: string
  schoolId: string
  createdAt: Date
}

export interface StudentDocument extends TenantDocument {
  _id: string
  schoolId: string
  firstName: string
  lastName: string
  birthDate?: string | null
  notes?: string | null
  foodIntolerances: string[]
  scholarships: {
    academicYear: string
    activityType: string
    percentage: number
    approved: boolean
  }[]
  status: 'active' | 'inactive' | 'paused'
  active: boolean
  createdAt: Date
}

export interface GuardianDocument extends TenantDocument {
  _id: string
  firstName: string
  lastName: string
  email?: string | null
  phone: string
  createdAt: Date
}

export interface StudentGuardianDocument extends TenantDocument {
  _id: string
  studentId: string
  guardianId: string
  relationship: string
  isPrimary: boolean
}

export interface StudentPaymentSettingsDocument extends TenantDocument {
  _id: string
  studentId: string
  method: 'card' | 'direct-debit' | 'cash' | 'bizum' | 'transfer'
  accountHolder?: string | null
  last4?: string | null
  cardBrand?: string | null
  phone?: string | null
  reference?: string | null
  updatedAt: Date
}

export interface ActivityDocument extends NamedDocument {
  description?: string | null
  category?: string | null
  minimumAge?: number | null
  maximumAge?: number | null
  active: boolean
}

export interface VenueDocument extends NamedDocument {
  address?: string | null
}

export interface WeeklySchedule {
  dayOfWeek: number
  startsAt: string
  endsAt: string
}

export interface ActivityGroupDocument extends TenantDocument {
  _id: string
  activityId: string
  name: string
  scope: 'school' | 'external'
  schoolId?: string | null
  venueId?: string | null
  capacity: number
  schedule: WeeklySchedule[]
  active: boolean
  createdAt: Date
}

export interface GroupTeacherDocument extends TenantDocument {
  _id: string
  groupId: string
  teacherId: string
  role: 'lead' | 'assistant' | 'substitute'
}

export interface EnrollmentDocument extends TenantDocument {
  _id: string
  groupId: string
  studentId: string
  status: 'active' | 'waitlist' | 'cancelled'
  enrolledAt: Date
}

export interface SessionDocument extends TenantDocument {
  _id: string
  groupId: string
  date: string
  startsAt: string
  endsAt: string
  venueId?: string | null
  status: 'scheduled' | 'completed' | 'cancelled'
  notes?: string | null
  createdAt: Date
}

export interface AttendanceDocument extends TenantDocument {
  _id: string
  sessionId: string
  studentId: string
  status: 'present' | 'absent' | 'justified'
  notes?: string | null
}

export interface ActivityLogDocument extends TenantDocument {
  _id: string
  actorUserId: string
  action: string
  entityType: string
  entityId: string
  metadata?: Record<string, unknown>
  createdAt: Date
}

let clientPromise: Promise<MongoClient> | undefined

function getMongoUri() {
  const uri = process.env.MONGODB_URI

  if (!uri) throw new Error('MONGODB_URI is required')

  return uri
}

export async function getDatabase(): Promise<Db> {
  clientPromise ??= new MongoClient(getMongoUri()).connect()
  const client = await clientPromise

  return client.db(process.env.MONGODB_DB_NAME ?? 'club_platform')
}

export async function getCollections() {
  const database = await getDatabase()

  return {
    organizations: database.collection<OrganizationDocument>('organizations'),
    users: database.collection<UserDocument>('users'),
    organizationUsers: database.collection<OrganizationUserDocument>('organization_users'),
    schools: database.collection<SchoolDocument>('schools'),
    teachers: database.collection<TeacherDocument>('teachers'),
    teacherSchoolAssignments: database.collection<TeacherSchoolAssignmentDocument>('teacher_school_assignments'),
    students: database.collection<StudentDocument>('students'),
    guardians: database.collection<GuardianDocument>('guardians'),
    studentGuardians: database.collection<StudentGuardianDocument>('student_guardians'),
    studentPaymentSettings: database.collection<StudentPaymentSettingsDocument>('student_payment_settings'),
    activities: database.collection<ActivityDocument>('activities'),
    venues: database.collection<VenueDocument>('venues'),
    activityGroups: database.collection<ActivityGroupDocument>('activity_groups'),
    groupTeachers: database.collection<GroupTeacherDocument>('group_teachers'),
    enrollments: database.collection<EnrollmentDocument>('enrollments'),
    sessions: database.collection<SessionDocument>('sessions'),
    attendance: database.collection<AttendanceDocument>('attendance'),
    activityLogs: database.collection<ActivityLogDocument>('activity_logs'),
  }
}

export async function ensureIndexes() {
  const collections = await getCollections()

  await Promise.all([
    collections.users.createIndex({ email: 1 }, { unique: true }),
    collections.organizationUsers.createIndex({ organizationId: 1, userId: 1 }, { unique: true }),
    collections.schools.createIndex({ organizationId: 1, name: 1 }),
    collections.teachers.createIndex({ organizationId: 1, email: 1 }, { unique: true }),
    collections.teacherSchoolAssignments.createIndex({ organizationId: 1, teacherId: 1, schoolId: 1 }, { unique: true }),
    collections.students.createIndex({ organizationId: 1, schoolId: 1, status: 1 }),
    collections.guardians.createIndex({ organizationId: 1, phone: 1 }),
    collections.studentGuardians.createIndex({ organizationId: 1, studentId: 1, guardianId: 1 }, { unique: true }),
    collections.studentPaymentSettings.createIndex({ organizationId: 1, studentId: 1 }, { unique: true }),
    collections.activities.createIndex({ organizationId: 1, name: 1 }),
    collections.venues.createIndex({ organizationId: 1, name: 1 }),
    collections.activityGroups.createIndex({ organizationId: 1, schoolId: 1, active: 1 }),
    collections.groupTeachers.createIndex({ organizationId: 1, groupId: 1, teacherId: 1 }, { unique: true }),
    collections.enrollments.createIndex({ organizationId: 1, groupId: 1, studentId: 1 }, { unique: true }),
    collections.sessions.createIndex({ organizationId: 1, groupId: 1, date: 1 }),
    collections.attendance.createIndex({ organizationId: 1, sessionId: 1, studentId: 1 }, { unique: true }),
    collections.activityLogs.createIndex({ organizationId: 1, createdAt: -1 }),
  ])
}

export function serializeDocument<T extends { _id: string }>(document: T) {
  const { _id, ...fields } = document

  return { id: _id, ...fields }
}
