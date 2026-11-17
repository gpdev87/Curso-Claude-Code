import { describe, expect, it } from "vitest";
import {
  STREAMINGS,
  curatedProviderIds,
  parseMyStreamings,
  providerIdsFor,
  serializeMyStreamings,
} from "@/lib/streamings";

describe("parseMyStreamings", () => {
  it("keeps known chip ids and p<id> chips", () => {
    expect(parseMyStreamings("netflix,max,p190")).toEqual(["netflix", "max", "p190"]);
  });
  it("drops unknown, malformed and duplicated values without throwing", () => {
    expect(parseMyStreamings("netflix,<script>,,netflix,pxyz")).toEqual(["netflix"]);
  });
  it("decodes URL-encoded values and ignores malformed encoding", () => {
    expect(parseMyStreamings("netflix%2Cmax")).toEqual(["netflix", "max"]);
    expect(parseMyStreamings("%E0%A4%A")).toEqual([]);
  });
  it("returns empty for missing cookie", () => {
    expect(parseMyStreamings(undefined)).toEqual([]);
    expect(parseMyStreamings("")).toEqual([]);
  });
  it("round-trips with serializeMyStreamings", () => {
    expect(parseMyStreamings(serializeMyStreamings(["prime", "p7"]))).toEqual(["prime", "p7"]);
  });
});

describe("providerIdsFor", () => {
  it("merges chip provider ids with raw p<id> chips, without duplicates", () => {
    const netflix = STREAMINGS.find((s) => s.id === "netflix")!;
    const ids = providerIdsFor(["netflix", "p190", "netflix"]);
    for (const id of netflix.providerIds) expect(ids).toContain(id);
    expect(ids).toContain(190);
    expect(new Set(ids).size).toBe(ids.length);
  });
  it("returns empty for no chips", () => {
    expect(providerIdsFor([])).toEqual([]);
  });
});

describe("STREAMINGS", () => {
  it("lists the curated services in order", () => {
    expect(STREAMINGS.map((s) => s.id)).toEqual([
      "netflix", "prime", "max", "disney", "globoplay", "appletv", "paramount", "mercadoplay",
    ]);
  });
  it("covers Netflix in curatedProviderIds", () => {
    expect(curatedProviderIds().has(8)).toBe(true);
  });
});
