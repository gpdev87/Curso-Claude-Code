// Decide o que fazer com "Meus streamings" ao entrar na conta.
// Conta com itens vence; conta vazia herda os do aparelho.
export function resolveStreamingsOnLogin(
  account: string[] | null,
  device: string[],
): { cookie: string[]; saveToAccount: string[] | null } {
  if (account && account.length > 0) return { cookie: account, saveToAccount: null };
  if (device.length > 0) return { cookie: device, saveToAccount: device };
  return { cookie: [], saveToAccount: null };
}
