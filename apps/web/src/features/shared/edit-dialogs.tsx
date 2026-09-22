import { useMutation } from '@tanstack/react-query'
import type { FormEvent } from 'react'

import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogHeader } from '../../components/ui/dialog'
import { backofficeApi, type School, type Student, type StudentStatus, type Teacher } from '../../lib/api'
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
  const submit = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); if (!item) return; const data = new FormData(event.currentTarget); mutation.mutate({ id: item.id, payload: { firstName: String(data.get('firstName')), lastName: String(data.get('lastName')), schoolId: String(data.get('schoolId')), birthDate: String(data.get('birthDate') || '') || undefined, notes: String(data.get('notes') || '') || undefined, foodIntolerances: String(data.get('foodIntolerances') || '').split(',').map((value) => value.trim()).filter(Boolean), status: data.get('status') as StudentStatus } }) }

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
