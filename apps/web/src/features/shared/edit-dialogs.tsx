import { type FormEvent, useEffect, useState } from 'react'

import { useMutation } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'

import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogHeader } from '../../components/ui/dialog'
import { backofficeApi, type Scholarship, type School, type Student, type StudentStatus, type Teacher } from '../../lib/api'
import { inputClass, labelClass } from './backoffice-ui'

interface EditProps<T> {
  item: T | null
  onClose: () => void
  onSaved: () => Promise<unknown>
}

function ErrorMessage({ error }: { error: Error | null }) {
  return error && <p className="rounded-[4px] bg-rose-500/10 p-3 text-xs text-rose-600">
{error.message}
</p>
}

const activityTypes = ['Casal de Verano', 'Casal de Navidad', 'Casal de Semana Santa', 'Jornadas Abiertas', 'Pruebas', 'Otros']

function ScholarshipEditor({ scholarships }: { scholarships: Scholarship[] }) {
  const [rows, setRows] = useState<Scholarship[]>(scholarships)
  useEffect(() => setRows(scholarships), [scholarships])

  const update = (index: number, changes: Partial<Scholarship>) => setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...changes } : row))
  const remove = (index: number) => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))
  const add = () => setRows((current) => [...current, { academicYear: '', activityType: 'Casal de Verano', percentage: 0, approved: false }])

  return <div className="grid gap-2">
    <div className="flex items-center justify-between gap-3">
<span className="text-xs font-semibold">
Historial de becas
</span>
<Button
type="button"
variant="outline"
size="sm"
onClick={add}
>
<Plus size={14} />
Añadir beca
</Button>
</div>
    {rows.length ? rows.map((scholarship, index) => <div
key={index}
className={`grid gap-2 rounded-[4px] border p-3 ${scholarship.approved ? 'border-emerald-300 bg-emerald-500/5' : 'border-amber-300 bg-amber-500/5'}`}
    >
      <div className="flex items-center justify-between">
<span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${scholarship.approved ? 'bg-emerald-500/15 text-emerald-700' : 'bg-amber-500/15 text-amber-700'}`}>
{scholarship.approved ? 'Aprobada' : 'Pendiente'}
</span>
<button
type="button"
className="rounded-[4px] p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"
aria-label="Eliminar beca"
onClick={() => remove(index)}
>
<Trash2 size={14} />
</button>
</div>
      <div className="grid gap-2 sm:grid-cols-[1fr_1.35fr_.65fr]">
        <label className={labelClass}>
Curso
<input
className={inputClass}
name="scholarshipAcademicYear"
value={scholarship.academicYear}
placeholder="2025/2026"
pattern="\d{4}/\d{4}"
required
onChange={(event) => update(index, { academicYear: event.target.value })}
/>
</label>
        <label className={labelClass}>
Tipo de actividad
<select
className={inputClass}
name="scholarshipActivityType"
value={scholarship.activityType}
onChange={(event) => update(index, { activityType: event.target.value })}
>
{activityTypes.map((type) => <option
key={type}
value={type}
>
{type}
</option>)}
</select>
</label>
        <label className={labelClass}>
Porcentaje
<input
className={inputClass}
name="scholarshipPercentage"
type="number"
min="0"
max="100"
value={scholarship.percentage}
required
onChange={(event) => update(index, { percentage: Number(event.target.value) })}
/>
</label>
      </div>
      <label className={labelClass}>
Resolución
<select
className={inputClass}
name="scholarshipApproved"
value={scholarship.approved ? 'true' : 'false'}
onChange={(event) => update(index, { approved: event.target.value === 'true' })}
>
<option value="false">
Pendiente
</option>
<option value="true">
Aprobada
</option>
</select>
</label>
    </div>) : <p className="rounded-[4px] border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
Este alumno todavía no tiene becas registradas.
</p>}
  </div>
}

export function EditSchoolDialog({ item, onClose, onSaved }: EditProps<School>) {
  const mutation = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof backofficeApi.schools.update>[1] }) => backofficeApi.schools.update(id, payload), onSuccess: async () => { await onSaved(); onClose() } })
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!item) return; const data = new FormData(event.currentTarget); mutation.mutate({ id: item.id, payload: { name: String(data.get('name')), address: String(data.get('address') || '') || undefined, contactEmail: String(data.get('contactEmail') || '') || undefined } }) }

  return <Dialog
open={Boolean(item)}
onOpenChange={(open) => !open && onClose()}
  >
<DialogContent>
<DialogHeader title="Editar colegio" />
<form
className="grid gap-4"
onSubmit={submit}
>
{item && <>
<label className={labelClass}>
Nombre
<input
className={inputClass}
name="name"
defaultValue={item.name}
required
/>
</label>
<label className={labelClass}>
Dirección
<input
className={inputClass}
name="address"
defaultValue={item.address ?? ''}
/>
</label>
<label className={labelClass}>
Email
<input
className={inputClass}
name="contactEmail"
type="email"
defaultValue={item.contactEmail ?? ''}
/>
</label>
<ErrorMessage error={mutation.error} />
<Button
type="submit"
disabled={mutation.isPending}
>
{mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
</Button>
</>}
</form>
</DialogContent>
</Dialog>
}

export function EditTeacherDialog({ item, schools, onClose, onSaved }: EditProps<Teacher> & { schools: School[] }) {
  const mutation = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof backofficeApi.teachers.update>[1] }) => backofficeApi.teachers.update(id, payload), onSuccess: async () => { await onSaved(); onClose() } })
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!item) return; const data = new FormData(event.currentTarget); mutation.mutate({ id: item.id, payload: { firstName: String(data.get('firstName')), lastName: String(data.get('lastName')), email: String(data.get('email')), phone: String(data.get('phone') || '') || undefined, schoolIds: data.getAll('schoolIds').map(String) } }) }

  return <Dialog
open={Boolean(item)}
onOpenChange={(open) => !open && onClose()}
  >
<DialogContent>
<DialogHeader
title="Editar profesor"
description="Actualiza sus datos y asignaciones a colegios."
/>
<form
className="grid gap-4"
onSubmit={submit}
>
{item && <>
<div className="grid grid-cols-2 gap-3">
<label className={labelClass}>
Nombre
<input
className={inputClass}
name="firstName"
defaultValue={item.firstName}
required
/>
</label>
<label className={labelClass}>
Apellidos
<input
className={inputClass}
name="lastName"
defaultValue={item.lastName}
required
/>
</label>
</div>
<label className={labelClass}>
Email
<input
className={inputClass}
name="email"
type="email"
defaultValue={item.email}
required
/>
</label>
<label className={labelClass}>
Teléfono
<input
className={inputClass}
name="phone"
defaultValue={item.phone ?? ''}
/>
</label>
<label className={labelClass}>
Colegios
<select
className={`${inputClass} h-auto min-h-24 py-2`}
name="schoolIds"
multiple
defaultValue={item.schoolIds}
>
{schools.map((school) => <option
key={school.id}
value={school.id}
>
{school.name}
</option>)}
</select>
</label>
<ErrorMessage error={mutation.error} />
<Button
type="submit"
disabled={mutation.isPending}
>
{mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
</Button>
</>}
</form>
</DialogContent>
</Dialog>
}

export function EditStudentDialog({ item, schools, onClose, onSaved }: EditProps<Student> & { schools: School[] }) {
  const mutation = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof backofficeApi.students.update>[1] }) => backofficeApi.students.update(id, payload), onSuccess: async () => { await onSaved(); onClose() } })
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!item) return; const data = new FormData(event.currentTarget); const years = data.getAll('scholarshipAcademicYear'); const activityTypes = data.getAll('scholarshipActivityType'); const percentages = data.getAll('scholarshipPercentage'); const approvals = data.getAll('scholarshipApproved'); const scholarships = years.map((year, index) => ({ academicYear: String(year), activityType: String(activityTypes[index]), percentage: Number(percentages[index]), approved: approvals[index] === 'true' })); mutation.mutate({ id: item.id, payload: { firstName: String(data.get('firstName')), lastName: String(data.get('lastName')), schoolId: String(data.get('schoolId')), birthDate: String(data.get('birthDate') || '') || undefined, notes: String(data.get('notes') || '') || undefined, foodIntolerances: String(data.get('foodIntolerances') || '').split(',').map((value) => value.trim()).filter(Boolean), scholarships, status: data.get('status') as StudentStatus } }) }

  return <Dialog
open={Boolean(item)}
onOpenChange={(open) => !open && onClose()}
  >
<DialogContent>
<DialogHeader title="Editar alumno" />
<form
className="grid gap-4"
onSubmit={submit}
>
{item && <>
<div className="grid grid-cols-2 gap-3">
<label className={labelClass}>
Nombre
<input
className={inputClass}
name="firstName"
defaultValue={item.firstName}
required
/>
</label>
<label className={labelClass}>
Apellidos
<input
className={inputClass}
name="lastName"
defaultValue={item.lastName}
required
/>
</label>
</div>
<label className={labelClass}>
Colegio
<select
className={inputClass}
name="schoolId"
defaultValue={item.schoolId}
required
>
{schools.map((school) => <option
key={school.id}
value={school.id}
>
{school.name}
</option>)}
</select>
</label>
<label className={labelClass}>
Fecha de nacimiento
<input
className={inputClass}
name="birthDate"
type="date"
defaultValue={item.birthDate ?? ''}
/>
</label>
<label className={labelClass}>
Estado
<select
className={inputClass}
name="status"
defaultValue={item.status}
>
<option value="active">
Activo
</option>
<option value="paused">
Pausado
</option>
<option value="inactive">
Inactivo
</option>
</select>
</label>
<label className={labelClass}>
Intolerancias alimentarias
<input
className={inputClass}
name="foodIntolerances"
defaultValue={item.foodIntolerances.join(', ')}
placeholder="Lactosa, gluten, frutos secos"
/>
</label>
<ScholarshipEditor scholarships={item.scholarships} />
<label className={labelClass}>
Notas
<textarea
className={`${inputClass} min-h-20 py-2`}
name="notes"
defaultValue={item.notes ?? ''}
/>
</label>
<ErrorMessage error={mutation.error} />
<Button
type="submit"
disabled={mutation.isPending}
>
{mutation.isPending ? 'Guardando...' : 'Guardar cambios'}
</Button>
</>}
</form>
</DialogContent>
</Dialog>
}
