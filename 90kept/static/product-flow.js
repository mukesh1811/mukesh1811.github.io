// Loop the silent walkthrough while visible; respect visitor playback preferences.
export function mountProductFlow() {
  const video = document.getElementById("product-flow-video");
  if (!video) return;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches || navigator.connection?.saveData) { video.controls = false; return; }

  let visible = false;
  let finished = false;
  let observer;
  let pausedByVisitor = false;
  let internalPause = false;
  video.muted = true;
  video.loop = true;

  function pausePreview() {
    if (video.paused) return;
    internalPause = true;
    video.pause();
  }
  function onPause() {
    if (!internalPause && !finished) pausedByVisitor = true;
    internalPause = false;
  }
  function onPlay() { pausedByVisitor = false; }

  function finish() {
    finished = true;
    pausePreview();
    observer?.disconnect();
    document.removeEventListener("visibilitychange", update);
    motion.removeEventListener("change", changeMotion);
    video.removeEventListener("pause", onPause);
    video.removeEventListener("play", onPlay);
  }
  function update() {
    if (finished) return;
    if (!visible || document.hidden || pausedByVisitor) { pausePreview(); return; }
    if (!video.getAttribute("src")) video.src = video.dataset.src;
    // Autoplay rejection keeps a useful still preview and never affects Login.
    video.play().catch((error) => {
      if (error.name === "AbortError" && (!visible || document.hidden)) return;
      showPoster();
    });
  }
  function changeMotion(event) {
    if (!event.matches) return;
    showPoster();
  }
  function showPoster() {
    finish();
    video.removeAttribute("src");
    video.controls = false;
    video.load();
  }
  video.addEventListener("pause", onPause);
  video.addEventListener("play", onPlay);
  video.addEventListener("error", showPoster, { once: true });
  motion.addEventListener("change", changeMotion);
  document.addEventListener("visibilitychange", update);
  if ("IntersectionObserver" in window) {
    observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting && entry.intersectionRatio >= 0.9;
      update();
    }, { threshold: 0.9 });
    observer.observe(video);
  } else {
    visible = true;
    update();
  }
}
