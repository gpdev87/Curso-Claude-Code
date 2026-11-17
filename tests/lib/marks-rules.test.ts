import { describe, expect, it } from "vitest";
import { isValidMarkMovie, toggleStatus } from "@/lib/marks-rules";

describe("toggleStatus", () => {
  it("marks, unmarks and switches", () => {
    expect(toggleStatus(null, "quero")).toBe("quero");
    expect(toggleStatus("quero", "quero")).toBeNull();
    expect(toggleStatus("quero", "visto")).toBe("visto");
  });
});

describe("isValidMarkMovie", () => {
  const ok = { movieId: 1, title: "X", posterPath: "/a.jpg" };
  it("accepts valid movies", () => {
    expect(isValidMarkMovie(ok)).toBe(true);
    expect(isValidMarkMovie({ ...ok, posterPath: null })).toBe(true);
  });
  it("rejects invalid movies", () => {
    expect(isValidMarkMovie({ ...ok, movieId: -1 })).toBe(false);
    expect(isValidMarkMovie({ ...ok, movieId: 2.5 })).toBe(false);
    expect(isValidMarkMovie({ ...ok, movieId: "1" })).toBe(false);
    expect(isValidMarkMovie({ ...ok, title: "" })).toBe(false);
    expect(isValidMarkMovie({ ...ok, title: "a".repeat(301) })).toBe(false);
    expect(isValidMarkMovie({ ...ok, posterPath: "http://x" })).toBe(false);
    expect(isValidMarkMovie({ ...ok, posterPath: "/" + "a".repeat(200) })).toBe(false);
    expect(isValidMarkMovie(null)).toBe(false);
  });
});
