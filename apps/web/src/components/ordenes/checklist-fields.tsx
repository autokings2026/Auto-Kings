'use client'

import { Label } from '@/components/ui/label'
import { TESTIGOS_TABLERO, ANORMALIDADES_REPORTADAS } from '@kings/shared'

export function toggleItem(list: string[], item: string): string[] {
  return list.includes(item) ? list.filter(i => i !== item) : [...list, item]
}

export function CheckboxGrid({
  items, selected, onToggle, readonly,
}: {
  items: string[]
  selected: string[]
  onToggle: (item: string) => void
  readonly: boolean
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
      {items.map(item => (
        <label
          key={item}
          className={`flex items-center gap-2 text-sm px-2.5 py-1.5 rounded-lg border cursor-pointer transition-colors ${
            selected.includes(item)
              ? 'border-accent/40 bg-accent/10 text-white'
              : 'border-surface-2 bg-surface-2/40 text-muted-foreground hover:text-foreground'
          } ${readonly ? 'cursor-not-allowed opacity-70' : ''}`}
        >
          <input
            type="checkbox"
            checked={selected.includes(item)}
            onChange={() => !readonly && onToggle(item)}
            disabled={readonly}
            className="accent-secondary h-3.5 w-3.5 shrink-0"
          />
          {item}
        </label>
      ))}
    </div>
  )
}

export interface ChecklistState {
  testigos: string[]
  setTestigos: (v: string[] | ((prev: string[]) => string[])) => void
  testigoOtro: string
  setTestigoOtro: (v: string) => void
  anormalidades: string[]
  setAnormalidades: (v: string[] | ((prev: string[]) => string[])) => void
  anormalidadOtro: string
  setAnormalidadOtro: (v: string) => void
  obsRecepcion: string
  setObsRecepcion: (v: string) => void
  obsAdicionales: string
  setObsAdicionales: (v: string) => void
}

export function useChecklistFieldsRequired(state: ChecklistState) {
  return {
    testigos: state.testigos,
    testigoOtro: state.testigoOtro || undefined,
    anormalidades: state.anormalidades,
    anormalidadOtro: state.anormalidadOtro || undefined,
    observacionesRecepcion: state.obsRecepcion || undefined,
    observacionesAdicionales: state.obsAdicionales || undefined,
  }
}

export function ChecklistFields({ state, readonly }: { state: ChecklistState; readonly: boolean }) {
  return (
    <div className="space-y-5">
      {/* Testigos del tablero */}
      <div className="space-y-2">
        <Label className="text-muted-foreground">Testigos del tablero encendidos</Label>
        <CheckboxGrid
          items={TESTIGOS_TABLERO}
          selected={state.testigos}
          onToggle={(i) => state.setTestigos(t => toggleItem(t, i))}
          readonly={readonly}
        />
        <input
          value={state.testigoOtro}
          onChange={e => state.setTestigoOtro(e.target.value)}
          disabled={readonly}
          placeholder="Otro testigo…"
          className="w-full h-9 text-sm rounded-lg border border-surface-2 bg-surface-2 px-3 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-secondary disabled:opacity-60"
        />
      </div>

      {/* Anormalidades */}
      <div className="space-y-2">
        <Label className="text-muted-foreground">Anormalidades reportadas por el cliente</Label>
        <CheckboxGrid
          items={ANORMALIDADES_REPORTADAS}
          selected={state.anormalidades}
          onToggle={(i) => state.setAnormalidades(a => toggleItem(a, i))}
          readonly={readonly}
        />
        <input
          value={state.anormalidadOtro}
          onChange={e => state.setAnormalidadOtro(e.target.value)}
          disabled={readonly}
          placeholder="Otra anormalidad…"
          className="w-full h-9 text-sm rounded-lg border border-surface-2 bg-surface-2 px-3 text-white placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-secondary disabled:opacity-60"
        />
      </div>

      {/* Observaciones */}
      <div className="grid sm:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label className="text-muted-foreground">Observaciones de recepción</Label>
          <textarea
            value={state.obsRecepcion}
            onChange={e => state.setObsRecepcion(e.target.value)}
            disabled={readonly}
            rows={3}
            className="w-full rounded-md border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary resize-none disabled:opacity-60"
            placeholder="Estado general, golpes, rayones, faltantes…"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-muted-foreground">Observaciones adicionales</Label>
          <textarea
            value={state.obsAdicionales}
            onChange={e => state.setObsAdicionales(e.target.value)}
            disabled={readonly}
            rows={3}
            className="w-full rounded-md border border-surface-2 bg-surface-2 px-3 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-secondary resize-none disabled:opacity-60"
            placeholder="Cualquier otra nota relevante…"
          />
        </div>
      </div>
    </div>
  )
}
