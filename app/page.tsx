"use client";

import { FormEvent, useMemo, useState, useSyncExternalStore } from "react";

type Filter = "all" | "open" | "done";

type Task = {
  id: string;
  title: string;
  completed: boolean;
  createdAt: number;
};

const STORAGE_KEY = "first-task-tracker.tasks";

const starterTasks: Task[] = [
  {
    id: "welcome-task",
    title: "Try adding your own task",
    completed: false,
    createdAt: 1,
  },
  {
    id: "completed-task",
    title: "Open the app on Vercel",
    completed: true,
    createdAt: 2,
  },
];

const starterTasksJson = JSON.stringify(starterTasks);

function subscribeToTasks(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener("task-tracker-update", onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener("task-tracker-update", onStoreChange);
  };
}

function getTasksSnapshot() {
  return window.localStorage.getItem(STORAGE_KEY) ?? starterTasksJson;
}

function getServerTasksSnapshot() {
  return starterTasksJson;
}

export default function Home() {
  const [taskTitle, setTaskTitle] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const tasksJson = useSyncExternalStore(
    subscribeToTasks,
    getTasksSnapshot,
    getServerTasksSnapshot,
  );
  const tasks = useMemo(() => {
    try {
      return JSON.parse(tasksJson) as Task[];
    } catch {
      return starterTasks;
    }
  }, [tasksJson]);

  function saveTasks(nextTasks: Task[]) {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextTasks));
    window.dispatchEvent(new Event("task-tracker-update"));
  }

  const openCount = tasks.filter((task) => !task.completed).length;
  const completedCount = tasks.length - openCount;
  const progress = tasks.length
    ? Math.round((completedCount / tasks.length) * 100)
    : 0;

  const visibleTasks = useMemo(() => {
    if (filter === "open") return tasks.filter((task) => !task.completed);
    if (filter === "done") return tasks.filter((task) => task.completed);
    return tasks;
  }, [filter, tasks]);

  function addTask(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const title = taskTitle.trim();

    if (!title) return;

    saveTasks([
      {
        id: crypto.randomUUID(),
        title,
        completed: false,
        createdAt: Date.now(),
      },
      ...tasks,
    ]);
    setTaskTitle("");
  }

  function toggleTask(id: string) {
    saveTasks(
      tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task,
      ),
    );
  }

  function deleteTask(id: string) {
    saveTasks(tasks.filter((task) => task.id !== id));
  }

  function clearCompleted() {
    saveTasks(tasks.filter((task) => !task.completed));
  }

  return (
    <main className="app-shell">
      <section className="task-app" aria-labelledby="page-title">
        <header className="app-header">
          <div>
            <p className="eyebrow">MY DAY</p>
            <h1 id="page-title">Task Tracker</h1>
            <p className="date-label">
              {new Intl.DateTimeFormat("en-US", {
                weekday: "long",
                month: "long",
                day: "numeric",
              }).format(new Date())}
            </p>
          </div>

          <div
            className="progress-ring"
            style={{ "--progress": `${progress * 3.6}deg` } as React.CSSProperties}
            aria-label={`${progress}% of tasks completed`}
          >
            <div>
              <strong>{progress}%</strong>
              <span>done</span>
            </div>
          </div>
        </header>

        <form className="task-form" onSubmit={addTask}>
          <label className="sr-only" htmlFor="new-task">
            New task
          </label>
          <input
            id="new-task"
            value={taskTitle}
            onChange={(event) => setTaskTitle(event.target.value)}
            placeholder="What needs to get done?"
            autoComplete="off"
          />
          <button type="submit" disabled={!taskTitle.trim()}>
            Add task
          </button>
        </form>

        <div className="task-toolbar">
          <div className="filters" aria-label="Filter tasks">
            {(["all", "open", "done"] as const).map((option) => (
              <button
                key={option}
                type="button"
                className={filter === option ? "active" : ""}
                onClick={() => setFilter(option)}
                aria-pressed={filter === option}
              >
                {option === "all"
                  ? `All ${tasks.length}`
                  : option === "open"
                    ? `Open ${openCount}`
                    : `Done ${completedCount}`}
              </button>
            ))}
          </div>

          {completedCount > 0 && (
            <button
              type="button"
              className="clear-button"
              onClick={clearCompleted}
            >
              Clear completed
            </button>
          )}
        </div>

        <div className="task-list" aria-live="polite">
          {visibleTasks.length === 0 ? (
            <div className="empty-state">
              <span aria-hidden="true">✓</span>
              <h2>{tasks.length === 0 ? "A clear list" : "Nothing here"}</h2>
              <p>
                {tasks.length === 0
                  ? "Add a task above to get started."
                  : "Try a different filter."}
              </p>
            </div>
          ) : (
            visibleTasks.map((task) => (
              <article
                className={`task-row ${task.completed ? "completed" : ""}`}
                key={task.id}
              >
                <label className="task-check">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span aria-hidden="true">✓</span>
                  <span className="sr-only">
                    Mark {task.title} as
                    {task.completed ? " incomplete" : " complete"}
                  </span>
                </label>
                <p>{task.title}</p>
                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteTask(task.id)}
                  aria-label={`Delete ${task.title}`}
                >
                  Delete
                </button>
              </article>
            ))
          )}
        </div>

        <footer>
          <span>{openCount === 1 ? "1 task" : `${openCount} tasks`} left</span>
          <span>Saved on this device</span>
        </footer>
      </section>
    </main>
  );
}
