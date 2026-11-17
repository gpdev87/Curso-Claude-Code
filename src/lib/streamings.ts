export type StreamingChip = { id: string; name: string; providerIds: number[] };

// IDs de provedor do TMDB para o Brasil (watch_region=BR).
// Cada chip agrupa as variantes do mesmo serviço (com anúncios, canal Amazon…).
// Conferidos com `node scripts/list-br-providers.mjs` em 2026-11-17.
export const STREAMINGS: StreamingChip[] = [
  { id: "netflix", name: "Netflix", providerIds: [8, 1796] }, // + Standard with Ads
  { id: "prime", name: "Prime Video", providerIds: [119, 2100] }, // + with Ads
  { id: "max", name: "HBO Max", providerIds: [1899, 1825] }, // + Amazon Channel
  { id: "disney", name: "Disney+", providerIds: [337] },
  { id: "globoplay", name: "Globoplay", providerIds: [307] },
  { id: "appletv", name: "Apple TV", providerIds: [350, 2243] }, // + Amazon Channel
  { id: "paramount", name: "Paramount+", providerIds: [531, 582, 2303] }, // + Amazon Channel, Premium
  { id: "mercadoplay", name: "Mercado Play", providerIds: [2302] },
];

export const COOKIE_NAME = "meus_streamings";

const KNOWN_CHIPS = new Set(STREAMINGS.map((s) => s.id));
const RAW_CHIP = /^p(\d+)$/;

export function parseMyStreamings(value: string | undefined): string[] {
  if (!value) return [];
  let decoded: string;
  try {
    decoded = decodeURIComponent(value);
  } catch {
    return [];
  }
  const result: string[] = [];
  for (const part of decoded.split(",")) {
    const id = part.trim();
    if ((KNOWN_CHIPS.has(id) || RAW_CHIP.test(id)) && !result.includes(id)) result.push(id);
  }
  return result;
}

export function serializeMyStreamings(ids: string[]): string {
  return ids.join(",");
}

/** Grava a escolha no navegador (1 ano). Só usar no cliente. */
export function writeMyStreamingsCookie(ids: string[]): void {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(serializeMyStreamings(ids))}; path=/; max-age=31536000; samesite=lax`;
}

export function providerIdsFor(chipIds: string[]): number[] {
  const ids = new Set<number>();
  for (const chipId of chipIds) {
    const chip = STREAMINGS.find((s) => s.id === chipId);
    if (chip) chip.providerIds.forEach((id) => ids.add(id));
    const raw = RAW_CHIP.exec(chipId);
    if (raw) ids.add(Number(raw[1]));
  }
  return [...ids];
}

export function curatedProviderIds(): Set<number> {
  return new Set(STREAMINGS.flatMap((s) => s.providerIds));
}
