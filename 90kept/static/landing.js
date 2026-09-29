import { createFirebaseClient } from "./firebase-client.js?v=c25d55c977";

const button = document.getElementById("primary-cta");
const errorMessage = document.getElementById("login-error");
const config = window.NINETYKEPT_FIREBASE;
const client = config?.apiKey ? createFirebaseClient(config) : null;

function showError(error) {
  if (error.code === "auth/popup-closed-by-user") return;
  errorMessage.textContent = error.code === "auth/popup-timeout" ?
    "Finish signing in in Google's window. If it hasn't opened, try Chrome or Safari." :
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
