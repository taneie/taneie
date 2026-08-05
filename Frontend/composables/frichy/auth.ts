import type { Account, Role } from "./types";

export type ApiLoginUser = {
  email: string;
  role: Role;
  name: string;
  freelancerId?: string;
};

export type ApiLoginResponse = {
  token: string;
  user: ApiLoginUser;
};

export type LoginSource =
  | { kind: "api"; result: ApiLoginResponse }
  | { kind: "local-demo"; account: Account }
  | { kind: "error"; error: unknown };

export function findDemoAccountByCredentials(
  accounts: Account[],
  email: string,
  password: string,
) {
  const normalizedEmail = email.trim();

  return accounts.find(
    (account) =>
      account.email === normalizedEmail && account.password === password,
  );
}

export function shouldFallbackToLocalDemoLogin(error: unknown) {
  if (error instanceof TypeError) return true;

  const message = error instanceof Error ? error.message : String(error ?? "");

  return /Failed to fetch|fetch failed|Load failed|NetworkError/i.test(message);
}

export async function resolveLoginSource(
  input: { email: string; password: string },
  demoAccounts: Account[],
  apiLogin: () => Promise<ApiLoginResponse>,
): Promise<LoginSource> {
  const demoAccount = findDemoAccountByCredentials(
    demoAccounts,
    input.email,
    input.password,
  );

  try {
    return { kind: "api", result: await apiLogin() };
  } catch (error) {
    if (demoAccount && shouldFallbackToLocalDemoLogin(error)) {
      return { kind: "local-demo", account: demoAccount };
    }

    return { kind: "error", error };
  }
}
