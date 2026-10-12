import { useState } from "react";
import { announcementService } from "../services/announcement.ts";
import { getErrorMessage } from "../utils/error.ts";
import type {
  Announcement,
  AnnouncementImageResponse,
  AnnouncementRequest,
} from "../types/announcement.ts";

const SOURCE_LANG = "es";
const ENTITY_TYPE = "announcement";

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAnnouncements = async (
    lang: string,
    page: number = 0,
    size: number = 10,
  ) => {
    setLoading(true);
    setError(null);

    try {
      // Solicita al backend únicamente la página necesaria
      const data = await announcementService.getAnnouncements(
        SOURCE_LANG,
        page,
        size,
      );

      // Guarda de una vez las noticias sin traducir, para que se vean aunque
      // la traducción falle o tarde
      setAnnouncements(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);

      try {
        const items = data.content.flatMap((a) => [
          {
            entityId: a.id,
            fieldName: "title",
            originalText: a.title,
          },
          {
            entityId: a.id,
            fieldName: "content",
            originalText: a.content,
          },
          ...(a.aiSummary
            ? [{
                entityId: a.id,
                fieldName: "aiSummary",
                originalText: a.aiSummary,
              }]
            : []),
        ]);

        const translated = await announcementService.translateBatch(
          ENTITY_TYPE,
          lang,
          items,
        );

        setAnnouncements(data.content.map((a) => ({
          ...a,
          title: translated[`${a.id}:title`] ?? a.title,
          content: translated[`${a.id}:content`] ?? a.content,
          aiSummary: a.aiSummary
            ? translated[`${a.id}:aiSummary`] ?? a.aiSummary
            : a.aiSummary,
        })));
      } catch {
        // Se deja el contenido original visible si la traducción no está disponible.
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const createAnnouncement = async (dto: AnnouncementRequest) => {
    setLoading(true);
    setError(null);
    try {
      const newAnnouncement = await announcementService.create(dto);
      setAnnouncements((prev) => [newAnnouncement, ...prev]);
      return newAnnouncement;
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateAnnouncement = async (id: string, dto: AnnouncementRequest) => {
    setLoading(true);
    setError(null);
    try {
      const updated = await announcementService.update(id, dto);
      setAnnouncements((prev) => prev.map((a) => (a.id === id ? updated : a)));
      return updated;
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteAnnouncement = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      await announcementService.delete(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getImages = async (
    announcementId: string,
  ): Promise<AnnouncementImageResponse[]> => {
    try {
      return await announcementService.getImages(announcementId);
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
  };

  const uploadImages = async (
    announcementId: string,
    files: File[],
    isCover: boolean,
  ) => {
    try {
      return await announcementService.uploadImages(
        announcementId,
        files,
        isCover,
      );
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
  };

  const deleteImage = async (imageId: string) => {
    try {
      await announcementService.deleteImage(imageId);
    } catch (err) {
      setError(getErrorMessage(err));
      throw err;
    }
  };

  return {
    announcements,
    totalPages,
    totalElements,
    loading,
    error,
    fetchAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    getImages,
    uploadImages,
    deleteImage,
  };
}
