import { type FormEvent,useDeferredValue, useState } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ContactRound, Pencil, School, UserRound, WalletCards } from 'lucide-react'

import { Card } from '../../components/ui/card'
import { backofficeApi, type Student, type StudentStatus } from '../../lib/api'
import { EmptyState, FormPanel, inputClass, labelClass, ListToolbar, LoadingState, PageHeader, Pagination, SubmitButton } from '../shared/backoffice-ui'
import { EditStudentDialog } from '../shared/edit-dialogs'
import { StudentGuardiansDialog, StudentPaymentDialog } from './student-extra-dialogs'

export function StudentsPage() {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Student | null>(null)
  const [paymentStudent, setPaymentStudent] = useState<Student | null>(null)
  const [guardiansStudent, setGuardiansStudent] = useState<Student | null>(null)
  const [search, setSearch] = useState('')
  const [schoolId, setSchoolId] = useState('')
  const [status, setStatus] = useState<'' | StudentStatus>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const deferredSearch = useDeferredValue(search)
  const queryClient = useQueryClient()
  const students = useQuery({ queryKey: ['students', deferredSearch, schoolId, status, page, pageSize], queryFn: () => backofficeApi.students.list({ search: deferredSearch, schoolId, status: status || undefined, page, pageSize }) })
  const schools = useQuery({ queryKey: ['schools', 'options'], queryFn: () => backofficeApi.schools.list({ active: 'true', pageSize: 100 }) })
  const mutation = useMutation({
    mutationFn: backofficeApi.students.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['students'] })
      setCreating(false)
    },
  })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    mutation.mutate({ firstName: String(data.get('firstName')), lastName: String(data.get('lastName')), schoolId: String(data.get('schoolId')), birthDate: String(data.get('birthDate') || '') || undefined, notes: String(data.get('notes') || '') || undefined, foodIntolerances: String(data.get('foodIntolerances') || '').split(',').map((item) => item.trim()).filter(Boolean), scholarships: [], status: data.get('status') as StudentStatus })
  }

  const schoolName = (id: string) => schools.data?.items.find((school) => school.id === id)?.name ?? 'Colegio'
  const updateSearch = (value: string) => { setSearch(value); setPage(1) }
  const updateSchool = (value: string) => { setSchoolId(value); setPage(1) }
  const updateStatus = (value: '' | StudentStatus) => { setStatus(value); setPage(1) }
  const updatePageSize = (value: number) => { setPageSize(value); setPage(1) }

  return (
    <>
      <PageHeader
title="Alumnos"
createLabel="Nuevo alumno"
onCreate={() => setCreating((value) => !value)}
      />
      <ListToolbar
search={search}
onSearch={updateSearch}
pageSize={pageSize}
onPageSize={updatePageSize}
      >
<select
className={`${inputClass} sm:w-56`}
value={schoolId}
onChange={(event) => updateSchool(event.target.value)}
>
<option value="">
Todos los colegios
</option>
{schools.data?.items.map((school) => <option
key={school.id}
value={school.id}
>
{school.name}
</option>)}
</select>
<select
className={`${inputClass} sm:w-44`}
value={status}
onChange={(event) => updateStatus(event.target.value as '' | StudentStatus)}
>
<option value="">
Todos los estados
</option>
<option value="active">
Activos
</option>
<option value="paused">
Pausados
</option>
<option value="inactive">
Inactivos
</option>
</select>
</ListToolbar>
      <div className={`grid gap-4 ${creating ? 'xl:grid-cols-[1fr_380px]' : ''}`}>
        <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/70">
{students.isLoading ? <LoadingState /> : students.data?.items.length ? <>
<div className="divide-y divide-border">
{students.data.items.map((student) => <div
key={student.id}
className="flex items-center gap-4 p-4 hover:bg-muted/40"
>
<div className="grid size-10 shrink-0 place-items-center rounded-full bg-violet-100 text-violet-700">
<UserRound size={18} />
</div>
<div className="min-w-0 flex-1">
<p className="font-semibold">
{student.firstName} 
{' '}
{student.lastName}
</p>
<p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
<School size={12} />
{schoolName(student.schoolId)}
{student.birthDate && ` · ${student.birthDate}`}
</p>
{student.foodIntolerances.length > 0 && <p className="mt-1 text-xs font-medium text-amber-700">
Intolerancias: 
{' '}
{student.foodIntolerances.join(', ')}
</p>}
</div>
<div className="flex flex-wrap justify-end gap-1">
{student.scholarships.some((scholarship) => scholarship.approved) && <span className="rounded-full bg-violet-500/10 px-2 py-1 text-[10px] font-semibold text-violet-700">
Becado
</span>}
<span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${student.status === 'active' ? 'bg-emerald-500/10 text-emerald-600' : student.status === 'paused' ? 'bg-amber-500/10 text-amber-700' : 'bg-slate-500/10 text-slate-600'}`}>
{student.status === 'active' ? 'Activo' : student.status === 'paused' ? 'Pausado' : 'Inactivo'}
</span>
</div>
<button
className="rounded-[4px] p-2 text-muted-foreground hover:bg-muted hover:text-primary"
aria-label={`Método de pago de ${student.firstName} ${student.lastName}`}
title="Método de pago"
onClick={() => setPaymentStudent(student)}
>
<WalletCards size={15} />
</button>
<button
className="rounded-[4px] p-2 text-muted-foreground hover:bg-muted hover:text-primary"
aria-label={`Familiares de ${student.firstName} ${student.lastName}`}
title="Familiares y teléfonos"
onClick={() => setGuardiansStudent(student)}
>
<ContactRound size={15} />
</button>
<button
className="rounded-[4px] p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
aria-label={`Editar ${student.firstName} ${student.lastName}`}
onClick={() => setEditing(student)}
>
<Pencil size={15} />
</button>
</div>)}
</div>
<Pagination
page={students.data.page}
totalPages={students.data.totalPages}
total={students.data.total}
onPage={setPage}
/>
</> : <EmptyState
title="No hay resultados"
description={search || schoolId ? 'Prueba con otros términos o elimina los filtros.' : 'Primero debe existir al menos un colegio para dar de alta alumnado.'}
/>}
</Card>
        {creating && <FormPanel
title="Nuevo alumno"
description="Los datos familiares y autorizaciones se añadirán en la siguiente iteración."
error={mutation.error?.message}
        >
<form
className="grid gap-4"
onSubmit={submit}
>
<div className="grid grid-cols-2 gap-3">
<label className={labelClass}>
Nombre
<input
className={inputClass}
name="firstName"
required
autoFocus
/>
</label>
<label className={labelClass}>
Apellidos
<input
className={inputClass}
name="lastName"
required
/>
</label>
</div>
<label className={labelClass}>
Colegio
<select
className={inputClass}
name="schoolId"
required
defaultValue=""
>
<option
value=""
disabled
>
Selecciona un colegio
</option>
{schools.data?.items.map((school) => <option
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
/>
</label>
<label className={labelClass}>
Estado
<select
className={inputClass}
name="status"
defaultValue="active"
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
placeholder="Lactosa, gluten, frutos secos"
/>
</label>
<label className={labelClass}>
Notas
<textarea
className={`${inputClass} min-h-20 py-2`}
name="notes"
/>
</label>
<SubmitButton pending={mutation.isPending}>
Guardar alumno
</SubmitButton>
</form>
</FormPanel>}
      </div>
      <EditStudentDialog
item={editing}
schools={schools.data?.items ?? []}
onClose={() => setEditing(null)}
onSaved={() => queryClient.invalidateQueries({ queryKey: ['students'] })}
      />
      <StudentPaymentDialog
student={paymentStudent}
onClose={() => setPaymentStudent(null)}
      />
      <StudentGuardiansDialog
student={guardiansStudent}
onClose={() => setGuardiansStudent(null)}
      />
    </>
  )
}
