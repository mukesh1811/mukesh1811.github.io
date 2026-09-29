import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js";
import {
  getAuth, getRedirectResult, GoogleAuthProvider, onAuthStateChanged,
  signInWithPopup, signInWithRedirect, signOut,
} from "https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js";

export function createFirebaseClient(config) {
  const auth = getAuth(initializeApp(config));
  return {
    get user() { return auth.currentUser; },
    getToken: (refresh = false) => auth.currentUser.getIdToken(refresh),
    subscribe: (callback) => onAuthStateChanged(auth, callback),
    completeRedirect: () => getRedirectResult(auth),
    signOut: () => signOut(auth),
    async signIn() {
      const provider = new GoogleAuthProvider();
      try {
        return await signInWithPopup(auth, provider);
      } catch (error) {
        if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment"].includes(error.code)) {
          return signInWithRedirect(auth, provider);
        }
        throw error;
      }
    },
  };
}
