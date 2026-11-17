import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AuthForm } from "@/components/AuthForm";

const ok = vi.fn(async () => undefined);

function setup(props: Partial<Parameters<typeof AuthForm>[0]> = {}) {
  return render(<AuthForm next="/minhas-listas" signInAction={ok} signUpAction={ok} resetAction={ok} {...props} />);
}

describe("AuthForm", () => {
  it("starts in sign-in mode", () => {
    setup();
    expect(screen.getByRole("heading", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
  });

  it("switches to sign-up mode", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: "Não tem conta? Criar conta" }));
    expect(screen.getByRole("heading", { name: "Criar conta" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Criar conta" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Já tem conta? Entrar" })).toBeInTheDocument();
  });

  it("hides the password field in forgot mode", async () => {
    setup();
    await userEvent.click(screen.getByRole("button", { name: "Esqueci minha senha" }));
    expect(screen.getByRole("heading", { name: "Recuperar senha" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Enviar link" })).toBeInTheDocument();
    expect(screen.queryByLabelText("Senha")).not.toBeInTheDocument();
  });

  it("shows the action error and keeps the email", async () => {
    const signIn = vi.fn(async () => ({ error: "Email ou senha incorretos.", email: "a@b.com" }));
    setup({ signInAction: signIn });
    await userEvent.type(screen.getByLabelText("Email"), "a@b.com");
    await userEvent.type(screen.getByLabelText("Senha"), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Email ou senha incorretos.");
    expect(screen.getByLabelText("Email")).toHaveValue("a@b.com");
  });

  it("shows initialError", () => {
    setup({ initialError: "Esse link expirou." });
    expect(screen.getByRole("alert")).toHaveTextContent("Esse link expirou.");
  });

  it("carries next in a hidden field", () => {
    const { container } = setup();
    expect(container.querySelector('input[name="next"]')).toHaveValue("/minhas-listas");
  });

  it("clears the error when switching mode", async () => {
    const signIn = vi.fn(async () => ({ error: "Email ou senha incorretos.", email: "a@b.com" }));
    setup({ signInAction: signIn });
    await userEvent.type(screen.getByLabelText("Email"), "a@b.com");
    await userEvent.type(screen.getByLabelText("Senha"), "123456");
    await userEvent.click(screen.getByRole("button", { name: "Entrar" }));
    expect(await screen.findByRole("alert")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Não tem conta? Criar conta" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("keeps the typed email when switching mode", async () => {
    setup();
    await userEvent.type(screen.getByLabelText("Email"), "a@b.com");
    await userEvent.click(screen.getByRole("button", { name: "Esqueci minha senha" }));
    expect(screen.getByLabelText("Email")).toHaveValue("a@b.com");
  });
});
