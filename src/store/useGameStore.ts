import { create } from 'zustand'
import { UserProfile, CharacterType, ScenarioResult, Mission, TreeHolePost, Reply, WeeklySnapshot } from '@/types'
import { treeHolePosts } from '@/data/treeHolePosts'
import {
  getWeekKey,
  getWeekStart,
  getWeekEnd,
  formatDate,
  isCurrentWeek,
} from '@/lib/utils'

const STORAGE_KEY = 'dad-adventure-state'

function getTitleByLevel(level: number): string {
  if (level <= 2) return '初出茅庐的爸爸'
  if (level <= 4) return '渐入佳境的爸爸'
  if (level <= 6) return '得心应手的爸爸'
  return '传说中的超级爸爸'
}

function saveToLocalStorage(state: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

function loadFromLocalStorage(): GameState | null {
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) {
      return JSON.parse(data)
    }
  } catch {
    // ignore
  }
  return null
}

interface GameState {
  userProfile: UserProfile | null
  scenarioResults: ScenarioResult[]
  missions: Mission[]
  weeklySnapshots: WeeklySnapshot[]
  lastProcessedWeekKey: string | null
  posts: TreeHolePost[]
}

interface GameActions {
  createProfile: (characterType: CharacterType, nickname: string) => void
  completeScenario: (scenarioId: string, choices: { sceneId: string; optionId: string }[]) => void
  unlockSkill: (skillId: string) => void
  toggleMission: (missionId: string) => void
  addMission: (mission: Mission) => void
  removeMission: (missionId: string) => void
  addPost: (post: TreeHolePost) => void
  addReplyToPost: (postId: string, reply: Reply) => void
  togglePostLike: (postId: string) => void
  resetGame: () => void
  ensureWeekArchive: () => void
  getMissionsByWeek: (weekKey: string) => Mission[]
}

type StoreType = GameState & GameActions

const savedState = loadFromLocalStorage()

export const useGameStore = create<StoreType>()((set, get) => ({
  userProfile: savedState?.userProfile ?? null,
  scenarioResults: savedState?.scenarioResults ?? [],
  missions: savedState?.missions ?? [],
  weeklySnapshots: savedState?.weeklySnapshots ?? [],
  lastProcessedWeekKey: savedState?.lastProcessedWeekKey ?? null,
  posts: savedState?.posts ?? treeHolePosts,

  createProfile: (characterType, nickname) => {
    const profile: UserProfile = {
      id: crypto.randomUUID(),
      characterType,
      nickname,
      level: 1,
      title: '初出茅庐的爸爸',
      createdAt: new Date().toISOString(),
      completedScenarios: [],
      unlockedSkills: [],
      completedMissions: [],
      earnedBadges: [],
    }
    set({ userProfile: profile })
    get().ensureWeekArchive()
    saveToLocalStorage(get())
  },

  completeScenario: (scenarioId, choices) => {
    const state = get()
    if (!state.userProfile) return

    const result: ScenarioResult = {
      scenarioId,
      choices,
      completedAt: new Date().toISOString(),
    }

    const newLevel = state.userProfile.level + 1
    const newTitle = getTitleByLevel(newLevel)

    set({
      scenarioResults: [...state.scenarioResults, result],
      userProfile: {
        ...state.userProfile,
        level: newLevel,
        title: newTitle,
        completedScenarios: [...state.userProfile.completedScenarios, scenarioId],
      },
    })
    saveToLocalStorage(get())
  },

  unlockSkill: (skillId) => {
    const state = get()
    if (!state.userProfile) return

    const newLevel = state.userProfile.level + 1
    const newTitle = getTitleByLevel(newLevel)

    set({
      userProfile: {
        ...state.userProfile,
        level: newLevel,
        title: newTitle,
        unlockedSkills: [...state.userProfile.unlockedSkills, skillId],
        earnedBadges: [...state.userProfile.earnedBadges, `${skillId}-badge`],
      },
    })
    saveToLocalStorage(get())
  },

  toggleMission: (missionId) => {
    get().ensureWeekArchive()
    const state = get()
    const mission = state.missions.find((m) => m.id === missionId)
    if (!mission) return

    const willBeCompleted = !mission.completed
    let newCompletedMissions = [...(state.userProfile?.completedMissions ?? [])]

    if (willBeCompleted) {
      if (!newCompletedMissions.includes(missionId)) {
        newCompletedMissions.push(missionId)
      }
    } else {
      newCompletedMissions = newCompletedMissions.filter((id) => id !== missionId)
    }

    let newProfile = state.userProfile
    if (state.userProfile) {
      newProfile = {
        ...state.userProfile,
        completedMissions: newCompletedMissions,
      }
    }

    set({
      missions: state.missions.map((m) =>
        m.id === missionId ? { ...m, completed: !m.completed } : m
      ),
      userProfile: newProfile,
    })
    saveToLocalStorage(get())
  },

  addMission: (mission) => {
    get().ensureWeekArchive()
    const state = get()
    set({ missions: [...state.missions, mission] })
    saveToLocalStorage(get())
  },

  removeMission: (missionId) => {
    get().ensureWeekArchive()
    const state = get()

    let newProfile = state.userProfile
    if (state.userProfile) {
      newProfile = {
        ...state.userProfile,
        completedMissions: state.userProfile.completedMissions.filter(
          (id) => id !== missionId
        ),
      }
    }

    set({
      missions: state.missions.filter((m) => m.id !== missionId),
      userProfile: newProfile,
    })
    saveToLocalStorage(get())
  },

  addPost: (post) => {
    const state = get()
    set({ posts: [post, ...state.posts] })
    saveToLocalStorage(get())
  },

  addReplyToPost: (postId, reply) => {
    const state = get()
    set({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, replies: [...p.replies, reply] } : p
      ),
    })
    saveToLocalStorage(get())
  },

  togglePostLike: (postId) => {
    const state = get()
    set({
      posts: state.posts.map((p) =>
        p.id === postId ? { ...p, likes: p.likes + 1 } : p
      ),
    })
    saveToLocalStorage(get())
  },

  resetGame: () => {
    set({
      userProfile: null,
      scenarioResults: [],
      missions: [],
      weeklySnapshots: [],
      lastProcessedWeekKey: null,
      posts: treeHolePosts,
    })
    localStorage.removeItem(STORAGE_KEY)
  },

  ensureWeekArchive: () => {
    const state = get()
    const currentWeekKey = getWeekKey()

    if (state.lastProcessedWeekKey === currentWeekKey) {
      return
    }

    if (!state.lastProcessedWeekKey) {
      set({ lastProcessedWeekKey: currentWeekKey })
      saveToLocalStorage(get())
      return
    }

    if (state.lastProcessedWeekKey !== currentWeekKey) {
      const lastKey = state.lastProcessedWeekKey
      const lastStart = getWeekStart(
        new Date(lastKey.split("-").map(Number).join("-"))
      )
      const lastEnd = getWeekEnd(lastStart)

      const existingSnapshot = state.weeklySnapshots.find(
        (s) => s.weekKey === lastKey
      )

      if (!existingSnapshot && state.missions.length > 0) {
        const snapshot: WeeklySnapshot = {
          weekKey: lastKey,
          weekStart: formatDate(lastStart),
          weekEnd: formatDate(lastEnd),
          missions: JSON.parse(JSON.stringify(state.missions)),
          archivedAt: new Date().toISOString(),
        }
        set({
          weeklySnapshots: [...state.weeklySnapshots, snapshot],
        })
      }

      const newState = get()
      const currentWeekMissions = newState.missions.map((m) => {
        const missionWeekKey = m.weekStart
          ? getWeekKey(new Date(m.weekStart))
          : null
        if (missionWeekKey && isCurrentWeek(missionWeekKey)) {
          return m
        }
        if (missionWeekKey && missionWeekKey === currentWeekKey) {
          return m
        }
        return {
          ...m,
          completed: false,
          weekStart: formatDate(getWeekStart()),
        }
      })

      set({
        missions: currentWeekMissions,
        lastProcessedWeekKey: currentWeekKey,
      })
      saveToLocalStorage(get())
    }
  },

  getMissionsByWeek: (weekKey: string): Mission[] => {
    get().ensureWeekArchive()
    const state = get()

    if (isCurrentWeek(weekKey)) {
      return state.missions
    }

    const snapshot = state.weeklySnapshots.find((s) => s.weekKey === weekKey)
    if (snapshot) {
      return snapshot.missions
    }

    return []
  },
}))
