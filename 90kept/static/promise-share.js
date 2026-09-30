import { createPromiseCard, promiseCardContent, promiseCardFormats } from "./promise-card.js?v=9ee3c7d282";

export function mountPromiseShare(getProfile) {
  const element = (id) => document.getElementById(id);
  const dialog = element("promise-share-dialog");
  const image = element("promise-share-image");
  const preview = element("promise-preview-link");
  const loading = element("promise-card-loading");
  const status = element("promise-share-status");
  const share = element("promise-share-image-button");
  const download = element("promise-download");
  const buttons = [...document.querySelectorAll("[data-share-promise]")];
  const formats = [...document.querySelectorAll("[data-promise-format]")];
  let version = 0;
  let renderVersion = 0;
  let file;
  let imageUrl;
  let content;
  let format = "story";
  let sharing = false;

  function clearImage() {
    file = undefined;
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    imageUrl = undefined;
    image.removeAttribute("src");
    image.alt = "";
    preview.removeAttribute("href");
    download.removeAttribute("href");
    download.hidden = true;
    share.disabled = true;
  }
  function reset() {
    version++; renderVersion++;
    content = undefined;
    sharing = false;
    clearImage();
    dialog.close();
    status.textContent = "";
    formats.forEach((button) => { button.disabled = false; });
  }
  function canShareImage() {
    try {
      return typeof navigator.share === "function" && typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] });
    } catch { return false; }
  }
  async function render(nextFormat) {
    const currentVersion = version;
    const request = ++renderVersion;
    format = nextFormat;
    clearImage();
    loading.hidden = false;
    loading.textContent = "Preparing your image…";
    share.hidden = false;
    share.textContent = "Share image";
    status.textContent = "";
    formats.forEach((button) => button.setAttribute("aria-pressed", String(button.dataset.promiseFormat === format)));
    try {
      const result = await createPromiseCard(content, format);
      if (currentVersion !== version || request !== renderVersion) return;
      file = result;
      imageUrl = URL.createObjectURL(file);
      image.src = imageUrl;
      image.alt = `My promise: ${content.goal}. Every day: ${content.tracks.join(", ")}.`;
      const dimensions = promiseCardFormats[format];
      image.width = dimensions.width; image.height = dimensions.height;
      preview.href = imageUrl;
      download.href = imageUrl;
      download.download = file.name;
      download.hidden = false;
      download.setAttribute("aria-disabled", "false");
      const supported = canShareImage();
      share.hidden = !supported;
      share.disabled = !supported;
      download.className = `${supported ? "image-download" : "primary"} link-button`;
      status.textContent = supported ? "Choose Instagram in the share menu." :
        `Download the image and add it to your Instagram ${format === "story" ? "Story" : "post"}.`;
      loading.hidden = true;
    } catch {
      if (currentVersion === version && request === renderVersion) {
        loading.textContent = "Couldn't prepare the image. Tap Story or Post to try again.";
        share.hidden = true;
      }
    }
  }
  buttons.forEach((button) => button.addEventListener("click", () => {
    const saved = promiseCardContent(getProfile());
    if (!saved || sharing || dialog.open) return;
    content = saved;
    dialog.showModal();
    render("story");
  }));
  formats.forEach((button) => button.addEventListener("click", () => {
    if (content && !sharing) render(button.dataset.promiseFormat);
  }));
  share.addEventListener("click", async () => {
    if (!file || sharing || share.disabled) return;
    const currentVersion = version;
    sharing = true;
    share.disabled = true;
    share.textContent = "Sharing…";
    download.setAttribute("aria-disabled", "true");
    formats.forEach((button) => { button.disabled = true; });
    try {
      // Prepare the PNG before this click to retain user activation for file sharing.
      await navigator.share({ files: [file] });
    } catch (error) {
      if (currentVersion === version && error.name !== "AbortError") {
        status.textContent = "Sharing was blocked. Download the image and add it in Instagram.";
      }
    } finally {
      if (currentVersion === version) {
        sharing = false;
        share.disabled = false;
        share.textContent = "Share image";
        download.setAttribute("aria-disabled", "false");
        formats.forEach((button) => { button.disabled = false; });
      }
    }
  });
  download.addEventListener("click", (event) => {
    if (!file || sharing) { event.preventDefault(); return; }
    status.textContent = `Open Instagram and add the saved image to your ${format === "story" ? "Story" : "post"}.`;
  });
  element("promise-share-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", reset);
  return { reset };
}
