export interface ApiError {
  error?: string
  errors?: { field: string; message: string }[]
}

export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    message: string
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}
