import axios from "axios";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type CDragonChampion = { apiName: string; name: string; cost: number; traits: string[]; squareIcon?: string };
type CDragonTrait = { apiName: string; name: string; icon?: string };
type CDragonSet = { champions?: CDragonChampion[]; traits?: CDragonTrait[] };
type CDragonApi = {
  sets?: Record<string, CDragonSet>;
  setData?: Record<string, { champions?: unknown[]; traits?: unknown[]; items?: string[]; augments?: string[] }>;
};
type ChampionAsset = { name: string; character_record?: { character_id?: string; display_name?: string; rarity?: number; traits?: string[]; squareIconPath?: string } };
type TraitAsset = { trait_id: string; display_name: string; set: string; icon_path?: string };
type ItemAsset = { nameId?: string; name: string; squareIconPath?: string; description?: string };
type ImageKind = "champions" | "traits" | "items" | "augments" | "anomalies";
type ImageManifest = Record<ImageKind, Record<string, string>>;

const rootDirectory = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dataDirectory = resolve(rootDirectory, "src/data");
const imageDirectory = resolve(rootDirectory, "public/assets/tft");
const rawBaseUrl = "https://raw.communitydragon.org/latest";
const apiBaseUrl = `${rawBaseUrl}/plugins/rcp-be-lol-game-data/global/default/v1`;
const requestedSet = process.argv[2];

function toId(value: unknown) {
  return String(value).replace(/^TFT\d+_/, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/([a-z0-9])([A-Z])/g, "$1_$2").replace(/^_+|_+$/g, "").toLowerCase();
}

function selectSet(sets: Record<string, CDragonSet>, setId?: string) {
  if (setId) {
    const set = sets[setId];
    if (!set) throw new Error(`Set \"${setId}\" was not found.`);
    return { id: setId, set };
  }
  const selected = Object.entries(sets).filter(([, set]) => set.champions?.length && set.traits?.length).sort(([a], [b]) => Number(b) - Number(a))[0];
  if (!selected) throw new Error("No playable TFT set was found in the CommunityDragon response.");
  return { id: selected[0], set: selected[1] };
}

function assetUrl(path?: string) {
  if (!path) return undefined;
  const assetPath = path.replace(/^\/lol-game-data\/assets\/assets\//i, "assets/").replace(/^\/lol-game-data\/assets\//i, "assets/").toLowerCase();
  return `${rawBaseUrl}/plugins/rcp-be-lol-game-data/global/default/${assetPath}`;
}

function selectedAssets(assets: ItemAsset[], ids: string[]) {
  const byId = new Map(assets.filter((asset) => asset.nameId).map((asset) => [asset.nameId!, asset]));
  return ids.map((id) => byId.get(id)).filter((asset): asset is ItemAsset => Boolean(asset));
}

async function writeJson(filename: string, value: unknown) {
  await writeFile(resolve(dataDirectory, filename), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function downloadImages(images: { kind: ImageKind; id: string; url?: string }[]) {
  const manifest: ImageManifest = { champions: {}, traits: {}, items: {}, augments: {}, anomalies: {} };
  const queue = [...new Map(images.filter((image) => image.url).map((image) => [`${image.kind}:${image.id}`, image])).values()];
  let downloaded = 0;

  async function worker() {
    while (queue.length) {
      const image = queue.pop();
      if (!image?.url) continue;
      const relativePath = `/assets/tft/${image.kind}/${image.id}.png`;
      try {
        const response = await axios.get<ArrayBuffer>(image.url, { responseType: "arraybuffer", timeout: 30_000 });
        await writeFile(resolve(imageDirectory, image.kind, `${image.id}.png`), Buffer.from(response.data));
        manifest[image.kind][image.id] = relativePath;
        downloaded += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.warn(`Skipped image ${image.kind}/${image.id}: ${message}`);
      }
    }
  }

  await Promise.all(Array.from({ length: 12 }, worker));
  return { manifest, downloaded };
}

async function main() {
  const [{ data: tft }, { data: championAssets }, { data: traitAssets }, { data: itemAssets }] = await Promise.all([
    axios.get<CDragonApi>(`${rawBaseUrl}/cdragon/tft/en_us.json`, { timeout: 30_000 }),
    axios.get<ChampionAsset[]>(`${apiBaseUrl}/tftchampions.json`, { timeout: 30_000 }),
    axios.get<TraitAsset[]>(`${apiBaseUrl}/tfttraits.json`, { timeout: 30_000 }),
    axios.get<ItemAsset[]>(`${apiBaseUrl}/tftitems.json`, { timeout: 30_000 }),
  ]);
  if (!tft.sets || !tft.setData) throw new Error("CommunityDragon returned incomplete TFT data.");

  const { id: setId, set } = selectSet(tft.sets, requestedSet);
  const setData = tft.setData[setId];
  if (!setData) throw new Error(`No asset manifest is available for set ${setId}.`);
  const championImages = new Map(championAssets.map((asset) => [asset.character_record?.character_id, assetUrl(asset.character_record?.squareIconPath)]));
  const traitImages = new Map(traitAssets.map((asset) => [asset.trait_id, assetUrl(asset.icon_path)]));
  const traits = (set.traits ?? []).map((trait) => ({ id: toId(trait.apiName), name: trait.name, icon: traitImages.get(trait.apiName) }));
  const traitIds = new Set(traits.map((trait) => trait.id));
  const champions = (set.champions ?? [])
    .map((champion) => ({
      id: toId(champion.apiName),
      name: champion.name,
      cost: champion.cost,
      traits: champion.traits.map(toId).filter((trait) => traitIds.has(trait)),
      icon: championImages.get(champion.apiName),
    }))
    .filter((champion) => champion.traits.length > 0)
    .sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
  const items = selectedAssets(itemAssets, setData.items ?? []).map((item) => ({ id: toId(item.nameId!), name: item.name, description: item.description ?? "", icon: assetUrl(item.squareIconPath) }));
  const augments = selectedAssets(itemAssets, setData.augments ?? []).map((item) => ({ id: toId(item.nameId!), name: item.name, description: item.description ?? "", icon: assetUrl(item.squareIconPath) }));
  const anomalies = itemAssets.filter((item) => /anomaly/i.test(`${item.nameId ?? ""} ${item.name} ${item.description ?? ""}`)).map((item) => ({ id: toId(item.nameId ?? item.name), name: item.name, description: item.description ?? "", icon: assetUrl(item.squareIconPath) }));

  if (!champions.length || !traits.length) throw new Error(`Set ${setId} did not contain usable champions and traits.`);
  await Promise.all([dataDirectory, imageDirectory, ...Object.keys({ champions: 0, traits: 0, items: 0, augments: 0, anomalies: 0 }).map((kind) => resolve(imageDirectory, kind))].map((directory) => mkdir(directory, { recursive: true })));
  const { manifest, downloaded } = await downloadImages([
    ...champions.map((entry) => ({ kind: "champions" as const, id: entry.id, url: entry.icon })),
    ...traits.map((entry) => ({ kind: "traits" as const, id: entry.id, url: entry.icon })),
    ...items.map((entry) => ({ kind: "items" as const, id: entry.id, url: entry.icon })),
    ...augments.map((entry) => ({ kind: "augments" as const, id: entry.id, url: entry.icon })),
    ...anomalies.map((entry) => ({ kind: "anomalies" as const, id: entry.id, url: entry.icon })),
  ]);

  await Promise.all([
    writeJson("champions.json", champions.map(({ icon, ...entry }) => ({ ...entry, image: manifest.champions[entry.id] }))),
    writeJson("traits.json", traits.map(({ icon, ...entry }) => ({ ...entry, image: manifest.traits[entry.id] }))),
    writeJson("items.json", items.map(({ icon, ...entry }) => ({ ...entry, image: manifest.items[entry.id] }))),
    writeJson("augments.json", augments.map(({ icon, ...entry }) => ({ ...entry, image: manifest.augments[entry.id] }))),
    writeJson("anomalies.json", anomalies.map(({ icon, ...entry }) => ({ ...entry, image: manifest.anomalies[entry.id] }))),
    writeJson("images.json", manifest),
    writeJson("metadata.json", { set: setId, updatedAt: new Date().toISOString(), source: `${rawBaseUrl}/cdragon/tft/en_us.json`, counts: { champions: champions.length, traits: traits.length, items: items.length, augments: augments.length, anomalies: anomalies.length, images: downloaded } }),
  ]);
  console.log(`Updated TFT set ${setId}: ${champions.length} champions, ${traits.length} traits, ${items.length} items, ${augments.length} augments, ${anomalies.length} anomalies, and ${downloaded} images.`);
}

main().catch((error: unknown) => {
  console.error(`Unable to update TFT data: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
