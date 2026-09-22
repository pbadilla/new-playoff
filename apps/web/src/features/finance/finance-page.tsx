import { type ReactNode,useState } from 'react'

import { ArrowLeftRight, Banknote, CreditCard, Landmark, ShieldCheck, Smartphone } from 'lucide-react'

import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { inputClass, labelClass } from '../shared/backoffice-ui'

const methods = [
  ['card', 'Tarjeta bancaria', 'Visa, Mastercard y otras', CreditCard],
  ['direct-debit', 'Domiciliación', 'Mandato bancario SEPA', Landmark],
  ['cash', 'Efectivo', 'Cobro presencial', Banknote],
  ['bizum', 'Bizum', 'Pago asociado a un teléfono', Smartphone],
  ['transfer', 'Transferencia', 'Ingreso en cuenta bancaria', ArrowLeftRight],
] as const

type PaymentMethod = (typeof methods)[number][0]

export function FinancePage() {
  const [method, setMethod] = useState<PaymentMethod>('card')
  const [number, setNumber] = useState('')
  const [name, setName] = useState('')
  const [expiry, setExpiry] = useState('')
  const formattedNumber = number.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim()

  return <>
    <div className="mb-5">
<h1 className="text-2xl font-bold tracking-tight">
Finanzas
</h1>
<p className="mt-1 text-sm text-muted-foreground">
Configura cómo se registran y reciben los pagos.
</p>
</div>
    <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
      <Card className="border-0 p-5 shadow-sm ring-1 ring-border/70">
        <h2 className="font-semibold">
Tipo de pago
</h2>
<p className="mt-1 text-xs text-muted-foreground">
Selecciona el método que utilizará la familia.
</p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          {methods.map(([id, label, description, Icon]) => <button
key={id}
type="button"
className={`flex items-center gap-3 rounded-[4px] border p-4 text-left transition ${method === id ? 'border-primary bg-primary/5 ring-2 ring-primary/15' : 'border-border hover:border-primary/40 hover:bg-muted/40'}`}
onClick={() => setMethod(id)}
          >
<span className={`grid size-10 shrink-0 place-items-center rounded-[4px] ${method === id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
<Icon size={19} />
</span>
<span>
<strong className="block text-sm">
{label}
</strong>
<span className="mt-0.5 block text-xs text-muted-foreground">
{description}
</span>
</span>
</button>)}
        </div>
      </Card>
      <Card className="border-0 p-5 shadow-sm ring-1 ring-border/70">
        {method === 'card' && <CardPayment
number={formattedNumber}
name={name}
expiry={expiry}
onNumber={setNumber}
onName={setName}
onExpiry={setExpiry}
        />}
        {method === 'direct-debit' && <PaymentPanel
title="Domiciliación bancaria"
description="Registra la cuenta y la referencia del mandato SEPA."
        >
<Field label="Titular de la cuenta" />
<Field
label="IBAN"
placeholder="ES00 0000 0000 0000 0000 0000"
/>
<Field label="Referencia del mandato" />
</PaymentPanel>}
        {method === 'cash' && <PaymentPanel
title="Pago en efectivo"
description="Registra quién ha recibido el importe y cuándo."
        >
<Field
label="Importe"
type="number"
/>
<Field
label="Fecha de cobro"
type="date"
/>
<Field label="Recibido por" />
</PaymentPanel>}
        {method === 'bizum' && <PaymentPanel
title="Pago por Bizum"
description="Asocia el pago con el teléfono y su referencia."
        >
<Field
label="Teléfono"
type="tel"
placeholder="+34 600 000 000"
/>
<Field label="Referencia" />
</PaymentPanel>}
        {method === 'transfer' && <PaymentPanel
title="Transferencia bancaria"
description="Registra la transferencia recibida."
        >
<Field label="Ordenante" />
<Field label="Referencia bancaria" />
<Field
label="Fecha de ingreso"
type="date"
/>
</PaymentPanel>}
      </Card>
    </div>
  </>
}

function CardPayment({ number, name, expiry, onNumber, onName, onExpiry }: { number: string; name: string; expiry: string; onNumber: (value: string) => void; onName: (value: string) => void; onExpiry: (value: string) => void }) {
  return <div>
<h2 className="font-semibold">
Tarjeta bancaria
</h2>
    <div className="my-5 flex aspect-[1.62/1] max-h-56 flex-col justify-between rounded-[4px] bg-gradient-to-br from-violet-700 via-violet-600 to-indigo-800 p-5 text-white shadow-xl">
<div className="flex items-start justify-between">
<span className="text-xs font-semibold uppercase tracking-[.2em]">
RG360
</span>
<CreditCard size={26} />
</div>
<p className="font-mono text-lg tracking-[.12em] sm:text-xl">
{number || '•••• •••• •••• ••••'}
</p>
<div className="flex items-end justify-between gap-3 text-xs">
<div>
<span className="block text-[9px] uppercase text-white/65">
Titular
</span>
<strong className="uppercase">
{name || 'NOMBRE Y APELLIDOS'}
</strong>
</div>
<div className="text-right">
<span className="block text-[9px] uppercase text-white/65">
Caduca
</span>
<strong>
{expiry || 'MM/AA'}
</strong>
</div>
</div>
</div>
    <div className="grid gap-3">
<label className={labelClass}>
Número de tarjeta
<input
className={inputClass}
inputMode="numeric"
autoComplete="cc-number"
value={number}
placeholder="1234 5678 9012 3456"
onChange={(event) => onNumber(event.target.value)}
/>
</label>
<label className={labelClass}>
Titular
<input
className={inputClass}
autoComplete="cc-name"
value={name}
onChange={(event) => onName(event.target.value)}
/>
</label>
<div className="grid grid-cols-2 gap-3">
<label className={labelClass}>
Caducidad
<input
className={inputClass}
autoComplete="cc-exp"
value={expiry}
placeholder="MM/AA"
onChange={(event) => onExpiry(event.target.value.slice(0, 5))}
/>
</label>
<label className={labelClass}>
CVC
<input
className={inputClass}
type="password"
inputMode="numeric"
autoComplete="cc-csc"
maxLength={4}
placeholder="•••"
/>
</label>
</div>
<div className="flex gap-2 rounded-[4px] bg-muted p-3 text-xs text-muted-foreground">
<ShieldCheck
size={16}
className="shrink-0 text-primary"
/>
<span>
La tarjeta deberá tokenizarse mediante una pasarela de pagos; no se almacenará directamente.
</span>
</div>
<Button type="button">
Guardar método
</Button>
</div>
  </div>
}

function PaymentPanel({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return <div>
<h2 className="font-semibold">
{title}
</h2>
<p className="mt-1 text-xs text-muted-foreground">
{description}
</p>
<div className="mt-5 grid gap-4">
{children}
<Button type="button">
Guardar método
</Button>
</div>
</div>
}

function Field({ label, type = 'text', placeholder }: { label: string; type?: string; placeholder?: string }) {
  return <label className={labelClass}>
{label}
<input
className={inputClass}
type={type}
placeholder={placeholder}
/>
</label>
}
