export const promiseCardFormats = {
  story: { width: 1080, height: 1920 },
  post: { width: 1080, height: 1350 },
};
const colors = { linen: "#F1ECE6", umber: "#493B36", terracotta: "#BB7653", muted: "#79675E", line: "#DDD0C4" };
const fontFamily = 'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export function promiseCardContent(profile) {
  if (!profile?.goal_locked || typeof profile.goal !== "string" || !profile.goal.trim() ||
      !Array.isArray(profile.tracks) || profile.tracks.length !== 3 ||
      profile.tracks.some((track) => typeof track !== "string" || !track.trim())) return null;
  const clean = (text) => text.trim().replace(/\s+/gu, " ");
  return { goal: clean(profile.goal), tracks: profile.tracks.map(clean) };
}

export function wrapCardText(context, text, width) {
  const lines = [];
  let line = "";
  for (const word of text.split(/\s+/u)) {
    if (context.measureText(line ? `${line} ${word}` : word).width <= width) {
      line = line ? `${line} ${word}` : word;
      continue;
    }
    if (line) { lines.push(line); line = ""; }
    for (const character of Array.from(word)) {
      if (line && context.measureText(line + character).width > width) {
        lines.push(line); line = "";
      }
      line += character;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function fitText(context, text, width, height, largest, smallest, weight = 800) {
  for (let size = largest; size >= smallest; size -= 2) {
    context.font = `${weight} ${size}px ${fontFamily}`;
    const lines = wrapCardText(context, text, width);
    const lineHeight = size * 1.08;
    if (lines.length * lineHeight <= height) return { lines, lineHeight, size };
  }
  throw new Error("Promise text does not fit the card.");
}

function drawMark(context, x, y, size) {
  context.save(); context.translate(x, y); context.scale(size / 128, size / 128);
  context.strokeStyle = colors.terracotta;
  context.lineCap = "round"; context.lineJoin = "round"; context.lineWidth = 5;
  // Match branding/90kept-mark.svg without fetching external resources.
  for (const path of ["M32 15H19A4 4 0 0 0 15 19V32", "M96 15H109A4 4 0 0 1 113 19V32", "M15 96V109A4 4 0 0 0 19 113H32", "M96 113H109A4 4 0 0 0 113 109V96"]) context.stroke(new Path2D(path));
  context.lineWidth = 7.5;
  context.stroke(new Path2D("M92 83C86 92 76 98 64 98C45.22 98 30 82.78 30 64C30 45.22 45.22 30 64 30C77 30 89 38 94 50L68 78L55 65"));
  context.restore();
}

export function drawPromiseCard(canvas, content, format = "story") {
  const dimensions = promiseCardFormats[format];
  if (!dimensions) throw new Error("Unknown image format.");
  canvas.width = dimensions.width; canvas.height = dimensions.height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image rendering is unavailable.");
  const story = format === "story";
  const header = story ? 280 : 90;
  const goalTop = story ? 570 : 330;
  const actionsTop = story ? 1110 : 800;
  const rowHeight = story ? 112 : 94;
  const footer = story ? 1535 : 1185;
  context.fillStyle = colors.linen; context.fillRect(0, 0, canvas.width, canvas.height);
  context.textBaseline = "top";
  drawMark(context, 88, header, 100);
  context.fillStyle = colors.umber; context.font = `900 52px ${fontFamily}`;
  context.fillText("90KEPT", 212, header + 24);
  context.textAlign = "right"; context.fillStyle = colors.muted; context.font = `500 26px ${fontFamily}`;
  context.fillText("Oct 2–Dec 31", 984, header + 24); context.fillText("2026", 984, header + 62);
  context.textAlign = "left"; context.font = `500 34px ${fontFamily}`;
  context.fillText("My promise.", 96, goalTop - 88);
  const goal = fitText(context, content.goal, 888, story ? 430 : 360, story ? 132 : 118, 40);
  context.fillStyle = colors.umber;
  goal.lines.forEach((line, index) => context.fillText(line, 96, goalTop + index * goal.lineHeight));
  context.fillStyle = colors.muted; context.font = `500 30px ${fontFamily}`;
  context.fillText("Every day, I will", 96, actionsTop - 66);
  content.tracks.forEach((track, index) => {
    const top = actionsTop + index * rowHeight;
    context.strokeStyle = colors.line; context.lineWidth = 2;
    context.beginPath(); context.moveTo(96, top - 16); context.lineTo(984, top - 16); context.stroke();
    context.strokeStyle = colors.terracotta; context.lineWidth = 3;
    context.beginPath(); context.arc(112, top + 25, 12, 0, Math.PI * 2); context.stroke();
    const action = fitText(context, track, 824, rowHeight - 25, 38, 20, 500);
    context.fillStyle = colors.umber;
    action.lines.forEach((line, lineIndex) => context.fillText(line, 160, top + 5 + lineIndex * action.lineHeight));
  });
  context.fillStyle = colors.terracotta; context.font = `600 32px ${fontFamily}`;
  context.fillText("One promise. 13 weeks. kept.", 96, footer);
  context.fillStyle = colors.muted; context.font = `500 27px ${fontFamily}`;
  context.fillText("mukesh1811.github.io/90kept", 96, footer + 54);
  return dimensions;
}

export async function createPromiseCard(content, format = "story") {
  await document.fonts?.ready;
  const canvas = document.createElement("canvas");
  drawPromiseCard(canvas, content, format);
  const blob = await new Promise((resolve, reject) => canvas.toBlob(
    (result) => result ? resolve(result) : reject(new Error("Image export failed.")), "image/png",
  ));
  return new File([blob], `90kept-promise-${format}.png`, { type: "image/png" });
}
