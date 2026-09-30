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
  const fallback = `${publicLoginUrl}?browser=manual`;
  return `intent://mukesh1811.github.io/90kept/#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url=${encodeURIComponent(fallback)};end`;
}

export function mountBrowserLoginHelp() {
  const context = getBrowserContext();
  const element = (id) => document.getElementById(id);
  const screen = element("browser-login-screen");
  const chrome = element("browser-open-chrome");
  const copy = element("browser-copy-link");
  const status = element("browser-link-status");
  const link = element("browser-login-link");
  chrome.hidden = !context.android;
  chrome.href = chromeLoginIntent();
  copy.className = context.android ? "text-button" : "primary";
  link.value = publicLoginUrl;
  element("browser-login-reason").textContent = context.embedded ?
    `${context.appName === "this app" ? "This app's" : `${context.appName}'s`} browser doesn't support Google login.` :
    "Use Chrome or Safari to complete Google login.";
  element("browser-login-instructions").textContent = context.android ?
    "If Chrome hasn't opened, tap below." : context.embedded ?
    `Tap ${context.appName === "this app" ? "the app's" : `${context.appName}'s`} ⋯ menu, then Open in browser. You can also copy the link below.` :
    "Copy the link below and open it in Chrome or Safari.";
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
  function open() {
    status.textContent = "";
    link.hidden = true;
    copy.textContent = "Copy link";
    element("site-content").hidden = true;
    screen.hidden = false;
  }
  let attempted = false;
  return {
    isEmbedded: context.embedded,
    open,
    start() {
      if (!context.embedded) return false;
      open();
      if (context.android && !attempted && new URL(location.href).searchParams.get("browser") !== "manual") {
        attempted = true;
        try { location.replace(chromeLoginIntent()); }
        catch { /* The browser can require a tap; the handoff screen stays available. */ }
      }
      return true;
    },
  };
}
