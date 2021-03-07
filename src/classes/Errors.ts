export default class InputError extends Error {
  constructor (message: string) {
    super(message);
    this.name = "InputError";
  }
}
