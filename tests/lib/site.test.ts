import { describe, expect, it } from "vitest";
import { siteUrl } from "@/lib/site";

describe("siteUrl", () => {
  it("prefers the explicit NEXT_PUBLIC_SITE_URL without trailing slash", () => {
    expect(siteUrl({ NEXT_PUBLIC_SITE_URL: "https://cinecasa.app/", VERCEL_PROJECT_PRODUCTION_URL: "x.vercel.app" })).toBe(
      "https://cinecasa.app",
    );
  });
  it("falls back to the Vercel production domain", () => {
    expect(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "cinecasa.vercel.app" })).toBe("https://cinecasa.vercel.app");
  });
  it("uses localhost only when nothing is configured", () => {
    expect(siteUrl({})).toBe("http://localhost:3000");
  });
});
