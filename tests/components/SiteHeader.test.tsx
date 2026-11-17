import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SiteHeader } from "@/components/SiteHeader";

const pathname = vi.hoisted(() => ({ value: "/" }));
vi.mock("next/navigation", () => ({ usePathname: () => pathname.value }));

const signOut = async () => {};

describe("SiteHeader", () => {
  beforeEach(() => {
    pathname.value = "/";
  });

  it("shows the login link and no account button when logged out", () => {
    render(<SiteHeader userEmail={null} signOutAction={signOut} />);
    expect(screen.getByRole("link", { name: "Entrar" })).toHaveAttribute("href", "/entrar");
    expect(screen.queryByRole("button", { name: "Conta" })).not.toBeInTheDocument();
  });

  it("opens the account menu with email and sign out when logged in", () => {
    render(<SiteHeader userEmail="ana@exemplo.com" signOutAction={signOut} />);
    expect(screen.queryByRole("link", { name: "Entrar" })).not.toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Conta" });
    expect(button).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(button);
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("ana@exemplo.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
  });

  it("closes the menu with Esc and with an outside click", () => {
    render(<SiteHeader userEmail="ana@exemplo.com" signOutAction={signOut} />);
    fireEvent.click(screen.getByRole("button", { name: "Conta" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("button", { name: "Sair" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Conta" }));
    fireEvent.mouseDown(document.body);
    expect(screen.queryByRole("button", { name: "Sair" })).not.toBeInTheDocument();
  });

  it("has two Minhas listas links (text and icon)", () => {
    render(<SiteHeader userEmail={null} signOutAction={signOut} />);
    const links = screen.getAllByRole("link", { name: "Minhas listas" });
    expect(links).toHaveLength(2);
    for (const l of links) expect(l).toHaveAttribute("href", "/minhas-listas");
  });

  it("marks the text item as current on /minhas-listas", () => {
    pathname.value = "/minhas-listas";
    render(<SiteHeader userEmail={null} signOutAction={signOut} />);
    const [text] = screen.getAllByRole("link", { name: "Minhas listas" });
    expect(text).toHaveAttribute("aria-current", "page");
  });

  it("returns focus to the Conta button on Esc", () => {
    render(<SiteHeader userEmail="ana@exemplo.com" signOutAction={signOut} />);
    fireEvent.click(screen.getByRole("button", { name: "Conta" }));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.getByRole("button", { name: "Conta" })).toHaveFocus();
  });

  it("closes the menu when the pathname changes", () => {
    const { rerender } = render(<SiteHeader userEmail="ana@exemplo.com" signOutAction={signOut} />);
    fireEvent.click(screen.getByRole("button", { name: "Conta" }));
    expect(screen.getByRole("button", { name: "Sair" })).toBeInTheDocument();
    pathname.value = "/busca";
    rerender(<SiteHeader userEmail="ana@exemplo.com" signOutAction={signOut} />);
    expect(screen.queryByRole("button", { name: "Sair" })).not.toBeInTheDocument();
  });
});
