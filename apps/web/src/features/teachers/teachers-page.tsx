import { type FormEvent,useDeferredValue, useState } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Mail, Pencil, School } from 'lucide-react'

import { Card } from '../../components/ui/card'
import { backofficeApi, type Teacher } from '../../lib/api'
import { EmptyState, FormPanel, inputClass, labelClass, ListToolbar, LoadingState, PageHeader, Pagination, SubmitButton } from '../shared/backoffice-ui'
import { EditTeacherDialog } from '../shared/edit-dialogs'

export function TeachersPage() {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<Teacher | null>(null)
  const [search, setSearch] = useState('')
  const [schoolId, setSchoolId] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const deferredSearch = useDeferredValue(search)
  const queryClient = useQueryClient()
  const teachers = useQuery({ queryKey: ['teachers', deferredSearch, schoolId, page, pageSize], queryFn: () => backofficeApi.teachers.list({ search: deferredSearch, schoolId, page, pageSize }) })
  const schools = useQuery({ queryKey: ['schools', 'options'], queryFn: () => backofficeApi.schools.list({ active: 'true', pageSize: 100 }) })
  const mutation = useMutation({
    mutationFn: backofficeApi.teachers.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['teachers'] })
      setCreating(false)
    },
  })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    mutation.mutate({ firstName: String(data.get('firstName')), lastName: String(data.get('lastName')), email: String(data.get('email')), phone: String(data.get('phone') || '') || undefined, schoolIds: data.getAll('schoolIds').map(String) })
  }

  const schoolName = (id: string) => schools.data?.items.find((school) => school.id === id)?.name ?? 'Colegio'
  const updateSearch = (value: string) => { setSearch(value); setPage(1) }
  const updateSchool = (value: string) => { setSchoolId(value); setPage(1) }
  const updatePageSize = (value: number) => { setPageSize(value); setPage(1) }

  return (
    <>
      <PageHeader
title="Profesores"
createLabel="Nuevo profesor"
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
</ListToolbar>
      <div className={`grid gap-4 ${creating ? 'xl:grid-cols-[1fr_380px]' : ''}`}>
        <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/70">
{teachers.isLoading ? <LoadingState /> : teachers.data?.items.length ? <>
<div className="divide-y divide-border">
{teachers.data.items.map((teacher) => <div
key={teacher.id}
className="flex items-start gap-4 p-4 hover:bg-muted/40"
>
<div className="grid size-10 shrink-0 place-items-center rounded-full bg-violet-100 font-bold text-violet-700">
{teacher.firstName[0]}
{teacher.lastName[0]}
</div>
<div className="min-w-0 flex-1">
<p className="font-semibold">
{teacher.firstName} 
{' '}
{teacher.lastName}
</p>
<p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
<Mail size={12} />
{teacher.email}
</p>
<div className="mt-2 flex flex-wrap gap-1.5">
{teacher.schoolIds.map((id) => <span
key={id}
className="flex items-center gap-1 rounded-[4px] bg-secondary px-2 py-1 text-[10px] font-medium text-secondary-foreground"
>
<School size={11} />
{schoolName(id)}
</span>)}
</div>
</div>
<button
className="rounded-[4px] p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
aria-label={`Editar ${teacher.firstName} ${teacher.lastName}`}
onClick={() => setEditing(teacher)}
>
<Pencil size={15} />
</button>
</div>)}
</div>
<Pagination
page={teachers.data.page}
totalPages={teachers.data.totalPages}
total={teachers.data.total}
onPage={setPage}
/>
</> : <EmptyState
title="No hay resultados"
description={search || schoolId ? 'Prueba con otros términos o elimina los filtros.' : 'Crea un profesor y asígnalo a uno o varios colegios.'}
/>}
</Card>
        {creating && <FormPanel
title="Nuevo profesor"
description="Podrás asignarlo posteriormente a grupos concretos."
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
Email
<input
className={inputClass}
name="email"
type="email"
required
/>
</label>
<label className={labelClass}>
Teléfono
<input
className={inputClass}
name="phone"
/>
</label>
<label className={labelClass}>
Colegios
<select
className={`${inputClass} h-auto min-h-24 py-2`}
name="schoolIds"
multiple
>
{schools.data?.items.map((school) => <option
key={school.id}
value={school.id}
>
{school.name}
</option>)}
</select>
<span className="font-normal text-muted-foreground">
Usa Ctrl/⌘ para seleccionar varios.
</span>
</label>
<SubmitButton pending={mutation.isPending}>
Guardar profesor
</SubmitButton>
</form>
</FormPanel>}
      </div>
      <EditTeacherDialog
item={editing}
schools={schools.data?.items ?? []}
onClose={() => setEditing(null)}
onSaved={() => queryClient.invalidateQueries({ queryKey: ['teachers'] })}
      />
    </>
  )
}
