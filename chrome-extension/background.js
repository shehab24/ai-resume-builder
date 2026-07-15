// background.js — TalentFlow Auto-Applier Service Worker (Bot Mode)
// Extension polls the platform queue, opens job URLs, applies, and reports back.

const APP_BASE = "http://localhost:3000"; // ← Change to production URL before release
const POLL_INTERVAL_MS = 5000; // Poll every 5 seconds

// ── Listen for TALENTFLOW_AUTH postMessage from /extension/auth page ──────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "TALENTFLOW_AUTH") {
    const { token, userId, name, email, photoUrl, expiresAt } = message;
    if (!token) return;

    chrome.storage.local.set({
      tf_token: token,
      tf_user: { userId, name, email, photoUrl, expiresAt },
      tf_stats: { today: 0, total: 0 },
    });

    console.log("[TalentFlow] Extension connected for:", email);
    sendResponse({ ok: true });
  }

  if (message.type === "TALENTFLOW_CHECK_AUTH") {
    chrome.storage.local.get(["tf_token", "tf_user"], (data) => {
      let token = data.tf_token || null;
      if (token && data.tf_user?.expiresAt) {
        if (new Date(data.tf_user.expiresAt) < new Date()) {
          chrome.storage.local.remove(["tf_token", "tf_user", "tf_stats"]);
          token = null;
        }
      }
      sendResponse({ token });
    });
    return true; // async
  }

  if (message.type === "TALENTFLOW_GET_LINKEDIN_PROFILE") {
    // Check if there is an existing tab on linkedin.com
    chrome.tabs.query({ url: "*://*.linkedin.com/*" }, (tabs) => {
      // 1. See if a profile tab is already open
      const profileTab = tabs.find(t => t.url && t.url.includes("linkedin.com/in/") && !t.url.endsWith("/in/") && !t.url.endsWith("/in") && !t.url.endsWith("/me"));
      if (profileTab && profileTab.url) {
        console.log("[TalentFlow] Found open LinkedIn profile tab:", profileTab.url);
        sendResponse({ success: true, profileUrl: profileTab.url });
      } else {
        // 2. Otherwise use the redirect detection tab
        fetchLinkedInFromNewTab(sendResponse);
      }
    });
    return true; // async
  }

  if (message.type === "TALENTFLOW_LOGOUT") {
    chrome.storage.local.remove(["tf_token", "tf_user", "tf_stats"]);
    console.log("[TalentFlow] Extension logged out");
    sendResponse({ ok: true });
  }
});

function fetchLinkedInFromNewTab(sendResponse) {
  console.log("[TalentFlow] Opening profile redirect tab...");
  chrome.tabs.create({ url: "https://www.linkedin.com/in/", active: false }, (tab) => {
    let attempts = 0;
    const checkInterval = setInterval(() => {
      attempts++;
      if (attempts > 15) {
        clearInterval(checkInterval);
        chrome.tabs.remove(tab.id).catch(() => {});
        sendResponse({ success: false, error: "Could not retrieve LinkedIn profile automatically. Please make sure you are logged in." });
        return;
      }
      chrome.tabs.get(tab.id, (currentTab) => {
        if (!currentTab) { clearInterval(checkInterval); return; }
        
        const url = currentTab.url || "";
        console.log(`[TalentFlow] Redirect check attempt ${attempts}: ${url}`);

        if (url.includes("linkedin.com/login") || url.includes("linkedin.com/signup")) {
          clearInterval(checkInterval);
          chrome.tabs.remove(tab.id).catch(() => {});
          sendResponse({ success: false, error: "Please log in to LinkedIn first." });
          return;
        }

        const cleanUrl = url.replace(/\/$/, "");
        if (currentTab.status === "complete" && cleanUrl.includes("/in/") && !cleanUrl.endsWith("/in") && !cleanUrl.endsWith("/me")) {
          clearInterval(checkInterval);
          chrome.tabs.remove(tab.id).catch(() => {});
          console.log("[TalentFlow] Retrieved profile URL via redirect:", url);
          sendResponse({ success: true, profileUrl: url });
        }
      });
    }, 1000);
  });
}

// ── Tab update bridge: capture postMessage on the auth page ──────────────────
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== "complete") return;
  if (!tab.url) return;

  if (tab.url.startsWith(`${APP_BASE}/extension/auth`)) {
    chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        window.addEventListener("message", (e) => {
          if (e.data?.type === "TALENTFLOW_AUTH") {
            chrome.runtime.sendMessage(e.data).catch(() => {});
          }
        });
      },
    }).catch(() => {});
  }
});

// ── Re-inject content.js into existing app tabs on install/reload/startup ─────
// When the extension is reloaded from chrome://extensions, any open tabs lose
// their content script connection (orphaned). This re-injects content.js so
// the ping/pong detection works without requiring a manual page refresh.
function reinjectContentScriptIntoAppTabs() {
  chrome.tabs.query({ url: [`${APP_BASE}/*`] }, (tabs) => {
    for (const tab of tabs) {
      if (!tab.id) continue;
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      }).catch(() => {}); // Silently ignore if tab doesn't allow injection
    }
  });
}

chrome.runtime.onInstalled.addListener(reinjectContentScriptIntoAppTabs);
chrome.runtime.onStartup.addListener(reinjectContentScriptIntoAppTabs);

// ── Bot: Poll for queued jobs and process them ────────────────────────────────
let isProcessing = false;

async function pollAndProcess() {
  try {
    const { tf_token, tf_user } = await chrome.storage.local.get(["tf_token", "tf_user"]);
    if (!tf_token) return;

    if (tf_user?.expiresAt && new Date(tf_user.expiresAt) < new Date()) {
      console.warn("[TalentFlow Bot] Token expired. Logging out extension.");
      chrome.storage.local.remove(["tf_token", "tf_user", "tf_stats"]);
      return;
    }

    const res = await fetch(`${APP_BASE}/api/extension/queue`, {
      headers: { Authorization: `Bearer ${tf_token}` },
    });

    if (res.status === 401 || res.status === 403) {
      console.warn("[TalentFlow Bot] Token rejected by server (401/403). Logging out extension.");
      chrome.storage.local.remove(["tf_token", "tf_user", "tf_stats"]);
      return;
    }

    if (!res.ok) return;

    const jobs = await res.json();
    if (!Array.isArray(jobs) || jobs.length === 0) return;

    console.log(`[TalentFlow Bot] ${jobs.length} job(s) in queue`);

    for (const job of jobs) {
      if (isProcessing) break; // Only one at a time
      await processQueuedJob(job, tf_token);
    }
  } catch (err) {
    console.error("[TalentFlow Bot] Poll error:", err);
  }
}

async function processQueuedJob(job, token) {
  isProcessing = true;
  console.log(`[TalentFlow Bot] Processing: ${job.jobTitle} @ ${job.jobUrl}`);

  // 1. Mark as PROCESSING
  await updateJobStatus(token, job.id, "PROCESSING");

  // 2. Open the job URL in a background tab
  let tab;
  try {
    tab = await chrome.tabs.create({ url: job.jobUrl, active: false });
  } catch (err) {
    await updateJobStatus(token, job.id, "FAILED", `Could not open URL: ${err.message}`);
    isProcessing = false;
    return;
  }

  // 3. Wait for the tab to fully load (up to 20 seconds)
  try {
    await waitForTabLoad(tab.id, 20000);
  } catch {
    await updateJobStatus(token, job.id, "FAILED", "Page took too long to load");
    chrome.tabs.remove(tab.id).catch(() => {});
    isProcessing = false;
    return;
  }

  // 4. Fetch candidate profile in background context (bypasses webpage CSP/CORS)
  let profile;
  try {
    const profRes = await fetch(`${APP_BASE}/api/extension/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (profRes.status === 401 || profRes.status === 403) {
      chrome.storage.local.remove(["tf_token", "tf_user", "tf_stats"]);
      throw new Error("Could not load candidate profile: token expired/unauthorized");
    }
    if (!profRes.ok) throw new Error("Could not load candidate profile");
    profile = await profRes.json();
  } catch (err) {
    await updateJobStatus(token, job.id, "FAILED", `Profile fetch error: ${err.message}`);
    chrome.tabs.remove(tab.id).catch(() => {});
    isProcessing = false;
    return;
  }

  // 5. Small extra wait for JS-heavy SPAs to settle
  await delay(2000);

  // 6. Trigger auto-apply via content script injection
  let site = "other";
  try {
    const urlObj = new URL(job.jobUrl);
    const host = urlObj.hostname;
    if (host.includes("linkedin"))  site = "linkedin";
    else if (host.includes("indeed"))    site = "indeed";
    else if (host.includes("glassdoor")) site = "glassdoor";
    else if (host.includes("bdjobs"))    site = "bdjobs";
  } catch (e) {
    console.error("[TalentFlow Bot] Invalid job URL:", job.jobUrl);
  }

  let result;
  try {
    if (site !== "other") {
      const responses = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (profile, jobData) => {
        // This runs IN the job page context with access to loaded profile
        return new Promise(async (resolve) => {
          try {
            // Detect site
            const host = window.location.hostname;
            let site = "other";
            if (host.includes("linkedin"))  site = "linkedin";
            if (host.includes("indeed"))    site = "indeed";
            if (host.includes("glassdoor")) site = "glassdoor";
            if (host.includes("bdjobs"))    site = "bdjobs";

            // ── Helpers ─────────────────────────────────────────────────────
            const delay = (ms) => new Promise(r => setTimeout(r, ms));

            function fillField(selector, value) {
              const el = document.querySelector(selector);
              if (!el || !value) return false;
              const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set
                          || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
              if (setter) setter.call(el, value);
              el.dispatchEvent(new Event("input", { bubbles: true }));
              el.dispatchEvent(new Event("change", { bubbles: true }));
              return true;
            }

            function fillAny(selectors, value) {
              for (const s of selectors) { if (fillField(s, value)) return true; }
              return false;
            }

            // ── LinkedIn Easy Apply ──────────────────────────────────────────
            async function applyLinkedIn() {
              // Check for external apply link first
              const extBtn = document.querySelector('a.jobs-apply-button, a[aria-label*="Apply on company"], a[aria-label*="Apply on recruiter"], .jobs-s-apply a');
              if (extBtn && extBtn.href) {
                let url = extBtn.href;
                if (url.includes("safety/go")) {
                  try {
                    const uObj = new URL(url);
                    url = uObj.searchParams.get("url") || url;
                  } catch (e) {}
                }
                resolve({ success: true, redirectUrl: url });
                return;
              }

              const btn = document.querySelector('button.jobs-apply-button, .jobs-s-apply button');
              if (!btn) {
                resolve({ success: false, error: "No Easy Apply button found" });
                return;
              }

              // If the button is not Easy Apply, it's external
              const btnText = (btn.textContent || "").trim().toLowerCase();
              if (!btnText.includes("easy apply")) {
                const parentLink = btn.closest('a') || btn.querySelector('a');
                if (parentLink && parentLink.href) {
                  resolve({ success: true, redirectUrl: parentLink.href });
                  return;
                }
                // Try finding any redirect url
                const anyExtLink = document.querySelector('a[href*="linkedin.com/jobs/view/externalApply"]');
                if (anyExtLink && anyExtLink.href) {
                  resolve({ success: true, redirectUrl: anyExtLink.href });
                  return;
                }
                resolve({ success: false, error: "No Easy Apply button found (External Job)" });
                return;
              }

              btn.click();
              await delay(2000);

              const title = document.querySelector("h1.job-details-jobs-unified-top-card__job-title")?.textContent?.trim() || jobData.jobTitle;
              const company = document.querySelector(".job-details-jobs-unified-top-card__company-name")?.textContent?.trim() || jobData.company || "";

              for (let step = 0; step < 12; step++) {
                await delay(1000);

                document.querySelectorAll("input[type='text'], input[type='tel'], textarea").forEach(input => {
                  const lbl = (input.getAttribute("aria-label") || input.placeholder || "").toLowerCase();
                  if (lbl.includes("first name")) fillField(`#${input.id}`, profile.name?.split(" ")[0]);
                  if (lbl.includes("last name"))  fillField(`#${input.id}`, profile.name?.split(" ").slice(1).join(" ") || "");
                  if (lbl.includes("email"))      fillField(`#${input.id}`, profile.email);
                  if (lbl.includes("phone"))      fillField(`#${input.id}`, profile.phone);
                  if (lbl.includes("linkedin"))   fillField(`#${input.id}`, profile.linkedinUrl);
                  if (lbl.includes("website") || lbl.includes("portfolio")) fillField(`#${input.id}`, profile.portfolioUrl);
                  if (lbl.includes("city") || lbl.includes("location")) fillField(`#${input.id}`, profile.location);
                  if (lbl.includes("year") && lbl.includes("experience")) fillField(`#${input.id}`, String(profile.yearsOfExperience || 0));
                });

                document.querySelectorAll("textarea").forEach(ta => {
                  const lbl = (ta.getAttribute("aria-label") || ta.placeholder || "").toLowerCase();
                  if ((lbl.includes("cover") || lbl.includes("additional")) && !ta.value) {
                    fillField(`textarea[aria-label="${ta.getAttribute("aria-label")}"]`, profile.summary);
                  }
                });

                // Yes/No radio — prefer "Yes"
                document.querySelectorAll('input[type="radio"]').forEach(r => {
                  if ((r.value || "").toLowerCase() === "yes") {
                    if (!document.querySelector(`input[name="${r.name}"]:checked`)) r.click();
                  }
                });

                const submitBtn = document.querySelector('button[aria-label="Submit application"]');
                if (submitBtn) { submitBtn.click(); await delay(1000); break; }

                const nextBtn = document.querySelector('button[aria-label="Continue to next step"], button[aria-label="Review"], .artdeco-button--primary');
                if (nextBtn) { nextBtn.click(); }
                else break;
              }

              resolve({ success: true, jobTitle: title, company });
            }

            // ── Indeed Quick Apply ───────────────────────────────────────────
            async function applyIndeed() {
              // Check for external apply link
              const extBtn = document.querySelector('a.jobsearch-CallToApply-button, a[href*="apply"], [data-testid="indeed-apply-button"] a');
              if (extBtn && extBtn.href) {
                resolve({ success: true, redirectUrl: extBtn.href });
                return;
              }

              const btn = document.querySelector('button#indeedApplyButton, .ia-IndeedApplyButton, [data-testid="ia-IndeedApplyButton"]');
              if (!btn) { resolve({ success: false, error: "No Apply button found" }); return; }
              btn.click();
              await delay(2000);

              const title = document.querySelector('[data-testid="jobTitle"], .jobsearch-JobInfoHeader-title')?.textContent?.trim() || jobData.jobTitle;
              const company = document.querySelector('[data-testid="inlineHeader-companyName"]')?.textContent?.trim() || jobData.company || "";

              for (let step = 0; step < 8; step++) {
                await delay(1000);
                fillAny(['input[name="applicant.name"]', 'input[name="name"]'], profile.name);
                fillAny(['input[name="applicant.phoneNumber"]', 'input[type="tel"]'], profile.phone);
                fillAny(['input[name="applicant.email"]', 'input[type="email"]'], profile.email);

                document.querySelectorAll("textarea").forEach(ta => {
                  if (!ta.value) fillField(`textarea[name="${ta.name}"]`, profile.summary);
                });

                document.querySelectorAll('input[type="radio"]').forEach(r => {
                  if ((r.value || "").toLowerCase() === "yes" && !document.querySelector(`input[name="${r.name}"]:checked`)) r.click();
                });

                const contBtn = document.querySelector('[data-testid="ia-continueButton"], button[type="submit"]');
                if (!contBtn) break;
                contBtn.click();
              }

              resolve({ success: true, jobTitle: title, company });
            }

            // ── Glassdoor ────────────────────────────────────────────────────
            async function applyGlassdoor() {
              const btn = document.querySelector('[data-test="easyApply-button"], .EasyApplyButton');
              if (!btn) { resolve({ success: false, error: "No Easy Apply button found" }); return; }
              btn.click();
              await delay(2000);

              const title = document.querySelector('[data-test="job-title"]')?.textContent?.trim() || jobData.jobTitle;
              const company = document.querySelector('[data-test="employer-name"]')?.textContent?.trim() || jobData.company || "";

              for (let step = 0; step < 8; step++) {
                await delay(1000);
                fillAny(['input[id*="FirstName"]', 'input[name*="firstName"]'], profile.name?.split(" ")[0]);
                fillAny(['input[id*="LastName"]', 'input[name*="lastName"]'], profile.name?.split(" ").slice(1).join(" ") || "");
                fillAny(['input[id*="Email"]', 'input[type="email"]'], profile.email);
                fillAny(['input[id*="Phone"]', 'input[type="tel"]'], profile.phone);

                const nextBtn = document.querySelector('[data-test="continue-btn"], button[type="submit"]');
                if (!nextBtn) break;
                nextBtn.click();
              }

              resolve({ success: true, jobTitle: title, company });
            }

            // ── Bdjobs ───────────────────────────────────────────────────────
            async function applyBdjobs() {
              const btn = document.querySelector('#btnApply, .apply-btn, button.apply');
              if (!btn) { resolve({ success: false, error: "No Apply button found" }); return; }
              btn.click();
              await delay(2000);

              const title = document.querySelector('.job-title-text, h1.title')?.textContent?.trim() || jobData.jobTitle;
              const company = document.querySelector('.company-name')?.textContent?.trim() || jobData.company || "";

              fillAny(['input[name="name"]', '#name'], profile.name);
              fillAny(['input[name="email"]', '#email', 'input[type="email"]'], profile.email);
              fillAny(['input[name="phone"]', '#phone', 'input[type="tel"]'], profile.phone);
              fillAny(['textarea[name="cover_letter"]', '#cover_letter'], profile.summary);

              await delay(600);
              const submitBtn = document.querySelector('button[type="submit"], #btnSubmit');
              if (submitBtn) submitBtn.click();

              resolve({ success: true, jobTitle: title, company });
            }

            // Run site-specific apply
            if (site === "linkedin")       await applyLinkedIn();
            else if (site === "indeed")    await applyIndeed();
            else if (site === "glassdoor") await applyGlassdoor();
            else if (site === "bdjobs")    await applyBdjobs();
            else                           resolve({ success: true, redirectUrl: window.location.href });

          } catch (err) {
            resolve({ success: false, error: err.message || String(err) });
          }
        });
      },
      args: [profile, { jobTitle: job.jobTitle, company: job.company }],
    });

    result = responses?.[0]?.result;
    if (result && result.success && !result.redirectUrl) {
      result.submitted = true;
    }
    }
  } catch (err) {
    result = { success: false, error: `Script injection failed: ${err.message}` };
  }

  // If we are on an unrecognized/generic site from the start, or if site-specific script returned a redirectUrl:
  if (site === "other" || (result?.success && result.redirectUrl)) {
    const extUrl = result?.redirectUrl;
    let ok = true;
    if (extUrl) {
      console.log(`[TalentFlow Bot] External Apply detected. Navigating to: ${extUrl}`);
      try {
        await chrome.tabs.update(tab.id, { url: extUrl });
        await waitForTabLoad(tab.id, 25000);
        await delay(3000);
      } catch (err) {
        result = { success: false, error: `Navigation to external page failed: ${err.message}` };
        ok = false;
      }
    }

    site = "other";

    if (ok) {
      try {
        // ── STEP A: Snapshot the page's form fields ──────────────────────────
        const snapshotResponses = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            function getLabel(el) {
              if (el.id) {
                const lbl = document.querySelector(`label[for="${el.id}"]`);
                if (lbl) return lbl.textContent?.trim() || "";
              }
              const parentLbl = el.closest("label");
              if (parentLbl) return parentLbl.textContent?.trim() || "";
              return el.getAttribute("aria-label") || el.placeholder || el.name || "";
            }

            function buildSelector(el) {
              if (el.id) return `#${CSS.escape(el.id)}`;
              if (el.name) return `${el.tagName.toLowerCase()}[name="${CSS.escape(el.name)}"]`;
              // Fallback: nth-child path
              const idx = Array.from(el.parentElement?.children || []).indexOf(el) + 1;
              return `${el.tagName.toLowerCase()}:nth-child(${idx})`;
            }

            const fields = [];

            // Text-like inputs
            const textInputs = document.querySelectorAll(
              "input[type='text'], input[type='email'], input[type='tel'], input[type='url'], input[type='number'], input[type='search'], textarea"
            );
            for (const el of textInputs) {
              const rect = el.getBoundingClientRect();
              if (rect.width === 0 || rect.height === 0) continue;
              fields.push({
                selector: buildSelector(el),
                type: el.tagName === "TEXTAREA" ? "textarea" : (el.type || "text"),
                label: getLabel(el),
                placeholder: el.placeholder || "",
                name: el.name || "",
                id: el.id || "",
                required: el.required || el.getAttribute("aria-required") === "true",
                currentValue: el.value || "",
              });
            }

            // Selects
            const selects = document.querySelectorAll("select");
            for (const el of selects) {
              const rect = el.getBoundingClientRect();
              if (rect.width === 0 || rect.height === 0) continue;
              const options = Array.from(el.options).map(o => o.text.trim()).filter(Boolean);
              fields.push({
                selector: buildSelector(el),
                type: "select",
                label: getLabel(el),
                name: el.name || "",
                id: el.id || "",
                required: el.required || el.getAttribute("aria-required") === "true",
                options,
                currentValue: el.value || "",
              });
            }

            // Radios — group by name
            const radioGroups = {};
            for (const el of document.querySelectorAll("input[type='radio']")) {
              const rect = el.getBoundingClientRect();
              if (rect.width === 0 || rect.height === 0) continue;
              const groupName = el.name || el.id || "_ungrouped";
              if (!radioGroups[groupName]) {
                radioGroups[groupName] = {
                  selector: `input[type="radio"][name="${CSS.escape(el.name || el.id)}"]`,
                  type: "radio",
                  label: getLabel(el.closest("fieldset") || el.closest("[role='radiogroup']") || el) || el.name,
                  name: el.name || "",
                  required: el.required || el.getAttribute("aria-required") === "true",
                  options: [],
                };
              }
              radioGroups[groupName].options.push(el.value || el.labels?.[0]?.textContent?.trim() || "");
            }
            fields.push(...Object.values(radioGroups));

            // Checkboxes
            for (const el of document.querySelectorAll("input[type='checkbox']")) {
              const rect = el.getBoundingClientRect();
              if (rect.width === 0 || rect.height === 0) continue;
              fields.push({
                selector: buildSelector(el),
                type: "checkbox",
                label: getLabel(el),
                name: el.name || "",
                id: el.id || "",
                required: el.required || el.getAttribute("aria-required") === "true",
                currentValue: el.checked ? "true" : "false",
              });
            }

            return {
              fields,
              pageUrl: window.location.href,
              pageTitle: document.title,
            };
          },
        });

        const pageData = snapshotResponses?.[0]?.result;

        // ── STEP B: Ask Gemini AI to produce field mappings ──────────────────
        let aiMappings = [];
        let aiUsed = false;

        if (pageData?.fields?.length) {
          try {
            const aiRes = await fetch(`${APP_BASE}/api/extension/ai-fill`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                fields: pageData.fields,
                profile,
                jobTitle: job.jobTitle,
                company: job.company,
                pageUrl: pageData.pageUrl,
              }),
            });

            if (aiRes.ok) {
              const aiData = await aiRes.json();
              aiMappings = aiData.mappings || [];
              aiUsed = true;
              console.log(`[TalentFlow Bot] 🤖 AI produced ${aiMappings.length} field mappings`);
            } else {
              console.warn("[TalentFlow Bot] AI fill API failed, using rule-based fallback");
            }
          } catch (aiErr) {
            console.warn("[TalentFlow Bot] AI fill request error:", aiErr.message);
          }
        }

        // ── STEP C: Inject the filler script with AI mappings ─────────────
        const extResponses = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: (profile, aiMappings, aiUsed) => {
            return new Promise(async (resolve) => {
              try {
                const delay = (ms) => new Promise(r => setTimeout(r, ms));

                // ── Core field setters ─────────────────────────────────────────
                function setInputValue(el, value) {
                  if (!el || value === undefined || value === null) return false;
                  try {
                    const proto = el.tagName === "TEXTAREA"
                      ? window.HTMLTextAreaElement.prototype
                      : window.HTMLInputElement.prototype;
                    const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
                    if (setter) setter.call(el, value);
                    else el.value = value;
                    el.dispatchEvent(new Event("input", { bubbles: true }));
                    el.dispatchEvent(new Event("change", { bubbles: true }));
                    el.dispatchEvent(new KeyboardEvent("keyup", { bubbles: true }));
                    return true;
                  } catch {
                    el.value = value;
                    el.dispatchEvent(new Event("input", { bubbles: true }));
                    el.dispatchEvent(new Event("change", { bubbles: true }));
                    return true;
                  }
                }

                function fillSelect(select, value) {
                  if (!select || !value) return false;
                  const valLower = String(value).toLowerCase();
                  let bestOption = null;
                  for (const option of select.options) {
                    const optVal = option.value.toLowerCase();
                    const optText = option.textContent.toLowerCase();
                    if (optVal === valLower || optText === valLower) { bestOption = option; break; }
                    if (optVal.includes(valLower) || optText.includes(valLower)) bestOption = option;
                  }
                  if (bestOption) {
                    select.value = bestOption.value;
                    select.dispatchEvent(new Event("change", { bubbles: true }));
                    return true;
                  }
                  return false;
                }

                let fieldsFilled = 0;

                // ── PHASE 1: Apply AI mappings ─────────────────────────────────
                if (aiUsed && aiMappings.length > 0) {
                  for (const mapping of aiMappings) {
                    try {
                      const el = document.querySelector(mapping.selector);
                      if (!el) continue;

                      if (mapping.action === "type") {
                        if (setInputValue(el, mapping.value)) fieldsFilled++;
                      } else if (mapping.action === "select") {
                        if (fillSelect(el, mapping.value)) fieldsFilled++;
                      } else if (mapping.action === "click") {
                        // For radios: find the option that matches
                        const radioGroup = el.name
                          ? document.querySelectorAll(`input[type="radio"][name="${CSS.escape(el.name)}"]`)
                          : [el];
                        for (const radio of radioGroup) {
                          const val = (radio.value || "").toLowerCase();
                          const lbl = (radio.labels?.[0]?.textContent || "").toLowerCase();
                          if (val.includes(mapping.value.toLowerCase()) || lbl.includes(mapping.value.toLowerCase())) {
                            radio.click();
                            fieldsFilled++;
                            break;
                          }
                        }
                      } else if (mapping.action === "check") {
                        const cb = el;
                        if (cb.type === "checkbox" && !cb.checked) { cb.click(); fieldsFilled++; }
                      }
                    } catch (mappingErr) {
                      console.warn("[TalentFlow] AI mapping failed for selector:", mapping.selector, mappingErr.message);
                    }
                  }
                  console.log(`[TalentFlow] 🤖 AI filled ${fieldsFilled} fields`);
                }

                // ── PHASE 2: Rule-based fallback for any still-empty fields ──
                function getLabel(el) {
                  if (el.id) {
                    const lbl = document.querySelector(`label[for="${el.id}"]`);
                    if (lbl) return lbl.textContent?.trim() || "";
                  }
                  const parentLbl = el.closest("label");
                  if (parentLbl) return parentLbl.textContent?.trim() || "";
                  return el.getAttribute("aria-label") || el.placeholder || el.name || "";
                }

                const textInputs = Array.from(document.querySelectorAll(
                  "input[type='text'], input[type='email'], input[type='tel'], input[type='url'], input[type='number'], textarea"
                ));

                for (const input of textInputs) {
                  if (input.value?.trim()) continue; // already filled
                  const lbl = getLabel(input).toLowerCase();

                  let val = null;
                  if (lbl.includes("first name")) val = profile.name?.split(" ")[0];
                  else if (lbl.includes("last name")) val = profile.name?.split(" ").slice(1).join(" ") || "";
                  else if (lbl.includes("name") || lbl.includes("fullname")) val = profile.name;
                  else if (lbl.includes("email") || lbl.includes("mail")) val = profile.email;
                  else if (lbl.includes("phone") || lbl.includes("mobile") || lbl.includes("tel")) val = profile.phone;
                  else if (lbl.includes("linkedin")) val = profile.linkedinUrl || profile.linkedinProfileUrl;
                  else if (lbl.includes("portfolio") || lbl.includes("website") || lbl.includes("github")) val = profile.portfolioUrl;
                  else if (lbl.includes("city") || lbl.includes("location") || lbl.includes("address")) val = profile.location;
                  else if (lbl.includes("experience") && lbl.includes("year")) val = String(profile.yearsOfExperience || 0);
                  else if (lbl.includes("cover") || lbl.includes("letter") || lbl.includes("motivation") || lbl.includes("summary") || lbl.includes("about you") || lbl.includes("message")) val = profile.summary;
                  else if (lbl.includes("company") || lbl.includes("employer")) val = profile.mostRecentCompany;
                  else if (lbl.includes("title") || lbl.includes("role") || lbl.includes("position")) val = profile.mostRecentJobTitle;
                  else if (lbl.includes("degree") || lbl.includes("education")) val = profile.highestEducation?.split(" - ")[0] || "";
                  else if (lbl.includes("school") || lbl.includes("university") || lbl.includes("college")) val = profile.highestEducation?.split(" - ").slice(-1)[0] || "";
                  else if (lbl.includes("salary") || lbl.includes("expected") || lbl.includes("desired")) val = "Negotiable";
                  else if (lbl.includes("notice") || lbl.includes("availability")) val = "1 month";

                  if (val && setInputValue(input, val)) fieldsFilled++;
                }

                // Selects fallback
                for (const select of document.querySelectorAll("select")) {
                  if (select.value && select.selectedIndex > 0) continue;
                  const lbl = getLabel(select).toLowerCase();
                  let val = null;
                  if (lbl.includes("country")) val = "Bangladesh";
                  else if (lbl.includes("gender")) val = "Male";
                  else if (lbl.includes("experience") || lbl.includes("year")) val = String(profile.yearsOfExperience || 0);
                  else if (lbl.includes("degree") || lbl.includes("education")) val = profile.highestEducation?.split(" - ")[0] || "";
                  if (val && fillSelect(select, val)) fieldsFilled++;
                }

                // Checkboxes/radios fallback
                for (const input of document.querySelectorAll("input[type='checkbox'], input[type='radio']")) {
                  const lbl = getLabel(input).toLowerCase();
                  if (lbl.includes("terms") || lbl.includes("consent") || lbl.includes("privacy") || lbl.includes("agree") || lbl.includes("policy")) {
                    if (input.type === "checkbox" && !input.checked) { input.click(); fieldsFilled++; }
                  }
                  if (lbl.includes("authorized") || lbl.includes("eligible") || lbl.includes("sponsor")) {
                    if (input.type === "radio") {
                      const val = input.value.toLowerCase();
                      if ((val === "yes" || val === "true" || val === "1") && !document.querySelector(`input[name="${input.name}"]:checked`)) {
                        input.click(); fieldsFilled++;
                      }
                    }
                  }
                }

                // ── PHASE 3: Resume upload ─────────────────────────────────────
                if (profile.resumePdfUrl) {
                  const fileInputs = Array.from(document.querySelectorAll("input[type='file']"));
                  for (const fileInput of fileInputs) {
                    const lbl = (getLabel(fileInput) || fileInput.name || fileInput.id || "").toLowerCase();
                    const isResumeField = lbl.includes("resume") || lbl.includes("cv") || lbl.includes("doc") || lbl.includes("pdf") || lbl.includes("upload") || lbl.includes("attachment") || fileInputs.length === 1;
                    if (isResumeField) {
                      try {
                        const response = await fetch(profile.resumePdfUrl);
                        const blob = await response.blob();
                        const file = new File([blob], profile.resumeTitle || "resume.pdf", { type: "application/pdf" });
                        const container = new DataTransfer();
                        container.items.add(file);
                        fileInput.files = container.files;
                        fileInput.dispatchEvent(new Event("change", { bubbles: true }));
                        fieldsFilled++;
                        break;
                      } catch (fileErr) {
                        console.error("Resume upload failed:", fileErr);
                      }
                    }
                  }
                }

                // ── PHASE 4: Check for empty required fields ───────────────────
                function getEmptyRequiredFields() {
                  const els = Array.from(document.querySelectorAll(
                    "input[required], textarea[required], select[required], [aria-required='true']"
                  ));
                  const empty = [];
                  for (const el of els) {
                    const rect = el.getBoundingClientRect();
                    const visible = rect.width > 0 && rect.height > 0
                      && window.getComputedStyle(el).display !== "none"
                      && window.getComputedStyle(el).visibility !== "hidden";
                    if (!visible) continue;

                    let isEmpty = false;
                    if (el.type === "radio") {
                      if (el.name && !document.querySelector(`input[name="${el.name}"]:checked`)) isEmpty = true;
                    } else if (el.type === "checkbox") {
                      if (!el.checked) isEmpty = true;
                    } else {
                      if (!el.value || !el.value.trim()) isEmpty = true;
                    }

                    if (isEmpty) {
                      const lbl = (getLabel(el) || el.name || "Required Field").replace(/[:*]/g, "").trim();
                      if (lbl) empty.push(lbl);
                    }
                  }
                  return [...new Set(empty)]; // dedupe
                }

                function hasCaptchaOnPage() {
                  const captchaSelectors = [
                    ".g-recaptcha",
                    ".h-captcha",
                    ".cf-turnstile",
                    "[id*='captcha']",
                    "[class*='captcha']",
                    "iframe[src*='recaptcha']",
                    "iframe[src*='hcaptcha']",
                    "iframe[src*='challenges.cloudflare.com']"
                  ];
                  for (const selector of captchaSelectors) {
                    const el = document.querySelector(selector);
                    if (el) {
                      const rect = el.getBoundingClientRect();
                      const visible = rect.width > 0 && rect.height > 0
                        && window.getComputedStyle(el).display !== "none"
                        && window.getComputedStyle(el).visibility !== "hidden";
                      if (visible) return true;
                    }
                  }
                  return false;
                }

                const emptyFields = getEmptyRequiredFields();
                const captchaPresent = hasCaptchaOnPage();
                let submitted = false;
                let skipSubmit = emptyFields.length > 0 || captchaPresent;
                let reason = "";

                if (captchaPresent) {
                  reason = "Manual Apply required: CAPTCHA detected on page. Please solve and submit manually.";
                } else if (skipSubmit) {
                  reason = `Manual Apply required: unfilled required fields (${emptyFields.slice(0, 4).join(", ")}${emptyFields.length > 4 ? "..." : ""})`;
                } else {
                  // ── PHASE 5: Auto-submit ─────────────────────────────────────
                  const submitSelectors = [
                    "button[type='submit']",
                    "input[type='submit']",
                    "button.submit-button",
                    "button.apply-button",
                    "button[id*='submit']",
                    "button[class*='submit']",
                    "input[class*='submit']",
                  ];
                  for (const sel of submitSelectors) {
                    const btn = document.querySelector(sel);
                    if (btn) {
                      const txt = (btn.textContent || btn.value || "").toLowerCase();
                      if (txt.includes("submit") || txt.includes("apply") || txt.includes("send") || txt.includes("finish")) {
                        btn.click();
                        submitted = true;
                        await delay(3000);

                        // Check if submission succeeded or failed validation
                        try {
                          const form = document.querySelector("form");
                          if (form) {
                            const rect = form.getBoundingClientRect();
                            const isFormVisible = rect.width > 0 && rect.height > 0 && window.getComputedStyle(form).display !== "none";
                            
                            if (isFormVisible) {
                              const errorClasses = [
                                ".error", ".invalid", "[class*='error']", "[class*='invalid']", 
                                "[id*='error']", "[id*='invalid']", ".alert-danger", ".has-error",
                                ".text-danger", ".field-validation-error", "[role='alert']"
                              ];
                              let hasErrors = false;
                              for (const errSel of errorClasses) {
                                const errEls = Array.from(document.querySelectorAll(errSel));
                                for (const errEl of errEls) {
                                  const errRect = errEl.getBoundingClientRect();
                                  if (errRect.width > 0 && errRect.height > 0 && window.getComputedStyle(errEl).display !== "none") {
                                    const text = (errEl.textContent || "").trim().toLowerCase();
                                    if (text.includes("error") || text.includes("invalid") || text.includes("required") || text.includes("must") || text.includes("please")) {
                                      hasErrors = true;
                                      break;
                                    }
                                  }
                                }
                                if (hasErrors) break;
                              }

                              const emptyReqNow = getEmptyRequiredFields();

                              if (hasErrors || emptyReqNow.length > 0) {
                                submitted = false;
                                reason = `Form submission blocked: validation errors detected (${emptyReqNow.slice(0, 3).join(", ") || "error messages shown"})`;
                              }
                            }
                          }
                        } catch (checkErr) {
                          console.warn("[TalentFlow Check] Error checking post-submit state:", checkErr);
                        }

                        break;
                      }
                    }
                  }
                  if (!submitted && !reason) reason = "Manual Apply required: no auto-submit button found";
                }

                // ── PHASE 6: Inject banner ─────────────────────────────────────
                try {
                  const banner = document.createElement("div");
                  banner.id = "tf-autofill-banner";
                  banner.style.cssText = `
                    position: fixed !important;
                    top: 0 !important; left: 0 !important; right: 0 !important;
                    height: 52px !important;
                    background: linear-gradient(135deg, #003a9b, #0055e9) !important;
                    color: white !important;
                    display: flex !important; align-items: center !important;
                    justify-content: space-between !important;
                    padding: 0 24px !important;
                    z-index: 999999999 !important;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
                    font-size: 13px !important; font-weight: 600 !important;
                    box-shadow: 0 4px 16px rgba(0,0,0,0.18) !important;
                  `;
                  const aiTag = aiUsed ? ' <span style="background:rgba(255,255,255,0.2);border-radius:4px;padding:2px 6px;font-size:11px;margin-left:6px">🤖 AI</span>' : "";
                  const msg = submitted
                    ? `Form submitted automatically.${aiTag}`
                    : `<strong>Please review & submit manually.</strong> (${emptyFields.length} field${emptyFields.length !== 1 ? "s" : ""} need attention)${aiTag}`;
                  banner.innerHTML = `
                    <div style="display:flex;align-items:center;gap:8px">
                      ⚡ <strong>TalentFlow</strong> — Auto-filled ${fieldsFilled} field${fieldsFilled !== 1 ? "s" : ""}! ${msg}
                    </div>
                    <button onclick="this.parentElement.remove()" style="background:none;border:none;color:white;cursor:pointer;font-size:18px;padding:4px 8px;line-height:1">✕</button>
                  `;
                  document.body.prepend(banner);
                  document.body.style.paddingTop = "52px";
                } catch (bannerErr) {
                  console.error("Banner injection failed:", bannerErr);
                }

                resolve({ success: !skipSubmit && submitted, fieldsFilled, submitted, error: reason || null });
              } catch (err) {
                resolve({ success: false, error: err.message || String(err) });
              }
            });
          },
          args: [profile, aiMappings, aiUsed],
        });

        const extResult = extResponses?.[0]?.result;
        if (extResult?.success) {
          result = { success: true, submitted: extResult.submitted, error: null };
          console.log(`[TalentFlow Bot] ✅ AI-powered fill done. Fields: ${extResult.fieldsFilled}, Submitted: ${extResult.submitted}`);
        } else {
          result = { success: false, submitted: extResult?.submitted || false, error: extResult?.error || "Auto-fill failed" };
        }
      } catch (err) {
        result = { success: false, error: `External page processing failed: ${err.message}` };
      }
    }
  }
  // 6. Keep the tab open after applying (for monitoring/debugging)
  // Bring the tab to the front so the user can see it
  chrome.tabs.update(tab.id, { active: true }).catch(() => {});

  // 7. Report result
  if (result?.success && result.submitted) {
    await updateJobStatus(token, job.id, "DONE");
    // Update stats
    const { tf_stats } = await chrome.storage.local.get(["tf_stats"]);
    const s = tf_stats || { today: 0, total: 0 };
    s.today = (s.today || 0) + 1;
    s.total = (s.total || 0) + 1;
    await chrome.storage.local.set({ tf_stats: s });
    console.log(`[TalentFlow Bot] ✓ Applied to: ${job.jobTitle}`);
  } else {
    await updateJobStatus(token, job.id, "FAILED", result?.error || "Unknown error");
    console.error(`[TalentFlow Bot] ✗ Failed: ${job.jobTitle} — ${result?.error}`);
  }

  isProcessing = false;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function updateJobStatus(token, jobId, status, notes) {
  try {
    const res = await fetch(`${APP_BASE}/api/extension/queue/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, notes: notes ?? undefined }),
    });
    if (res.status === 401 || res.status === 403) {
      console.warn("[TalentFlow Bot] Token rejected by server on status update. Logging out.");
      chrome.storage.local.remove(["tf_token", "tf_user", "tf_stats"]);
    }
  } catch (err) {
    console.error("[TalentFlow Bot] Failed to update status:", err);
  }
}

function waitForTabLoad(tabId, timeout = 15000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      chrome.tabs.onUpdated.removeListener(listener);
      reject(new Error("Tab load timeout"));
    }, timeout);

    function listener(id, changeInfo) {
      if (id === tabId && changeInfo.status === "complete") {
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    }
    chrome.tabs.onUpdated.addListener(listener);
  });
}

const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ── Start polling ─────────────────────────────────────────────────────────────
setInterval(pollAndProcess, POLL_INTERVAL_MS);
pollAndProcess(); // Also run immediately on startup

chrome.runtime.onInstalled.addListener(() => {
  console.log("[TalentFlow] Extension installed — bot mode active.");
});
