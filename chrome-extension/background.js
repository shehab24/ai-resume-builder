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
    chrome.storage.local.get(["tf_token"], (data) => {
      sendResponse({ token: data.tf_token || null });
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

// ── Bot: Poll for queued jobs and process them ────────────────────────────────
let isProcessing = false;

async function pollAndProcess() {
  try {
    const { tf_token } = await chrome.storage.local.get(["tf_token"]);
    if (!tf_token) return;

    const res = await fetch(`${APP_BASE}/api/extension/queue`, {
      headers: { Authorization: `Bearer ${tf_token}` },
    });

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
  let result;
  try {
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
  } catch (err) {
    result = { success: false, error: `Script injection failed: ${err.message}` };
  }

  // If redirectUrl is detected, navigate to the external site and run generic auto-fill
  if (result?.success && result.redirectUrl) {
    const extUrl = result.redirectUrl;
    console.log(`[TalentFlow Bot] External Apply detected. Navigating to: ${extUrl}`);
    try {
      await chrome.tabs.update(tab.id, { url: extUrl });
      await waitForTabLoad(tab.id, 25000);
      await delay(3000); // Wait for page JS to render forms

      const extResponses = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (profile) => {
          return new Promise(async (resolve) => {
            try {
              const delay = (ms) => new Promise(r => setTimeout(r, ms));

              function fillField(el, value) {
                if (!el || !value) return false;
                const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set
                            || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
                if (setter) setter.call(el, value);
                el.dispatchEvent(new Event("input", { bubbles: true }));
                el.dispatchEvent(new Event("change", { bubbles: true }));
                return true;
              }

              // 1. Fill all text, email, tel inputs, and textareas based on label heuristics
              const textInputs = Array.from(document.querySelectorAll("input[type='text'], input[type='email'], input[type='tel'], textarea"));
              let fieldsFilled = 0;

              for (const input of textInputs) {
                const labelText = (() => {
                  if (input.id) {
                    const label = document.querySelector(`label[for="${input.id}"]`);
                    if (label) return label.textContent;
                  }
                  const parentLabel = input.closest("label");
                  if (parentLabel) return parentLabel.textContent;
                  return input.getAttribute("aria-label") || input.placeholder || input.name || "";
                })().toLowerCase();

                if (labelText.includes("first name")) {
                  if (fillField(input, profile.name?.split(" ")[0])) fieldsFilled++;
                } else if (labelText.includes("last name")) {
                  if (fillField(input, profile.name?.split(" ").slice(1).join(" ") || "")) fieldsFilled++;
                } else if (labelText.includes("name") || labelText.includes("fullname") || labelText.includes("full name")) {
                  if (fillField(input, profile.name)) fieldsFilled++;
                } else if (labelText.includes("email") || labelText.includes("mail")) {
                  if (fillField(input, profile.email)) fieldsFilled++;
                } else if (labelText.includes("phone") || labelText.includes("mobile") || labelText.includes("tel") || labelText.includes("contact")) {
                  if (fillField(input, profile.phone)) fieldsFilled++;
                } else if (labelText.includes("linkedin") || labelText.includes("profile url")) {
                  if (fillField(input, profile.linkedinUrl)) fieldsFilled++;
                } else if (labelText.includes("portfolio") || labelText.includes("website") || labelText.includes("github")) {
                  if (fillField(input, profile.portfolioUrl)) fieldsFilled++;
                } else if (labelText.includes("city") || labelText.includes("location") || labelText.includes("address")) {
                  if (fillField(input, profile.location)) fieldsFilled++;
                } else if (labelText.includes("experience") && labelText.includes("year")) {
                  if (fillField(input, String(profile.yearsOfExperience || 0))) fieldsFilled++;
                } else if (labelText.includes("cover") || labelText.includes("letter") || labelText.includes("additional") || labelText.includes("message") || labelText.includes("summary")) {
                  if (fillField(input, profile.summary)) fieldsFilled++;
                }
              }

              // 2. Programmatically upload the candidate's PDF resume if pdfUrl is present
              if (profile.resumePdfUrl) {
                const fileInputs = Array.from(document.querySelectorAll("input[type='file']"));
                for (const fileInput of fileInputs) {
                  const labelText = (fileInput.name || fileInput.id || "").toLowerCase();
                  if (labelText.includes("resume") || labelText.includes("cv") || labelText.includes("doc")) {
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
                      console.error("Resume file injection failed:", fileErr);
                    }
                  }
                }
              }

              // 3. Find and click Submit button
              let submitted = false;
              const submitSelectors = [
                "button[type='submit']",
                "input[type='submit']",
                "button.submit-button",
                "button.apply-button",
                "button[id*='submit']",
                "button[class*='submit']",
                "input[class*='submit']"
              ];

              for (const selector of submitSelectors) {
                const btn = document.querySelector(selector);
                if (btn) {
                  const txt = (btn.textContent || btn.value || "").toLowerCase();
                  if (txt.includes("submit") || txt.includes("apply") || txt.includes("send") || txt.includes("finish")) {
                    btn.click();
                    submitted = true;
                    await delay(3000);
                    break;
                  }
                }
              }

              resolve({ success: true, fieldsFilled, submitted });
            } catch (err) {
              resolve({ success: false, error: err.message || String(err) });
            }
          });
        },
        args: [profile]
      });

      const extResult = extResponses?.[0]?.result;
      if (extResult?.success) {
        result = {
          success: true,
          error: null
        };
        console.log(`[TalentFlow Bot] Generic filler completed. Fields filled: ${extResult.fieldsFilled}, Submitted: ${extResult.submitted}`);
      } else {
        result = { success: false, error: extResult?.error || "Generic auto-filler failed" };
      }
    } catch (err) {
      result = { success: false, error: `External page processing failed: ${err.message}` };
    }
  }

  // 6. Close the tab
  chrome.tabs.remove(tab.id).catch(() => {});

  // 7. Report result
  if (result?.success) {
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
    await fetch(`${APP_BASE}/api/extension/queue/${jobId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ status, notes: notes ?? undefined }),
    });
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
