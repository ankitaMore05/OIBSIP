// Calculator: no eval(). Logic uses variables and conditionals.
// Operations are applied one at a time (like a basic pocket calculator),
// so 5 + 3 x 2 = 16.
const display = document.getElementById("display");
let current = "0";   // number being typed / shown
let prev = null;     // stored left-hand number
let op = null;       // pending operator
let fresh = false;   // next digit starts a new number
let error = false;

function show() { display.textContent = current; }

function compute(a, b, o) {
  if (o === "+") return a + b;
  if (o === "\u2212") return a - b;
  if (o === "\u00D7") return a * b;
  if (o === "\u00F7") return b === 0 ? null : a / b; // null = division by zero
  return b;
}
function fmt(n) { return String(parseFloat(n.toPrecision(12))); }

function setError() {
  current = "Error: divide by 0"; prev = null; op = null; error = true; fresh = true; show();
}
function clearAll() { current = "0"; prev = null; op = null; fresh = false; error = false; show(); }

function digit(d) {
  if (error) clearAll();
  if (fresh) { current = "0"; fresh = false; }
  if (d === ".") { if (current.includes(".")) return; current += "."; }
  else { current = current === "0" ? d : current + d; }
  show();
}
function operator(o) {
  if (error) return;
  if (op !== null && !fresh) {            // chaining: finish the previous operation first
    const r = compute(prev, parseFloat(current), op);
    if (r === null) { setError(); return; }
    prev = r; current = fmt(r);
  } else if (op === null) {
    prev = parseFloat(current);
  }
  op = o; fresh = true; show();
}
function equals() {
  if (error || op === null || fresh) return;
  const r = compute(prev, parseFloat(current), op);
  if (r === null) { setError(); return; }
  current = fmt(r); prev = null; op = null; fresh = true; show();
}
function back() {
  if (error) { clearAll(); return; }
  if (fresh) return;
  current = current.length > 1 ? current.slice(0, -1) : "0";
  if (current === "-") current = "0";
  show();
}

// Event listeners on every button (no inline onclick)
document.querySelectorAll("button").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (btn.dataset.digit !== undefined) digit(btn.dataset.digit);
    else if (btn.dataset.op !== undefined) operator(btn.textContent);
    else if (btn.dataset.action === "equals") equals();
    else if (btn.dataset.action === "clear") clearAll();
    else if (btn.dataset.action === "back") back();
  });
});
