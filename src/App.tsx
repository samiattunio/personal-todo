import { useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react'
import type { Goal, Project, Store, Task } from './types'
import { loadStore, saveStore } from './storage'
import {
  IconBack,
  IconBattery,
  IconCheck,
  IconClose,
  IconDots,
  IconFlag,
  IconFlame,
  IconPlus,
  IconRepeat,
  IconSignal,
  IconWifi,
} from './icons'
import './App.css'

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
type Sheet =
  | { type: 'none' }
  | { type: 'add-task' }
  | { type: 'edit-task'; taskId: string }
  | { type: 'rename' }
  | { type: 'menu' }
  | { type: 'add-goal' }
  | { type: 'edit-goal'; goalId: string }
  | { type: 'set-goal-date' }

function pad(n: number) {
  return String(n).padStart(2, '0')
}

function toISODate(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

function fromISODate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function startOfWeek(d: Date) {
  const date = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const day = date.getDay()
  const diff = day === 0 ? -6 : 1 - day
  date.setDate(date.getDate() + diff)
  return date
}

function addDays(d: Date, n: number) {
  const next = new Date(d)
  next.setDate(next.getDate() + n)
  return next
}

function isDaily(task: Task) {
  return task.repeat === 'daily'
}

function appearsOn(task: Task, date: string) {
  if (isDaily(task)) return date >= task.date
  return task.date === date
}

function isDoneOn(task: Task, date: string) {
  if (isDaily(task)) return (task.completedDates ?? []).includes(date)
  return task.completed
}

function dueLabel(iso: string, today: string) {
  const t = fromISODate(today).getTime()
  const d = fromISODate(iso).getTime()
  const diff = Math.round((d - t) / 86400000)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  if (diff === -1) return 'Yesterday'
  const date = fromISODate(iso)
  return `${DAY_NAMES[(date.getDay() + 6) % 7]} ${date.getDate()}`
}

function endOfDueDate(iso: string) {
  const d = fromISODate(iso)
  d.setHours(23, 59, 59, 999)
  return d
}

function goalCountLabel(total: number) {
  if (total === 1) return '1 goal'
  return `${total} goals`
}

function splitDuration(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  return {
    d: Math.floor(total / 86400),
    h: Math.floor((total % 86400) / 3600),
    m: Math.floor((total % 3600) / 60),
    s: total % 60,
  }
}

function isDeadlineOverdue(due: string | null, now: Date, allDone: boolean) {
  if (!due || allDone) return false
  return now.getTime() > endOfDueDate(due).getTime()
}

function useClock() {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    let intervalId = 0
    const tick = () => setNow(Date.now())

    const timeoutId = window.setTimeout(() => {
      tick()
      intervalId = window.setInterval(tick, 1000)
    }, 1000 - (Date.now() % 1000))

    const onVisible = () => {
      if (document.visibilityState === 'visible') tick()
    }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      window.clearTimeout(timeoutId)
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  return new Date(now)
}

export default function App() {
  const [store, setStore] = useState<Store>(loadStore)
  const [showGoals, setShowGoals] = useState(false)
  const [selectedDate, setSelectedDate] = useState(() => toISODate(new Date()))
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()))
  const [calOpen, setCalOpen] = useState(true)
  const [sheet, setSheet] = useState<Sheet>({ type: 'none' })
  const [draft, setDraft] = useState('')
  const [draftRepeat, setDraftRepeat] = useState(false)
  const [draftDue, setDraftDue] = useState('')
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)
  const now = useClock()
  const today = toISODate(now)

  useEffect(() => {
    saveStore(store)
  }, [store])

  useEffect(() => {
    if (sheet.type === 'none') return
    const t = setTimeout(() => inputRef.current?.focus(), 80)
    return () => clearTimeout(t)
  }, [sheet])

  const project = useMemo(() => {
    const list = store.projects
    if (list.length === 0) return null
    return [...list].sort((a, b) => a.createdAt - b.createdAt)[0]
  }, [store.projects])
  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart],
  )

  const dayTasks = useMemo(() => {
    if (!project) return []
    return store.tasks
      .filter((t) => t.projectId === project.id && appearsOn(t, selectedDate))
      .sort(
        (a, b) =>
          Number(isDoneOn(a, selectedDate)) - Number(isDoneOn(b, selectedDate)) || a.createdAt - b.createdAt,
      )
  }, [store.tasks, project, selectedDate])

  const doneCount = dayTasks.filter((t) => isDoneOn(t, selectedDate)).length
  const totalCount = dayTasks.length

  function updateStore(updater: (prev: Store) => Store) {
    setStore((prev) => updater(prev))
  }

  function closeSheet() {
    setSheet({ type: 'none' })
    setDraft('')
    setDraftRepeat(false)
    setDraftDue('')
  }

  function renameProject() {
    if (!project) return
    const name = draft.trim()
    if (!name) return
    updateStore((s) => ({
      ...s,
      projects: s.projects.map((p) => (p.id === project.id ? { ...p, name } : p)),
    }))
    closeSheet()
  }

  function clearCompleted() {
    if (!project) return
    updateStore((s) => ({
      ...s,
      tasks: s.tasks.filter((t) => {
        if (t.projectId !== project.id) return true
        if (isDaily(t)) return true
        return !(t.completed && t.date === selectedDate)
      }),
    }))
    closeSheet()
  }

  function addTask() {
    if (!project) return
    const title = draft.trim()
    if (!title) return
    const task: Task = {
      id: crypto.randomUUID(),
      projectId: project.id,
      title,
      date: selectedDate,
      completed: false,
      completedDates: [],
      repeat: draftRepeat ? 'daily' : 'none',
      createdAt: Date.now(),
    }
    updateStore((s) => ({ ...s, tasks: [...s.tasks, task] }))
    closeSheet()
  }

  function saveTaskEdit() {
    if (sheet.type !== 'edit-task') return
    const title = draft.trim()
    if (!title) return
    updateStore((s) => ({
      ...s,
      tasks: s.tasks.map((t) => {
        if (t.id !== sheet.taskId) return t
        const nextRepeat = draftRepeat ? 'daily' : 'none'
        if (nextRepeat === 'daily') {
          return {
            ...t,
            title,
            repeat: 'daily',
            completed: false,
            completedDates: t.completedDates ?? [],
          }
        }
        return {
          ...t,
          title,
          repeat: 'none',
          date: selectedDate,
          completed: isDoneOn(t, selectedDate),
          completedDates: [],
        }
      }),
    }))
    closeSheet()
  }

  function deleteTask(id: string) {
    updateStore((s) => ({ ...s, tasks: s.tasks.filter((t) => t.id !== id) }))
    closeSheet()
  }

  function toggleTask(id: string) {
    updateStore((s) => ({
      ...s,
      tasks: s.tasks.map((t) => {
        if (t.id !== id) return t
        if (isDaily(t)) {
          const dates = t.completedDates ?? []
          const has = dates.includes(selectedDate)
          return {
            ...t,
            completedDates: has ? dates.filter((d) => d !== selectedDate) : [...dates, selectedDate],
          }
        }
        return { ...t, completed: !t.completed }
      }),
    }))
  }

  function shiftWeek(dir: number) {
    setWeekStart((w) => addDays(w, dir * 7))
  }

  const hasTasksOn = (iso: string) =>
    !!project &&
    store.tasks.some((t) => t.projectId === project.id && appearsOn(t, iso) && !isDoneOn(t, iso))

  const goals = useMemo(
    () =>
      [...(store.goals ?? [])].sort(
        (a, b) => Number(a.completed) - Number(b.completed) || a.createdAt - b.createdAt,
      ),
    [store.goals],
  )
  const openGoalCount = goals.filter((g) => !g.completed).length
  const allGoalsDone = goals.length > 0 && openGoalCount === 0
  const goalDueDate = store.goalDueDate ?? null

  function openAddGoal() {
    setDraft('')
    setSheet({ type: 'add-goal' })
  }

  function openEditGoal(goal: Goal) {
    setDraft(goal.title)
    setSheet({ type: 'edit-goal', goalId: goal.id })
  }

  function openSetGoalDate() {
    setDraftDue(goalDueDate || toISODate(addDays(new Date(), 30)))
    setSheet({ type: 'set-goal-date' })
  }

  function addGoal() {
    const title = draft.trim()
    if (!title) return
    const goal: Goal = {
      id: crypto.randomUUID(),
      title,
      completed: false,
      createdAt: Date.now(),
    }
    updateStore((s) => ({ ...s, goals: [goal, ...(s.goals ?? [])] }))
    closeSheet()
  }

  function saveGoalEdit() {
    if (sheet.type !== 'edit-goal') return
    const title = draft.trim()
    if (!title) return
    updateStore((s) => ({
      ...s,
      goals: (s.goals ?? []).map((g) => (g.id === sheet.goalId ? { ...g, title } : g)),
    }))
    closeSheet()
  }

  function saveGoalDate() {
    if (!draftDue) return
    updateStore((s) => ({ ...s, goalDueDate: draftDue }))
    closeSheet()
  }

  function deleteGoal(id: string) {
    updateStore((s) => ({ ...s, goals: (s.goals ?? []).filter((g) => g.id !== id) }))
    closeSheet()
  }

  function toggleGoal(id: string) {
    updateStore((s) => ({
      ...s,
      goals: (s.goals ?? []).map((g) => (g.id === id ? { ...g, completed: !g.completed } : g)),
    }))
  }

  const sheetOpen = sheet.type !== 'none'
  const timeLabel = `${now.getHours()}:${pad(now.getMinutes())}`

  return (
    <div className="stage">
      <div className="phone">
        <div className="status-bar">
          <span className="status-time">{timeLabel}</span>
          <div className="island" />
          <div className="status-icons">
            <IconSignal />
            <IconWifi />
            <IconBattery />
          </div>
        </div>

        {showGoals || !project ? (
          <Home
            goals={goals}
            now={now}
            goalDueDate={goalDueDate}
            allGoalsDone={allGoalsDone}
            onBack={project ? () => setShowGoals(false) : undefined}
            onAddGoal={openAddGoal}
            onSetGoalDate={openSetGoalDate}
            onToggleGoal={toggleGoal}
            onEditGoal={openEditGoal}
          />
        ) : (
          <ProjectView
            project={project}
            weekDays={weekDays}
            selectedDate={selectedDate}
            today={today}
            now={now}
            calOpen={calOpen}
            dayTasks={dayTasks}
            doneCount={doneCount}
            totalCount={totalCount}
            hasTasksOn={hasTasksOn}
            goalCount={goals.length}
            goalDueDate={goalDueDate}
            allGoalsDone={allGoalsDone}
            onMenu={() => setSheet({ type: 'menu' })}
            onSelectDate={setSelectedDate}
            onToggleCal={() => setCalOpen((v) => !v)}
            onShiftWeek={shiftWeek}
            onToggleTask={toggleTask}
            onEditTask={(task) => {
              setDraft(task.title)
              setDraftRepeat(isDaily(task))
              setSheet({ type: 'edit-task', taskId: task.id })
            }}
            onAdd={() => {
              setDraft('')
              setDraftRepeat(false)
              setSheet({ type: 'add-task' })
            }}
            onOpenGoals={() => setShowGoals(true)}
          />
        )}

        {sheetOpen && (
          <div className="overlay" onClick={closeSheet}>
            <div className="sheet" onClick={(e) => e.stopPropagation()}>
              <div className="sheet-handle" />

              {sheet.type === 'menu' && project && (
                <div className="menu-list">
                  <button
                    className="menu-item"
                    onClick={() => {
                      setDraft(project.name)
                      setSheet({ type: 'rename' })
                    }}
                  >
                    Rename list
                  </button>
                  <button className="menu-item" onClick={clearCompleted}>
                    Clear completed
                  </button>
                  <button className="menu-item" onClick={closeSheet}>
                    Cancel
                  </button>
                </div>
              )}

              {sheet.type === 'rename' && (
                <SheetForm
                  title="Rename list"
                  placeholder="List name"
                  value={draft}
                  onChange={setDraft}
                  onSubmit={renameProject}
                  onCancel={closeSheet}
                  submitLabel="Save"
                  inputRef={inputRef}
                />
              )}

              {sheet.type === 'add-task' && (
                <SheetForm
                  title="New task"
                  placeholder="What do you need to do?"
                  value={draft}
                  onChange={setDraft}
                  onSubmit={addTask}
                  onCancel={closeSheet}
                  submitLabel="Add"
                  inputRef={inputRef}
                  repeat={draftRepeat}
                  onRepeatChange={setDraftRepeat}
                />
              )}

              {sheet.type === 'edit-task' && (
                <SheetForm
                  title="Edit task"
                  placeholder="Task"
                  value={draft}
                  onChange={setDraft}
                  onSubmit={saveTaskEdit}
                  onCancel={closeSheet}
                  submitLabel="Save"
                  inputRef={inputRef}
                  onDelete={() => deleteTask(sheet.taskId)}
                  repeat={draftRepeat}
                  onRepeatChange={setDraftRepeat}
                />
              )}

              {sheet.type === 'add-goal' && (
                <SheetForm
                  title="New goal"
                  placeholder="What do you want to finish?"
                  value={draft}
                  onChange={setDraft}
                  onSubmit={addGoal}
                  onCancel={closeSheet}
                  submitLabel="Add"
                  inputRef={inputRef}
                />
              )}

              {sheet.type === 'edit-goal' && (
                <SheetForm
                  title="Edit goal"
                  placeholder="Goal"
                  value={draft}
                  onChange={setDraft}
                  onSubmit={saveGoalEdit}
                  onCancel={closeSheet}
                  submitLabel="Save"
                  inputRef={inputRef}
                  onDelete={() => deleteGoal(sheet.goalId)}
                />
              )}

              {sheet.type === 'set-goal-date' && (
                <DateForm
                  due={draftDue}
                  onDueChange={setDraftDue}
                  onSubmit={saveGoalDate}
                  onCancel={closeSheet}
                  inputRef={inputRef}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Home({
  goals,
  now,
  goalDueDate,
  allGoalsDone,
  onBack,
  onAddGoal,
  onSetGoalDate,
  onToggleGoal,
  onEditGoal,
}: {
  goals: Goal[]
  now: Date
  goalDueDate: string | null
  allGoalsDone: boolean
  onBack?: () => void
  onAddGoal: () => void
  onSetGoalDate: () => void
  onToggleGoal: (id: string) => void
  onEditGoal: (goal: Goal) => void
}) {
  return (
    <div className="screen home">
      <header className="nav">
        {onBack ? (
          <button className="nav-back" onClick={onBack} aria-label="Back">
            <IconBack />
          </button>
        ) : (
          <span className="nav-spacer" />
        )}
        <h1 className="nav-title">Goals</h1>
        <button className="nav-back add-list-btn" onClick={onAddGoal} aria-label="New goal">
          <IconPlus size={20} />
        </button>
      </header>

      <TimerHero
        dueDate={goalDueDate}
        now={now}
        done={allGoalsDone}
        label={goalCountLabel(goals.length)}
        onClick={onSetGoalDate}
      />

      <div className="goal-stack">
        {goals.map((goal) => (
          <GoalCard
            key={goal.id}
            goal={goal}
            onToggle={() => onToggleGoal(goal.id)}
            onEdit={() => onEditGoal(goal)}
          />
        ))}

        <button className="list-card new" onClick={onAddGoal}>
          <span className="list-plus">+</span>
          <span className="list-copy">
            <span className="list-name">New goal</span>
            <span className="list-meta">Add to the list</span>
          </span>
        </button>
      </div>
    </div>
  )
}

function ProjectView({
  project,
  weekDays,
  selectedDate,
  today,
  now,
  calOpen,
  dayTasks,
  doneCount,
  totalCount,
  hasTasksOn,
  goalCount,
  goalDueDate,
  allGoalsDone,
  onMenu,
  onSelectDate,
  onToggleCal,
  onShiftWeek,
  onToggleTask,
  onEditTask,
  onAdd,
  onOpenGoals,
}: {
  project: Project
  weekDays: Date[]
  selectedDate: string
  today: string
  now: Date
  calOpen: boolean
  dayTasks: Task[]
  doneCount: number
  totalCount: number
  hasTasksOn: (iso: string) => boolean
  goalCount: number
  goalDueDate: string | null
  allGoalsDone: boolean
  onMenu: () => void
  onSelectDate: (iso: string) => void
  onToggleCal: () => void
  onShiftWeek: (dir: number) => void
  onToggleTask: (id: string) => void
  onEditTask: (task: Task) => void
  onAdd: () => void
  onOpenGoals: () => void
}) {
  const touchX = useRef<number | null>(null)
  const lastShift = useRef(0)

  return (
    <div className="screen project">
      <header className="nav">
        <span className="nav-spacer" />
        <h1 className="nav-title">{project.name}</h1>
        <button className="nav-menu" onClick={onMenu} aria-label="More">
          <IconDots />
        </button>
      </header>

      <TimerHero
        dueDate={goalDueDate}
        now={now}
        done={allGoalsDone}
        label={goalCountLabel(goalCount)}
        onClick={onOpenGoals}
      />

      {calOpen && (
        <div
          className="calendar"
          onTouchStart={(e) => {
            touchX.current = e.changedTouches[0].clientX
          }}
          onTouchEnd={(e) => {
            if (touchX.current == null) return
            const dx = e.changedTouches[0].clientX - touchX.current
            if (dx > 50) onShiftWeek(-1)
            if (dx < -50) onShiftWeek(1)
            touchX.current = null
          }}
          onMouseDown={(e) => {
            touchX.current = e.clientX
          }}
          onMouseUp={(e) => {
            if (touchX.current == null) return
            const dx = e.clientX - touchX.current
            if (dx > 50) onShiftWeek(-1)
            if (dx < -50) onShiftWeek(1)
            touchX.current = null
          }}
          onWheel={(e) => {
            if (Math.abs(e.deltaX) < 30 && Math.abs(e.deltaY) < 40) return
            const now = Date.now()
            if (now - lastShift.current < 400) return
            lastShift.current = now
            onShiftWeek(e.deltaX + e.deltaY > 0 ? 1 : -1)
          }}
        >
          {weekDays.map((d) => {
            const iso = toISODate(d)
            const selected = iso === selectedDate
            return (
              <button
                key={iso}
                className={`day ${selected ? 'selected' : ''} ${iso === today ? 'is-today' : ''}`}
                onClick={() => onSelectDate(iso)}
              >
                {hasTasksOn(iso) && <span className="day-dot" />}
                <span className="day-name">{DAY_NAMES[(d.getDay() + 6) % 7]}</span>
                <span className="day-num">{d.getDate()}</span>
              </button>
            )
          })}
        </div>
      )}

      <button className="grabber-wrap" onClick={onToggleCal} aria-label="Toggle calendar">
        <span className="grabber" />
      </button>

      <div className="progress-card">
        <span className="progress-label">Progress</span>
        <div className="segments" aria-hidden>
          {Array.from({ length: Math.max(totalCount, 1) }).map((_, i) => (
            <span
              key={i}
              className={`segment ${totalCount > 0 && i < doneCount ? 'filled' : ''}`}
            />
          ))}
        </div>
        <div className="progress-count">
          <IconFlame />
          <span>
            {doneCount}/{Math.max(totalCount, 0)}
          </span>
        </div>
      </div>

      <div className="tasks">
        {dayTasks.length === 0 && (
          <div className="empty">
            <p>No tasks for {dueLabel(selectedDate, today).toLowerCase()}.</p>
            <button onClick={onAdd}>Add one</button>
          </div>
        )}
        {dayTasks.map((task) => {
          const done = isDoneOn(task, selectedDate)
          return (
            <div key={task.id} className={`task ${done ? 'done' : ''}`}>
              <button className="check" onClick={() => onToggleTask(task.id)} aria-label={done ? 'Mark incomplete' : 'Complete'}>
                {done ? (
                  <span className="check-on">
                    <IconCheck />
                  </span>
                ) : (
                  <span className="check-off" />
                )}
              </button>
              <button className="task-body" onClick={() => onEditTask(task)}>
                <span className="task-title">{task.title}</span>
              </button>
              <span className={`task-when ${isDaily(task) ? 'daily' : ''}`}>
                {isDaily(task) ? (
                  <>
                    <IconRepeat />
                    Every day
                  </>
                ) : (
                  dueLabel(task.date, today)
                )}
              </span>
            </div>
          )
        })}
      </div>

      <div className="dock">
        <button className="fab" onClick={onAdd} aria-label="Add task">
          <IconPlus />
        </button>
      </div>
    </div>
  )
}

function SheetForm({
  title,
  placeholder,
  value,
  onChange,
  onSubmit,
  onCancel,
  submitLabel,
  inputRef,
  onDelete,
  repeat,
  onRepeatChange,
}: {
  title: string
  placeholder: string
  value: string
  onChange: (v: string) => void
  onSubmit: () => void
  onCancel: () => void
  submitLabel: string
  inputRef: MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>
  onDelete?: () => void
  repeat?: boolean
  onRepeatChange?: (value: boolean) => void
}) {
  return (
    <>
      <div className="sheet-head">
        <h3 className="sheet-title">{title}</h3>
        <button className="icon-btn subtle" onClick={onCancel} aria-label="Close">
          <IconClose />
        </button>
      </div>
      <input
        ref={(el) => {
          inputRef.current = el
        }}
        className="sheet-input"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onSubmit()
        }}
      />
      {onRepeatChange && (
        <button
          type="button"
          className={`repeat-row ${repeat ? 'on' : ''}`}
          onClick={() => onRepeatChange(!repeat)}
        >
          <span className="repeat-copy">
            <IconRepeat size={16} />
            Repeat every day
          </span>
          <span className="switch" aria-hidden>
            <span className="knob" />
          </span>
        </button>
      )}
      <div className="sheet-actions">
        {onDelete && (
          <button className="btn danger-ghost" onClick={onDelete}>
            Delete
          </button>
        )}
        <div className="sheet-actions-right">
          <button className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn primary" onClick={onSubmit} disabled={!value.trim()}>
            {submitLabel}
          </button>
        </div>
      </div>
    </>
  )
}

function DateForm({
  due,
  onDueChange,
  onSubmit,
  onCancel,
  inputRef,
}: {
  due: string
  onDueChange: (v: string) => void
  onSubmit: () => void
  onCancel: () => void
  inputRef: MutableRefObject<HTMLInputElement | HTMLTextAreaElement | null>
}) {
  return (
    <>
      <div className="sheet-head">
        <h3 className="sheet-title">Finish by</h3>
        <button className="icon-btn subtle" onClick={onCancel} aria-label="Close">
          <IconClose />
        </button>
      </div>
      <p className="sheet-note">Every goal shares this date. The timer runs until they are all done.</p>
      <label className="date-row">
        <span className="date-copy">
          <IconFlag size={16} />
          Date
        </span>
        <input
          ref={(el) => {
            inputRef.current = el
          }}
          type="date"
          className="date-input"
          value={due}
          onChange={(e) => onDueChange(e.target.value)}
        />
      </label>
      <div className="sheet-actions">
        <div className="sheet-actions-right">
          <button className="btn ghost" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn primary" onClick={onSubmit} disabled={!due}>
            Save
          </button>
        </div>
      </div>
    </>
  )
}

function GoalCard({
  goal,
  onToggle,
  onEdit,
}: {
  goal: Goal
  onToggle: () => void
  onEdit: () => void
}) {
  const done = goal.completed
  return (
    <div className={`goal-card ${done ? 'done' : ''}`}>
      <button className="check" onClick={onToggle} aria-label={done ? 'Mark incomplete' : 'Complete'}>
        {done ? (
          <span className="check-on">
            <IconCheck />
          </span>
        ) : (
          <span className="check-off" />
        )}
      </button>
      <button className="goal-body" onClick={onEdit}>
        <span className="goal-title">{goal.title}</span>
      </button>
    </div>
  )
}

function TimerHero({
  dueDate,
  now,
  done,
  label,
  onClick,
}: {
  dueDate: string | null
  now: Date
  done: boolean
  label: string
  onClick: () => void
}) {
  const overdue = isDeadlineOverdue(dueDate, now, done)
  return (
    <button
      className={`timer-hero ${!dueDate ? 'add' : ''} ${done ? 'done' : ''} ${overdue ? 'overdue' : ''}`}
      onClick={onClick}
    >
      {dueDate ? (
        <>
          <Countdown dueDate={dueDate} done={done} now={now} size="big" />
          <span className="timer-label">{label}</span>
        </>
      ) : (
        <>
          <span className="timer-empty">Set a finish date</span>
          <span className="timer-label">{label}</span>
        </>
      )}
    </button>
  )
}

function Countdown({
  dueDate,
  done,
  now,
  size = 'normal',
}: {
  dueDate: string
  done: boolean
  now: Date
  size?: 'normal' | 'big'
}) {
  if (done) {
    return <div className={`timer-finished ${size}`}>{size === 'big' ? 'Done' : 'Finished'}</div>
  }

  const diff = endOfDueDate(dueDate).getTime() - now.getTime()
  const overdue = diff < 0
  const parts = splitDuration(Math.abs(diff))
  const ticks = [
    { n: String(parts.d), u: 'd' },
    { n: pad(parts.h), u: 'h' },
    { n: pad(parts.m), u: 'm' },
    { n: pad(parts.s), u: 's' },
  ]

  return (
    <div className={`countdown ${size} ${overdue ? 'overdue' : ''}`} aria-live="off">
      {ticks.map((tick, i) => (
        <span key={tick.u} className="tick-group">
          {i > 0 && size === 'big' && (
            <span className="tick-sep" aria-hidden>
              :
            </span>
          )}
          <span className="tick">
            <span className="tick-num">{tick.n}</span>
            <span className="tick-unit">{tick.u}</span>
          </span>
        </span>
      ))}
    </div>
  )
}
