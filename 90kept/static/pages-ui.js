export function mountPagesApp(client, apiBase) {
  const element = (id) => document.getElementById(id);
  const views = ["loading", "sign-in", "paywall", "setup", "run"];
  const signIn = element("sign-in-button");
  const dialog = element("pages-checkin-dialog");
  const submit = element("pages-submit-checkin");
  let state;
  let values = [null, null, null];
  let authVersion = 0;
  let stateVersion = 0;

  function view(name) {
    views.forEach((id) => { element(`${id}-view`).hidden = id !== name; });
  }
  function clearError() { element("status-message").hidden = true; }
  function showError(error) {
    if (error.code === "auth/popup-closed-by-user") return;
    const messages = {
      unauthorized: "Please sign in again.", invalid_token: "Your sign-in expired. Sign out and sign in again.",
      goal_already_locked: "Your goal is already locked. Refresh to see your run.",
      checkin_already_locked: "Today's check-in is already locked.",
      outside_cohort: "Check-ins are open October 2 through December 31, 2026.",
      payment_required: "Purchase access before starting your run.",
      invalid_sprint: "That sprint is unavailable. Choose a sprint from 1 to 13.",
      "auth/popup-blocked": "Open 90KEPT in Chrome or Safari to sign in.",
      "auth/network-request-failed": "Check your connection and try again.",
      "auth/popup-timeout": "If Google's sign-in window hasn't opened, open this page in Chrome or Safari and try again. If it is open, finish signing in there.",
    };
    element("status-message").textContent = messages[error.code] || "Couldn't complete that step. Please try again.";
    element("status-message").hidden = false;
  }
  async function api(path, body, refresh = false) {
    if (!client.user) throw Object.assign(new Error(), { code: "unauthorized" });
    const token = await client.getToken(refresh);
    const response = await fetch(`${apiBase}${path}`, {
      method: body === undefined ? "GET" : "POST", credentials: "omit",
      headers: { Authorization: `Bearer ${token}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    if (response.status === 401 && !refresh) return api(path, body, true);
    const data = await response.json();
    if (!response.ok) throw Object.assign(new Error(), { code: data.error });
    return data;
  }
  function textNode(tag, text, className = "") {
    const node = document.createElement(tag);
    node.textContent = text;
    node.className = className;
    return node;
  }
  function renderRun() {
    element("goal-text").textContent = state.profile.goal;
    element("sprint-number").textContent = `${String(state.sprint).padStart(2, "0")} / 13`;
    element("previous-sprint").disabled = state.sprint === 1;
    element("next-sprint").disabled = state.sprint === 13;
    element("track-headings").replaceChildren(textNode("span", ""), ...state.profile.tracks.map((track) => {
      const heading = textNode("span", track);
      heading.title = track;
      return heading;
    }));
    element("week-grid").replaceChildren(...state.days.map((day) => {
      const row = textNode("div", "", `grid-row${day.is_today ? " today" : ""}`);
      const label = textNode("span", "", "day");
      label.append(textNode("b", day.label), textNode("small", day.day));
      if (day.is_today) label.append(textNode("em", "Today"));
      row.append(label);
      state.profile.tracks.forEach((track, index) => {
        const status = day.values ? (day.values[index] ? "yes" : "no") : (day.missed ? "missed" : "");
        const cell = textNode("span", "", `cell ${status}`);
        cell.setAttribute("role", "img");
        cell.setAttribute("aria-label", `${day.date}, ${track}: ${status || "not submitted"}`);
        row.append(cell);
      });
      return row;
    }));
    element("run-timezone").textContent = `Days lock at midnight in ${state.profile.timezone}.`;
    const button = element("pages-checkin-open");
    button.disabled = !state.can_checkin;
    button.classList.toggle("done", !state.can_checkin);
    button.textContent = state.can_checkin ? "CHECK IN" : state.checked_in_today ? "KEPT FOR TODAY" :
      state.today < state.cohort_start ? "CHECK-IN OPENS OCT 2" : "THIS RUN HAS ENDED";
  }
  async function loadState() {
    const version = ++stateVersion;
    const signedInVersion = authVersion;
    const sprint = new URL(location.href).searchParams.get("sprint");
    const data = await api(`/api/state${sprint === null ? "" : `?sprint=${encodeURIComponent(sprint)}`}`);
    if (version !== stateVersion || signedInVersion !== authVersion || !client.user) return;
    state = data;
    if (!state.paid) {
      element("checkout-link").hidden = !state.checkout_url;
      element("checkout-unavailable").hidden = Boolean(state.checkout_url);
      if (state.checkout_url) element("checkout-link").href = state.checkout_url;
      view("paywall");
    } else if (!state.profile.goal_locked) {
      view("setup");
    } else {
      renderRun();
      view("run");
    }
  }
  async function updateAuth(user) {
    const version = ++authVersion;
    state = undefined;
    dialog.close();
    element("sign-out").hidden = !user;
    if (!user) { view("sign-in"); return; }
    clearError();
    view("loading");
    try {
      await api("/api/session", {});
      if (version === authVersion) await loadState();
    } catch (error) {
      if (version === authVersion) { view("sign-in"); showError(error); }
    }
  }
  signIn.addEventListener("click", async () => {
    clearError(); signIn.disabled = true; signIn.textContent = "Signing in…";
    let timeout;
    try {
      await Promise.race([client.signIn(), new Promise((resolve, reject) => {
        timeout = setTimeout(() => reject(Object.assign(new Error(), { code: "auth/popup-timeout" })), 45000);
      })]);
    } catch (error) { showError(error); }
    finally { clearTimeout(timeout); signIn.disabled = false; signIn.textContent = "Continue with Google"; }
  });
  element("sign-out").addEventListener("click", () => client.signOut().catch(showError));
  element("refresh-purchase").addEventListener("click", () => { clearError(); loadState().catch(showError); });
  element("pages-setup-form").addEventListener("submit", async (event) => {
    event.preventDefault(); clearError();
    const form = event.currentTarget;
    const button = form.querySelector("button[type=submit]");
    const data = new FormData(form);
    button.disabled = true;
    try {
      await api("/api/setup", { goal: data.get("goal"), tracks: [1,2,3].map((i) => data.get(`track${i}`)),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Kolkata" });
      await loadState();
    } catch (error) { showError(error); }
    finally { button.disabled = false; }
  });
  function changeSprint(delta) {
    if (!state) return;
    const url = new URL(location.href);
    url.searchParams.set("sprint", state.sprint - 1 + delta);
    history.pushState(null, "", url);
    clearError(); loadState().catch(showError);
  }
  element("previous-sprint").addEventListener("click", () => changeSprint(-1));
  element("next-sprint").addEventListener("click", () => changeSprint(1));
  window.addEventListener("popstate", () => { if (client.user) loadState().catch(showError); });
  element("pages-checkin-open").addEventListener("click", () => {
    if (!state?.can_checkin) return;
    values = [null, null, null]; submit.disabled = true;
    element("checkin-questions").replaceChildren(...state.profile.tracks.map((track, index) => {
      const field = textNode("fieldset", "");
      field.append(textNode("legend", track));
      [true, false].forEach((value) => {
        const button = textNode("button", value ? "YES" : "NO");
        button.type = "button"; button.dataset.value = value; button.setAttribute("aria-pressed", "false");
        button.addEventListener("click", () => {
          values[index] = value;
          field.querySelectorAll("button").forEach((choice) => {
            const selected = choice === button;
            choice.classList.toggle("selected", selected);
            choice.setAttribute("aria-pressed", String(selected));
          });
          submit.disabled = values.some((item) => item === null);
        });
        field.append(button);
      });
      return field;
    }));
    dialog.showModal();
  });
  element("pages-cancel-checkin").addEventListener("click", () => dialog.close());
  element("pages-checkin-form").addEventListener("submit", async (event) => {
    event.preventDefault(); clearError(); submit.disabled = true;
    try { await api("/api/checkin", { values }); dialog.close(); await loadState(); }
    catch (error) {
      if (error.code === "checkin_already_locked") { dialog.close(); await loadState().catch(showError); }
      showError(error); submit.disabled = false;
    }
  });
  return { updateAuth, showError };
}
