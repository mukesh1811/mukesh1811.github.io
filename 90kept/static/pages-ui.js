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
  let paymentRefresh;

  function mountPaymentButton(buttonId) {
    const form = element("razorpay-checkout");
    form.hidden = false;
    if (form.dataset.buttonId === buttonId) return;
    form.replaceChildren();
    form.dataset.buttonId = buttonId;
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/payment-button.js";
    script.dataset.payment_button_id = buttonId;
    script.async = true;
    const status = element("payment-button-status");
    status.hidden = false;
    status.textContent = "Loading secure checkout…";
    script.onload = () => { status.hidden = true; };
    script.onerror = () => {
      delete form.dataset.buttonId;
      form.hidden = true;
      status.textContent = "Razorpay couldn't load. Check your connection and try again.";
      const retry = element("checkout-unavailable");
      retry.hidden = false;
      retry.disabled = false;
      retry.textContent = "Retry payment button";
    };
    form.append(script);
  }

  function view(name) {
    views.forEach((id) => { element(`${id}-view`).hidden = id !== name; });
  }
  function clearError() { element("status-message").hidden = true; }
  function showError(error) {
    if (error.code === "auth/popup-closed-by-user") return;
    const messages = {
      unauthorized: "Please sign in again.", invalid_token: "Your sign-in expired. Sign out and sign in again.",
      goal_already_locked: "Your goal is already locked. Refresh to see your run.",
      goal_and_three_tracks_required: "Enter your goal and all three daily actions. Each field needs more than spaces.",
      invalid_timezone: "Your browser's timezone couldn't be recognized. Refresh and try again.",
      checkin_already_locked: "Today's check-in is already locked.",
      outside_cohort: "Check-ins are open October 2 through December 31, 2026.",
      payment_required: "Purchase access before starting your run.",
      invalid_order_id: "Enter the purchase ID exactly as shown on your payment receipt.",
      payment_claim_pending: "Your purchase is already awaiting verification.",
      checkout_unavailable: "Checkout isn't available yet. Please try again later.",
      purchase_email_required: "Sign in with the Google email you used to pay.",
      setup_required: "Save your goal before submitting a purchase.",
      invalid_sprint: "That sprint is unavailable. Choose a sprint from 1 to 13.",
      "auth/popup-blocked": "Open 90KEPT in Chrome or Safari to sign in.",
      "auth/network-request-failed": "Check your connection and try again.",
      "auth/user-token-expired": "Your sign-in expired. Sign in again to continue.",
      "auth/user-not-found": "Your account was removed. Sign in again to start fresh.",
      "auth/user-disabled": "This account is disabled. Contact mukesh1811@gmail.com for help.",
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
    clearTimeout(paymentRefresh);
    const version = ++stateVersion;
    const signedInVersion = authVersion;
    const sprint = new URL(location.href).searchParams.get("sprint");
    const data = await api(`/api/state${sprint === null ? "" : `?sprint=${encodeURIComponent(sprint)}`}`);
    if (version !== stateVersion || signedInVersion !== authVersion || !client.user) return;
    state = data;
    if (!state.profile.goal_locked) {
      view("setup");
    } else if (!state.paid) {
      element("payment-goal").textContent = state.profile.goal;
      element("payment-tracks").textContent = state.profile.tracks.join(" · ");
      element("razorpay-checkout").hidden = true;
      element("payment-button-status").hidden = true;
      element("checkout-link").hidden = !state.checkout_url || Boolean(state.payment_button_id);
      const unavailable = element("checkout-unavailable");
      unavailable.hidden = Boolean(state.checkout_url || state.payment_button_id);
      unavailable.disabled = true;
      unavailable.textContent = "Checkout opening soon";
      if (state.checkout_url) element("checkout-link").href = state.checkout_url;
      const hosted = ["stck", "razorpay"].includes(state.payment_provider) && Boolean(state.checkout_url);
      const razorpay = state.payment_provider === "razorpay";
      const providerName = razorpay ? "Razorpay" : "Stck";
      const pending = hosted && state.payment_claim?.status === "pending";
      element("payment-price").textContent = state.price.label;
      element("payment-compare-price").hidden = !state.price.compare_label;
      element("payment-compare-price").textContent = state.price.compare_label || "";
      element("checkout-link").textContent = `Pay ${state.price.label}${hosted ? ` on ${providerName}` : " and start"}`;
      element("stck-purchase").hidden = !hosted;
      element("purchase-provider").textContent = providerName;
      element("payment-reference-label").textContent = razorpay ? "Razorpay payment ID" : "Stck order ID";
      element("stck-order-id").pattern = razorpay ? "pay_[A-Za-z0-9]{8,40}" : "[A-Za-z0-9][A-Za-z0-9._:\\-]{2,119}";
      element("stck-order-id").placeholder = razorpay ? "pay_… from your Razorpay receipt" : "From your payment receipt";
      element("purchase-email").textContent = state.user.email;
      element("stck-order-id").disabled = pending;
      element("submit-stck-claim").disabled = pending;
      element("submit-stck-claim").textContent = pending ? "Awaiting verification" : "Submit purchase for verification";
      element("stck-claim-status").textContent = pending ? `Order ${state.payment_claim.order_id} is saved. We're verifying your purchase.` :
        state.payment_claim?.status === "rejected" ? "We couldn't verify that purchase. Check your order ID and payment email, then submit again. For help, contact mukesh1811@gmail.com." : "";
      if (pending) {
        element("stck-order-id").value = state.payment_claim.order_id;
        element("checkout-link").hidden = true;
        paymentRefresh = setTimeout(() => {
          if (!document.hidden && client.user) loadState().catch(showError);
        }, 30000);
      } else if (razorpay && state.payment_button_id) {
        mountPaymentButton(state.payment_button_id);
      }
      view("paywall");
    } else {
      renderRun();
      view("run");
    }
  }
  async function updateAuth(user) {
    clearTimeout(paymentRefresh);
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
  element("razorpay-checkout").addEventListener("submit", (event) => event.preventDefault());
  element("checkout-unavailable").addEventListener("click", () => {
    if (state?.payment_button_id) {
      element("checkout-unavailable").hidden = true;
      mountPaymentButton(state.payment_button_id);
    }
  });
  element("refresh-purchase").addEventListener("click", () => { clearError(); loadState().catch(showError); });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && client.user && state?.profile.goal_locked && !state.paid) loadState().catch(showError);
  });
  element("stck-claim-form").addEventListener("submit", async (event) => {
    event.preventDefault(); clearError();
    const button = element("submit-stck-claim");
    button.disabled = true;
    try {
      await api(`/api/payments/${state.payment_provider}/claim`, { order_id: new FormData(event.currentTarget).get("order_id") });
      await loadState();
    } catch (error) { button.disabled = false; showError(error); }
  });
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
