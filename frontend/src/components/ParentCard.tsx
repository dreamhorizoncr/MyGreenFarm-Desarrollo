import type { Parent } from "../types/parent.ts";
import Skeleton from "./ui/Skeleton.tsx";
import CardActionButton from "./ui/CardActionButton.tsx";
import { useTranslation } from "react-i18next";

interface ParentCardProps {
    parent?: Parent;
    onEdit?: (parent: Parent) => void;
    onDelete?: (parent: Parent) => void;
    loading?: boolean;
}

function getLanguageLabel(language: string) {

    if (language === "en") return "English";
    if (language === "fr") return "Français";

    return "Español";
}

function ParentCard({
    parent,
    onEdit,
    onDelete,
    loading = false,
}: Readonly<ParentCardProps>) {
  const { t } = useTranslation();
    return (
        <article className="rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm card-hover">
        <div className="flex items-start justify-between gap-4">
        {loading ? (
          <Skeleton shape="line" className="h-6 w-1/2" />
        ) : (
          <h2 className="font-heading text-xl font-bold text-heading">
              {parent!.firstName} {parent!.lastName}
          </h2>
        )}

        <div className="flex shrink-0 items-center gap-2">
            {loading ? (
              <>
                <Skeleton shape="circle" className="size-10" />
                <Skeleton shape="circle" className="size-10" />
              </>
            ) : (
              <>
                <CardActionButton action="edit" label={t("admin.edit")} onClick={() => onEdit!(parent!)} />

                <CardActionButton action="delete" label={t("admin.delete")} onClick={() => onDelete!(parent!)} />
              </>
            )}
        </div>
    </div>

        <div className="mt-4 space-y-2 font-body text-body-text">
            {loading ? (
              <>
                <Skeleton shape="line" className="h-4 w-2/3" />
                <Skeleton shape="line" className="h-4 w-1/2" />
              </>
            ) : (
              <>
                <p>
                <span className="font-bold">{t("admin.parents.identification")}: </span>
                {parent!.identification}
                </p>

                <p>
                <span className="font-bold">{t("admin.parents.language")}: </span>
                {getLanguageLabel(parent!.language)}
                </p>
              </>
            )}
        </div>

        <div className="mt-6 flex flex-col gap-5 border-t border-neutral-100 pt-5 sm:flex-row">
            <div className="min-w-0 flex-1">
            {loading ? (
              <>
                <Skeleton shape="line" className="h-4 w-1/3" />
                <Skeleton shape="line" className="mt-2 h-3 w-full" />
              </>
            ) : (
              <>
                <h3 className="font-body text-body font-bold text-heading">
                    {t("admin.parents.email")}
                </h3>

                <p className="mt-2 break-words font-body text-body-sm leading-relaxed text-body-text">
                    {parent!.email}
                </p>
              </>
            )}
            </div>

            <div className="min-w-0 flex-1">
            {loading ? (
              <>
                <Skeleton shape="line" className="h-4 w-1/3" />
                <Skeleton shape="line" className="mt-2 h-3 w-full" />
                <Skeleton shape="line" className="mt-2 h-3 w-5/6" />
              </>
            ) : (
              <>
                <h3 className="font-body text-body font-bold text-heading">
                    {t("admin.parents.contact")}
                </h3>

                <p className="mt-2 break-words font-body text-body-sm leading-relaxed text-body-text">
                    <span className="font-bold">{t("admin.parents.phoneNumber")}: </span>
                    {parent!.phoneNumber}
                </p>

                <p className="mt-2 break-words font-body text-body-sm leading-relaxed text-body-text">
                    <span className="font-bold">{t("admin.parents.address")}: </span>
                    {parent!.address}
                </p>
              </>
            )}
            </div>
        </div>
        </article>
    );
}

export default ParentCard;
