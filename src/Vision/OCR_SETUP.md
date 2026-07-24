# OCR backend

The vision detectors use Tesseract.js through `OCRService`.

## First run

Run the app with an internet connection the first time. Tesseract.js downloads and caches the English worker, core, and `eng` language data on its first OCR request. Later runs reuse the cache.

```powershell
npm install
npm run tauri dev
```

The detectors are asynchronous because OCR runs in a worker:

```ts
const stage = await stageDetector.detect(frame);
const gold = await goldDetector.detect(frame);
```

If the app must work fully offline, pre-cache the Tesseract worker/core/language files and configure `createWorker` with local `workerPath`, `corePath`, and `langPath` values in `OCRService.ts`.

The service restricts recognition to numeric characters and stage separators (`0-9`, `-`, `:`, `/`, and spaces), which reduces false positives in these small UI regions.
