import { type ChangeEvent,useState } from 'react'

import { useMutation } from '@tanstack/react-query'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'
import * as XLSX from 'xlsx'

import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { backofficeApi, type ExportFormat, type ImportEntity } from '../../lib/api'
import { inputClass } from '../shared/backoffice-ui'

const entities: { value: ImportEntity; label: string; columns: string }[] = [
  { value: 'schools', label: 'Colegios', columns: 'name, address, contactEmail' },
  { value: 'teachers', label: 'Profesores', columns: 'firstName, lastName, email, phone, schoolNames' },
  { value: 'students', label: 'Alumnos', columns: 'firstName, lastName, birthDate, schoolName, foodIntolerances, status, notes' },
]

export function CommunicationPage() {
  const [entity, setEntity] = useState<ImportEntity>('schools')
  const [format, setFormat] = useState<ExportFormat>('xlsx')
  const exportMutation = useMutation({ mutationFn: () => backofficeApi.communication.export(entity, format) })
  const importMutation = useMutation({ mutationFn: ({ selected, rows }: { selected: ImportEntity; rows: Record<string, unknown>[] }) => backofficeApi.communication.import(selected, rows) })
  const definition = entities.find((item) => item.value === entity)!

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const workbook = XLSX.read(await file.arrayBuffer(), { type: 'array' })
    const sheet = workbook.Sheets[workbook.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
    importMutation.mutate({ selected: entity, rows })
    event.target.value = ''
  }

  return (
    <>
      <h1 className="mb-5 text-2xl font-bold tracking-tight">
Comunicación
</h1>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-0 p-5 shadow-sm ring-1 ring-border/70">
          <div className="flex items-center gap-2">
<Download
size={18}
className="text-primary"
/>
<h2 className="font-semibold">
Exportar datos
</h2>
</div>
          <p className="mt-2 text-xs text-muted-foreground">
Descarga todos los registros de la organización para trabajar con ellos o conservar una copia.
</p>
          <div className="mt-5 grid gap-4">
<label className="grid gap-1.5 text-xs font-semibold">
Datos
<select
className={inputClass}
value={entity}
onChange={(event) => setEntity(event.target.value as ImportEntity)}
>
{entities.map((item) => <option
key={item.value}
value={item.value}
>
{item.label}
</option>)}
</select>
</label>
<label className="grid gap-1.5 text-xs font-semibold">
Formato
<select
className={inputClass}
value={format}
onChange={(event) => setFormat(event.target.value as ExportFormat)}
>
<option value="xlsx">
Excel (.xlsx)
</option>
<option value="csv">
CSV (.csv)
</option>
</select>
</label>
<Button
onClick={() => exportMutation.mutate()}
disabled={exportMutation.isPending}
>
<FileSpreadsheet size={16} />
{exportMutation.isPending ? 'Preparando...' : 'Descargar archivo'}
</Button>
{exportMutation.error && <p className="text-xs text-rose-600">
{exportMutation.error.message}
</p>}
</div>
        </Card>

        <Card className="border-0 p-5 shadow-sm ring-1 ring-border/70">
          <div className="flex items-center gap-2">
<Upload
size={18}
className="text-primary"
/>
<h2 className="font-semibold">
Importar datos
</h2>
</div>
          <p className="mt-2 text-xs text-muted-foreground">
Admite archivos CSV y Excel. La primera fila debe contener los nombres de columnas.
</p>
          <div className="mt-5 grid gap-4">
<label className="grid gap-1.5 text-xs font-semibold">
Tipo de contenido
<select
className={inputClass}
value={entity}
onChange={(event) => { setEntity(event.target.value as ImportEntity); importMutation.reset() }}
>
{entities.map((item) => <option
key={item.value}
value={item.value}
>
{item.label}
</option>)}
</select>
</label>
<div className="rounded-[4px] bg-muted p-3 text-xs">
<p className="font-semibold">
Columnas esperadas
</p>
<code className="mt-1 block text-muted-foreground">
{definition.columns}
</code>
<p className="mt-2 text-muted-foreground">
En profesores, separa varios colegios con punto y coma.
En alumnos, separa las intolerancias con punto y coma.
</p>
</div>
<label className="flex h-24 cursor-pointer flex-col items-center justify-center rounded-[4px] border border-dashed border-primary/40 bg-primary/5 text-center text-xs transition hover:bg-primary/10">
<Upload
size={20}
className="mb-2 text-primary"
/>
<span className="font-semibold">
Seleccionar CSV o Excel
</span>
<input
className="sr-only"
type="file"
accept=".csv,.xlsx,.xls"
onChange={importFile}
disabled={importMutation.isPending}
/>
</label>
{importMutation.isPending && <p className="text-xs text-muted-foreground">
Validando e importando...
</p>}
{importMutation.data && <div className="grid grid-cols-4 gap-2 text-center text-xs">
<Result
value={importMutation.data.total}
label="Filas"
/>
<Result
value={importMutation.data.created}
label="Creadas"
/>
<Result
value={importMutation.data.updated}
label="Actualizadas"
/>
<Result
value={importMutation.data.rejected}
label="Rechazadas"
/>
</div>}
{importMutation.data?.errors.length ? <div className="max-h-36 overflow-auto rounded-[4px] bg-rose-500/10 p-3 text-xs text-rose-700">
{importMutation.data.errors.map((error) => <p key={`${error.row}-${error.message}`}>
Fila
{error.row}
:
{error.message}
</p>)}
</div> : null}
{importMutation.error && <p className="text-xs text-rose-600">
{importMutation.error.message}
</p>}
</div>
        </Card>
      </div>
    </>
  )
}

function Result({ value, label }: { value: number; label: string }) {
  return <div className="rounded-[4px] bg-muted p-2">
<strong className="block text-base">
{value}
</strong>
<span className="text-muted-foreground">
{label}
</span>
</div>
}
