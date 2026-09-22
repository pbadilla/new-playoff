import { getCollections } from '@club/database'
import cors from '@fastify/cors'
import Fastify from 'fastify'

import { activityRoutes } from './modules/activities/activity.routes'
import { communicationRoutes } from './modules/communication/communication.routes'
import { schoolRoutes } from './modules/schools/school.routes'
import { studentRoutes } from './modules/students/student.routes'
import { teacherRoutes } from './modules/teachers/teacher.routes'

export async function buildApp() {
  const app = Fastify({ logger: true })

  await app.register(cors, { origin: true })

  app.get('/health', async () => {
    const database = await getCollections()
    await database.schools.findOne({}, { projection: { _id: 1 } })

    return { ok: true, service: 'api', database: 'mongodb' }
  })

  await app.register(schoolRoutes)
  await app.register(teacherRoutes)
  await app.register(studentRoutes)
  await app.register(activityRoutes)
  await app.register(communicationRoutes)

  return app
}
