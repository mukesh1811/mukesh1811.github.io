import { createFirebaseClient } from "./firebase-client.js?v=c25d55c977";
import { mountPagesApp } from "./pages-ui.js?v=968d76afa3";

const client = createFirebaseClient(window.NINETYKEPT_FIREBASE);
const controller = mountPagesApp(client, window.NINETYKEPT_API_URL);
client.completeRedirect()
  .catch(controller.showError)
  .finally(() => client.subscribe(controller.updateAuth));
