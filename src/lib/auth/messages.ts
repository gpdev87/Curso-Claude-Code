// Traduz os códigos de erro do Supabase Auth para mensagens em pt-BR.
export function authErrorMessage(code: string | undefined): string {
  switch (code) {
    case "invalid_credentials":
      return "Email ou senha incorretos.";
    case "user_already_exists":
    case "email_exists":
      return "Já existe uma conta com esse email. Tente entrar.";
    case "weak_password":
      return "A senha precisa ter pelo menos 6 caracteres.";
    case "email_address_invalid":
      return "Esse email não parece válido.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Muitas tentativas. Espere alguns minutos e tente de novo.";
    case "same_password":
      return "A nova senha precisa ser diferente da atual.";
    default:
      return "Algo deu errado. Tente de novo.";
  }
}
