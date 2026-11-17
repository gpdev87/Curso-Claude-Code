import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const verifyOtp = vi.fn();
vi.mock("@/lib/supabase/server", () => ({
  isSupabaseConfigured: () => true,
  createClient: async () => ({ auth: { verifyOtp } }),
}));

import { GET } from "@/app/auth/confirm/route";

async function call(qs: string) {
  const res = await GET(new NextRequest(`http://localhost/auth/confirm${qs}`));
  return new URL(res.headers.get("location")!).pathname + new URL(res.headers.get("location")!).search;
}

beforeEach(() => verifyOtp.mockReset().mockResolvedValue({ error: null }));

describe("GET /auth/confirm", () => {
  it("redirects to next on success", async () => {
    expect(await call("?token_hash=abc&type=recovery&next=/redefinir-senha")).toBe("/redefinir-senha");
    expect(verifyOtp).toHaveBeenCalledWith({ type: "recovery", token_hash: "abc" });
  });
  it("redirects to the error page when verifyOtp fails", async () => {
    verifyOtp.mockResolvedValue({ error: { message: "x" } });
    expect(await call("?token_hash=abc&type=recovery&next=/redefinir-senha")).toBe("/entrar?erro=link");
  });
  it("rejects a missing token_hash without calling verifyOtp", async () => {
    expect(await call("?type=recovery")).toBe("/entrar?erro=link");
    expect(verifyOtp).not.toHaveBeenCalled();
  });
  it("rejects type=signup", async () => {
    expect(await call("?token_hash=abc&type=signup")).toBe("/entrar?erro=link");
    expect(verifyOtp).not.toHaveBeenCalled();
  });
  it("sanitizes next", async () => {
    expect(await call("?token_hash=abc&type=email&next=//evil.com")).toBe("/");
  });
});
