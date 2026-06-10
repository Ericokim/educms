export interface ApiSuccess<T> {
  success: true
  message: string
  data: T
}

export interface ApiError {
  success: false
  message: string
  errors: ApiFieldError[]
}

export interface ApiFieldError {
  field?: string
  message: string
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError

export interface Pagination {
  page: number
  limit: number
  total: number
  totalPages: number
}

export interface Paginated<T> {
  items: T[]
  pagination: Pagination
}
