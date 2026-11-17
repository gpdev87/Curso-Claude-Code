import { describe, expect, it } from "vitest";
import { authErrorMessage } from "@/lib/auth/messages";

describe("authErrorMessage", () => {
  it.each([
    ["invalid_credentials", "Email ou senha incorretos."],
    ["user_already_exists", "Já existe uma conta com esse email. Tente entrar."],
    ["email_exists", "Já existe uma conta com esse email. Tente entrar."],
    ["weak_password", "A senha precisa ter pelo menos 6 caracteres."],
    ["email_address_invalid", "Esse email não parece válido."],
    ["over_request_rate_limit", "Muitas tentativas. Espere alguns minutos e tente de novo."],
    ["over_email_send_rate_limit", "Muitas tentativas. Espere alguns minutos e tente de novo."],
    ["same_password", "A nova senha precisa ser diferente da atual."],
    ["algo_novo", "Algo deu errado. Tente de novo."],
    [undefined, "Algo deu errado. Tente de novo."],
  ])("%s -> %s", (code, message) => {
    expect(authErrorMessage(code)).toBe(message);
  });
});
