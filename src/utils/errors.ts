export class CodaApiError extends Error {
  statusCode: number;
  statusMessage: string;

  constructor(statusCode: number, statusMessage: string, detail: string) {
    super(detail);
    this.name = "CodaApiError";
    this.statusCode = statusCode;
    this.statusMessage = statusMessage;
  }
}

export function formatError(err: unknown, format: "json" | "table"): string {
  if (err instanceof CodaApiError) {
    const msg = friendlyMessage(err);
    if (format === "json") {
      return JSON.stringify({ error: true, statusCode: err.statusCode, message: msg }, null, 2);
    }
    return `Error ${err.statusCode}: ${msg}`;
  }
  if (err instanceof Error) {
    if (format === "json") {
      return JSON.stringify({ error: true, message: err.message }, null, 2);
    }
    return `Error: ${err.message}`;
  }
  if (format === "json") {
    return JSON.stringify({ error: true, message: String(err) }, null, 2);
  }
  return `Error: ${String(err)}`;
}

function friendlyMessage(err: CodaApiError): string {
  switch (err.statusCode) {
    case 401:
      return `Authentication failed. Run 'codaio login' or set CODA_API_TOKEN. (${err.message})`;
    case 403:
      return `Permission denied. Your token may not have access to this resource. (${err.message})`;
    case 404:
      return `Resource not found. (${err.message})`;
    case 429:
      return `Rate limited. Try again later. (${err.message})`;
    default:
      return err.message;
  }
}
