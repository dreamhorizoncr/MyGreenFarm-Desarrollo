import { useState } from "react";
import { announcementService } from "../services/announcement.ts";
import { getErrorMessage } from "../utils/error.ts";
import type { AnnouncementImageResponse } from "../types/announcement.ts";

export function useAnnouncementImages() {
  const [images, setImages] = useState<
    Record<string, AnnouncementImageResponse[]>
  >({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchImages = async (announcementIds: string[]) => {
    if (announcementIds.length === 0) {
      setImages({});
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const entries = await Promise.all(
        announcementIds.map(
          async (announcementId) =>
            [
              announcementId,
              await announcementService.getImages(announcementId),
            ] as const,
        ),
      );
      setImages(Object.fromEntries(entries));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const getCoverImage = (announcementId: string) => {
    const announcementImages = images[announcementId] ?? [];
    return (
      announcementImages.find((image) => image.isCover)?.fileUrl ??
      announcementImages[0]?.fileUrl
    );
  };

  return { images, loading, error, fetchImages, getCoverImage };
}
