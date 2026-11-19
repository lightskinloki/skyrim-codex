// Background Service Worker for Skyrim Codex Final Render Bridge.
// Fetches latest selectors from Skyrim Codex, opens Google AI Mode in a background tab,
// injects the runner, brings the tab forward if CAPTCHA/login appears, and holds the tab
// open until Skyrim Codex confirms IndexedDB persistence via RENDER_SAVED_ACK.

const SELECTOR_CACHE_TTL_MS = 1000 * 60 * 15; // 15 minutes

const FALLBACK_SELECTORS = {
  aiModeUrl: "https://www.google.com/search?udm=50",
  plusButtonSelectors: [
    'button[aria-label*="Add" i]',
    'button[aria-label*="More" i]',
    'button[aria-label*="Upload" i]',
    'button[aria-label*="Attach" i]',
    '[role="button"][aria-label*="Add" i]',
  ],
  createImagesMenuText: ["Create images", "Create image", "Generate image"],
  fileInputSelectors: ['input[type="file"]'],
  promptInputSelectors: [
    'textarea[aria-label*="Ask" i]',
    'textarea[placeholder*="Ask" i]',
    "textarea",
    '[contenteditable="true"][role="textbox"]',
    '[contenteditable="true"]',
  ],
  submitButtonSelectors: [
    'button[aria-label*="Submit" i]',
    'button[aria-label*="Send" i]',
    'button[type="submit"]',
  ],
  captchaSelectors: [
    'iframe[src*="recaptcha"]',
    'iframe[title*="challenge" i]',
    "#captcha-form",
    'form[action*="sorry"]',
  ],
};

// Persist activeJob & pendingAckTabs in chrome.storage.session so MV3 SW suspension
// during long image generations (30s+) never loses tab/job references.
async function getActiveJob() {
  try {
    const data = await chrome.storage.session.get("activeJob");
    return data.activeJob || null;
  } catch {
    return null;
  }
}

async function setActiveJob(job) {
  try {
    if (job) await chrome.storage.session.set({ activeJob: job });
    else await chrome.storage.session.remove("activeJob");
  } catch {
    // Ignore storage error
  }
}

async function setPendingAckTab(renderJobId, tabId) {
  try {
    const data = await chrome.storage.session.get("pendingAckTabs");
    const map = data.pendingAckTabs || {};
    map[renderJobId] = tabId;
    await chrome.storage.session.set({ pendingAckTabs: map });
  } catch {
    // Ignore storage error
  }
}

async function popPendingAckTab(renderJobId) {
  try {
    const data = await chrome.storage.session.get("pendingAckTabs");
    const map = data.pendingAckTabs || {};
    const tabId = map[renderJobId];
    if (tabId !== undefined) {
      delete map[renderJobId];
      await chrome.storage.session.set({ pendingAckTabs: map });
    }
    return tabId;
  } catch {
    return undefined;
  }
}

async function loadSelectors(appOrigin) {
  if (appOrigin) {
    try {
      const res = await fetch(`${appOrigin}/ai-mode-selectors.json`, { cache: "no-store" });
      if (res.ok) {
        const json = await res.json();
        await chrome.storage.local.set({
          selectorsCache: json,
          selectorsCacheAt: Date.now(),
        });
        return { ...FALLBACK_SELECTORS, ...json };
      }
    } catch {
      // Fallback to cached/default
    }
  }

  try {
    const cached = await chrome.storage.local.get(["selectorsCache", "selectorsCacheAt"]);
    const freshEnough =
      cached.selectorsCache && Date.now() - (cached.selectorsCacheAt || 0) < SELECTOR_CACHE_TTL_MS;
    if (freshEnough) return { ...FALLBACK_SELECTORS, ...cached.selectorsCache };
  } catch {
    // Ignore storage issues
  }
  return FALLBACK_SELECTORS;
}

function sendToApp(appTabId, payload) {
  if (!appTabId) return;
  chrome.tabs.sendMessage(appTabId, payload).catch(() => {});
}

async function computeBlobFingerprint(blob) {
  try {
    const bmp = await createImageBitmap(blob);
    const canvas = new OffscreenCanvas(16, 16);
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(bmp, 0, 0, 16, 16);
    bmp.close();
    const d = ctx.getImageData(0, 0, 16, 16).data;
    const fp = [];
    for (let i = 0; i < d.length; i += 4) fp.push(d[i], d[i + 1], d[i + 2]);
    return fp;
  } catch {
    return null;
  }
}

function isSameFingerprint(fpA, fpB) {
  if (!fpA || !fpB || fpA.length !== fpB.length) return false;
  let sum = 0;
  for (let i = 0; i < fpA.length; i++) sum += Math.abs(fpA[i] - fpB[i]);
  return sum / fpA.length < 18;
}

async function dataUrlToBlob(dataUrl) {
  const res = await fetch(dataUrl);
  return res.blob();
}

async function urlToDataUrl(url) {
  if (!url) throw new Error("Empty image URL");
  if (url.startsWith("data:")) return url;
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error(`Image fetch failed (${response.status})`);
  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  const mime = blob.type || "image/png";
  return `data:${mime};base64,${btoa(binary)}`;
}

function waitForTabComplete(tabId) {
  return new Promise((resolve) => {
    const listener = (updatedId, info) => {
      if (updatedId === tabId && info.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };
    chrome.tabs.onUpdated.addListener(listener);
    chrome.tabs.get(tabId, (tab) => {
      if (chrome.runtime.lastError || tab?.status === "complete") {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });
}

// Auto-attach content script into already-open Skyrim Codex tabs on install/reload
// so playtesters never lose unsaved creator state by refreshing.
chrome.runtime.onInstalled.addListener(async () => {
  try {
    const tabs = await chrome.tabs.query({
      url: [
        "https://skyrim-codex.frankbrown8810.workers.dev/*",
        "http://localhost/*",
        "http://127.0.0.1/*",
      ],
    });
    for (const tab of tabs) {
      if (tab.id) {
        chrome.scripting
          .executeScript({ target: { tabId: tab.id }, files: ["app-bridge.js"] })
          .catch(() => {});
      }
    }
  } catch {
    // Ignore tab query errors
  }
});

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === "aimode-keepalive") {
    port.onDisconnect.addListener(() => {});
  }
});

chrome.tabs.onUpdated.addListener((tabId, info) => {
  if (info.status !== "complete") return;
  getActiveJob().then((job) => {
    if (job && tabId === job.renderTabId && job.submitted) {
      chrome.scripting
        .executeScript({ target: { tabId }, files: ["aimode-runner.js"] })
        .then(() => {
          chrome.tabs
            .sendMessage(tabId, {
              type: "WATCH_AIMODE_RESULT",
              renderJobId: job.renderJobId,
              selectors: job.selectors,
              refFingerprint: job.refFingerprint,
            })
            .catch(() => {});
        })
        .catch(() => {});
    }
  });
});

chrome.runtime.onMessage.addListener((msg, sender) => {
  if (!msg?.type) return;

  if (msg.type === "REQUEST_AI_RENDER") {
    const appTabId = sender.tab?.id;
    const { renderJobId, appOrigin, baseImageDataUrl, prompt } = msg;

    (async () => {
      try {
        const selectors = await loadSelectors(appOrigin);
        const tab = await chrome.tabs.create({
          url: selectors.aiModeUrl || FALLBACK_SELECTORS.aiModeUrl,
          active: false,
        });
        await setActiveJob({
          renderJobId,
          appTabId,
          renderTabId: tab.id,
          selectors,
          submitted: false,
        });

        await waitForTabComplete(tab.id);
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["aimode-runner.js"],
        });

        chrome.tabs.sendMessage(tab.id, {
          type: "START_AIMODE_JOB",
          renderJobId,
          prompt,
          baseImageDataUrl,
          selectors,
        });
      } catch (err) {
        sendToApp(appTabId, {
          type: "AI_RENDER_COMPLETE",
          renderJobId,
          error: err?.message || "Failed to launch Google AI Mode render tab.",
        });
      }
    })();
    return;
  }

  if (msg.type === "AIMODE_REF_FINGERPRINT") {
    getActiveJob().then((job) => {
      if (job?.renderJobId === msg.renderJobId && msg.refFingerprint) {
        setActiveJob({ ...job, refFingerprint: msg.refFingerprint });
      }
    });
    return;
  }

  if (msg.type === "AIMODE_SUBMITTED") {
    getActiveJob().then((job) => {
      if (job?.renderJobId === msg.renderJobId) {
        setActiveJob({ ...job, submitted: true });
      }
    });
    return;
  }

  if (msg.type === "AIMODE_STATUS") {
    getActiveJob().then((job) => {
      if (job?.renderJobId === msg.renderJobId) {
        sendToApp(job.appTabId, {
          type: "AI_RENDER_STATUS",
          renderJobId: msg.renderJobId,
          status: msg.status,
          message: msg.message,
        });
      }
    });
    return;
  }

  if (msg.type === "AIMODE_NEEDS_ATTENTION") {
    getActiveJob().then((job) => {
      if (job?.renderJobId === msg.renderJobId) {
        chrome.tabs.update(job.renderTabId, { active: true }).catch(() => {});
        sendToApp(job.appTabId, {
          type: "AI_RENDER_STATUS",
          renderJobId: msg.renderJobId,
          status: "needs-attention",
          message: msg.message || "Please complete the Google check or sign-in in the render tab.",
        });
      }
    });
    return;
  }

  if (msg.type === "AIMODE_IMAGE_FOUND") {
    getActiveJob().then(async (job) => {
      const targetAppTabId = job?.appTabId || sender.tab?.id;
      const targetRenderTabId = job?.renderTabId || sender.tab?.id;
      if (!job || job.renderJobId !== msg.renderJobId) return;

      try {
        const imageDataUrl = msg.imageDataUrl || (await urlToDataUrl(msg.imageUrl));
        if (job.refFingerprint) {
          const candBlob = await dataUrlToBlob(imageDataUrl);
          const candFp = await computeBlobFingerprint(candBlob);
          if (isSameFingerprint(candFp, job.refFingerprint)) {
            chrome.tabs
              .sendMessage(targetRenderTabId, {
                type: "REJECT_REFERENCE_DUPLICATE",
                imageUrl: msg.imageUrl,
              })
              .catch(() => {});
            return;
          }
        }
        sendToApp(targetAppTabId, {
          type: "AI_RENDER_STATUS",
          renderJobId: job.renderJobId,
          status: "saving",
          message: "Transferring finished portrait to Skyrim Codex...",
        });
        await setPendingAckTab(job.renderJobId, targetRenderTabId);
        sendToApp(targetAppTabId, {
          type: "AI_RENDER_COMPLETE",
          renderJobId: job.renderJobId,
          imageDataUrl,
        });
      } catch (err) {
        chrome.tabs.update(targetRenderTabId, { active: true }).catch(() => {});
        sendToApp(targetAppTabId, {
          type: "AI_RENDER_COMPLETE",
          renderJobId: job.renderJobId,
          error: `Could not fetch generated image cleanly (${err?.message}). Render tab left open.`,
        });
      }
    });
    return;
  }

  if (msg.type === "AIMODE_ERROR") {
    getActiveJob().then((job) => {
      if (job?.renderJobId === msg.renderJobId) {
        chrome.tabs.update(job.renderTabId, { active: true }).catch(() => {});
        sendToApp(job.appTabId, {
          type: "AI_RENDER_COMPLETE",
          renderJobId: msg.renderJobId,
          error: msg.error || "Google AI Mode render failed.",
        });
      }
    });
    return;
  }

  if (msg.type === "RENDER_SAVED_ACK") {
    (async () => {
      const tabId = await popPendingAckTab(msg.renderJobId);
      const job = await getActiveJob();
      const closeId = tabId ?? (job?.renderJobId === msg.renderJobId ? job.renderTabId : undefined);
      if (closeId) {
        chrome.tabs.remove(closeId).catch(() => {});
      }
      if (job?.renderJobId === msg.renderJobId) {
        await setActiveJob(null);
      }
    })();
    return;
  }

  if (msg.type === "FOCUS_RENDER_TAB") {
    getActiveJob().then((job) => {
      if (job?.renderTabId) {
        chrome.tabs.update(job.renderTabId, { active: true }).catch(() => {});
      }
    });
    return;
  }

  if (msg.type === "RETRY_AI_GRAB") {
    getActiveJob().then(async (job) => {
      if (!job?.renderTabId) return;
      try {
        await chrome.scripting.executeScript({
          target: { tabId: job.renderTabId },
          files: ["aimode-runner.js"],
        });
      } catch {
        // Already injected or tab navigated
      }
      chrome.tabs
        .sendMessage(job.renderTabId, {
          type: "RETRY_GRAB_IMAGE",
          renderJobId: job.renderJobId,
          refFingerprint: job.refFingerprint,
        })
        .catch(() => {});
    });
  }
});
