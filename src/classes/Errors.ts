import type { Response } from "node-fetch";

export class InputError extends Error {
  constructor (message: string) {
    super(message);
  }
}
