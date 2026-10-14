// Temperature Converter: Celsius, Fahrenheit, Kelvin
const input = document.getElementById("value");
const unit = document.getElementById("unit");
const btn = document.getElementById("convert");
const errorBox = document.getElementById("error");
const outC = document.getElementById("outC");
const outF = document.getElementById("outF");
const outK = document.getElementById("outK");

function clearOutputs() {
  outC.textContent = outF.textContent = outK.textContent = "-";
}

function convert() {
  errorBox.textContent = "";
  const raw = input.value.trim();

  // Validation: must be a number (rejects empty text, letters, "1e", "5-3")
  if (raw === "" || isNaN(Number(raw))) {
    errorBox.textContent = "Please enter a valid number, for example 25 or -4.5.";
    clearOutputs();
    return;
  }
  const value = Number(raw);

  // Step 1: convert whatever the user chose into Celsius
  let c;
  if (unit.value === "C") c = value;
  else if (unit.value === "F") c = (value - 32) * 5 / 9;
  else c = value - 273.15;

  // Edge case: nothing can be colder than absolute zero (-273.15 C)
  if (c < -273.15) {
    errorBox.textContent = "That is below absolute zero (-273.15 \u00B0C, -459.67 \u00B0F, 0 K). Enter a higher value.";
    clearOutputs();
    return;
  }

  // Step 2: show all three units
  outC.textContent = c.toFixed(2) + " \u00B0C";
  outF.textContent = (c * 9 / 5 + 32).toFixed(2) + " \u00B0F";
  outK.textContent = (c + 273.15).toFixed(2) + " K";
}

btn.addEventListener("click", convert);
input.addEventListener("keydown", (e) => { if (e.key === "Enter") convert(); });
