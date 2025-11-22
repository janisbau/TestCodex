/* Inline JS with refined summary text + theme toggle */
const STORAGE_KEY = "personal-task-tracker-live";
const THEME_KEY = "personal-task-tracker-theme";

let tasks = [];
let currentFilter = "all";

const form = document.getElementById("task-form");
const titleInput = document.getElementById("title");
const descInput = document.getElementById("description");
const err = document.getElementById("title-error");
const list = document.getElementById("task-list");
const empty = document.getElementById("empty-state");
const summary = document.getElementById("task-summary");
const filters = Array.from(document.querySelectorAll(".filter-btn"));
const themeToggleBtn = document.getElementById("theme-toggle");
const bodyEl = document.body;

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function filteredTasks() {
  if (currentFilter === "active") return tasks.filter((t) => !t.completed);
  if (currentFilter === "completed") return tasks.filter((t) => t.completed);
  return tasks;
}

function updateSummary() {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  if (!total) {
    summary.textContent = "No tasks yet.";
    return;
  }
  const taskWord = total === 1 ? "task" : "tasks";
  summary.textContent = `${total} ${taskWord}, ${completed} completed`;
}

function render() {
  const f = filteredTasks();
  list.innerHTML = "";

  if (!f.length) {
    list.classList.add("hidden");
    empty.classList.remove("hidden");
  } else {
    list.classList.remove("hidden");
    empty.classList.add("hidden");
  }

  f.forEach((t) => {
    const li = document.createElement("li");
    li.className = "task-item" + (t.completed ? " completed" : "");
    li.dataset.id = t.id;
    li.innerHTML = `
      <input type="checkbox" class="task-checkbox" ${t.completed ? "checked" : ""}>
      <div>
        <div class="task-title">${t.title}</div>
        ${t.description ? `<p class="task-description">${t.description}</p>` : ""}
      </div>
      <button class="icon-btn delete" title="Delete">✕</button>
    `;
    list.appendChild(li);
  });

  updateSummary();
}

function addTask(title, description) {
  tasks.unshift({
    id: Date.now() + "",
    title,
    description,
    completed: false,
  });
  saveTasks();
  render();
}

function toggle(id) {
  const t = tasks.find((x) => x.id === id);
  if (!t) return;
  t.completed = !t.completed;
  saveTasks();
  render();
}

function removeTask(id) {
  tasks = tasks.filter((t) => t.id !== id);
  saveTasks();
  render();
}

// Theme helpers
function loadTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "dark" || stored === "light") return stored;
  // fallback: prefer system
  if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
}

function applyTheme(theme) {
  bodyEl.setAttribute("data-theme", theme);
  if (themeToggleBtn) {
    const next = theme === "dark" ? "light" : "dark";
    themeToggleBtn.setAttribute("aria-label", `Switch to ${next} theme`);
  }
}

function setTheme(theme) {
  applyTheme(theme);
  try {
    localStorage.setItem(THEME_KEY, theme);
  } catch (e) {
    // ignore storage errors
  }
}

// Event wiring
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const title = titleInput.value.trim();
  const description = descInput.value.trim();

  if (!title) {
    err.textContent = "Please enter a task title.";
    titleInput.focus();
    return;
  }

  err.textContent = "";
  addTask(title, description);
  form.reset();
  titleInput.focus();
});

filters.forEach((btn) => {
  btn.addEventListener("click", () => {
    const filter = btn.dataset.filter;
    if (!filter || filter === currentFilter) return;
    currentFilter = filter;
    filters.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    render();
  });
});

list.addEventListener("click", (e) => {
  const li = e.target.closest(".task-item");
  if (!li) return;
  const id = li.dataset.id;

  if (e.target.classList.contains("task-checkbox")) {
    toggle(id);
  } else if (e.target.classList.contains("delete")) {
    removeTask(id);
  }
});

if (themeToggleBtn) {
  themeToggleBtn.addEventListener("click", () => {
    const current = bodyEl.getAttribute("data-theme") || "light";
    const next = current === "light" ? "dark" : "light";
    setTheme(next);
  });
}

// Init

document.addEventListener("DOMContentLoaded", () => {
  const initialTheme = loadTheme();
  applyTheme(initialTheme);
  try {
    localStorage.setItem(THEME_KEY, initialTheme);
  } catch (e) {
    // ignore
  }

  tasks = loadTasks();
  render();
});
