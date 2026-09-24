import { type FormEvent,useDeferredValue, useState } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Mail, MapPin, Pencil, School } from 'lucide-react'

import { Card } from '../../components/ui/card'
import { backofficeApi, type School as SchoolRecord } from '../../lib/api'
import { AlphabetFilter, EmptyState, FormPanel, inputClass, labelClass, ListToolbar, LoadingState, PageHeader, Pagination, SubmitButton } from '../shared/backoffice-ui'
import { EditSchoolDialog } from '../shared/edit-dialogs'

export function SchoolsPage() {
  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState<SchoolRecord | null>(null)
  const [search, setSearch] = useState('')
  const [initial, setInitial] = useState('')
  const [active, setActive] = useState<'' | 'true' | 'false'>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const deferredSearch = useDeferredValue(search)
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['schools', deferredSearch, initial, active, page, pageSize], queryFn: () => backofficeApi.schools.list({ search: deferredSearch, initial, active: active || undefined, page, pageSize }) })
  const mutation = useMutation({
    mutationFn: backofficeApi.schools.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['schools'] })
      setCreating(false)
    },
  })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    mutation.mutate({ name: String(data.get('name')), address: String(data.get('address') || '') || undefined, contactEmail: String(data.get('contactEmail') || '') || undefined })
  }

  const updateSearch = (value: string) => { setSearch(value); setPage(1) }
  const updateActive = (value: '' | 'true' | 'false') => { setActive(value); setPage(1) }
  const updatePageSize = (value: number) => { setPageSize(value); setPage(1) }

  return (
    <>
      <PageHeader
title="Colegios"
createLabel="Nuevo colegio"
onCreate={() => setCreating((value) => !value)}
      />
      <ListToolbar
search={search}
onSearch={updateSearch}
pageSize={pageSize}
onPageSize={updatePageSize}
      >
<select
className={`${inputClass} sm:w-44`}
value={active}
onChange={(event) => updateActive(event.target.value as '' | 'true' | 'false')}
>
<option value="">
Todos los estados
</option>
<option value="true">
Activos
</option>
<option value="false">
Inactivos
</option>
</select>
</ListToolbar>
      <AlphabetFilter
value={initial}
onChange={(value) => { setInitial(value); setPage(1) }}
      />
      <div className={`grid gap-4 ${creating ? 'xl:grid-cols-[1fr_360px]' : ''}`}>
        <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/70">
          {query.isLoading ? <LoadingState /> : query.data?.items.length ? <>
<div className="divide-y divide-border">
{query.data.items.map((school) => <div
key={school.id}
className="flex items-center gap-4 p-4 hover:bg-muted/40"
>
<div className="grid size-10 shrink-0 place-items-center rounded-[4px] bg-primary/10 text-primary">
<School size={19} />
</div>
<div className="min-w-0 flex-1">
<p className="font-semibold">
{school.name}
</p>
<div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
{school.address && <span className="flex items-center gap-1">
<MapPin size={12} />
{school.address}
</span>}
{school.contactEmail && <span className="flex items-center gap-1">
<Mail size={12} />
{school.contactEmail}
</span>}
</div>
</div>
<span className="rounded-full bg-emerald-500/10 px-2 py-1 text-[10px] font-semibold text-emerald-600">
Activo
</span>
<button
className="rounded-[4px] p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
aria-label={`Editar ${school.name}`}
onClick={() => setEditing(school)}
>
<Pencil size={15} />
</button>
</div>)}
</div>
<Pagination
page={query.data.page}
totalPages={query.data.totalPages}
total={query.data.total}
onPage={setPage}
/>
</> : <EmptyState
title="No hay resultados"
description={search ? 'Prueba con otros términos o elimina los filtros.' : 'Añade el primer centro para poder asignar profesores, alumnos y grupos.'}
/>}
        </Card>
        {creating && <FormPanel
title="Nuevo colegio"
description="Los datos de contacto podrán completarse más adelante."
error={mutation.error?.message}
        >
<form
className="grid gap-4"
onSubmit={submit}
>
<label className={labelClass}>
Nombre
<input
className={inputClass}
name="name"
required
autoFocus
/>
</label>
<label className={labelClass}>
Dirección
<input
className={inputClass}
name="address"
/>
</label>
<label className={labelClass}>
Email de contacto
<input
className={inputClass}
name="contactEmail"
type="email"
/>
</label>
<SubmitButton pending={mutation.isPending}>
Guardar colegio
</SubmitButton>
</form>
</FormPanel>}
      </div>
      <EditSchoolDialog
item={editing}
onClose={() => setEditing(null)}
onSaved={() => queryClient.invalidateQueries({ queryKey: ['schools'] })}
      />
    </>
  )
}
