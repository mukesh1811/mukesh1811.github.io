import { mountBrowserLoginHelp } from "./browser-login.js?v=93ec1f1ebe";

const browserHelp = mountBrowserLoginHelp();
if (!browserHelp.start()) {
  const [{ createFirebaseClient }, { mountPagesApp }] = await Promise.all([
    import("./firebase-client.js?v=8405cf6bb4"), import("./pages-ui.js?v=e53e650376"),
  ]);
  const client = createFirebaseClient(window.NINETYKEPT_FIREBASE);
  const controller = mountPagesApp(client, window.NINETYKEPT_API_URL, browserHelp);
  client.completeRedirect()
    .catch(controller.showError)
    .finally(() => client.subscribe(controller.updateAuth));
}
