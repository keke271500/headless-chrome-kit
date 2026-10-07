# headless-chrome-kit

Small helpers for launching and driving headless Chrome over the Chrome
DevTools Protocol (CDP). No dependencies — just Node.js built-ins.

## Contents

- `bin/launch.js` — start a fresh headless Chrome with a remote debugging
  port and a throwaway user-data dir, then wait until the DevTools HTTP
  endpoint is ready. Prints the resolved port, profile dir and browser
  version as JSON.

- `bin/screenshot.js` — take a full-page screenshot of a URL with an
  already-running instance (started by `launch.js`): opens a new tab,
  navigates, waits for the page to settle, captures via
  `Page.captureScreenshot`.

## Requirements

- Node.js >= 22 (uses the built-in `WebSocket` and `fetch` globals)
- Chrome/Chromium installed locally

## Usage

Start a headless instance:

```
node bin/launch.js --chrome "C:\Program Files\Google\Chrome\Application\chrome.exe" --port 9222
```

Take a screenshot:

```
node bin/screenshot.js --port 9222 --url https://example.com --out page.png
```

## License

[MIT](LICENSE)
