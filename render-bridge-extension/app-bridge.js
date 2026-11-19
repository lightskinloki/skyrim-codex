// Content script running on Skyrim Codex tab to relay messages to/from extension service worker.

if (!window.__SKYRIM_CODEX_BRIDGE_LOADED__) {
  window.__SKYRIM_CODEX_BRIDGE_LOADED__ = true;

  window.addEventListener("message", (event) => {
    if (event.source !== window || !event.data?.type) return;

    const { type } = event.data;

    if (type === "RENDER_BRIDGE_PING") {
      window.postMessage({ type: "RENDER_BRIDGE_PONG", reqId: event.data.reqId }, "*");
      return;
    }

    if (
      type === "REQUEST_AI_RENDER" ||
      type === "RENDER_SAVED_ACK" ||
      type === "FOCUS_RENDER_TAB" ||
      type === "RETRY_AI_GRAB"
    ) {
      chrome.runtime.sendMessage(event.data);
    }
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg?.type) return;
    if (msg.type === "AI_RENDER_STATUS" || msg.type === "AI_RENDER_COMPLETE") {
      window.postMessage(msg, "*");
    }
  });
}
