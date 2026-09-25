import { useEffect, useState } from 'react'
import { useJointStore } from '../../stores/jointStore'

interface FamilyStandardEditorProps {
  family: string
}

/** 本家族配合基准：名义间隙与允许偏差，保存后本家族全部构件的校验结论随之变化 */
export function FamilyStandardEditor({ family }: FamilyStandardEditorProps) {
  const getFamilyStandard = useJointStore((state) => state.getFamilyStandard)
  const updateFamilyStandard = useJointStore((state) => state.updateFamilyStandard)
  const standard = getFamilyStandard(family)

  const [nominalText, setNominalText] = useState(String(standard.nominalGapMm))
  const [deviationText, setDeviationText] = useState(String(standard.allowableDeviationMm))

  useEffect(() => {
    setNominalText(String(standard.nominalGapMm))
    setDeviationText(String(standard.allowableDeviationMm))
  }, [family, standard.nominalGapMm, standard.allowableDeviationMm])

  const commit = (field: 'nominalGapMm' | 'allowableDeviationMm', raw: string): void => {
    const value = Number.parseFloat(raw)
    if (!Number.isFinite(value) || value < 0) {
      // 非法输入不入库，界面回退到已保存的值
      if (field === 'nominalGapMm') setNominalText(String(standard.nominalGapMm))
      else setDeviationText(String(standard.allowableDeviationMm))
      return
    }
    void updateFamilyStandard(family, {
      nominalGapMm: field === 'nominalGapMm' ? value : standard.nominalGapMm,
      allowableDeviationMm: field === 'allowableDeviationMm' ? value : standard.allowableDeviationMm,
    })
  }

  return (
    <div
      className="flex flex-wrap items-end gap-3 rounded-xl border border-wood-100 bg-white px-3.5 py-2.5"
      data-testid="family-standard"
    >
      <span className="text-xs font-medium text-wood-700">{family}家族基准</span>
      <label className="flex items-center gap-1.5 text-xs text-stone-500">
        名义间隙
        <input
          type="number"
          min="0"
          step="0.01"
          aria-label={`${family}名义间隙`}
          data-testid="field-nominal-gap"
          className="w-20 rounded-md border border-wood-100 px-2 py-1 text-sm text-stone-800 outline-none focus:border-wood-500"
          value={nominalText}
          onChange={(event) => setNominalText(event.target.value)}
          onBlur={(event) => commit('nominalGapMm', event.target.value)}
        />
        mm
      </label>
      <label className="flex items-center gap-1.5 text-xs text-stone-500">
        允许偏差 ±
        <input
          type="number"
          min="0"
          step="0.01"
          aria-label={`${family}允许偏差`}
          data-testid="field-allowable-deviation"
          className="w-20 rounded-md border border-wood-100 px-2 py-1 text-sm text-stone-800 outline-none focus:border-wood-500"
          value={deviationText}
          onChange={(event) => setDeviationText(event.target.value)}
          onBlur={(event) => commit('allowableDeviationMm', event.target.value)}
        />
        mm
      </label>
    </div>
  )
}
