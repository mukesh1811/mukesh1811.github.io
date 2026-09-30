import { createFirebaseClient } from "./firebase-client.js?v=f7e4143817";
import { mountPagesApp } from "./pages-ui.js?v=9a999ea90a";
import { mountBrowserLoginHelp } from "./browser-login.js?v=227bd7338d";

const browserHelp = mountBrowserLoginHelp();
if (browserHelp.isEmbedded) {
  document.getElementById("loading-view").hidden = true;
  document.getElementById("sign-in-view").hidden = false;
  const button = document.getElementById("sign-in-button");
  button.textContent = "Continue in your browser";
  button.addEventListener("click", () => browserHelp.open());
} else {
  const client = createFirebaseClient(window.NINETYKEPT_FIREBASE);
  const controller = mountPagesApp(client, window.NINETYKEPT_API_URL, browserHelp);
  client.completeRedirect()
    .catch(controller.showError)
    .finally(() => client.subscribe(controller.updateAuth));
}
