// Lista os provedores de streaming do TMDB para o Brasil.
// Uso: node scripts/list-br-providers.mjs   (lê TMDB_READ_ACCESS_TOKEN de .env.local)
import { readFileSync } from "node:fs";

const env = readFileSync(new URL("../.env.local", import.meta.url), "utf8");
const token = /^TMDB_READ_ACCESS_TOKEN=(.+)$/m.exec(env)?.[1]?.trim();
if (!token) {
  console.error("TMDB_READ_ACCESS_TOKEN não encontrado em .env.local");
  process.exit(1);
}

const res = await fetch(
  "https://api.themoviedb.org/3/watch/providers/movie?watch_region=BR&language=pt-BR",
  { headers: { Authorization: `Bearer ${token}` } },
);
if (!res.ok) {
  console.error(`TMDB respondeu ${res.status}`);
  process.exit(1);
}
const { results } = await res.json();
results
  .sort((a, b) => (a.display_priorities?.BR ?? a.display_priority) - (b.display_priorities?.BR ?? b.display_priority))
  .forEach((p) => console.log(`${String(p.provider_id).padStart(5)}  ${p.provider_name}`));
