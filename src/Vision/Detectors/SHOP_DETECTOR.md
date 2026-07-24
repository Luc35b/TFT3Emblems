# Shop detector

`ShopDetector` compares each of the five normalized shop portrait regions with every champion portrait in the current `src/data/champions.json` set. It does not OCR names.

Each result is either:

```ts
{ championId: string, cost: number }
```

or `null` when the slot is empty or the best OpenCV score is below `0.72`.

## Template cache

Templates are cached in a shared static cache using:

```text
set id + champion id + resized template width + resized template height
```

This avoids reloading image files, creating canvases, grayscale conversion, and resizing on every frame. Templates are resized to the actual slot dimensions before matching so the cache remains correct when the game window resolution changes.

Call `ShopDetector.clearTemplateCache()` after changing sets or replacing CommunityDragon assets. The next detection pass will rebuild the templates for the new set and resolution.

The debug overlay outlines all five shop slots in purple so their crop dimensions can be calibrated before tuning `DEFAULT_SHOP_REGIONS`.
