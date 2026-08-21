import type { Store, Project, Task } from './types'

const KEY = 'personal-todo-v1'

function todayISO() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function seed(): Store {
  const projectId = crypto.randomUUID()
  const now = Date.now()
  const date = todayISO()

  const project: Project = {
    id: projectId,
    name: 'Launch my side hustle',
    emoji: '🚀',
    notes: '',
    createdAt: now,
  }

  const titles = [
    { title: 'Identify 3 core strengths and write them down', completed: true },
    { title: "Draft a 'Value Proposition' (How you help people)", completed: true },
    { title: 'Choose a business name and check domain availability', completed: false },
    { title: 'Create a simple logo using a brand kit', completed: false },
    { title: 'Set your hourly or project rates (Research competitors)', completed: false },
  ]

  const tasks: Task[] = titles.map((t, i) => ({
    id: crypto.randomUUID(),
    projectId,
    title: t.title,
    date,
    completed: t.completed,
    completedDates: [],
    repeat: 'none',
    createdAt: now + i,
  }))

  return { projects: [project], tasks }
}

export function loadStore(): Store {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) {
      const seeded = seed()
      saveStore(seeded)
      return seeded
    }
    const parsed = JSON.parse(raw) as Store
    if (!Array.isArray(parsed.projects) || !Array.isArray(parsed.tasks)) {
      const seeded = seed()
      saveStore(seeded)
      return seeded
    }
    return {
      ...parsed,
      tasks: parsed.tasks.map((t) => ({
        ...t,
        repeat: t.repeat ?? 'none',
        completedDates: t.completedDates ?? [],
      })),
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
