import { type FormEvent,useEffect, useState } from 'react'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, ShieldCheck, Trash2 } from 'lucide-react'

import { Button } from '../../components/ui/button'
import { Dialog, DialogContent, DialogHeader } from '../../components/ui/dialog'
import { backofficeApi, type Guardian, type PaymentMethod, type Student } from '../../lib/api'
import { inputClass, labelClass, LoadingState } from '../shared/backoffice-ui'

const paymentMethods: { value: PaymentMethod; label: string }[] = [
  { value: 'card', label: 'Tarjeta bancaria' },
  { value: 'direct-debit', label: 'Domiciliación' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'bizum', label: 'Bizum' },
  { value: 'transfer', label: 'Transferencia' },
]

export function StudentPaymentDialog({ student, onClose }: { student: Student | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['student-payment', student?.id], queryFn: () => backofficeApi.students.getPaymentSettings(student!.id), enabled: Boolean(student) })
  const mutation = useMutation({ mutationFn: ({ id, payload }: { id: string; payload: Parameters<typeof backofficeApi.students.updatePaymentSettings>[1] }) => backofficeApi.students.updatePaymentSettings(id, payload), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['student-payment', student?.id] }); onClose() } })
  const [method, setMethod] = useState<PaymentMethod>('card')
  useEffect(() => { if (query.data?.method) setMethod(query.data.method) }, [query.data])

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!student) return
    const data = new FormData(event.currentTarget)
    mutation.mutate({ id: student.id, payload: { method, accountHolder: String(data.get('accountHolder') || '') || undefined, last4: String(data.get('last4') || '') || undefined, cardBrand: String(data.get('cardBrand') || '') || undefined, phone: String(data.get('phone') || '') || undefined, reference: String(data.get('reference') || '') || undefined } })
  }

  return <Dialog
open={Boolean(student)}
onOpenChange={(open) => !open && onClose()}
  >
<DialogContent>
<DialogHeader
title="Método de pago"
description={student ? `${student.firstName} ${student.lastName}` : undefined}
/>
{query.isLoading ? <LoadingState /> : <form
className="grid gap-4"
onSubmit={submit}
>
<label className={labelClass}>
Tipo de pago
<select
className={inputClass}
value={method}
onChange={(event) => setMethod(event.target.value as PaymentMethod)}
>
{paymentMethods.map((option) => <option
key={option.value}
value={option.value}
>
{option.label}
</option>)}
</select>
</label>
{method === 'card' && <>
<div className="rounded-[4px] bg-gradient-to-br from-violet-700 to-indigo-800 p-5 text-white shadow-lg">
<p className="text-xs uppercase tracking-[.2em]">
Tarjeta tokenizada
</p>
<p className="mt-8 font-mono text-xl tracking-widest">
•••• •••• ••••
{query.data?.last4 ?? '••••'}
</p>
</div>
<label className={labelClass}>
Titular
<input
className={inputClass}
name="accountHolder"
defaultValue={query.data?.accountHolder ?? ''}
/>
</label>
<div className="grid grid-cols-2 gap-3">
<label className={labelClass}>
Marca
<input
className={inputClass}
name="cardBrand"
defaultValue={query.data?.cardBrand ?? ''}
placeholder="Visa"
/>
</label>
<label className={labelClass}>
Últimos 4 dígitos
<input
className={inputClass}
name="last4"
inputMode="numeric"
pattern="\d{4}"
maxLength={4}
defaultValue={query.data?.last4 ?? ''}
/>
</label>
</div>
</>}
{method === 'direct-debit' && <>
<label className={labelClass}>
Titular de la cuenta
<input
className={inputClass}
name="accountHolder"
defaultValue={query.data?.accountHolder ?? ''}
/>
</label>
<label className={labelClass}>
Últimos 4 dígitos del IBAN
<input
className={inputClass}
name="last4"
inputMode="numeric"
pattern="\d{4}"
maxLength={4}
defaultValue={query.data?.last4 ?? ''}
/>
</label>
<label className={labelClass}>
Referencia del mandato
<input
className={inputClass}
name="reference"
defaultValue={query.data?.reference ?? ''}
/>
</label>
</>}
{method === 'bizum' && <label className={labelClass}>
Teléfono asociado
<input
className={inputClass}
name="phone"
type="tel"
defaultValue={query.data?.phone ?? ''}
/>
</label>}
{method === 'transfer' && <label className={labelClass}>
Referencia bancaria
<input
className={inputClass}
name="reference"
defaultValue={query.data?.reference ?? ''}
/>
</label>}
<div className="flex gap-2 rounded-[4px] bg-muted p-3 text-xs text-muted-foreground">
<ShieldCheck
size={16}
className="shrink-0 text-primary"
/>
No se almacenan números completos de tarjeta, CVC ni credenciales bancarias.
</div>
{mutation.error && <p className="text-xs text-rose-600">
{mutation.error.message}
</p>}
<Button
type="submit"
disabled={mutation.isPending}
>
{mutation.isPending ? 'Guardando...' : 'Guardar método'}
</Button>
</form>}
</DialogContent>
</Dialog>
}

const emptyGuardian = (): Guardian => ({ firstName: '', lastName: '', relationship: 'Madre', phone: '', email: '', isPrimary: false })

export function StudentGuardiansDialog({ student, onClose }: { student: Student | null; onClose: () => void }) {
  const queryClient = useQueryClient()
  const query = useQuery({ queryKey: ['student-guardians', student?.id], queryFn: () => backofficeApi.students.getGuardians(student!.id), enabled: Boolean(student) })
  const [rows, setRows] = useState<Guardian[]>([])
  useEffect(() => { if (query.data) setRows(query.data) }, [query.data])
  useEffect(() => { if (!student) setRows([]) }, [student])
  const mutation = useMutation({ mutationFn: ({ id, guardians }: { id: string; guardians: Guardian[] }) => backofficeApi.students.updateGuardians(id, guardians), onSuccess: async () => { await queryClient.invalidateQueries({ queryKey: ['student-guardians', student?.id] }); onClose() } })
  const update = (index: number, changes: Partial<Guardian>) => setRows((current) => current.map((row, rowIndex) => rowIndex === index ? { ...row, ...changes } : row))
  const save = () => { if (student) mutation.mutate({ id: student.id, guardians: rows.map(({ id: _id, ...guardian }) => guardian) }) }

  return <Dialog
open={Boolean(student)}
onOpenChange={(open) => !open && onClose()}
  >
<DialogContent>
<DialogHeader
title="Familiares y contactos"
description={student ? `${student.firstName} ${student.lastName}` : undefined}
/>
{query.isLoading ? <LoadingState /> : <div className="grid gap-3">
<div className="flex justify-end">
<Button
type="button"
variant="outline"
size="sm"
onClick={() => setRows((current) => [...current, emptyGuardian()])}
>
<Plus size={14} />
Añadir familiar
</Button>
</div>
{rows.length ? rows.map((guardian, index) => <div
key={guardian.id ?? index}
className={`grid gap-3 rounded-[4px] border p-3 ${guardian.isPrimary ? 'border-primary bg-primary/5' : 'border-border'}`}
>
<div className="flex items-center justify-between">
<span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${guardian.isPrimary ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground'}`}>
{guardian.isPrimary ? 'Contacto principal' : 'Contacto familiar'}
</span>
<button
type="button"
className="rounded-[4px] p-1.5 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-600"
onClick={() => setRows((current) => current.filter((_, rowIndex) => rowIndex !== index))}
>
<Trash2 size={14} />
</button>
</div>
<div className="grid grid-cols-2 gap-3">
<label className={labelClass}>
Nombre
<input
className={inputClass}
value={guardian.firstName}
required
onChange={(event) => update(index, { firstName: event.target.value })}
/>
</label>
<label className={labelClass}>
Apellidos
<input
className={inputClass}
value={guardian.lastName}
required
onChange={(event) => update(index, { lastName: event.target.value })}
/>
</label>
</div>
<label className={labelClass}>
Parentesco
<select
className={inputClass}
value={guardian.relationship}
onChange={(event) => update(index, { relationship: event.target.value })}
>
<option>
Madre
</option>
<option>
Padre
</option>
<option>
Tutor/a legal
</option>
<option>
Abuelo/a
</option>
<option>
Otro
</option>
</select>
</label>
<div className="grid grid-cols-2 gap-3">
<label className={labelClass}>
Teléfono
<input
className={inputClass}
type="tel"
value={guardian.phone}
required
onChange={(event) => update(index, { phone: event.target.value })}
/>
</label>
<label className={labelClass}>
Email
<input
className={inputClass}
type="email"
value={guardian.email ?? ''}
onChange={(event) => update(index, { email: event.target.value })}
/>
</label>
</div>
<label className="flex items-center gap-2 text-xs font-medium">
<input
type="checkbox"
checked={guardian.isPrimary}
onChange={(event) => setRows((current) => current.map((row, rowIndex) => ({ ...row, isPrimary: rowIndex === index ? event.target.checked : event.target.checked ? false : row.isPrimary })))}
/>
Contacto principal
</label>
</div>) : <p className="rounded-[4px] border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
No hay familiares asociados.
</p>}
{mutation.error && <p className="text-xs text-rose-600">
{mutation.error.message}
</p>}
<Button
type="button"
disabled={mutation.isPending || rows.some((row) => !row.firstName || !row.lastName || !row.phone)}
onClick={save}
>
{mutation.isPending ? 'Guardando...' : 'Guardar familiares'}
</Button>
</div>}
</DialogContent>
</Dialog>
}
