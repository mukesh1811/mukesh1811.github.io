// A single silent walkthrough; leave the poster visible when motion is unwanted.
export function mountProductFlow() {
  const video = document.getElementById("product-flow-video");
  if (!video) return;
  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (motion.matches || navigator.connection?.saveData) return;

  let visible = false;
  let finished = false;
  let observer;
  video.muted = true;

  function finish() {
    finished = true;
    video.pause();
    observer?.disconnect();
    document.removeEventListener("visibilitychange", update);
    motion.removeEventListener("change", changeMotion);
  }
  function update() {
    if (finished) return;
    if (!visible || document.hidden) { video.pause(); return; }
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
    video.load();
  }
  video.addEventListener("ended", finish, { once: true });
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
