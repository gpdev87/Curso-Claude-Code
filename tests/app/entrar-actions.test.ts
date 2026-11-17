import { beforeEach, describe, expect, it, vi } from "vitest";

const store = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => (store.has(name) ? { name, value: store.get(name)! } : undefined),
    // Como o Next, grava o valor codificado: parseMyStreamings precisa decodificar.
    set: (name: string, value: string) => void store.set(name, encodeURIComponent(value)),
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`REDIRECT:${url}`);
  },
}));

const auth = {
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
  getUser: vi.fn(),
};
const upsert = vi.fn();
const maybeSingle = vi.fn();
const supabase = {
  auth,
  from: vi.fn(() => ({
    select: () => ({ eq: () => ({ maybeSingle }) }),
    upsert,
  })),
};
const configured = vi.hoisted(() => ({ value: true }));
vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => supabase,
  isSupabaseConfigured: () => configured.value,
}));

import { requestPasswordReset, signIn, signOut, signUp, updatePassword } from "@/app/entrar/actions";
import { COOKIE_NAME, parseMyStreamings } from "@/lib/streamings";

function form(fields: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.set(k, v);
  return f;
}
const ok = { data: { user: { id: "u1" } }, error: null };

beforeEach(() => {
  store.clear();
  vi.clearAllMocks();
  configured.value = true;
  auth.getUser.mockResolvedValue({ data: { user: { id: "u1" } }, error: null });
  maybeSingle.mockResolvedValue({ data: { streamings: [] }, error: null });
  upsert.mockResolvedValue({ error: null });
});

describe("sem Supabase configurado", () => {
  it("devolve erro em vez de lançar", async () => {
    configured.value = false;
    const msg = "Contas indisponíveis no momento.";
    expect(await signIn(undefined, form({ email: "a@b.com", password: "x" }))).toEqual({ error: msg, email: "a@b.com" });
    expect(await signUp(undefined, form({ email: "a@b.com", password: "x" }))).toEqual({ error: msg, email: "a@b.com" });
    expect(await requestPasswordReset(undefined, form({ email: "a@b.com" }))).toEqual({ error: msg, email: "a@b.com" });
    expect(await updatePassword(undefined, form({ password: "x" }))).toEqual({ error: msg, email: "" });
  });
});

describe("signIn", () => {
  it("returns a friendly error on wrong credentials", async () => {
    auth.signInWithPassword.mockResolvedValue({ data: {}, error: { code: "invalid_credentials" } });
    const r = await signIn(undefined, form({ email: "a@b.com", password: "x", next: "/" }));
    expect(r).toEqual({ error: "Email ou senha incorretos.", email: "a@b.com" });
  });

  it("redirects to / when next is external", async () => {
    auth.signInWithPassword.mockResolvedValue(ok);
    await expect(signIn(undefined, form({ email: "a@b.com", password: "123456", next: "//evil.com" }))).rejects.toThrow("REDIRECT:/");
  });

  it("redirects to a safe next", async () => {
    auth.signInWithPassword.mockResolvedValue(ok);
    await expect(signIn(undefined, form({ email: "a@b.com", password: "123456", next: "/filme/1-x" }))).rejects.toThrow("REDIRECT:/filme/1-x");
  });

  it("account with streamings wins over the device cookie, without upsert", async () => {
    auth.signInWithPassword.mockResolvedValue(ok);
    maybeSingle.mockResolvedValue({ data: { streamings: ["max"] }, error: null });
    store.set(COOKIE_NAME, "netflix");
    await expect(signIn(undefined, form({ email: "a@b.com", password: "123456" }))).rejects.toThrow("REDIRECT:/");
    expect(parseMyStreamings(store.get(COOKIE_NAME))).toEqual(["max"]);
    expect(upsert).not.toHaveBeenCalled();
  });

  it("proceeds to redirect when reading user_settings fails", async () => {
    auth.signInWithPassword.mockResolvedValue(ok);
    maybeSingle.mockRejectedValue(new Error("boom"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(signIn(undefined, form({ email: "a@b.com", password: "123456" }))).rejects.toThrow("REDIRECT:/");
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe("signUp", () => {
  it("saves the device streamings to the new account and keeps the cookie", async () => {
    auth.signUp.mockResolvedValue(ok);
    store.set(COOKIE_NAME, "netflix");
    await expect(signUp(undefined, form({ email: "a@b.com", password: "123456", next: "/" }))).rejects.toThrow("REDIRECT:/");
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "u1", streamings: ["netflix"] }));
    expect(parseMyStreamings(store.get(COOKIE_NAME))).toEqual(["netflix"]);
  });

  it("maps errors", async () => {
    auth.signUp.mockResolvedValue({ data: {}, error: { code: "weak_password" } });
    const r = await signUp(undefined, form({ email: "a@b.com", password: "1" }));
    expect(r).toEqual({ error: "A senha precisa ter pelo menos 6 caracteres.", email: "a@b.com" });
  });
});

describe("requestPasswordReset", () => {
  it("gives the same message whether or not the account exists", async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: null });
    const r = await requestPasswordReset(undefined, form({ email: "nao@existe.com" }));
    expect(r).toEqual({
      info: "Se existir uma conta com esse email, enviamos um link para criar uma nova senha.",
      email: "nao@existe.com",
    });
  });

  it("surfaces rate limit errors", async () => {
    auth.resetPasswordForEmail.mockResolvedValue({ data: {}, error: { code: "over_email_send_rate_limit" } });
    const r = await requestPasswordReset(undefined, form({ email: "a@b.com" }));
    expect(r?.error).toBe("Muitas tentativas. Espere alguns minutos e tente de novo.");
  });
});

describe("updatePassword / signOut", () => {
  it("updates the password and redirects home", async () => {
    auth.updateUser.mockResolvedValue({ data: {}, error: null });
    await expect(updatePassword(undefined, form({ password: "novasenha" }))).rejects.toThrow("REDIRECT:/");
    expect(auth.updateUser).toHaveBeenCalledWith({ password: "novasenha" });
  });

  it("syncs the device streamings to the account after a reset login", async () => {
    auth.updateUser.mockResolvedValue({ data: {}, error: null });
    store.set(COOKIE_NAME, "netflix");
    await expect(updatePassword(undefined, form({ password: "novasenha" }))).rejects.toThrow("REDIRECT:/");
    expect(upsert).toHaveBeenCalledWith(expect.objectContaining({ user_id: "u1", streamings: ["netflix"] }));
  });

  it("returns the error when the update fails", async () => {
    auth.updateUser.mockResolvedValue({ data: {}, error: { code: "same_password" } });
    const r = await updatePassword(undefined, form({ password: "x" }));
    expect(r?.error).toBe("A nova senha precisa ser diferente da atual.");
  });

  it("signs out, keeps the streamings cookie and redirects", async () => {
    auth.signOut.mockResolvedValue({ error: null });
    store.set(COOKIE_NAME, "netflix");
    await expect(signOut()).rejects.toThrow("REDIRECT:/");
    expect(auth.signOut).toHaveBeenCalledWith({ scope: "local" });
    expect(store.get(COOKIE_NAME)).toBe("netflix");
  });
});
