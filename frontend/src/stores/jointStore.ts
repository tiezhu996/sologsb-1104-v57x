import { create } from 'zustand'
import type { Furniture, FurnitureName } from '../types/furniture'
import type { FamilyStandard } from '../types/familyStandard'
import { makeDefaultStandard } from '../types/familyStandard'
import type { JointType } from '../types/jointType'
import type { DimensionUnit, Member } from '../types/member'
import { db, ensureSeedData } from '../utils/db'

export type JointDraft = Omit<JointType, 'id' | 'schemaRev'>
export type FurnitureDraft = Omit<Furniture, 'id' | 'schemaRev'>

interface JointState {
  joints: JointType[]
  members: Member[]
  furniture: Furniture[]
  familyStandards: FamilyStandard[]
  stepCounts: Record<string, number>
  selectedJointId: string | null
  loading: boolean
  loadAll: () => Promise<void>
  addJoint: (draft: JointDraft) => Promise<JointType>
  addFurniture: (draft: FurnitureDraft) => Promise<Furniture>
  setSelectedJoint: (id: string) => void
  updateMemberDimensions: (
    memberId: string,
    dimensions: Pick<Member, 'lengthMm' | 'widthMm' | 'thicknessMm' | 'toleranceMm'>,
  ) => Promise<void>
  setMemberUnit: (memberId: string, unit: DimensionUnit) => Promise<void>
  renameMember: (memberId: string, name: Member['name']) => Promise<void>
  getFamilyStandard: (family: string) => FamilyStandard
  updateFamilyStandard: (family: string, patch: Pick<FamilyStandard, 'nominalGapMm' | 'allowableDeviationMm'>) => Promise<void>
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useJointStore = create<JointState>((set, get) => ({
  joints: [],
  members: [],
  furniture: [],
  familyStandards: [],
  stepCounts: {},
  selectedJointId: null,
  loading: false,

  loadAll: async () => {
    if (get().loading) return
    set({ loading: true })
    try {
      await ensureSeedData()
      const [joints, members, furniture, steps, familyStandards] = await Promise.all([
        db.joints.toArray(),
        db.members.toArray(),
        db.furniture.toArray(),
        db.steps.toArray(),
        db.familyStandards.toArray(),
      ])
      const stepCounts = steps.reduce<Record<string, number>>((counts, step) => {
        counts[step.jointTypeId] = (counts[step.jointTypeId] ?? 0) + 1
        return counts
      }, {})
      const selectedJointId = get().selectedJointId
      set({
        joints: joints.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
        members,
        furniture,
        familyStandards,
        stepCounts,
        selectedJointId: selectedJointId && joints.some((joint) => joint.id === selectedJointId)
          ? selectedJointId
          : joints[0]?.id ?? null,
      })
    } finally {
      set({ loading: false })
    }
  },

  addJoint: async (draft) => {
    const joint: JointType = { ...draft, id: createId('joint'), schemaRev: 3 }
    // 自定义家族可能尚无基准记录，落库时补一条默认基准
    const existing = await db.familyStandards.get(draft.family)
    const standard = existing ?? makeDefaultStandard(draft.family)
    await db.transaction('rw', [db.joints, db.familyStandards], async () => {
      await db.joints.add(joint)
      if (!existing) await db.familyStandards.add(standard)
    })
    set((state) => ({
      joints: [...state.joints, joint].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
      familyStandards: existing ? state.familyStandards : [...state.familyStandards, standard],
      selectedJointId: joint.id,
      stepCounts: { ...state.stepCounts, [joint.id]: 0 },
    }))
    return joint
  },

  addFurniture: async (draft) => {
    const furniture: Furniture = { ...draft, id: createId('furniture'), schemaRev: 3 }
    await db.furniture.add(furniture)
    set((state) => ({ furniture: [...state.furniture, furniture] }))
    return furniture
  },

  setSelectedJoint: (id) => set({ selectedJointId: id }),

  updateMemberDimensions: async (memberId, dimensions) => {
    await db.members.update(memberId, dimensions)
    set((state) => ({
      members: state.members.map((member) => (
        member.id === memberId ? { ...member, ...dimensions } : member
      )),
    }))
  },

  setMemberUnit: async (memberId, unit) => {
    await db.members.update(memberId, { inputUnit: unit })
    set((state) => ({
      members: state.members.map((member) => (
        member.id === memberId ? { ...member, inputUnit: unit } : member
      )),
    }))
  },

  renameMember: async (memberId, name) => {
    await db.members.update(memberId, { name })
    set((state) => ({
      members: state.members.map((member) => (
        member.id === memberId ? { ...member, name } : member
      )),
    }))
  },

  getFamilyStandard: (family) => {
    return get().familyStandards.find((item) => item.family === family) ?? makeDefaultStandard(family)
  },

  updateFamilyStandard: async (family, patch) => {
    const current = get().familyStandards.find((item) => item.family === family) ?? makeDefaultStandard(family)
    const next: FamilyStandard = {
      ...current,
      nominalGapMm: patch.nominalGapMm,
      allowableDeviationMm: patch.allowableDeviationMm,
      schemaRev: 3,
    }
    await db.familyStandards.put(next)
    set((state) => {
      const exists = state.familyStandards.some((item) => item.family === family)
      return {
        familyStandards: exists
          ? state.familyStandards.map((item) => (item.family === family ? next : item))
          : [...state.familyStandards, next],
      }
    })
  },
}))

export type { FurnitureName }
