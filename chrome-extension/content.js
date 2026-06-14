// content.js — TalentFlow Auto-Applier Content Script
// Injected on LinkedIn, Indeed, Glassdoor, Bdjobs job pages

const APP_BASE = "http://localhost:3000";

// ── Site Detection ────────────────────────────────────────────────────────────
function detectSite() {
  const host = window.location.hostname;
  if (host.includes("linkedin.com"))  return "linkedin";
  if (host.includes("indeed.com"))    return "indeed";
  if (host.includes("glassdoor.com")) return "glassdoor";
  if (host.includes("bdjobs.com"))    return "bdjobs";
  return null;
}

// ── Helper: Fill a field safely ───────────────────────────────────────────────
function fillField(selector, value, method = "value") {
  const el = document.querySelector(selector);
  if (!el || !value) return false;

  if (method === "value") {
    // Trigger React synthetic events
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value")?.set
      || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, "value")?.set;
    if (nativeInputValueSetter) nativeInputValueSetter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  } else if (method === "text") {
    el.textContent = value;
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }
  return true;
}

// ── Helper: Click a button ────────────────────────────────────────────────────
function clickEl(selector) {
  const el = document.querySelector(selector);
  if (el) { el.click(); return true; }
  return false;
}

// ── Helper: Wait for element ──────────────────────────────────────────────────
function waitFor(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const el = document.querySelector(selector);
    if (el) { resolve(el); return; }
    const obs = new MutationObserver(() => {
      const found = document.querySelector(selector);
      if (found) { obs.disconnect(); resolve(found); }
    });
    obs.observe(document.body, { childList: true, subtree: true });
    setTimeout(() => { obs.disconnect(); reject(new Error(`Timeout waiting for ${selector}`)); }, timeout);
  });
}

// ── Helper: Delay ─────────────────────────────────────────────────────────────
const delay = (ms) => new Promise(r => setTimeout(r, ms));

// ══════════════════════════════════════════════════════════════════════════════
// SITE-SPECIFIC AUTO-APPLY LOGIC
// ══════════════════════════════════════════════════════════════════════════════

// ── LinkedIn Easy Apply ───────────────────────────────────────────────────────
async function applyLinkedIn(profile) {
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
    return { redirectUrl: url };
  }

  // Click "Easy Apply" button
  const easyApplyBtn = document.querySelector(
    'button.jobs-apply-button[aria-label*="Easy Apply"], .jobs-apply-button'
  );
  if (!easyApplyBtn) {
    throw new Error("No Easy Apply button found on this page");
  }

  // If the button is not Easy Apply, it's external
  const btnText = (easyApplyBtn.textContent || "").trim().toLowerCase();
  if (!btnText.includes("easy apply")) {
    const parentLink = easyApplyBtn.closest('a') || easyApplyBtn.querySelector('a');
    if (parentLink && parentLink.href) {
      return { redirectUrl: parentLink.href };
    }
    const anyExtLink = document.querySelector('a[href*="linkedin.com/jobs/view/externalApply"]');
    if (anyExtLink && anyExtLink.href) {
      return { redirectUrl: anyExtLink.href };
    }
    throw new Error("No Easy Apply button found (External Job)");
  }

  easyApplyBtn.click();
  await delay(1500);

  let jobTitle = document.querySelector("h1.job-details-jobs-unified-top-card__job-title")?.textContent?.trim()
    || document.querySelector(".job-title")?.textContent?.trim() || "Job";
  let company = document.querySelector(".job-details-jobs-unified-top-card__company-name")?.textContent?.trim() || "";

  let maxSteps = 10;
  while (maxSteps-- > 0) {
    await delay(800);

    // Fill phone
    fillField('input[id*="phoneNumber"]', profile.phone);
    fillField('input[aria-label*="Phone"]', profile.phone);
    fillField('input[name*="phone"]', profile.phone);

    // Fill text inputs with common labels
    document.querySelectorAll("input[type='text'], input[type='tel'], textarea").forEach(input => {
      const label = (input.getAttribute("aria-label") || input.placeholder || "").toLowerCase();
      if (label.includes("first name")) fillField(`#${input.id}`, profile.name?.split(" ")[0] || profile.name);
      if (label.includes("last name")) fillField(`#${input.id}`, profile.name?.split(" ").slice(1).join(" ") || "");
      if (label.includes("email")) fillField(`#${input.id}`, profile.email);
      if (label.includes("phone")) fillField(`#${input.id}`, profile.phone);
      if (label.includes("linkedin") || label.includes("profile url")) fillField(`#${input.id}`, profile.linkedinUrl);
      if (label.includes("website") || label.includes("portfolio")) fillField(`#${input.id}`, profile.portfolioUrl);
      if (label.includes("city") || label.includes("location")) fillField(`#${input.id}`, profile.location);
      if (label.includes("years") && label.includes("experience")) fillField(`#${input.id}`, String(profile.yearsOfExperience));
    });

    // Fill textareas (cover letter / additional info)
    document.querySelectorAll("textarea").forEach(ta => {
      const label = (ta.getAttribute("aria-label") || ta.placeholder || "").toLowerCase();
      if (label.includes("cover") || label.includes("additional") || label.includes("message")) {
        if (!ta.value) fillField(`textarea[aria-label="${ta.getAttribute("aria-label")}"]`, profile.summary);
      }
    });

    // Fill radio: "yes/no" questions (citizenship, relocation)
    document.querySelectorAll('fieldset [data-test-text-selectable-option__input]').forEach(radio => {
      if (!radio.checked) {
        const lbl = radio.labels?.[0]?.textContent?.toLowerCase() || "";
        if (lbl.includes("yes")) radio.click();
      }
    });

    // Check if there's a "Submit" or "Review" button
    const submitBtn = document.querySelector(
      'button[aria-label="Submit application"], button[aria-label="Review your application"]'
    );
    if (submitBtn) {
      submitBtn.click();
      await delay(1000);
      // Final submit after review
      const finalSubmit = document.querySelector('button[aria-label="Submit application"]');
      if (finalSubmit) { finalSubmit.click(); await delay(500); }
      return { jobTitle, company };
    }

    // Next step
    const nextBtn = document.querySelector(
      'button[aria-label="Continue to next step"], button[aria-label="Review"], .artdeco-button--primary'
    );
    if (nextBtn) { nextBtn.click(); await delay(1200); }
    else break;
  }

  return { jobTitle, company };
}

// ── Indeed Quick Apply ────────────────────────────────────────────────────────
async function applyIndeed(profile) {
  // Check for external apply link
  const extBtn = document.querySelector('a.jobsearch-CallToApply-button, a[href*="apply"], [data-testid="indeed-apply-button"] a');
  if (extBtn && extBtn.href) {
    return { redirectUrl: extBtn.href };
  }

  const applyBtn = document.querySelector(
    'button#indeedApplyButton, .ia-IndeedApplyButton, button[data-testid="ia-IndeedApplyButton"]'
  );
  if (!applyBtn) throw new Error("No Apply button found on this page");

  const btnText = (applyBtn.textContent || "").trim().toLowerCase();
  if (!btnText.includes("apply now") && !btnText.includes("apply with resume")) {
    const parentLink = applyBtn.closest('a') || applyBtn.querySelector('a');
    if (parentLink && parentLink.href) {
      return { redirectUrl: parentLink.href };
    }
  }

  applyBtn.click();
  await delay(2000);

  const jobTitle = document.querySelector('[data-testid="jobTitle"], .jobsearch-JobInfoHeader-title')?.textContent?.trim() || "Job";
  const company  = document.querySelector('[data-testid="inlineHeader-companyName"], .jobsearch-InlineCompanyRating')?.textContent?.trim() || "";

  // Indeed applies in an iframe or same-page multi-step
  let maxSteps = 8;
  while (maxSteps-- > 0) {
    await delay(800);

    fillField('input[name="applicant.name"]', profile.name);
    fillField('input[name="applicant.phoneNumber"]', profile.phone);
    fillField('input[name="applicant.email"]', profile.email);
    fillField('input[id*="city"], input[name*="city"]', profile.location);
    fillField('input[name*="resume"]', profile.name); // Name fallback

    document.querySelectorAll("input[type='text'], textarea").forEach(input => {
      const label = (input.getAttribute("aria-label") || input.name || input.placeholder || "").toLowerCase();
      if (label.includes("year") && label.includes("experience")) fillField(`#${input.id}`, String(profile.yearsOfExperience));
      if (label.includes("cover") || label.includes("letter")) {
        if (!input.value) fillField(`#${input.id}`, profile.summary);
      }
    });

    // Select "yes" for radio questions
    document.querySelectorAll('input[type="radio"]').forEach(r => {
      if ((r.value || "").toLowerCase() === "yes" || (r.labels?.[0]?.textContent || "").toLowerCase() === "yes") {
        if (!document.querySelector(`input[name="${r.name}"]:checked`)) r.click();
      }
    });

    const continueBtn = document.querySelector(
      'button[data-testid="ia-continueButton"], button.ia-continueButton, button[type="submit"]'
    );
    if (!continueBtn) break;
    continueBtn.click();
    await delay(1200);
  }

  return { jobTitle, company };
}

// ── Glassdoor Easy Apply ──────────────────────────────────────────────────────
async function applyGlassdoor(profile) {
  const applyBtn = document.querySelector(
    'button[data-test="easyApply-button"], a.EasyApplyButton, button[class*="EasyApply"]'
  );
  if (!applyBtn) throw new Error("No Easy Apply button found on this page");
  applyBtn.click();
  await delay(1500);

  const jobTitle = document.querySelector('[data-test="job-title"], .e1tk4kwz4')?.textContent?.trim() || "Job";
  const company  = document.querySelector('[data-test="employer-name"]')?.textContent?.trim() || "";

  let maxSteps = 8;
  while (maxSteps-- > 0) {
    await delay(800);

    fillField('input[id*="FirstName"], input[name*="firstName"]', profile.name?.split(" ")[0]);
    fillField('input[id*="LastName"], input[name*="lastName"]', profile.name?.split(" ").slice(1).join(" "));
    fillField('input[id*="Email"], input[name*="email"], input[type="email"]', profile.email);
    fillField('input[id*="Phone"], input[name*="phone"], input[type="tel"]', profile.phone);
    fillField('input[id*="City"], input[name*="city"]', profile.location);

    const nextBtn = document.querySelector('button[data-test="continue-btn"], button[type="submit"]');
    if (!nextBtn) break;
    nextBtn.click();
    await delay(1200);
  }

  return { jobTitle, company };
}

// ── Bdjobs Apply ──────────────────────────────────────────────────────────────
async function applyBdjobs(profile) {
  const applyBtn = document.querySelector(
    '#btnApply, .apply-btn, a[href*="apply"], button.apply'
  );
  if (!applyBtn) throw new Error("No Apply button found on this page");
  applyBtn.click();
  await delay(2000);

  const jobTitle = document.querySelector('.job-title-text, h1.title')?.textContent?.trim() || "Job";
  const company  = document.querySelector('.company-name')?.textContent?.trim() || "";

  fillField('input[name="name"], input[id="name"]', profile.name);
  fillField('input[name="email"], input[id="email"], input[type="email"]', profile.email);
  fillField('input[name="phone"], input[id="phone"], input[type="tel"]', profile.phone);
  fillField('input[name="address"], input[id="address"]', profile.location);
  fillField('textarea[name="cover_letter"], textarea[id="cover_letter"]', profile.summary);
  fillField('input[name="experience"], input[id="experience"]', String(profile.yearsOfExperience));

  await delay(600);

  const submitBtn = document.querySelector('button[type="submit"], input[type="submit"], #btnSubmit');
  if (submitBtn) submitBtn.click();

  return { jobTitle, company };
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN MESSAGE HANDLER
// ══════════════════════════════════════════════════════════════════════════════
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type !== "TALENTFLOW_AUTO_APPLY") return;

  const token = message.token;
  const site  = detectSite();

  if (!site) {
    sendResponse({ success: false, error: "Not a supported job site." });
    return true;
  }

  // Fetch profile then apply
  fetch(`${APP_BASE}/api/extension/profile`, {
    headers: { Authorization: `Bearer ${token}` }
  })
  .then(r => r.json())
  .then(async (profile) => {
    if (profile.error) throw new Error(profile.error);

    let result;
    if (site === "linkedin")  result = await applyLinkedIn(profile);
    if (site === "indeed")    result = await applyIndeed(profile);
    if (site === "glassdoor") result = await applyGlassdoor(profile);
    if (site === "bdjobs")    result = await applyBdjobs(profile);

    // If an external apply redirection is detected
    if (result && result.redirectUrl) {
      await chrome.storage.local.set({
        tf_auto_apply_pending: {
          jobUrl: window.location.href,
          token: token,
          timestamp: Date.now(),
          redirectUrl: result.redirectUrl
        }
      });
      window.location.href = result.redirectUrl;
      sendResponse({ success: true, jobTitle: "External Apply", company: "Redirecting to company website..." });
      return;
    }

    const { jobTitle, company } = result || {};

    // Log back to TalentFlow
    await fetch(`${APP_BASE}/api/extension/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ jobTitle, company, jobUrl: window.location.href, platform: site, status: "APPLIED" })
    });

    sendResponse({ success: true, jobTitle, company });
  })
  .catch(err => {
    console.error("[TalentFlow] Auto-apply failed:", err);
    // Log failure
    fetch(`${APP_BASE}/api/extension/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ jobTitle: document.title, jobUrl: window.location.href, platform: site, status: "FAILED", notes: err.message })
    }).catch(() => {});

    sendResponse({ success: false, error: err.message });
  });

  return true; // Keep message channel open for async response
});

// ── Dashboard Connection Detection ───────────────────────────────────────────
window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "TALENTFLOW_PING") {
    try {
      chrome.runtime.sendMessage({ type: "TALENTFLOW_CHECK_AUTH" }, (response) => {
        if (chrome.runtime.lastError) {
          window.postMessage({ type: "TALENTFLOW_PONG", installed: true, authenticated: false }, "*");
          return;
        }
        const authenticated = !!response?.token;
        window.postMessage({ 
          type: "TALENTFLOW_PONG", 
          installed: true, 
          authenticated: authenticated 
        }, "*");
      });
    } catch (err) {
      window.postMessage({ type: "TALENTFLOW_PONG", installed: true, authenticated: false }, "*");
    }
  }

  if (event.data && event.data.type === "TALENTFLOW_CONNECT_LINKEDIN_REQ") {
    chrome.runtime.sendMessage({ type: "TALENTFLOW_GET_LINKEDIN_PROFILE" }, (response) => {
      if (chrome.runtime.lastError) {
        window.postMessage({ type: "TALENTFLOW_CONNECT_LINKEDIN_RESP", success: false, error: "Extension not responding" }, "*");
        return;
      }
      window.postMessage({ type: "TALENTFLOW_CONNECT_LINKEDIN_RESP", ...response }, "*");
    });
  }

  if (event.data && event.data.type === "TALENTFLOW_AUTH") {
    chrome.runtime.sendMessage(event.data).catch(() => {});
  }

  if (event.data && event.data.type === "TALENTFLOW_LOGOUT") {
    chrome.runtime.sendMessage({ type: "TALENTFLOW_LOGOUT" }).catch(() => {});
  }
});

// Check for auth data on /extension/auth page DOM
function checkForAuthData() {
  const el = document.getElementById("tf-auth-data");
  if (el) {
    const token = el.getAttribute("data-token");
    const userId = el.getAttribute("data-userid");
    const name = el.getAttribute("data-name");
    const email = el.getAttribute("data-email");
    const photoUrl = el.getAttribute("data-photo");
    const expiresAt = el.getAttribute("data-expires");

    if (token) {
      chrome.runtime.sendMessage({
        type: "TALENTFLOW_AUTH",
        token,
        userId,
        name,
        email,
        photoUrl,
        expiresAt
      }).catch(() => {});
      console.log("[TalentFlow] Found auth data in DOM, sent to background");
    }
  }
}

if (window.location.pathname.startsWith("/extension/auth")) {
  checkForAuthData();
  const observer = new MutationObserver(checkForAuthData);
  observer.observe(document.body, { childList: true, subtree: true });
}

// ── Generic Auto-Filler for external sites ────────────────────────────────────
async function applyGeneric(profile) {
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
      if (fillField(`#${input.id}` || `input[name="${input.name}"]`, profile.name?.split(" ")[0])) fieldsFilled++;
    } else if (labelText.includes("last name")) {
      if (fillField(`#${input.id}` || `input[name="${input.name}"]`, profile.name?.split(" ").slice(1).join(" ") || "")) fieldsFilled++;
    } else if (labelText.includes("name") || labelText.includes("fullname") || labelText.includes("full name")) {
      if (fillField(`#${input.id}` || `input[name="${input.name}"]`, profile.name)) fieldsFilled++;
    } else if (labelText.includes("email") || labelText.includes("mail")) {
      if (fillField(`#${input.id}` || `input[name="${input.name}"]`, profile.email)) fieldsFilled++;
    } else if (labelText.includes("phone") || labelText.includes("mobile") || labelText.includes("tel") || labelText.includes("contact")) {
      if (fillField(`#${input.id}` || `input[name="${input.name}"]`, profile.phone)) fieldsFilled++;
    } else if (labelText.includes("linkedin") || labelText.includes("profile url")) {
      if (fillField(`#${input.id}` || `input[name="${input.name}"]`, profile.linkedinUrl)) fieldsFilled++;
    } else if (labelText.includes("portfolio") || labelText.includes("website") || labelText.includes("github")) {
      if (fillField(`#${input.id}` || `input[name="${input.name}"]`, profile.portfolioUrl)) fieldsFilled++;
    } else if (labelText.includes("city") || labelText.includes("location") || labelText.includes("address")) {
      if (fillField(`#${input.id}` || `input[name="${input.name}"]`, profile.location)) fieldsFilled++;
    } else if (labelText.includes("experience") && labelText.includes("year")) {
      if (fillField(`#${input.id}` || `input[name="${input.name}"]`, String(profile.yearsOfExperience || 0))) fieldsFilled++;
    } else if (labelText.includes("cover") || labelText.includes("letter") || labelText.includes("additional") || labelText.includes("message") || labelText.includes("summary")) {
      if (fillField(`#${input.id}` || `textarea[name="${input.name}"]`, profile.summary)) fieldsFilled++;
    }
  }

  // Resume PDF injection
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

  // Click Submit
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

  return { fieldsFilled, submitted };
}

// Check for pending external auto-apply state on page load
chrome.storage.local.get(["tf_auto_apply_pending"], async (data) => {
  const pending = data.tf_auto_apply_pending;
  if (!pending) return;

  // Ignore if pending job is older than 3 minutes
  if (Date.now() - pending.timestamp > 180000) {
    chrome.storage.local.remove(["tf_auto_apply_pending"]);
    return;
  }

  // Clear immediately to prevent infinite submission loop
  await chrome.storage.local.remove(["tf_auto_apply_pending"]);

  console.log("[TalentFlow Bot] Running generic auto-fill on external site...");

  try {
    const profRes = await fetch(`${APP_BASE}/api/extension/profile`, {
      headers: { Authorization: `Bearer ${pending.token}` }
    });
    if (!profRes.ok) throw new Error("Could not load profile");
    const profile = await profRes.json();
    if (profile.error) throw new Error(profile.error);

    const fillerResult = await applyGeneric(profile);

    // Log success back to API
    await fetch(`${APP_BASE}/api/extension/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${pending.token}` },
      body: JSON.stringify({
        jobTitle: document.title || "External Job",
        company: window.location.hostname || "External Site",
        jobUrl: window.location.href,
        platform: "external",
        status: fillerResult.submitted ? "APPLIED" : "MANUAL_SUBMIT_REQUIRED",
        notes: `Auto-filled ${fillerResult.fieldsFilled} fields. ${fillerResult.submitted ? "Submitted form." : "Manual submission required."}`
      })
    });

    console.log("[TalentFlow Bot] Generic auto-fill completed successfully.");
  } catch (err) {
    console.error("[TalentFlow Bot] Generic auto-fill failed:", err);
    await fetch(`${APP_BASE}/api/extension/log`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${pending.token}` },
      body: JSON.stringify({
        jobTitle: document.title || "External Job",
        company: window.location.hostname || "External Site",
        jobUrl: window.location.href,
        platform: "external",
        status: "FAILED",
        notes: err.message
      })
    }).catch(() => {});
  }
});
