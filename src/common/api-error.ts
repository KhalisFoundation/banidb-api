// An expected failure with a message for the client, sent as
// `{ error: true, data: { error: message } }` (the shape every client already reads).
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}
