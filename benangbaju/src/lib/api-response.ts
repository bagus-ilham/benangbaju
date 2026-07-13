import { ApiError, ApiErrorCode, ValidationError } from './api-errors'

export type ApiErrorDetails = {
  code: string
  message: string
  details?: Record<string, string[]>
}

export type ApiErrorResponse<T = unknown> = {
  success: false
  error: ApiErrorDetails
  data?: T
  pagination?: ApiPaginationParams
}

export type ApiSuccessResponse<T> = T extends undefined
  ? { success: true; data?: never }
  : { success: true; data: T }

export type ApiResponse<T = undefined> = ApiSuccessResponse<T> | ApiErrorResponse<T>

export type ApiPaginationParams = {
  page: number
  limit: number
  total_count: number
  total_pages: number
}

export type ApiListResponse<T> =
  | {
      success: true
      data: T[]
      pagination?: ApiPaginationParams
    }
  | ApiErrorResponse<T[]>

/**
 * Returns a standardized success response for singular operations.
 */
export function ok<T>(data?: T): ApiResponse<T> {
  if (data !== undefined) {
    return { success: true, data } as unknown as ApiResponse<T>
  }
  return { success: true } as ApiResponse<T>
}

/**
 * Returns a standardized error response.
 * Can be constructed from a known ApiError, an Error, or raw strings.
 */
export function fail<T = unknown>(error: ApiError | Error | unknown): ApiErrorResponse<T>
export function fail<T = unknown>(
  code: string,
  message: string,
  details?: Record<string, string[]>
): ApiErrorResponse<T>
export function fail<T = unknown>(
  errOrCode: unknown,
  message?: string,
  details?: Record<string, string[]>
): ApiErrorResponse<T> {
  if (typeof errOrCode === 'string') {
    return {
      success: false,
      error: {
        code: errOrCode,
        message: message || 'Terjadi kesalahan',
        details,
      },
    }
  }

  if (errOrCode instanceof ApiError) {
    return {
      success: false,
      error: {
        code: errOrCode.code,
        message: errOrCode.message,
        ...(errOrCode instanceof ValidationError && errOrCode.details
          ? { details: errOrCode.details }
          : {}),
      },
    }
  }

  if (errOrCode instanceof Error) {
    return {
      success: false,
      error: {
        code: ApiErrorCode.INTERNAL_ERROR,
        message: errOrCode.message,
      },
    }
  }

  return {
    success: false,
    error: {
      code: ApiErrorCode.INTERNAL_ERROR,
      message: 'Kesalahan sistem yang tidak terduga',
    },
  }
}

/**
 * Returns a standardized response for lists, optionally with pagination metadata.
 */
export function paginated<T>(
  data: T[],
  page?: number,
  limit?: number,
  total?: number
): ApiListResponse<T> {
  if (page !== undefined && limit !== undefined && total !== undefined) {
    const safeLimit = limit && limit > 0 ? limit : 10
    const total_pages = Math.max(1, Math.ceil(total / safeLimit))
    return {
      success: true,
      data,
      pagination: {
        page,
        limit,
        total_count: total,
        total_pages,
      },
    }
  }

  // Return unpaginated list
  return {
    success: true,
    data,
  }
}
