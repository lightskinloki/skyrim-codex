# Skyrim Codex Render Bridge (Manifest V3 Extension)

Zero-click companion extension connecting the **Skyrim TTRPG Character Manager** Appearance Studio to **Google Search AI Mode** using your own browser Google session.

## Playgroup Install (Chrome Web Store — Unlisted or Public)
1. Zip the contents of this `render-bridge-extension/` folder (so `manifest.json` is at the archive root) and upload it in the [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).
2. Set visibility to **Unlisted** (share the link with playgroups) or **Public**.
3. Set `VITE_RENDER_BRIDGE_STORE_URL` to your Chrome Web Store listing URL before building/deploying Skyrim Codex so players get a 1-click **Add to Chrome** button inside **Final Render** (no Developer Mode required).

### Chrome Web Store Review Notes & Privacy
- **Single Purpose**: Connects `skyrim-codex` tabs to a user-initiated `google.com/search?udm=50` AI Mode render tab and returns the generated portrait image to the originating tab's local IndexedDB storage.
- **Data Handling**: Zero remote servers, zero analytics, zero third-party data transmission. Only fetches `ai-mode-selectors.json` from the active Skyrim Codex origin.
- **Permissions**:
  - `tabs`: Opens and focuses/closes only the user-initiated AI Mode render tab after the app confirms save (`RENDER_SAVED_ACK`).
  - `scripting`: Injects `aimode-runner.js` into the active AI Mode render tab.
  - `storage`: Caches `ai-mode-selectors.json` and transient `chrome.storage.session` job state.

## Local Developer Testing Only
Open `chrome://extensions`, enable **Developer mode**, click **Load unpacked**, and select `render-bridge-extension/`.
