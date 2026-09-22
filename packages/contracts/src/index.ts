export type ApiHealth = { ok: true; service: 'api'; database: 'mongodb' }

export interface SchoolDto {
  id: string
  organizationId: string
  name: string
  address: string | null
  contactEmail: string | null
  active: boolean
}

export interface TeacherDto {
  id: string
  organizationId: string
  firstName: string
  lastName: string
  email: string
  phone: string | null
  schoolIds: string[]
  active: boolean
}

export interface StudentDto {
  id: string
  organizationId: string
  schoolId: string
  firstName: string
  lastName: string
  birthDate: string | null
  notes: string | null
  foodIntolerances: string[]
  scholarships: {
    academicYear: string
    activityType: string
    percentage: number
    approved: boolean
  }[]
  status: 'active' | 'inactive' | 'paused'
  active: boolean
}

export interface ActivityGroupDto {
  id: string
  organizationId: string
  activityId: string
  name: string
  scope: 'school' | 'external'
  schoolId: string | null
  venueId: string | null
  capacity: number
}
