export interface ClubRequest {
    name: string;
    description: string;
    schedule?: string;
    maxCapacity?: number;
}

export interface ClubImageResponse {
    id: number;
    clubId?: number;
    fileUrl: string;
    isCover: boolean;
    sortOrder?: number;
}

export interface ClubResponse {
    id: number;
    name: string;
    description: string;
    schedule?: string;
    maxCapacity?: number;
    coverImageUrl?: string;
    images?: ClubImageResponse[];
}

export interface PageableParams {
    page?: number;
    size?: number;
    sort?: string;
    lang?: string;
}

export interface PageResponse<T> {
    content: T[];
    totalPages: number;
    totalElements: number;
    size: number;
    number: number;
    first: boolean;
    last: boolean;
}