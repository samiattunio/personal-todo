import type { Store, Project, Task, Goal } from './types'

const KEY = 'personal-todo-v1'

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function todayISO() {
  return toISODate(new Date())
}

function addDaysISO(iso: string, n: number) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + n)
  return toISODate(date)
}

function defaultProject(): Project {
  return {
    id: crypto.randomUUID(),
    name: 'Launch my side hustle',
    emoji: '🚀',
    notes: '',
    createdAt: Date.now(),
  }
}

function seed(): Store {
  const project = defaultProject()
  const now = project.createdAt
  const date = todayISO()

  const titles = [
    { title: 'Identify 3 core strengths and write them down', completed: true },
    { title: "Draft a 'Value Proposition' (How you help people)", completed: true },
    { title: 'Choose a business name and check domain availability', completed: false },
    { title: 'Create a simple logo using a brand kit', completed: false },
    { title: 'Set your hourly or project rates (Research competitors)', completed: false },
  ]

  const tasks: Task[] = titles.map((t, i) => ({
    id: crypto.randomUUID(),
    projectId: project.id,
    title: t.title,
    date,
    completed: t.completed,
    completedDates: [],
    repeat: 'none',
    createdAt: now + i,
  }))

  const goal: Goal = {
    id: crypto.randomUUID(),
    title: 'Launch my side hustle',
    completed: false,
    createdAt: now,
  }

  return { projects: [project], tasks, goals: [goal], goalDueDate: addDaysISO(date, 60) }
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      const seeded = seed()
      saveStore(seeded)
      return seeded
    }
    const parsed = JSON.parse(raw) as {
      projects: Project[]
      tasks: Task[]
      goals?: Array<Goal & { dueDate?: string }>
      goalDueDate?: string | null
    }
    if (!Array.isArray(parsed.projects) || !Array.isArray(parsed.tasks)) {
      const seeded = seed()
      saveStore(seeded)
      return seeded
    }
    const rawGoals = Array.isArray(parsed.goals) ? parsed.goals : []
    const goals = rawGoals
      .filter((g) => g && typeof g.title === 'string')
      .map((g) => ({
        id: g.id || crypto.randomUUID(),
        title: g.title,
        completed: !!g.completed,
        createdAt: g.createdAt ?? Date.now(),
      }))
    const inheritedDue =
      typeof parsed.goalDueDate === 'string' && parsed.goalDueDate
        ? parsed.goalDueDate
        : (rawGoals
            .map((g) => g.dueDate)
            .filter((d): d is string => typeof d === 'string' && d.length > 0)
            .sort()[0] ?? null)
    return {
      ...parsed,
      projects: parsed.projects.length > 0 ? parsed.projects : [defaultProject()],
      tasks: parsed.tasks.map((t) => ({
        ...t,
        repeat: t.repeat ?? 'none',
        completedDates: t.completedDates ?? [],
      })),
      goals,
      goalDueDate: inheritedDue,
    }
  } catch {
    const seeded = seed()
    saveStore(seeded)
    return seeded
  }
}

export function saveStore(store: Store) {
  localStorage.setItem(KEY, JSON.stringify(store))
}
