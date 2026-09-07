export type AnnouncementType = 'NEWS' | 'EVENT' | 'NOTICE' | 'GENERAL'

// export interface Announcement {
//     id: string
//     title: string
//     content: string
//     type: AnnouncementType
//     eventDate: string | null
//     location: string | null
// }

export interface AnnouncementRequest {
    title: string
    content: string
    type: AnnouncementType
    eventDate?: string
    location?: string
}

export interface Announcement {
    id: string
    title: string
    content: string
    type: AnnouncementType
    eventDate?: string | null
    location?: string | null
}

export interface AnnouncementImageResponse {
    id: string
    announcementId: string
    fileUrl: string
    isCover: boolean
}
