export interface AnnouncementCategory {
    id: string
    title: string
    code: string | null
}

export interface AnnouncementRequest {
    title: string
    content: string
    categoryId: string
    eventDate?: string
    location?: string
}

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
    aiSummary?: string | null
}

export interface AnnouncementImageResponse {
    id: string
    announcementId: string
    fileUrl: string
    isCover: boolean
}
