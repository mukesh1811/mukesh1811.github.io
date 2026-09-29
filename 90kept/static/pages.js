const target = new Date("2027-01-01T00:00:00+05:30");

function tick() {
  const element = document.querySelector("#countdown");
  if (!element) return;

  const remaining = Math.max(0, target.getTime() - Date.now());
  const days = Math.floor(remaining / 86400000);
  const hours = Math.floor((remaining % 86400000) / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  const pad = (value) => String(value).padStart(2, "0");

  element.textContent = `${days}d ${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
}

tick();
setInterval(tick, 1000);
