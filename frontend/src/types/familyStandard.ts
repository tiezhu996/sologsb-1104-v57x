import type { JointFamily } from './jointType'

export interface FamilyStandard {
  /** 以榫卯家族名为主键，同一家族共用一套配合基准 */
  family: JointFamily | string
  /** 名义间隙，单位毫米 */
  nominalGapMm: number
  /** 允许偏差（±），单位毫米 */
  allowableDeviationMm: number
  schemaRev?: number
}

export const DEFAULT_NOMINAL_GAP_MM = 0.2
export const DEFAULT_ALLOWABLE_DEVIATION_MM = 0.12

export function makeDefaultStandard(family: JointFamily | string): FamilyStandard {
  return {
    family,
    nominalGapMm: DEFAULT_NOMINAL_GAP_MM,
    allowableDeviationMm: DEFAULT_ALLOWABLE_DEVIATION_MM,
    schemaRev: 3,
  }
}
