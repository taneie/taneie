import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Express } from "express";

export type TestResponse<T = unknown> = {
  status: number;
  data: T;
  headers: Headers;
};

export type TestServer = {
  baseUrl: string;
  apiUrl: string;
  request: <T = unknown>(
    path: string,
    options?: RequestInit,
    token?: string,
  ) => Promise<TestResponse<T>>;
  close: () => Promise<void>;
};

export function useLocalTestDatabase() {
  process.env.DATABASE_URL =
    process.env.TEST_DATABASE_URL ||
    "postgresql://frichy:frichy@127.0.0.1:5432/frichy?schema=public";

  const url = new URL(process.env.DATABASE_URL);
  assert.match(
    url.hostname,
    /^(127\.0\.0\.1|localhost)$/,
    "API tests only run against a local database",
  );
}

export async function startTestServer(app: Express): Promise<TestServer> {
  const server = await new Promise<import("node:http").Server>(
    (resolve, reject) => {
      const listener = app.listen(0, "127.0.0.1", () => resolve(listener));
      listener.on("error", reject);
    },
  );
  const address = server.address() as AddressInfo;
  const baseUrl = `http://127.0.0.1:${address.port}`;
  const apiUrl = `${baseUrl}/api`;

  return {
    baseUrl,
    apiUrl,
    async request(path, options = {}, token = "") {
      const headers = new Headers(options.headers);
      if (options.body && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }
      if (token) headers.set("Authorization", `Bearer ${token}`);

      const res = await fetch(`${apiUrl}${path}`, { ...options, headers });
      const text = await res.text();
      const data = text ? JSON.parse(text) : null;

      return { status: res.status, data, headers: res.headers };
    },
    close() {
      return new Promise<void>((resolve, reject) => {
        server.close((error) => (error ? reject(error) : resolve()));
      });
    },
  };
}

export async function login(
  server: TestServer,
  email: string,
  password: string,
) {
  const response = await server.request<{
    token?: string;
    user?: { id: string; role: string; freelancerId?: string };
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  assert.equal(response.status, 200);
  assert.ok(response.data.token);
  assert.ok(response.data.user);

  return {
    token: response.data.token,
    user: response.data.user,
  };
}

export function expectErrorCode(
  response: TestResponse<{ error?: { code?: string } }>,
  status: number,
  code?: string,
) {
  assert.equal(response.status, status);
  if (code) assert.equal(response.data.error?.code, code);
}
