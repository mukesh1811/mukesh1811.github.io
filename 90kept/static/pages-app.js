import { createFirebaseClient } from "./firebase-client.js";
import { mountPagesApp } from "./pages-ui.js";

const client = createFirebaseClient(window.NINETYKEPT_FIREBASE);
const controller = mountPagesApp(client, window.NINETYKEPT_API_URL);
client.completeRedirect()
  .catch(controller.showError)
  .finally(() => client.subscribe(controller.updateAuth));
