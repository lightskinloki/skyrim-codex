// Injected into Google Search AI Mode tab (udm=50) to activate Create Images,
// attach reference image, submit prompt, and capture ONLY the newly generated portrait
// cleanly even while the tab remains hidden/occluded in the background.

(() => {
  if (window.__skyrimCodexRunnerActive) return;
  window.__skyrimCodexRunnerActive = true;

  let currentJob = null;
  const knownImageSrcs = new Set();
  const checkedSrcs = new Set();
  let refFingerprint = null;

  // Keep a lightweight Port open to the extension SW so Chrome resists background throttling/sleep
  try {
    chrome.runtime.connect({ name: "aimode-keepalive" });
  } catch {
    // Ignore port failure
  }

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  function queryAllDeep(selector, root = document) {
    const results = [];
    const visit = (node) => {
      if (!node || !node.querySelectorAll) return;
      try {
        results.push(...node.querySelectorAll(selector));
      } catch {
        // Ignore unsupported pseudo-selectors
      }
      const all = node.querySelectorAll("*");
      for (const el of all) {
        if (el.shadowRoot) visit(el.shadowRoot);
      }
    };
    visit(root);
    return results;
  }

  function findFirst(selectors) {
    for (const sel of selectors || []) {
      const els = queryAllDeep(sel);
      const visible = els.find((el) => {
        const rect = el.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0;
      });
      if (visible) return visible;
      if (els[0]) return els[0];
    }
    return null;
  }

  function hasCaptcha(selectors) {
    if (location.pathname.includes("/sorry")) return true;
    for (const sel of selectors || []) {
      if (queryAllDeep(sel).length > 0) return true;
    }
    return false;
  }

  function dataUrlToFile(dataUrl, filename = "skyrim-prerender.png") {
    const [header, b64] = dataUrl.split(",");
    const mime = header.match(/data:(.*?);/)?.[1] || "image/png";
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return new File([bytes], filename, { type: mime });
  }

  async function computeBitmapFingerprint(bmp) {
    try {
      const c = document.createElement("canvas");
      c.width = 16;
      c.height = 16;
      const ctx = c.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(bmp, 0, 0, 16, 16);
      const d = ctx.getImageData(0, 0, 16, 16).data;
      const fp = [];
      for (let i = 0; i < d.length; i += 4) fp.push(d[i], d[i + 1], d[i + 2]);
      return fp;
    } catch {
      return null;
    }
  }

  async function computeDataUrlFingerprint(dataUrl) {
    if (!dataUrl) return null;
    try {
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const bmp = await createImageBitmap(blob);
      const fp = await computeBitmapFingerprint(bmp);
      bmp.close();
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

  async function tryEnableCreateImages(selectors) {
    const existingChips = queryAllDeep("button, [role='button'], span");
    const alreadyActive = existingChips.some((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return false;
      const label = (el.getAttribute("aria-label") || el.textContent || "").toLowerCase();
      return (
        label.includes("remove create image") ||
        (label.includes("create image") && el.closest("form, [role='main']"))
      );
    });
    if (alreadyActive) return;

    const plusBtn = findFirst(selectors?.plusButtonSelectors);
    if (!plusBtn) return;
    plusBtn.click();

    const targets = (selectors?.createImagesMenuText || ["Create images"]).map((t) =>
      t.toLowerCase()
    );
    let createBtn = null;
    for (let i = 0; i < 10; i++) {
      await sleep(150);
      const menuItems = queryAllDeep(
        "[role='menuitem'], [role='menuitemradio'], button, div[role='button'], span"
      );
      createBtn = menuItems.find((el) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 && r.height === 0) return false;
        const txt = (el.textContent || "").trim().toLowerCase();
        return targets.some((t) => txt === t || txt.startsWith(t));
      });
      if (createBtn) break;
    }
    if (createBtn) {
      createBtn.click();
      await sleep(400);
    } else {
      document.body.click();
      await sleep(200);
    }
  }

  async function attachReferenceImage(baseImageDataUrl, selectors, inputEl) {
    if (!baseImageDataUrl) return false;
    const file = dataUrlToFile(baseImageDataUrl, "prerender-blueprint.png");
    const beforeCount = queryAllDeep("img").length;

    let fileInput = findFirst(selectors?.fileInputSelectors);
    if (!fileInput) {
      const plusBtn = findFirst(selectors?.plusButtonSelectors);
      if (plusBtn) {
        plusBtn.click();
        await sleep(350);
        fileInput = findFirst(selectors?.fileInputSelectors);
      }
    }

    if (fileInput) {
      const dt = new DataTransfer();
      dt.items.add(file);
      fileInput.files = dt.files;
      fileInput.dispatchEvent(new Event("change", { bubbles: true }));
      fileInput.dispatchEvent(new Event("input", { bubbles: true }));
      for (let i = 0; i < 10; i++) {
        await sleep(200);
        if (queryAllDeep("img").length > beforeCount) break;
      }
      await sleep(350);
      return true;
    }

    if (inputEl) {
      const dt = new DataTransfer();
      dt.items.add(file);
      const pasteEvent = new ClipboardEvent("paste", {
        bubbles: true,
        cancelable: true,
        clipboardData: dt,
      });
      inputEl.focus();
      inputEl.dispatchEvent(pasteEvent);
      await sleep(750);
      return true;
    }

    return false;
  }

  function setPromptText(inputEl, prompt) {
    if (!inputEl) return false;
    inputEl.focus();
    if (inputEl.tagName === "TEXTAREA" || inputEl.tagName === "INPUT") {
      const proto = Object.getPrototypeOf(inputEl);
      const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
      if (setter) setter.call(inputEl, prompt);
      else inputEl.value = prompt;
      inputEl.dispatchEvent(new Event("input", { bubbles: true }));
      inputEl.dispatchEvent(new Event("change", { bubbles: true }));
      return true;
    }
    if (inputEl.isContentEditable) {
      inputEl.textContent = prompt;
      inputEl.dispatchEvent(
        new InputEvent("input", { bubbles: true, inputType: "insertText", data: prompt })
      );
      return true;
    }
    return false;
  }

  function snapshotImages() {
    for (const img of queryAllDeep("img")) {
      const s = img.currentSrc || img.src;
      if (s) knownImageSrcs.add(s);
    }
  }

  function isIgnoredUrl(src) {
    if (!src) return true;
    if (src.startsWith("data:image/svg") || src.startsWith("data:image/gif")) return true;
    return (
      src.includes("branding") ||
      src.includes("googlelogo") ||
      src.includes("favicon") ||
      src.includes("googleusercontent.com/a/")
    );
  }

  function findCandidateImages({ ignoreKnown = true } = {}) {
    const imgs = queryAllDeep("img").reverse();
    const out = [];
    for (const img of imgs) {
      const src = img.currentSrc || img.src;
      if (!src || isIgnoredUrl(src)) continue;
      if (ignoreKnown && knownImageSrcs.has(src)) continue;
      const alt = (img.alt || "").toLowerCase();
      if (alt.includes("uploaded") || alt.includes("attachment") || alt.includes("blueprint")) {
        continue;
      }

      // Force Chrome to decode lazy images even while this tab sits in the background
      if (img.loading === "lazy") img.loading = "eager";
      if (img.decoding === "async") img.decoding = "sync";

      // Accept already-loaded >= 256px images OR newly mounted external/blob/data images to fetch-check
      if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
        if (img.naturalWidth < 256 || img.naturalHeight < 256) continue;
        out.push(img);
      } else if (!checkedSrcs.has(src)) {
        out.push(img);
      }
    }
    return out;
  }

  async function extractImagePayload(img) {
    const imageUrl = img.currentSrc || img.src;
    if (imageUrl.startsWith("data:")) {
      const fp = await computeDataUrlFingerprint(imageUrl);
      if (isSameFingerprint(fp, refFingerprint)) return { isReferenceDuplicate: true, imageUrl };
      return { imageDataUrl: imageUrl, imageUrl };
    }

    // Direct fetch + ImageBitmap works even when Chrome pauses background-tab <img> rendering!
    try {
      const res = await fetch(imageUrl, { credentials: "include" });
      if (res.ok) {
        const blob = await res.blob();
        if (blob.size > 1500 && blob.type.startsWith("image/")) {
          const bmp = await createImageBitmap(blob);
          const w = bmp.width;
          const h = bmp.height;
          if (w < 256 || h < 256) {
            bmp.close();
            return { tooSmall: true, imageUrl };
          }
          const fp = await computeBitmapFingerprint(bmp);
          bmp.close();
          if (isSameFingerprint(fp, refFingerprint)) {
            return { isReferenceDuplicate: true, imageUrl };
          }
          const dataUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () =>
              typeof reader.result === "string"
                ? resolve(reader.result)
                : reject(new Error("Read failed"));
            reader.onerror = () => reject(new Error("FileReader failed"));
            reader.readAsDataURL(blob);
          });
          return { imageDataUrl: dataUrl, imageUrl };
        }
      }
    } catch {
      // Fall through to canvas or SW fetch
    }

    if (img.complete && img.naturalWidth >= 256 && img.naturalHeight >= 256) {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const dataUrl = canvas.toDataURL("image/png");
          if (dataUrl && dataUrl.length > 500) {
            const fp = await computeDataUrlFingerprint(dataUrl);
            if (isSameFingerprint(fp, refFingerprint)) {
              return { isReferenceDuplicate: true, imageUrl };
            }
            return { imageDataUrl: dataUrl, imageUrl };
          }
        }
      } catch {
        // Cross-origin tainted canvas — background.js will verify fingerprint and fetch imageUrl
      }
      return { imageUrl };
    }

    return null;
  }

  async function emitFoundImage(renderJobId, img) {
    const src = img.currentSrc || img.src;
    if (!src) return false;

    if (img.complete && typeof img.decode === "function") {
      await img.decode().catch(() => {});
    }
    const payload = await extractImagePayload(img);
    if (!payload) return false;
    checkedSrcs.add(src);
    if (payload.isReferenceDuplicate || payload.tooSmall) {
      knownImageSrcs.add(src);
      return false;
    }

    chrome.runtime.sendMessage({
      type: "AIMODE_IMAGE_FOUND",
      renderJobId,
      ...payload,
    });
    return true;
  }

  function watchForResult(job) {
    let resolved = false;
    let checking = false;
    let observer = null;
    let interval = null;

    const tryResolve = async () => {
      if (resolved || checking) return;
      checking = true;
      try {
        if (hasCaptcha(job.selectors?.captchaSelectors)) {
          chrome.runtime.sendMessage({
            type: "AIMODE_NEEDS_ATTENTION",
            renderJobId: job.renderJobId,
            message: "Google requested verification in the render tab.",
          });
          return;
        }
        const candidates = findCandidateImages({ ignoreKnown: true });
        for (const img of candidates) {
          if (!img.complete) {
            img.addEventListener("load", () => void tryResolve(), { once: true });
          }
          // Scroll candidate into view in the background tab to nudge Chrome eager decode
          try {
            img.scrollIntoView({ block: "nearest" });
          } catch {
            // Ignore scroll errors
          }
          const sent = await emitFoundImage(job.renderJobId, img);
          if (sent) {
            resolved = true;
            if (observer) observer.disconnect();
            if (interval) clearInterval(interval);
            break;
          }
        }
      } finally {
        checking = false;
      }
    };

    observer = new MutationObserver(() => {
      void tryResolve();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["src", "srcset"],
    });

    interval = setInterval(() => {
      void tryResolve();
    }, 1000);

    setTimeout(() => {
      if (!resolved) {
        clearInterval(interval);
        observer.disconnect();
      }
    }, 180000);
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "REJECT_REFERENCE_DUPLICATE" && msg.imageUrl) {
      knownImageSrcs.add(msg.imageUrl);
      if (currentJob) watchForResult(currentJob);
      return;
    }

    if (msg?.type === "RETRY_GRAB_IMAGE" && msg.renderJobId) {
      if (msg.refFingerprint && !refFingerprint) refFingerprint = msg.refFingerprint;
      checkedSrcs.clear();
      (async () => {
        const candidates = [
          ...findCandidateImages({ ignoreKnown: true }),
          ...findCandidateImages({ ignoreKnown: false }),
        ];
        for (const img of candidates) {
          const sent = await emitFoundImage(msg.renderJobId, img);
          if (sent) return;
        }
        chrome.runtime.sendMessage({
          type: "AIMODE_ERROR",
          renderJobId: msg.renderJobId,
          error:
            "No new generated portrait detected yet on the Google AI Mode tab (only the reference upload was present).",
        });
      })();
      return;
    }

    if (msg?.type === "WATCH_AIMODE_RESULT" && msg.renderJobId) {
      currentJob = msg;
      if (msg.refFingerprint) refFingerprint = msg.refFingerprint;
      watchForResult(msg);
      return;
    }

    if (msg?.type !== "START_AIMODE_JOB") return;
    currentJob = msg;

    (async () => {
      const { renderJobId, prompt, baseImageDataUrl, selectors } = msg;
      refFingerprint = await computeDataUrlFingerprint(baseImageDataUrl);
      chrome.runtime.sendMessage({
        type: "AIMODE_REF_FINGERPRINT",
        renderJobId,
        refFingerprint,
      });

      await sleep(800);

      if (hasCaptcha(selectors?.captchaSelectors)) {
        chrome.runtime.sendMessage({
          type: "AIMODE_NEEDS_ATTENTION",
          renderJobId,
          message:
            "Please complete the Google check in the opened tab; rendering will resume automatically.",
        });
      }

      snapshotImages();

      chrome.runtime.sendMessage({
        type: "AIMODE_STATUS",
        renderJobId,
        status: "attaching",
        message: "Activating Create Images & attaching Stage 1 collage...",
      });

      const inputEl = findFirst(selectors?.promptInputSelectors);
      if (!inputEl) {
        chrome.runtime.sendMessage({
          type: "AIMODE_NEEDS_ATTENTION",
          renderJobId,
          message: "Sign in to Google or open AI Mode in the render tab to continue.",
        });
        watchForResult(msg);
        return;
      }

      await tryEnableCreateImages(selectors);
      await attachReferenceImage(baseImageDataUrl, selectors, inputEl);
      snapshotImages();

      setPromptText(inputEl, prompt);
      await sleep(350);

      chrome.runtime.sendMessage({
        type: "AIMODE_STATUS",
        renderJobId,
        status: "generating",
        message: "Generating unified portrait in Google AI Mode...",
      });

      const submitBtn = findFirst(selectors?.submitButtonSelectors);
      if (submitBtn) {
        submitBtn.click();
      } else {
        inputEl.dispatchEvent(
          new KeyboardEvent("keydown", { key: "Enter", code: "Enter", keyCode: 13, bubbles: true })
        );
      }

      chrome.runtime.sendMessage({ type: "AIMODE_SUBMITTED", renderJobId });
      await sleep(3500);
      watchForResult(msg);
    })();
  });
})();
