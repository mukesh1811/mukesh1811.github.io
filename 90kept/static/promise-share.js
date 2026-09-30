const publicSiteUrl = "https://mukesh1811.github.io/90kept/";

export function promiseShareData(profile) {
  if (!profile?.goal_locked || !profile.goal?.trim() || profile.tracks?.length !== 3) return null;
  return {
    title: "My 90KEPT promise",
    text: `My promise: ${profile.goal}\n\nEvery day:\n${profile.tracks.map((track) => `• ${track}`).join("\n")}\n\nOctober 2–December 31, 2026. 91 days. One promise, kept.`,
    url: publicSiteUrl,
  };
}

export function mountPromiseShare(getProfile) {
  const element = (id) => document.getElementById(id);
  const dialog = element("promise-share-dialog");
  const preview = element("promise-share-text");
  const status = element("promise-share-status");
  const copy = element("promise-copy");
  const buttons = [...document.querySelectorAll("[data-share-promise]")];
  let version = 0;
  let busy = false;

  function reset() {
    version++;
    busy = false;
    buttons.forEach((button) => { button.disabled = false; });
    dialog.close();
    preview.value = "";
    status.textContent = "";
    copy.textContent = "Copy promise";
    copy.disabled = false;
  }
  function showCopy(data) {
    preview.value = `${data.text}\n\n${data.url}`;
    status.textContent = "";
    copy.textContent = "Copy promise";
    if (!dialog.open) dialog.showModal();
  }
  buttons.forEach((button) => button.addEventListener("click", async () => {
    const data = promiseShareData(getProfile());
    if (!data || busy) return;
    const currentVersion = version;
    busy = true;
    buttons.forEach((action) => { action.disabled = true; });
    try {
      if (typeof navigator.share === "function") {
        await navigator.share(data);
      } else {
        showCopy(data);
      }
    } catch (error) {
      if (currentVersion === version && error.name !== "AbortError") showCopy(data);
    } finally {
      if (currentVersion === version) {
        busy = false;
        buttons.forEach((action) => { action.disabled = false; });
      }
    }
  }));
  copy.addEventListener("click", async () => {
    if (!dialog.open || !preview.value || copy.disabled) return;
    const currentVersion = version;
    copy.disabled = true;
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(preview.value);
      if (currentVersion === version) {
        copy.textContent = "Copied";
        status.textContent = "Promise copied. Paste it into a message or post.";
      }
    } catch {
      if (currentVersion === version && dialog.open) {
        preview.focus();
        preview.select();
        status.textContent = "Select and copy the message, then paste it into a message or post.";
      }
    } finally {
      if (currentVersion === version) copy.disabled = false;
    }
  });
  element("promise-share-close").addEventListener("click", () => dialog.close());
  dialog.addEventListener("close", reset);
  return { reset };
}
