import { describe, expect, it } from "vitest";
import {
  formatRuntime,
  imageUrl,
  movieSlug,
  parseMovieSlug,
  releaseYear,
} from "@/lib/format";

describe("formatRuntime", () => {
  it("formats hours with zero-padded minutes", () => {
    expect(formatRuntime(180)).toBe("3h00");
    expect(formatRuntime(95)).toBe("1h35");
  });
  it("formats under one hour as minutes", () => {
    expect(formatRuntime(45)).toBe("45min");
  });
  it("returns null for missing runtime", () => {
    expect(formatRuntime(0)).toBeNull();
    expect(formatRuntime(null)).toBeNull();
  });
});

describe("releaseYear", () => {
  it("extracts the year", () => {
    expect(releaseYear("2023-07-19")).toBe(2023);
  });
  it("returns null for empty dates", () => {
    expect(releaseYear("")).toBeNull();
    expect(releaseYear(null)).toBeNull();
  });
});

describe("movieSlug", () => {
  it("builds id-title slugs", () => {
    expect(movieSlug(872585, "Oppenheimer")).toBe("872585-oppenheimer");
    expect(movieSlug(1, "O Auto da Compadecida")).toBe("1-o-auto-da-compadecida");
  });
  it("strips accents and punctuation", () => {
    expect(movieSlug(693134, "Duna: Parte Dois")).toBe("693134-duna-parte-dois");
    expect(movieSlug(5, "Ação & Reação!")).toBe("5-acao-reacao");
  });
});

describe("parseMovieSlug", () => {
  it("reads the leading id", () => {
    expect(parseMovieSlug("872585-qualquer-coisa")).toBe(872585);
    expect(parseMovieSlug("872585")).toBe(872585);
  });
  it("rejects invalid slugs", () => {
    expect(parseMovieSlug("abc")).toBeNull();
    expect(parseMovieSlug("0-x")).toBeNull();
  });
});

describe("imageUrl", () => {
  it("builds TMDB image URLs", () => {
    expect(imageUrl("/abc.jpg", "w342")).toBe("https://image.tmdb.org/t/p/w342/abc.jpg");
  });
  it("returns null without a path", () => {
    expect(imageUrl(null, "w342")).toBeNull();
  });
});
