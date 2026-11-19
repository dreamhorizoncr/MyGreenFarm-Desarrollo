/** Data to create or update a club. */
export interface ClubRequest {
    name: string;
    description: string;
    /** Schedule in the format of {@link serializeSchedule}. */
    schedule?: string;
    maxCapacity?: number;
    isPublished?: boolean;
}

/** Image of a club. */
export interface ClubImageResponse {
    id: number;
    clubId?: number;
    fileUrl: string;
    altText?: string | null;
    isCover: boolean;
    sortOrder?: number;
}

/** A club with its images. */
export interface ClubResponse {
    id: number;
    name: string;
    description: string;
    schedule?: string;
    maxCapacity?: number;
    /** Free places left. */
    availableSpots?: number;
    isPublished: boolean;
    coverImageUrl?: string;
    images?: ClubImageResponse[];
}

/** Page, sort and language of a club listing. */
export interface PageableParams {
    page?: number;
    size?: number;
    sort?: string;
    lang?: string;
}

