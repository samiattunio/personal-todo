export type Repeat = 'none' | 'daily'

export type Project = {
  id: string
  name: string
  emoji: string
  notes: string
  createdAt: number
}

export type Task = {
  id: string
  projectId: string
  title: string
  date: string
  completed: boolean
  completedDates: string[]
  repeat: Repeat
  createdAt: number
}

export type Store = {
  projects: Project[]
  tasks: Task[]
}
