import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import BlobButton from "./ui/BlobButton.tsx";
import Skeleton from "./ui/Skeleton.tsx";
import type { Announcement } from "../types/announcement.ts";
import LowCortisol from "../assets/imgs/LowCortisol.png";

interface NewsCardProps {
  big?: boolean
  announcement?: Announcement
  typeLabel?: string
  formattedDate?: string
  coverImage?: string
  coverAlt?: string
  onReadMore?: () => void
  previewLinkLabel?: string
  actions?: ReactNode
  loading?: boolean
  className?: string
}

function CoverImage({ coverImage, title, alt }: Readonly<{ coverImage?: string; title: string; alt?: string }>) {
  return coverImage ? (
    <img src={coverImage} alt={alt || title} className="h-full w-full object-cover" />
  ) : (
    <div className="flex h-full w-full items-center justify-center bg-bg-page">
      <img src={LowCortisol} alt="" className="h-[75%] w-[75%] object-contain" />
    </div>
  );
}

function NewsCard({ big = false, announcement, typeLabel, formattedDate, coverImage, coverAlt, onReadMore, previewLinkLabel, actions, loading = false, className = "" }: Readonly<NewsCardProps>) {
  const { t } = useTranslation();

  if (loading && big) {
    return (
      <article className={`relative overflow-hidden rounded-[22px] border border-neutral-200 bg-white shadow md:h-[340px] ${className}`}>
        <div className="relative h-[240px] md:absolute md:inset-y-0 md:left-0 md:h-auto md:w-1/2">
          <Skeleton shape="rect" className="h-full w-full rounded-none" />
        </div>

        <div className="relative flex flex-col gap-sm p-[22px] text-left md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-1/2 md:justify-center">
          <Skeleton shape="line" className="h-3 w-1/3" />
          <Skeleton shape="line" className="h-6 w-4/5" />
          <Skeleton shape="line" className="h-4 w-full" />
          <Skeleton shape="line" className="h-4 w-2/3" />
          <Skeleton shape="pill" className="h-8 w-28" />
        </div>
      </article>
    );
  }

  if (loading) {
    return (
      <article className={`relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow md:h-[340px] ${className}`}>
        <div className="relative h-[200px] md:absolute md:inset-x-0 md:top-0 md:h-[125px]">
          <Skeleton shape="rect" className="h-full w-full rounded-none" />
        </div>

        <div className="relative flex flex-col gap-sm p-[20px] text-left md:absolute md:inset-x-0 md:bottom-0 md:top-[125px]">
          <Skeleton shape="line" className="h-3 w-1/3" />
          <Skeleton shape="line" className="h-6 w-4/5" />
          <Skeleton shape="line" className="h-4 w-full" />
          <Skeleton shape="line" className="h-4 w-2/3" />
          <div className="mt-auto flex items-center justify-between gap-sm">
            {previewLinkLabel === undefined
              ? <Skeleton shape="pill" className="h-11 w-32" />
              : <Skeleton shape="line" className="h-4 w-24" />}
            {actions !== undefined && (
              <div className="flex items-center gap-2">
                <Skeleton shape="circle" className="size-10" />
                <Skeleton shape="circle" className="size-10" />
              </div>
            )}
          </div>
        </div>
      </article>
    );
  }

  const footer = (
    <>
      {previewLinkLabel === undefined ? (
        <BlobButton onClick={onReadMore} className="h-11 w-fit px-lg font-body text-button font-bold">
          {t("newspage.readMore")}
        </BlobButton>
      ) : (
        <button
          type="button"
          onClick={onReadMore}
          className="font-body text-body-sm font-semibold text-green-500 underline-offset-2 transition-opacity hover:opacity-80 hover:underline"
        >
          {previewLinkLabel}
        </button>
      )}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </>
  );

  if (big) {
    return (
      <article className={`relative overflow-hidden rounded-[22px] border border-neutral-200 bg-white shadow card-hover md:h-[340px] ${className}`}>
        <div className="relative h-[240px] md:absolute md:inset-y-0 md:left-0 md:h-auto md:w-1/2">
          <CoverImage coverImage={coverImage} title={announcement!.title} alt={coverAlt} />

          <span className="absolute left-[14px] top-[14px] rounded-full bg-[var(--pink-400)] px-sm py-2xs font-body text-caption font-semibold text-white">
            {typeLabel}
          </span>
        </div>

        <div className="relative flex flex-col items-start p-[22px] text-left md:absolute md:inset-y-0 md:right-0 md:h-auto md:w-1/2 md:pb-[60px]">
          <span className="font-body text-caption text-neutral-500">
            {formattedDate}
          </span>

          <h2 className="mt-[10px] line-clamp-2 font-heading text-h4 font-bold text-heading">
            {announcement!.title}
          </h2>

          <p className="mt-[14px] line-clamp-3 font-body text-body-sm leading-[1.6] text-body-text">
            {announcement!.content}
          </p>

          <div className="mt-md flex w-full items-center justify-between gap-sm md:absolute md:bottom-[22px] md:left-[22px] md:right-[22px] md:w-auto">
            {footer}
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className={`relative overflow-hidden rounded-2xl border border-neutral-200 bg-white shadow card-hover md:h-[340px] ${className}`}>
      <div className="relative h-[200px] md:absolute md:inset-x-0 md:top-0 md:h-[125px]">
        <CoverImage coverImage={coverImage} title={announcement!.title} alt={coverAlt} />

        <span className="absolute left-[14px] top-[14px] rounded-full bg-[var(--pink-400)] px-sm py-2xs font-body text-caption font-semibold text-white">
          {typeLabel}
        </span>
      </div>

      <div className="relative flex flex-col items-start p-[20px] text-left md:absolute md:inset-x-0 md:bottom-0 md:top-[125px] md:pb-[56px]">
        <span className="font-body text-caption text-neutral-500">
          {formattedDate}
        </span>

        <h2 className="mt-[8px] line-clamp-1 font-heading text-h4 font-bold text-heading">
          {announcement!.title}
        </h2>

        <p className="mt-[1px] line-clamp-2 font-body text-body-sm leading-[1.6] text-body-text">
          {announcement!.content}
        </p>

        <div className="mt-sm flex w-full items-center justify-between gap-sm md:absolute md:bottom-[20px] md:left-[20px] md:right-[20px] md:w-auto">
          {footer}
        </div>
      </div>
    </article>
  );
}

export default NewsCard;
