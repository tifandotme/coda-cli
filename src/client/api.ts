import { CodaApiError } from "../utils/errors.ts";
import { requireToken } from "../config/auth.ts";

const BASE_URL = "https://coda.io/apis/v1";
const VERSION = "0.1.0";
const MAX_RETRIES = 3;

type Params = Record<string, string | number | boolean | undefined>;

export class CodaClient {
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.token}`,
      "Content-Type": "application/json",
      "User-Agent": `coda-cli/${VERSION}`,
    };
  }

  async request<T>(
    method: string,
    path: string,
    options?: { params?: Params; body?: unknown }
  ): Promise<T> {
    const url = new URL(BASE_URL + path);

    if (options?.params) {
      for (const [k, v] of Object.entries(options.params)) {
        if (v !== undefined) {
          url.searchParams.set(k, String(v));
        }
      }
    }

    let attempt = 0;
    while (true) {
      const response = await fetch(url.toString(), {
        method,
        headers: this.headers(),
        body: options?.body !== undefined ? JSON.stringify(options.body) : undefined,
      });

      if (response.status === 429 && attempt < MAX_RETRIES) {
        const retryAfter = parseInt(response.headers.get("Retry-After") ?? "2", 10);
        await sleep(retryAfter * 1000);
        attempt++;
        continue;
      }

      if (!response.ok) {
        let message = response.statusText;
        try {
          const errBody = (await response.json()) as { message?: string; statusMessage?: string };
          message = errBody.message ?? errBody.statusMessage ?? message;
        } catch {
          // ignore parse error
        }
        throw new CodaApiError(response.status, response.statusText, message);
      }

      if (response.status === 204) {
        return undefined as T;
      }

      return response.json() as Promise<T>;
    }
  }

  get<T>(path: string, params?: Params): Promise<T> {
    return this.request<T>("GET", path, { params });
  }

  post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("POST", path, { body });
  }

  put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("PUT", path, { body });
  }

  delete<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>("DELETE", path, { body });
  }
}

export async function getClient(): Promise<CodaClient> {
  const token = await requireToken();
  return new CodaClient(token);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
