import { getCollections } from '../packages/database/src/index'

const organizationId = process.env.SEED_ORGANIZATION_ID
  ?? process.env.VITE_ORGANIZATION_ID
  ?? '20000000-0000-4000-8000-000000000001'

const createdAt = new Date('2026-09-01T08:00:00.000Z')

const schools = [
  {
    _id: '21000000-0000-4000-8000-000000000001',
    organizationId,
    name: 'Colegio Monteverde',
    address: 'Calle del Olmo, 14',
    contactEmail: 'monteverde@example.invalid',
    active: true,
    createdAt,
  },
  {
    _id: '21000000-0000-4000-8000-000000000002',
    organizationId,
    name: 'CEIP Río Claro',
    address: 'Avenida de los Almendros, 8',
    contactEmail: 'rioclaro@example.invalid',
    active: true,
    createdAt,
  },
  {
    _id: '21000000-0000-4000-8000-000000000003',
    organizationId,
    name: 'Colegio Las Encinas',
    address: 'Plaza del Roble, 3',
    contactEmail: 'encinas@example.invalid',
    active: true,
    createdAt,
  },
]

const activityCatalog = [
  ['25000000-0000-4000-8000-000000000001', 'Casal de Verano', 'Actividades educativas y de ocio durante las vacaciones de verano.', 3, 16],
  ['25000000-0000-4000-8000-000000000002', 'Casal de Navidad', 'Programa de actividades para el periodo de vacaciones de Navidad.', 3, 16],
  ['25000000-0000-4000-8000-000000000003', 'Casal de Semana Santa', 'Casal para los días no lectivos de Semana Santa.', 3, 16],
  ['25000000-0000-4000-8000-000000000004', 'Jornadas Abiertas', 'Jornadas puntuales abiertas a familias y participantes.', 3, 18],
  ['25000000-0000-4000-8000-000000000005', 'Pruebas', 'Sesiones de prueba y valoración antes de formalizar una inscripción.', 3, 18],
  ['25000000-0000-4000-8000-000000000006', 'Otros', 'Actividades que no pertenecen a las categorías anteriores.', 3, 21],
] as const

const activities = activityCatalog.map(([_id, name, description, minimumAge, maximumAge]) => ({
  _id,
  organizationId,
  name,
  description,
  category: name,
  minimumAge,
  maximumAge,
  active: true,
  createdAt,
}))

const teachers = [
  ['22000000-0000-4000-8000-000000000001', 'Lucía', 'Martín', 'lucia.martin@example.invalid', '+34 600 100 001'],
  ['22000000-0000-4000-8000-000000000002', 'Diego', 'Romero', 'diego.romero@example.invalid', '+34 600 100 002'],
  ['22000000-0000-4000-8000-000000000003', 'Carmen', 'Navarro', 'carmen.navarro@example.invalid', '+34 600 100 003'],
  ['22000000-0000-4000-8000-000000000004', 'Álvaro', 'Santos', 'alvaro.santos@example.invalid', '+34 600 100 004'],
  ['22000000-0000-4000-8000-000000000005', 'Nuria', 'Vega', 'nuria.vega@example.invalid', '+34 600 100 005'],
  ['22000000-0000-4000-8000-000000000006', 'Hugo', 'Molina', 'hugo.molina@example.invalid', '+34 600 100 006'],
].map(([_id, firstName, lastName, email, phone]) => ({
  _id,
  organizationId,
  firstName,
  lastName,
  email,
  phone,
  active: true,
  createdAt,
}))

const teacherAssignments = [
  ['23000000-0000-4000-8000-000000000001', teachers[0]._id, schools[0]._id],
  ['23000000-0000-4000-8000-000000000002', teachers[0]._id, schools[1]._id],
  ['23000000-0000-4000-8000-000000000003', teachers[1]._id, schools[0]._id],
  ['23000000-0000-4000-8000-000000000004', teachers[2]._id, schools[1]._id],
  ['23000000-0000-4000-8000-000000000005', teachers[2]._id, schools[2]._id],
  ['23000000-0000-4000-8000-000000000006', teachers[3]._id, schools[2]._id],
  ['23000000-0000-4000-8000-000000000007', teachers[4]._id, schools[0]._id],
  ['23000000-0000-4000-8000-000000000008', teachers[4]._id, schools[2]._id],
  ['23000000-0000-4000-8000-000000000009', teachers[5]._id, schools[1]._id],
].map(([_id, teacherId, schoolId]) => ({
  _id,
  organizationId,
  teacherId,
  schoolId,
  createdAt,
}))

const studentNames = [
  ['Sofía', 'García', '2017-02-14'], ['Mateo', 'López', '2016-05-03'],
  ['Valeria', 'Sánchez', '2018-07-21'], ['Leo', 'Fernández', '2017-11-09'],
  ['Martina', 'Ruiz', '2016-01-28'], ['Daniel', 'Moreno', '2018-09-16'],
  ['Paula', 'Jiménez', '2017-04-05'], ['Lucas', 'Álvarez', '2016-12-19'],
  ['Emma', 'Romero', '2018-03-11'], ['Hugo', 'Díaz', '2017-08-24'],
  ['Julia', 'Muñoz', '2016-06-07'], ['Alejandro', 'Ortega', '2018-10-30'],
  ['Carla', 'Navarro', '2017-01-17'], ['Martín', 'Torres', '2016-09-02'],
  ['Noa', 'Domínguez', '2018-12-08'], ['Adrián', 'Vázquez', '2017-05-26'],
  ['Claudia', 'Ramos', '2016-03-13'], ['Pablo', 'Gil', '2018-06-18'],
  ['Alba', 'Serrano', '2017-10-04'], ['Marco', 'Blanco', '2016-07-29'],
  ['Irene', 'Molina', '2018-02-23'], ['Bruno', 'Suárez', '2017-06-15'],
  ['Aitana', 'Castro', '2016-11-01'], ['Enzo', 'Iglesias', '2018-04-27'],
] as const

const students = studentNames.map(([firstName, lastName, birthDate], index) => ({
  _id: `24000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  organizationId,
  schoolId: schools[index % schools.length]._id,
  firstName,
  lastName,
  birthDate,
  notes: index % 7 === 0 ? 'Ficha pendiente de completar por la familia.' : null,
  foodIntolerances: index % 8 === 0 ? ['Lactosa'] : index % 11 === 0 ? ['Gluten', 'Frutos secos'] : [],
  scholarships: index % 6 === 0 ? [
    { academicYear: '2025/2026', activityType: 'Casal de Verano', percentage: 50, approved: true },
    ...(index === 0 ? [{ academicYear: '2024/2025', activityType: 'Casal de Semana Santa', percentage: 35, approved: true }] : []),
  ] : [],
  status: index === 22 ? 'paused' as const : index === 23 ? 'inactive' as const : 'active' as const,
  active: index < 22,
  createdAt,
}))

const activityGroups = [
  ['26000000-0000-4000-8000-000000000001', activities[0]._id, 'Multideporte · Monteverde', schools[0]._id, 24, [{ dayOfWeek: 1, startsAt: '16:30', endsAt: '17:30' }, { dayOfWeek: 3, startsAt: '16:30', endsAt: '17:30' }]],
  ['26000000-0000-4000-8000-000000000002', activities[5]._id, 'Robótica · Río Claro', schools[1]._id, 16, [{ dayOfWeek: 2, startsAt: '17:00', endsAt: '18:15' }]],
  ['26000000-0000-4000-8000-000000000003', activities[3]._id, 'Teatro · Las Encinas', schools[2]._id, 20, [{ dayOfWeek: 4, startsAt: '16:45', endsAt: '18:00' }]],
  ['26000000-0000-4000-8000-000000000004', activities[5]._id, 'Iniciación musical', schools[0]._id, 18, [{ dayOfWeek: 5, startsAt: '16:30', endsAt: '17:30' }]],
  ['26000000-0000-4000-8000-000000000005', activities[4]._id, 'Grupo de prueba', schools[1]._id, 12, [{ dayOfWeek: 1, startsAt: '18:00', endsAt: '19:00' }]],
].map(([_id, activityId, name, schoolId, capacity, schedule]) => ({
  _id: String(_id), organizationId, activityId: String(activityId), name: String(name), scope: 'school' as const,
  schoolId: String(schoolId), venueId: null, capacity: Number(capacity), schedule: schedule as { dayOfWeek: number; startsAt: string; endsAt: string }[], active: true, createdAt,
}))

const groupTeachers = activityGroups.map((group, index) => ({
  _id: `27000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  organizationId, groupId: group._id, teacherId: teachers[index % teachers.length]._id, role: 'lead' as const,
}))

const enrollments = activityGroups.flatMap((group, groupIndex) => Array.from({ length: groupIndex + 4 }, (_, index) => ({
  _id: `28000000-0000-4000-${String(groupIndex + 1).padStart(4, '0')}-${String(index + 1).padStart(12, '0')}`,
  organizationId, groupId: group._id, studentId: students[(groupIndex * 4 + index) % students.length]._id,
  status: 'active' as const, enrolledAt: createdAt,
})))

const collections = await getCollections()

await Promise.all([
  collections.schools.bulkWrite(schools.map((school) => ({
    updateOne: { filter: { _id: school._id }, update: { $set: school }, upsert: true },
  }))),
  collections.teachers.bulkWrite(teachers.map((teacher) => ({
    updateOne: { filter: { _id: teacher._id }, update: { $set: teacher }, upsert: true },
  }))),
  collections.teacherSchoolAssignments.bulkWrite(teacherAssignments.map((assignment) => ({
    updateOne: {
      filter: { organizationId: assignment.organizationId, teacherId: assignment.teacherId, schoolId: assignment.schoolId },
      update: { $set: { createdAt: assignment.createdAt }, $setOnInsert: { _id: assignment._id, organizationId: assignment.organizationId, teacherId: assignment.teacherId, schoolId: assignment.schoolId } },
      upsert: true,
    },
  }))),
  collections.students.bulkWrite(students.map((student) => ({
    updateOne: { filter: { _id: student._id }, update: { $set: student }, upsert: true },
  }))),
  collections.activities.bulkWrite(activities.map((activity) => ({
    updateOne: { filter: { _id: activity._id }, update: { $set: activity }, upsert: true },
  }))),
  collections.activityGroups.bulkWrite(activityGroups.map((group) => ({
    updateOne: { filter: { _id: group._id }, update: { $set: group }, upsert: true },
  }))),
  collections.groupTeachers.bulkWrite(groupTeachers.map((assignment) => ({
    updateOne: { filter: { organizationId, groupId: assignment.groupId, teacherId: assignment.teacherId }, update: { $set: assignment }, upsert: true },
  }))),
  collections.enrollments.bulkWrite(enrollments.map((enrollment) => ({
    updateOne: { filter: { organizationId, groupId: enrollment.groupId, studentId: enrollment.studentId }, update: { $set: enrollment }, upsert: true },
  }))),
])

console.log(`Seed completed for organization ${organizationId}`)
console.log(`${schools.length} schools, ${teachers.length} teachers, ${students.length} students, ${activities.length} activities, ${activityGroups.length} groups`)

process.exit(0)
