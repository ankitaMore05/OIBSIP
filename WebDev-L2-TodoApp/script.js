// To-Do app: add, complete, edit, delete, counts, timestamps, localStorage
const KEY = "oib_todo_tasks";
let tasks = [];
let editingId = null;

const input = document.getElementById("newTask");
const addBtn = document.getElementById("addBtn");
const pendingList = document.getElementById("pendingList");
const doneList = document.getElementById("doneList");

function load() {
  try { tasks = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { tasks = []; }
}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(tasks)); } catch (e) { /* storage unavailable */ }
}
function stamp(ms) { return new Date(ms).toLocaleString(); }

function addTask() {
  const text = input.value.trim();
  if (!text) { input.focus(); return; }
  tasks.push({ id: Date.now() + Math.random(), text, done: false, added: Date.now(), completed: null });
  input.value = "";
  save(); render();
}
function toggle(id) {
  const t = tasks.find((x) => x.id === id);
  t.done = !t.done;
  t.completed = t.done ? Date.now() : null;
  save(); render();
}
function remove(id) { tasks = tasks.filter((x) => x.id !== id); save(); render(); }

function button(label, cls, handler) {
  const b = document.createElement("button");
  b.type = "button"; b.textContent = label;
  if (cls) b.className = cls;
  b.addEventListener("click", handler);
  return b;
}

function buildItem(t) {
  const li = document.createElement("li");
  if (t.done) li.classList.add("done");

  if (editingId === t.id) {                       // inline edit mode
    const field = document.createElement("input");
    field.type = "text"; field.value = t.text; field.maxLength = 120; field.className = "text";
    field.setAttribute("aria-label", "Edit task");
    const saveEdit = () => {
      const v = field.value.trim();
      if (v) t.text = v;
      editingId = null; save(); render();
    };
    field.addEventListener("keydown", (e) => {
      if (e.key === "Enter") saveEdit();
      if (e.key === "Escape") { editingId = null; render(); }
    });
    li.append(field, button("Save", "", saveEdit), button("Cancel", "ghost", () => { editingId = null; render(); }));
    setTimeout(() => field.focus(), 0);
  } else {
    const span = document.createElement("span");
    span.className = "text"; span.textContent = t.text;   // textContent keeps user input safe
    li.append(span,
      button(t.done ? "Undo" : "Mark Complete", "", () => toggle(t.id)),
      button("Edit", "ghost", () => { editingId = t.id; render(); }),
      button("Delete", "danger", () => remove(t.id)));
  }
  const time = document.createElement("span");
  time.className = "time";
  time.textContent = "Added: " + stamp(t.added) + (t.completed ? "  |  Completed: " + stamp(t.completed) : "");
  li.append(time);
  return li;
}

function fillList(list, items, emptyMsg) {
  list.replaceChildren();
  if (items.length === 0) {
    const li = document.createElement("li");
    li.className = "empty"; li.textContent = emptyMsg;
    list.append(li);
    return;
  }
  items.forEach((t) => list.append(buildItem(t)));
}

function render() {
  const pending = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);
  document.getElementById("pendingCount").textContent = pending.length + " pending";
  document.getElementById("doneCount").textContent = done.length + " completed";
  fillList(pendingList, pending, "Nothing pending. Add a task above!");
  fillList(doneList, done, "No completed tasks yet.");
}

addBtn.addEventListener("click", addTask);
input.addEventListener("keydown", (e) => { if (e.key === "Enter") addTask(); });
load(); render();
