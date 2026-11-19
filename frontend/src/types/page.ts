/** A page of results as Spring Data returns it. */
export interface PageResponse<T> {
  content: T[]
  totalPages: number
  totalElements: number
  /** Page number, starting at 0. */
  number: number
  size: number
  first: boolean
  last: boolean
}
