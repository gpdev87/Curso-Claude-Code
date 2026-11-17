import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MarkButtons } from "@/components/MarkButtons";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
vi.mock("@/app/filme/actions", () => ({ setMark: vi.fn() }));

const movie = { movieId: 1, title: "Filme", posterPath: "/p.jpg" };
const loginHref = "/entrar?next=%2Ffilme%2F1-filme";
const quero = () => screen.getByRole("button", { name: /Quero assistir/ });
const visto = () => screen.getByRole("button", { name: /Já assisti/ });

beforeEach(() => push.mockClear());

describe("MarkButtons", () => {
  it("sends logged-out users to login without saving", async () => {
    const save = vi.fn();
    render(<MarkButtons movie={movie} initialStatus={null} loggedIn={false} loginHref={loginHref} save={save} />);
    await userEvent.click(quero());
    expect(push).toHaveBeenCalledWith(loginHref);
    expect(save).not.toHaveBeenCalled();
  });

  it("updates optimistically before save resolves", async () => {
    let resolve!: (v: { ok: true }) => void;
    const save = vi.fn(() => new Promise<{ ok: true }>((r) => (resolve = r)));
    render(<MarkButtons movie={movie} initialStatus={null} loggedIn loginHref={loginHref} save={save} />);
    await userEvent.click(quero());
    expect(quero()).toHaveAttribute("aria-pressed", "true");
    expect(save).toHaveBeenCalledWith(movie, "quero");
    await userEvent.click(visto()); // ignorado durante o salvamento
    expect(save).toHaveBeenCalledTimes(1);
    resolve({ ok: true });
    await vi.waitFor(() => expect(save).toHaveBeenCalledTimes(1));
    await act(async () => {});
  });

  it("switches from quero to visto", async () => {
    const save = vi.fn().mockResolvedValue({ ok: true });
    render(<MarkButtons movie={movie} initialStatus="quero" loggedIn loginHref={loginHref} save={save} />);
    await userEvent.click(visto());
    expect(visto()).toHaveAttribute("aria-pressed", "true");
    expect(quero()).toHaveAttribute("aria-pressed", "false");
  });

  it("reverts and alerts on error", async () => {
    const save = vi.fn().mockResolvedValue({ ok: false, reason: "error" });
    render(<MarkButtons movie={movie} initialStatus={null} loggedIn loginHref={loginHref} save={save} />);
    await userEvent.click(quero());
    expect(await screen.findByRole("alert")).toHaveTextContent("Não foi possível salvar. Tente de novo.");
    expect(quero()).toHaveAttribute("aria-pressed", "false");
  });

  it("reverts and goes to login on auth failure", async () => {
    const save = vi.fn().mockResolvedValue({ ok: false, reason: "auth" });
    render(<MarkButtons movie={movie} initialStatus={null} loggedIn loginHref={loginHref} save={save} />);
    await userEvent.click(quero());
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith(loginHref));
    expect(quero()).toHaveAttribute("aria-pressed", "false");
  });
});
