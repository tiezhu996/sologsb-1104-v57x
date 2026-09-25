export type MemberName = '榫头' | '榫眼' | '大边' | '抹头'
export type MemberPart = '出榫件' | '受榫件'
export type GrainDirection = '顺纹' | '横纹'
export type DimensionUnit = 'mm' | '寸'

export interface Member {
  id: string
  jointTypeId: string
  name: MemberName
  part: MemberPart
  grainDir: GrainDirection
  lengthMm: number
  widthMm: number
  thicknessMm: number
  toleranceMm: number
  /** 本构件录入尺寸时选用的单位，随构件持久化 */
  inputUnit: DimensionUnit
  note: string
  schemaRev?: number
}
