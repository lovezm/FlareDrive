export class HttpError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = "HttpError";
  }
}

export async function requireOk(
  response: Response,
  message: string
): Promise<Response> {
  if (!response.ok) throw new HttpError(message, response.status);
  return response;
}
