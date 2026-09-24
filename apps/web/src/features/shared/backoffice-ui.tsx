import { AlertCircle, ChevronLeft, ChevronRight, LoaderCircle, Plus, Search } from 'lucide-react'
import type { ReactNode } from 'react'

import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'

export const inputClass = 'h-10 w-full rounded-[4px] border border-border bg-background px-3 text-sm outline-none transition placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/15'
export const labelClass = 'grid gap-1.5 text-xs font-semibold text-foreground'

const initials = [...'ABCDEFGHIJKLMN', 'Ñ', ...'OPQRSTUVWXYZ']

export function AlphabetFilter({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return (
    <div
className="mb-4 flex gap-1 overflow-x-auto pb-1"
aria-label="Filtrar por inicial"
    >
      <Button
type="button"
size="sm"
variant={value ? 'outline' : 'default'}
onClick={() => onChange('')}
      >
        Todos
      </Button>
      {initials.map((initial) => (
        <Button
          key={initial}
          type="button"
          size="sm"
          variant={value === initial ? 'default' : 'outline'}
          className="min-w-8 px-2"
          aria-pressed={value === initial}
          onClick={() => onChange(value === initial ? '' : initial)}
        >
          {initial}
        </Button>
      ))}
    </div>
  )
}

export function PageHeader({ title, onCreate, createLabel }: { title: string; onCreate: () => void; createLabel: string }) {
  return (
    <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <h1 className="text-2xl font-bold tracking-tight">
{title}
</h1>
      <Button onClick={onCreate}>
<Plus size={16} />
{createLabel}
</Button>
    </div>
  )
}

export function ListToolbar({ search, onSearch, pageSize, onPageSize, children }: { search: string; onSearch: (value: string) => void; pageSize: number; onPageSize: (value: number) => void; children?: ReactNode }) {
  return (
    <div className="mb-3 flex flex-col gap-2 sm:flex-row">
      <label className="relative min-w-0 flex-1">
<Search
className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
size={15}
/>
<span className="sr-only">
Buscar
</span>
<input
className={`${inputClass} pl-9`}
value={search}
onChange={(event) => onSearch(event.target.value)}
placeholder="Buscar..."
/>
</label>
      {children}
      <label>
<span className="sr-only">
Resultados por página
</span>
<select
className={`${inputClass} sm:w-36`}
value={pageSize}
onChange={(event) => onPageSize(Number(event.target.value))}
>
<option value={10}>
10 por página
</option>
<option value={25}>
25 por página
</option>
<option value={50}>
50 por página
</option>
</select>
</label>
    </div>
  )
}

export function Pagination({ page, totalPages, total, onPage }: { page: number; totalPages: number; total: number; onPage: (page: number) => void }) {
  return (
    <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:flex-row">
      <span>
{total}
{' '}
resultados
</span>
      <div className="flex items-center gap-2">
<Button
variant="outline"
size="sm"
disabled={page <= 1}
onClick={() => onPage(page - 1)}
>
<ChevronLeft size={14} />
Anterior
</Button>
<span>
Página
{page}
{' '}
de
{totalPages}
</span>
<Button
variant="outline"
size="sm"
disabled={page >= totalPages}
onClick={() => onPage(page + 1)}
>
Siguiente
<ChevronRight size={14} />
</Button>
</div>
    </div>
  )
}

export function FormPanel({ title, description, children, error }: { title: string; description: string; children: ReactNode; error?: string | null }) {
  return (
    <Card className="border-0 p-5 shadow-sm ring-1 ring-border/70">
      <h2 className="font-semibold">
{title}
</h2>
<p className="mt-1 text-xs text-muted-foreground">
{description}
</p>
      {error && <div className="mt-4 flex items-start gap-2 rounded-[4px] bg-rose-500/10 p-3 text-xs text-rose-600">
<AlertCircle
size={15}
className="shrink-0"
/>
{error}
</div>}
      <div className="mt-5">
{children}
</div>
    </Card>
  )
}

export function LoadingState() {
  return <div className="grid min-h-48 place-items-center text-muted-foreground">
<LoaderCircle
className="animate-spin"
size={24}
/>
</div>
}

export function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="grid min-h-48 place-items-center p-8 text-center">
<div>
<p className="text-sm font-semibold">
{title}
</p>
<p className="mt-1 max-w-sm text-xs text-muted-foreground">
{description}
</p>
</div>
</div>
}

export function SubmitButton({ pending, children }: { pending: boolean; children: ReactNode }) {
  return <Button
className="w-full"
type="submit"
disabled={pending}
  >
{pending && <LoaderCircle
className="animate-spin"
size={15}
/>}
{children}
</Button>
}
