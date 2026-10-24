/** Error type carrying the HTTP status for centralized API handling. */
export default class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}
