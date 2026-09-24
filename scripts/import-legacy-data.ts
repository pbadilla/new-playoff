import { createHash, randomUUID } from 'node:crypto'
import { existsSync, readdirSync } from 'node:fs'

import * as XLSX from '../apps/api/node_modules/xlsx'
import { getCollections } from '../packages/database/src/index'

const organizationId = process.env.SEED_ORGANIZATION_ID
  ?? process.env.VITE_ORGANIZATION_ID
  ?? '20000000-0000-4000-8000-000000000001'
const commit = process.argv.includes('--commit')

type Row = Record<string, unknown>
type StudentImport = {
  _id: string
  organizationId: string
  schoolName?: string
  firstName: string
  lastName: string
  birthDate?: string
  status: 'active' | 'inactive' | 'paused'
  active: boolean
  paymentLast4?: string
}

const files = {
  members: "Socis-Excel.xlsx",
  associates: "Associats -Excel.xlsx",
  guardians: "Tutors dels associats-Excel.xlsx",
  activities: "Activitats-Excel.xlsx",
  attendance: "Llistes d'assistència-Excel.xlsx",
}

function normalized(value: unknown) {
  return String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase().replace(/\s+/g, ' ')
}

function text(row: Row, key: string) {
  return String(row[key] ?? '').trim()
}

function stableId(namespace: string, value: string) {
  const hash = createHash('sha256').update(`${namespace}:${normalized(value)}`).digest('hex')
  return `${hash.slice(0, 8)}-${hash.slice(8, 12)}-4${hash.slice(13, 16)}-8${hash.slice(17, 20)}-${hash.slice(20, 32)}`
}

function identity(firstName: unknown, lastName: unknown, birthDate?: unknown) {
  return normalized(`${firstName}|${lastName}|${birthDate ?? ''}`)
}

function parseDate(value: unknown) {
  const source = String(value ?? '').trim().split(' ')[0]
  const match = source.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/)
  return match ? `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}` : undefined
}

function numberValue(value: unknown) {
  const parsed = Number(String(value ?? '').replace(',', '.'))
  return Number.isFinite(parsed) ? parsed : undefined
}

function stripHtml(value: unknown) {
  return String(value ?? '').replace(/<[^>]+>/g, ' ').replace(/&nbsp;|\u00a0/g, ' ').replace(/\s+/g, ' ').trim()
}

function readRows(filename: string) {
  const path = `data/${filename}`
  if (!existsSync(path)) return []
  const workbook = XLSX.readFile(path, { cellDates: false })
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: '', raw: false })
  const headerIndex = matrix.findIndex((row) => Array.isArray(row) && row.filter(Boolean).length >= 2 && !String(row[0]).match(/^\d{1,2} \/ \w+ \/ \d{4}$/))
  const headers = matrix[headerIndex] as string[]
  return matrix.slice(headerIndex + 1).filter((row) => row.some(Boolean)).map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index]])))
}

const memberRows = readRows(files.members)
const associateRows = readRows(files.associates)
const guardianRows = readRows(files.guardians)
const activityRows = readRows(files.activities)
const attendanceRows = readRows(files.attendance)
const warnings: string[] = []
const studentsByIdentity = new Map<string, StudentImport>()

for (const row of memberRows) {
  const firstName = text(row, 'Nom')
  const lastName = text(row, 'Cognoms')
  if (!firstName || !lastName) continue
  const birthDate = parseDate(row['Data naixement'])
  const key = identity(firstName, lastName, birthDate)
  const iban = text(row, 'IBAN').replace(/\s/g, '')
  studentsByIdentity.set(key, {
    _id: stableId('student', key), organizationId, firstName, lastName, birthDate,
    schoolName: text(row, 'Centre educatiu') || undefined,
    status: 'active', active: true,
    paymentLast4: iban ? iban.slice(-4) : undefined,
  })
}

for (const row of associateRows) {
  const firstName = text(row, 'Nom')
  const lastName = text(row, 'Cognoms')
  if (!firstName || !lastName) continue
  const birthDate = parseDate(row['Data naixement'])
  const key = identity(firstName, lastName, birthDate)
  const current = studentsByIdentity.get(key)
  studentsByIdentity.set(key, current ?? {
    _id: stableId('student', key), organizationId, firstName, lastName, birthDate,
    schoolName: text(row, 'Centre educatiu') || undefined,
    status: 'active', active: true,
  })
}

const students = [...studentsByIdentity.values()]
const schools = [...new Set(students.map((student) => student.schoolName).filter(Boolean) as string[])]
  .map((name) => ({ _id: stableId('school', name), organizationId, name, address: null, contactEmail: null, active: true, createdAt: new Date() }))
const studentNameLookup = new Map(students.map((student) => [identity(student.firstName, student.lastName), student]))

const guardians = new Map<string, { _id: string; organizationId: string; firstName: string; lastName: string; phone: string; email: string | null; createdAt: Date }>()
const guardianLinks: { _id: string; organizationId: string; studentId: string; guardianId: string; relationship: string; isPrimary: boolean }[] = []
let unmatchedGuardians = 0

for (const row of guardianRows) {
  const phone = text(row, 'Tel. principal') || text(row, 'Tel. secundari')
  const firstName = text(row, 'Nom')
  const lastName = text(row, 'Cognoms')
  const student = studentNameLookup.get(identity(row['Nom associat'], row['Cognom associat']))
  if (!student || !phone || !firstName || !lastName) { unmatchedGuardians++; continue }
  const guardianKey = normalized(phone)
  const guardianId = stableId('guardian', guardianKey)
  guardians.set(guardianKey, { _id: guardianId, organizationId, firstName, lastName, phone, email: text(row, 'Email') || null, createdAt: new Date() })
  guardianLinks.push({ _id: stableId('student-guardian', `${student._id}|${guardianId}`), organizationId, studentId: student._id, guardianId, relationship: text(row, 'Relació') || 'Tutor/a legal', isPrimary: !guardianLinks.some((link) => link.studentId === student._id) })
}

const activities = activityRows.map((row) => {
  const name = text(row, 'Nom')
  return {
    _id: stableId('activity', name), organizationId, name,
    description: stripHtml(row['Descripció']) || null,
    category: null, minimumAge: null, maximumAge: null, active: normalized(row['Estat']) !== 'arxivada',
    createdAt: new Date(),
    legacy: {
      minimumPlaces: numberValue(row['Places mínimes']), maximumPlaces: numberValue(row['Places màximes']),
      startsOn: parseDate(row['Data inici']), registrationDeadline: parseDate(row['Data límit']),
      status: text(row, 'Estat'), registrations: numberValue(row['Inscripcions']),
      cancelledAmount: numberValue(row['Anulat']), pendingAmount: numberValue(row['Pendent']), paidAmount: numberValue(row['Pagat']),
    },
  }
}).filter((activity) => activity.name)

const report = {
  mode: commit ? 'commit' : 'dry-run', organizationId,
  sourceFiles: readdirSync('data').filter((name) => /\.xlsx$/i.test(name)).length,
  students: students.length, schools: schools.length, guardians: guardians.size, guardianLinks: guardianLinks.length,
  unmatchedGuardianRows: unmatchedGuardians, activities: activities.length,
  paymentReferences: students.filter((student) => student.paymentLast4).length,
  skipped: {
    attendanceRows: attendanceRows.length,
    attendanceReason: 'The source only contains aggregate attendance totals, not individual student attendance.',
    emptySheets: ['Sales-Excel.xlsx', 'Llistat inscripcions_Veure totes-Excel.xlsx', 'Contactes email-Excel.xlsx'],
  },
  warnings,
}

if (commit) {
  const collections = await getCollections()
  for (const school of schools) await collections.schools.updateOne({ _id: school._id }, { $set: school }, { upsert: true })
  for (const student of students) {
    const { schoolName, paymentLast4, ...document } = student
    const schoolId = schoolName ? stableId('school', schoolName) : schools[0]?._id
    if (!schoolId) { warnings.push('A student was skipped because no school could be resolved.'); continue }
    await collections.students.updateOne({ _id: document._id }, { $set: { ...document, schoolId, birthDate: document.birthDate ?? null, notes: null, foodIntolerances: [], scholarships: [], createdAt: new Date() } }, { upsert: true })
    if (paymentLast4) await collections.studentPaymentSettings.updateOne({ organizationId, studentId: document._id }, { $set: { method: 'direct-debit', accountHolder: `${document.firstName} ${document.lastName}`, last4: paymentLast4, cardBrand: null, phone: null, reference: null, updatedAt: new Date() }, $setOnInsert: { _id: randomUUID(), organizationId, studentId: document._id } }, { upsert: true })
  }
  for (const guardian of guardians.values()) await collections.guardians.updateOne({ _id: guardian._id }, { $set: guardian }, { upsert: true })
  for (const link of guardianLinks) await collections.studentGuardians.updateOne({ organizationId, studentId: link.studentId, guardianId: link.guardianId }, { $set: link }, { upsert: true })
  for (const activity of activities) await collections.activities.updateOne({ _id: activity._id }, { $set: activity }, { upsert: true })
}

console.log(JSON.stringify(report, null, 2))
