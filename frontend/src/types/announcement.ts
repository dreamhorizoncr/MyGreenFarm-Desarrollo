/** Category of news announcements. */
export interface AnnouncementCategory {
    id: string
    title: string
    /**
     * Fixed code of the built-in categories, used to translate their name; `null` for the ones created
     * by the owner.
     */
    code: string | null
}

/** Data to create or update an announcement. */
export interface AnnouncementRequest {
    title: string
    content: string
    categoryId: string
    eventDate?: string
    location?: string
}

/** News announcement. */
export interface Announcement {
    id: string
    title: string
    content: string
    categoryId?: string | null
    categoryTitle?: string | null
    categoryCode?: string | null
    type?: string | null
    eventDate?: string | null
    location?: string | null
    /** Short summary written by the AI when the announcement is saved. */
    aiSummary?: string | null
}

/** Image of an announcement. */
export interface AnnouncementImageResponse {
    id: string
    announcementId: string
    fileUrl: string
    altText?: string | null
    isCover: boolean
}
