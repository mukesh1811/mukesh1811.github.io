import { mountBrowserLoginHelp } from "./browser-login.js?v=93ec1f1ebe";
import { mountProductFlow } from "./product-flow.js?v=6072cc3c25";

const button = document.getElementById("primary-cta");
const errorMessage = document.getElementById("login-error");
const browserHelp = mountBrowserLoginHelp();
if (!browserHelp.start()) {
  mountProductFlow();
  await mountLogin();
}

async function mountLogin() {
  let client;
  button.disabled = true;
  try {
    const { createFirebaseClient } = await import("./firebase-client.js?v=8405cf6bb4");
    const config = window.NINETYKEPT_FIREBASE;
    client = config?.apiKey ? createFirebaseClient(config) : null;
  } catch (error) { showError(error); }
  button.disabled = false;

  function showError(error) {
    if (error.code === "auth/popup-closed-by-user") return;
    if (["auth/embedded-browser", "auth/operation-not-supported-in-this-environment", "auth/web-storage-unsupported"].includes(error.code)) {
      browserHelp.open();
      return;
    }
    errorMessage.textContent = error.code === "auth/popup-timeout" ?
      "Finish signing in in Google's window. If it hasn't opened, try Chrome or Safari." :
      error.code === "auth/popup-blocked" ? "Allow pop-ups for 90KEPT in your browser, then tap Login again." :
      "Couldn't log in. Please try again in Chrome or Safari.";
    errorMessage.hidden = false;
  }

  async function openApp(user) {
    if (window.NINETYKEPT_SERVER_SESSION) {
      const response = await fetch("/auth/session", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken: await user.getIdToken() }),
      });
      if (!response.ok) throw new Error("Could not create your session.");
    }
    location.assign(window.NINETYKEPT_APP_URL);
  }

  client?.completeRedirect()
    .then((credential) => credential && openApp(credential.user))
    .catch(showError);

  button.addEventListener("click", async () => {
    errorMessage.hidden = true;
    button.disabled = true;
    button.textContent = "Logging in…";
    let timeout;
    try {
      if (!client) throw new Error("Google login is not configured.");
      const login = async () => {
        const user = client.user || (await client.signIn())?.user;
        if (user) await openApp(user);
      };
      await Promise.race([login(), new Promise((resolve, reject) => {
        timeout = setTimeout(() => reject(Object.assign(new Error(), { code: "auth/popup-timeout" })), 45000);
      })]);
    } catch (error) { showError(error); }
    finally { clearTimeout(timeout); button.disabled = false; button.textContent = "Login"; }
  });
}
