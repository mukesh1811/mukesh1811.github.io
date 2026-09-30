import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth, getRedirectResult, GoogleAuthProvider, onAuthStateChanged,
  signInWithPopup, signOut,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";
import { getBrowserContext } from "./browser-login.js?v=227bd7338d";

export function createFirebaseClient(config) {
  const auth = getAuth(initializeApp(config));
  return {
    get user() { return auth.currentUser; },
    getToken: (refresh = false) => auth.currentUser.getIdToken(refresh),
    subscribe: (callback) => onAuthStateChanged(auth, callback),
    completeRedirect: () => getRedirectResult(auth),
    signOut: () => signOut(auth),
    async signIn() {
      if (getBrowserContext().embedded) {
        throw Object.assign(new Error("Open 90KEPT in your browser to log in."), { code: "auth/embedded-browser" });
      }
      const provider = new GoogleAuthProvider();
      return signInWithPopup(auth, provider);
    },
  };
}
