export type AnnouncementType = 'NEWS' | 'EVENT' | 'NOTICE' | 'GENERAL'

export interface Announcement {
    id: string
    title: string
    content: string
    type: AnnouncementType
    eventDate: string | null
    location: string | null
}