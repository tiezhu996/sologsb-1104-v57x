import { useState } from 'react'
import type { MeasureUnit } from '../../types/member'
import { cunToMm, formatDimension, mmToCun, roundMeasure } from '../../utils/measure'

interface SizeFieldProps {
  label: string
  valueMm: number
  toleranceMm: number
  onChange?: (valueMm: number) => void
  unit?: MeasureUnit
  onUnitChange?: (unit: MeasureUnit) => void
  readOnly?: boolean
}

export function SizeField({ label, valueMm, toleranceMm, onChange, unit, onUnitChange, readOnly = false }: SizeFieldProps) {
  const [localUnit, setLocalUnit] = useState<MeasureUnit>('mm')
  const activeUnit = unit ?? localUnit
  const displayedValue = roundMeasure(activeUnit === 'mm' ? valueMm : mmToCun(valueMm), 2)

  const updateValue = (rawValue: string) => {
    if (!onChange || readOnly) return
    const nextValue = Number.parseFloat(rawValue)
    if (!Number.isFinite(nextValue)) return
    onChange(activeUnit === 'mm' ? nextValue : cunToMm(nextValue))
  }

  const updateUnit = (rawValue: string) => {
    const nextUnit: MeasureUnit = rawValue === '寸' ? '寸' : 'mm'
    if (onUnitChange) {
      onUnitChange(nextUnit)
    } else {
      setLocalUnit(nextUnit)
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3">
        <label className="text-xs font-medium text-stone-600">{label}</label>
        <select
          aria-label={`${label}单位`}
          className="rounded-md border border-wood-100 bg-white px-1.5 py-0.5 text-xs text-wood-700 outline-none focus:border-wood-500"
          value={activeUnit}
          onChange={(event) => updateUnit(event.target.value)}
        >
          <option value="mm">mm</option>
          <option value="寸">寸</option>
        </select>
      </div>
      <div className="flex items-center rounded-lg border border-wood-100 bg-white focus-within:border-wood-500 focus-within:ring-2 focus-within:ring-wood-100">
        <input
          type="number"
          min="0"
          step={activeUnit === 'mm' ? 0.1 : 0.01}
          className="min-w-0 flex-1 rounded-lg bg-transparent px-2.5 py-2 text-sm text-stone-800 outline-none disabled:bg-stone-50"
          value={displayedValue}
          onChange={(event) => updateValue(event.target.value)}
          readOnly={readOnly}
          disabled={readOnly}
          aria-label={label}
        />
        <span className="border-l border-wood-100 px-2.5 py-2 text-xs text-stone-500">{activeUnit}</span>
      </div>
      <p className="text-[11px] text-stone-500">配合公差 ±{formatDimension(toleranceMm)}</p>
    </div>
  )
}
