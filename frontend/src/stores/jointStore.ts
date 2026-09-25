import { create } from 'zustand'
import type { Furniture, FurnitureName } from '../types/furniture'
import type { FamilyBaseline, JointFamily, JointType } from '../types/jointType'
import type { Member, MeasureUnit } from '../types/member'
import { db, ensureSeedData, SCHEMA_REV } from '../utils/db'

export type JointDraft = Omit<JointType, 'id' | 'schemaRev'>
export type FurnitureDraft = Omit<Furniture, 'id' | 'schemaRev'>

interface JointState {
  joints: JointType[]
  members: Member[]
  furniture: Furniture[]
  familyBaselines: FamilyBaseline[]
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
  setMemberUnit: (memberId: string, unit: MeasureUnit) => Promise<void>
  updateFamilyBaseline: (
    family: JointFamily,
    baseline: Pick<FamilyBaseline, 'nominalGapMm' | 'allowanceMm'>,
  ) => Promise<void>
  renameMember: (memberId: string, name: Member['name']) => Promise<void>
}

function createId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export const useJointStore = create<JointState>((set, get) => ({
  joints: [],
  members: [],
  furniture: [],
  familyBaselines: [],
  stepCounts: {},
  selectedJointId: null,
  loading: false,

  loadAll: async () => {
    if (get().loading) return
    set({ loading: true })
    try {
      await ensureSeedData()
      const [joints, members, furniture, steps, familyBaselines] = await Promise.all([
        db.joints.toArray(),
        db.members.toArray(),
        db.furniture.toArray(),
        db.steps.toArray(),
        db.familyBaselines.toArray(),
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
        familyBaselines,
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
    const joint: JointType = { ...draft, id: createId('joint'), schemaRev: SCHEMA_REV }
    await db.joints.add(joint)
    set((state) => ({
      joints: [...state.joints, joint].sort((a, b) => a.name.localeCompare(b.name, 'zh-CN')),
      selectedJointId: joint.id,
      stepCounts: { ...state.stepCounts, [joint.id]: 0 },
    }))
    return joint
  },

  addFurniture: async (draft) => {
    const furniture: Furniture = { ...draft, id: createId('furniture'), schemaRev: SCHEMA_REV }
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

  updateFamilyBaseline: async (family, baseline) => {
    await db.familyBaselines.update(family, baseline)
    set((state) => ({
      familyBaselines: state.familyBaselines.map((item) => (
        item.family === family ? { ...item, ...baseline } : item
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
}))

export type { FurnitureName }
