/**
 * Standardized API Error Codes
 */
export const ApiErrorCode = {
  UNAUTHORIZED: 'UNAUTHORIZED', // 401: No valid session
  FORBIDDEN: 'FORBIDDEN', // 403: Valid session, wrong role/permissions
  NOT_FOUND: 'NOT_FOUND', // 404: Entity doesn't exist
  VALIDATION_ERROR: 'VALIDATION_ERROR', // 422: Invalid input
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY', // 409: Unique constraint violation
  RATE_LIMITED: 'RATE_LIMITED', // 429: Too many requests
  INTERNAL_ERROR: 'INTERNAL_ERROR', // 500: Unexpected server error
} as const

export type ApiErrorCodeType = (typeof ApiErrorCode)[keyof typeof ApiErrorCode]

/**
 * Base class for all structured API Errors
 */
export class ApiError extends Error {
  constructor(
    public code: ApiErrorCodeType | string,
    message: string,
    public statusCode: number = 400
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = 'Akses ditolak. Silakan login terlebih dahulu.') {
    super(ApiErrorCode.UNAUTHORIZED, message, 401)
    this.name = 'UnauthorizedError'
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = 'Anda tidak memiliki izin untuk melakukan aksi ini.') {
    super(ApiErrorCode.FORBIDDEN, message, 403)
    this.name = 'ForbiddenError'
  }
}

export class NotFoundError extends ApiError {
  constructor(message = 'Data tidak ditemukan.') {
    super(ApiErrorCode.NOT_FOUND, message, 404)
    this.name = 'NotFoundError'
  }
}

export class ValidationError extends ApiError {
  constructor(
    message = 'Data yang dikirim tidak valid.',
    public details?: Record<string, string[]>
  ) {
    super(ApiErrorCode.VALIDATION_ERROR, message, 422)
    this.name = 'ValidationError'
  }
}

export class DuplicateEntryError extends ApiError {
  constructor(message = 'Data sudah ada dalam sistem.') {
    super(ApiErrorCode.DUPLICATE_ENTRY, message, 409)
    this.name = 'DuplicateEntryError'
  }
}

export class InternalError extends ApiError {
  constructor(message = 'Terjadi kesalahan pada server.') {
    super(ApiErrorCode.INTERNAL_ERROR, message, 500)
    this.name = 'InternalError'
  }
}
