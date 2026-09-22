import { type FormEvent, useDeferredValue, useState } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, Users } from 'lucide-react'

import { Card } from '../../components/ui/card'
import { backofficeApi } from '../../lib/api'
import { EmptyState, FormPanel, inputClass, labelClass, ListToolbar, LoadingState, PageHeader, Pagination, SubmitButton } from '../shared/backoffice-ui'

const activityTypes = ['Casal de Verano', 'Casal de Navidad', 'Casal de Semana Santa', 'Jornadas Abiertas', 'Pruebas', 'Otros']

export function ActivitiesPage() {
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [active, setActive] = useState<'' | 'true' | 'false'>('')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const deferredSearch = useDeferredValue(search)
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['activities', deferredSearch, active, page, pageSize], queryFn: () => backofficeApi.activities.list({ search: deferredSearch, active: active || undefined, page, pageSize }) })
  const mutation = useMutation({
    mutationFn: backofficeApi.activities.create,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['activities'] })
      setCreating(false)
    },
  })

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const minimumAge = String(data.get('minimumAge') || '')
    const maximumAge = String(data.get('maximumAge') || '')

    mutation.mutate({
      name: String(data.get('name')),
      category: String(data.get('category')),
      description: String(data.get('description') || '') || undefined,
      minimumAge: minimumAge ? Number(minimumAge) : undefined,
      maximumAge: maximumAge ? Number(maximumAge) : undefined,
    })
  }

  return (
    <>
      <PageHeader
title="Actividades"
createLabel="Nueva actividad"
onCreate={() => setCreating((value) => !value)}
      />
      <ListToolbar
search={search}
onSearch={(value) => { setSearch(value); setPage(1) }}
pageSize={pageSize}
onPageSize={(value) => { setPageSize(value); setPage(1) }}
      >
        <select
className={`${inputClass} sm:w-44`}
value={active}
onChange={(event) => { setActive(event.target.value as '' | 'true' | 'false'); setPage(1) }}
        >
          <option value="">
Todos los estados
</option>
          <option value="true">
Activas
</option>
          <option value="false">
Inactivas
</option>
        </select>
      </ListToolbar>
      <div className={`grid gap-4 ${creating ? 'xl:grid-cols-[1fr_380px]' : ''}`}>
        <Card className="overflow-hidden border-0 shadow-sm ring-1 ring-border/70">
          {query.isLoading ? <LoadingState /> : query.data?.items.length ? <>
            <div className="divide-y divide-border">
              {query.data.items.map((activity) => <div
key={activity.id}
className="flex items-center gap-4 p-4 hover:bg-muted/40"
              >
                <div className="grid size-10 shrink-0 place-items-center rounded-[4px] bg-primary/10 text-primary">
<CalendarDays size={19} />
</div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
<p className="font-semibold">
{activity.name}
</p>
{activity.category && <span className="rounded-full bg-violet-500/10 px-2 py-1 text-[10px] font-semibold text-violet-700">
{activity.category}
</span>}
</div>
                  <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    {activity.description && <span>
{activity.description}
</span>}
                    {(activity.minimumAge !== null || activity.maximumAge !== null) && <span className="flex items-center gap-1">
<Users size={12} />
{activity.minimumAge ?? 0}
–
{activity.maximumAge ?? 21}
{' '}
años
</span>}
                  </div>
                </div>
                <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${activity.active ? 'bg-emerald-500/10 text-emerald-600' : 'bg-slate-500/10 text-slate-600'}`}>
{activity.active ? 'Activa' : 'Inactiva'}
</span>
              </div>)}
            </div>
            <Pagination
page={query.data.page}
totalPages={query.data.totalPages}
total={query.data.total}
onPage={setPage}
            />
          </> : <EmptyState
title="No hay actividades"
description={search ? 'Prueba con otros términos o elimina los filtros.' : 'Añade la primera actividad para comenzar a organizar grupos y sesiones.'}
          />}
        </Card>
        {creating && <FormPanel
title="Nueva actividad"
description="Después podrás crear grupos, fechas y asignar profesores."
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
list="activity-name-options"
required
autoFocus
/>
<datalist id="activity-name-options">
{activityTypes.map((type) => <option
key={type}
value={type}
/>)}
</datalist>
</label>
            <label className={labelClass}>
Tipo
<select
className={inputClass}
name="category"
defaultValue="Otros"
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
Descripción
<textarea
className={`${inputClass} min-h-20 py-2`}
name="description"
/>
</label>
            <div className="grid grid-cols-2 gap-3">
              <label className={labelClass}>
Edad mínima
<input
className={inputClass}
name="minimumAge"
type="number"
min="0"
max="21"
/>
</label>
              <label className={labelClass}>
Edad máxima
<input
className={inputClass}
name="maximumAge"
type="number"
min="0"
max="21"
/>
</label>
            </div>
            <SubmitButton pending={mutation.isPending}>
Guardar actividad
</SubmitButton>
          </form>
        </FormPanel>}
      </div>
    </>
  )
}
