export const publicLoginUrl = "https://mukesh1811.github.io/90kept/";

export function getBrowserContext(userAgent = navigator.userAgent) {
  const instagram = /Instagram/i.test(userAgent);
  const facebook = /FBAN|FBAV|FB_IAB|FBIOS/i.test(userAgent);
  return {
    embedded: instagram || facebook || /\bwv\b|TikTok|musical_ly|BytedanceWebview|Line\/|LinkedInApp/i.test(userAgent),
    android: /Android/i.test(userAgent),
    appName: instagram ? "Instagram" : facebook ? "Facebook" : "this app",
  };
}

export function chromeLoginIntent() {
  return `intent://mukesh1811.github.io/90kept/#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(publicLoginUrl)};end`;
}

export function mountBrowserLoginHelp() {
  const context = getBrowserContext();
  const element = (id) => document.getElementById(id);
  const dialog = element("browser-login-dialog");
  const hint = element("browser-login-hint");
  const chrome = element("browser-open-chrome");
  const copy = element("browser-copy-link");
  const status = element("browser-link-status");
  const link = element("browser-login-link");
  chrome.hidden = !context.android;
  chrome.href = chromeLoginIntent();
  copy.className = context.android ? "text-button" : "primary";
  link.value = publicLoginUrl;
  if (context.embedded) {
    hint.hidden = false;
    hint.textContent = `${context.appName === "this app" ? "This app's" : `${context.appName}'s`} browser can't complete Google login. Open this page in Chrome or Safari.`;
  }
  element("browser-login-instructions").textContent = context.embedded ?
    `Use ${context.appName === "this app" ? "the app's" : `${context.appName}'s`} ⋯ menu to open this page in your browser, then tap Login.` :
    "Open the link below in Chrome or Safari, allow pop-ups for 90KEPT, then tap Login.";
  copy.addEventListener("click", async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(publicLoginUrl);
      status.textContent = "Link copied. Paste it in Chrome or Safari, then tap Login.";
      copy.textContent = "Link copied";
    } catch {
      link.hidden = false;
      link.focus();
      link.select();
      status.textContent = "Copy this link and open it in Chrome or Safari, then tap Login.";
    }
  });
  return {
    isEmbedded: context.embedded,
    open() {
      status.textContent = "";
      link.hidden = true;
      copy.textContent = "Copy link";
      if (!dialog.open) dialog.showModal();
    },
  };
}
