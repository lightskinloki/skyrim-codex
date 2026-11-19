export type RenderBridgeStatus =
  | "idle"
  | "starting"
  | "attaching"
  | "generating"
  | "needs-attention"
  | "saving"
  | "error";

export interface RenderBridgeResult {
  imageDataUrl: string;
  renderJobId: string;
}

export const RENDER_BRIDGE_STORE_URL =
  (import.meta.env.VITE_RENDER_BRIDGE_STORE_URL as string | undefined)?.trim() || "";

const EXTENSION_PROBE_TIMEOUT_MS = 900;

export function pingRenderBridge(): Promise<boolean> {
  return new Promise((resolve) => {
    const reqId = `ping_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    let done = false;

    const handler = (event: MessageEvent) => {
      if (event.source !== window) return;
      if (event.data?.type === "RENDER_BRIDGE_PONG" && event.data?.reqId === reqId) {
        done = true;
        window.removeEventListener("message", handler);
        resolve(true);
      }
    };

    window.addEventListener("message", handler);
    window.postMessage({ type: "RENDER_BRIDGE_PING", reqId }, "*");

    window.setTimeout(() => {
      if (!done) {
        window.removeEventListener("message", handler);
        resolve(false);
      }
    }, EXTENSION_PROBE_TIMEOUT_MS);
  });
}

const handledJobIds = new Set<string>();

export function requestAiRender(params: {
  baseImageDataUrl: string;
  prompt: string;
  onStatus?: (status: RenderBridgeStatus, message?: string) => void;
}): Promise<RenderBridgeResult> {
  const renderJobId = `render_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  return new Promise((resolve, reject) => {
    const timeoutId = window.setTimeout(() => {
      window.removeEventListener("message", handler);
      reject(
        new Error(
          "Timed out waiting for Google AI Mode render. Use 'Focus Render Tab' or 'Retry Grab' if the image finished loading."
        )
      );
    }, 180000);

    const handler = (event: MessageEvent) => {
      if (event.source !== window || event.data?.renderJobId !== renderJobId) return;

      if (event.data?.type === "AI_RENDER_STATUS") {
        params.onStatus?.(event.data.status, event.data.message);
      } else if (event.data?.type === "AI_RENDER_COMPLETE") {
        window.clearTimeout(timeoutId);
        window.removeEventListener("message", handler);
        if (event.data.error || !event.data.imageDataUrl) {
          reject(new Error(event.data.error || "Render failed without returning an image."));
        } else {
          handledJobIds.add(renderJobId);
          resolve({ imageDataUrl: event.data.imageDataUrl, renderJobId });
        }
      }
    };

    window.addEventListener("message", handler);
    params.onStatus?.("starting", "Opening background Google AI Mode render tab...");
    window.postMessage(
      {
        type: "REQUEST_AI_RENDER",
        renderJobId,
        appOrigin: window.location.origin,
        baseImageDataUrl: params.baseImageDataUrl,
        prompt: params.prompt,
      },
      "*"
    );
  });
}

export function subscribeLateRenderComplete(
  onComplete: (result: RenderBridgeResult) => void,
  onError?: (error: string) => void
): () => void {
  const handler = (event: MessageEvent) => {
    if (event.source !== window || event.data?.type !== "AI_RENDER_COMPLETE") return;
    const jobId = event.data.renderJobId;
    if (!jobId || handledJobIds.has(jobId)) return;

    if (event.data.imageDataUrl && !event.data.error) {
      handledJobIds.add(jobId);
      onComplete({ imageDataUrl: event.data.imageDataUrl, renderJobId: jobId });
    } else if (event.data.error) {
      onError?.(event.data.error);
    }
  };
  window.addEventListener("message", handler);
  return () => window.removeEventListener("message", handler);
}

export function sendRenderSavedAck(renderJobId: string): void {
  window.postMessage({ type: "RENDER_SAVED_ACK", renderJobId }, "*");
}

export function focusRenderTab(): void {
  window.postMessage({ type: "FOCUS_RENDER_TAB" }, "*");
}

export function retryRenderGrab(): void {
  window.postMessage({ type: "RETRY_AI_GRAB" }, "*");
}
