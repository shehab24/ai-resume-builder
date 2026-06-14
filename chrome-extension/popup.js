// popup.js — TalentFlow Auto-Applier Extension Popup

const APP_BASE = "http://localhost:3000"; // Change to production URL before release

// ── DOM refs ──────────────────────────────────────────────────────────────────
const stateDisconnected = document.getElementById("state-disconnected");
const stateConnected    = document.getElementById("state-connected");
const signupBtn         = document.getElementById("signup-btn");
const loginBtn          = document.getElementById("login-btn");
const connectLink       = document.getElementById("connect-link");
const applyBtn          = document.getElementById("apply-btn");
const disconnectBtn     = document.getElementById("disconnect-btn");
const dashboardLink     = document.getElementById("dashboard-link");
const userName          = document.getElementById("user-name");
const userEmail         = document.getElementById("user-email");
const userAvatar        = document.getElementById("user-avatar");
const avatarPlaceholder = document.getElementById("avatar-placeholder");
const pageStatusCard    = document.getElementById("page-status-card");
const pageStatusText    = document.getElementById("page-status-text");
const statToday         = document.getElementById("stat-today");
const statTotal         = document.getElementById("stat-total");
const toast             = document.getElementById("toast");

// ── Toast helper ──────────────────────────────────────────────────────────────
function showToast(msg, type = "info", duration = 3000) {
  toast.textContent = msg;
  toast.className = `show ${type}`;
  setTimeout(() => { toast.className = ""; }, duration);
}

// ── Open auth page ────────────────────────────────────────────────────────────
function openAuthPage(path = "/extension/auth") {
  chrome.tabs.create({ url: `${APP_BASE}${path}` });
  window.close();
}

signupBtn.addEventListener("click", () => openAuthPage("/sign-up"));
loginBtn.addEventListener("click", () => openAuthPage("/extension/auth"));
connectLink.addEventListener("click", (e) => { e.preventDefault(); openAuthPage("/extension/auth"); });

// ── Load saved session ────────────────────────────────────────────────────────
async function loadSession() {
  const data = await chrome.storage.local.get(["tf_token", "tf_user", "tf_stats"]);

  if (!data.tf_token || !data.tf_user) {
    showDisconnected();
    return;
  }

  showConnected(data.tf_user, data.tf_stats || { today: 0, total: 0 });
  await checkCurrentPage();
}

// ── UI: Disconnected ──────────────────────────────────────────────────────────
function showDisconnected() {
  stateDisconnected.style.display = "flex";
  stateConnected.style.display = "none";
  disconnectBtn.style.display = "none";
  dashboardLink.href = APP_BASE + "/dashboard/job-seeker/auto-apply";
}

// ── UI: Connected ─────────────────────────────────────────────────────────────
function showConnected(user, stats) {
  stateDisconnected.style.display = "none";
  stateConnected.style.display = "flex";
  disconnectBtn.style.display = "block";
  dashboardLink.href = APP_BASE + "/dashboard/job-seeker/auto-apply";

  userName.textContent  = user.name  || "TalentFlow User";
  userEmail.textContent = user.email || "";

  if (user.photoUrl) {
    userAvatar.src = user.photoUrl;
    userAvatar.style.display = "block";
    avatarPlaceholder.style.display = "none";
  } else {
    avatarPlaceholder.textContent = (user.name || "U")[0].toUpperCase();
  }

  statToday.textContent = stats.today || 0;
  statTotal.textContent = stats.total || 0;
}

// ── Check if current tab is a job page ───────────────────────────────────────
const JOB_PATTERNS = [
  /linkedin\.com\/jobs\//,
  /indeed\.com\/(viewjob|apply)/,
  /glassdoor\.com\/(job-listing|partner\/jobListing)/,
  /bdjobs\.com\/jobdetails\//,
];

async function checkCurrentPage() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url || "";

  const isJobPage = JOB_PATTERNS.some(p => p.test(url));

  if (isJobPage) {
    pageStatusText.textContent = "✓ Job page detected — ready to auto apply!";
    pageStatusCard.style.background = "#f0fdf4";
    pageStatusCard.style.borderColor = "#86efac";
    applyBtn.disabled = false;
  } else {
    pageStatusText.textContent = "Navigate to a job listing on LinkedIn, Indeed, Glassdoor, or Bdjobs to auto apply.";
    pageStatusCard.style.background = "#fffbeb";
    pageStatusCard.style.borderColor = "#fde68a";
    applyBtn.disabled = true;
  }
}

// ── Auto Apply Button ─────────────────────────────────────────────────────────
applyBtn.addEventListener("click", async () => {
  const data = await chrome.storage.local.get(["tf_token"]);
  if (!data.tf_token) { showToast("Not connected!", "error"); return; }

  applyBtn.disabled = true;
  applyBtn.innerHTML = '<span class="spin">⚡</span> Applying…';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // Send message to content script
  chrome.tabs.sendMessage(tab.id, { type: "TALENTFLOW_AUTO_APPLY", token: data.tf_token }, (response) => {
    if (chrome.runtime.lastError || !response) {
      showToast("Could not reach the page. Please refresh and try again.", "error");
      applyBtn.disabled = false;
      applyBtn.innerHTML = "⚡ Auto Apply";
      return;
    }

    if (response.success) {
      showToast(`✓ Applied to ${response.jobTitle || "job"}!`, "success");
      // Update stats
      chrome.storage.local.get(["tf_stats"], (d) => {
        const s = d.tf_stats || { today: 0, total: 0 };
        s.today = (s.today || 0) + 1;
        s.total = (s.total || 0) + 1;
        chrome.storage.local.set({ tf_stats: s });
        statToday.textContent = s.today;
        statTotal.textContent = s.total;
      });
    } else {
      showToast(response.error || "Could not auto-apply on this page.", "error", 4000);
    }

    applyBtn.disabled = false;
    applyBtn.innerHTML = "⚡ Auto Apply";
  });
});

// ── Disconnect ────────────────────────────────────────────────────────────────
disconnectBtn.addEventListener("click", async () => {
  const data = await chrome.storage.local.get(["tf_token"]);
  if (data.tf_token) {
    // Call disconnect API
    fetch(`${APP_BASE}/api/extension/token`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${data.tf_token}` }
    }).catch(() => {});
  }
  await chrome.storage.local.remove(["tf_token", "tf_user", "tf_stats"]);
  showDisconnected();
  showToast("Disconnected from TalentFlow", "info");
});

// ── Init ──────────────────────────────────────────────────────────────────────
loadSession();
