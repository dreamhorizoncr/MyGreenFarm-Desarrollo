import { useTranslation } from "react-i18next";
import { UserRoundIcon } from "@animateicons/react/lucide";

import type { UserInfo } from "../types/auth.ts";

import Skeleton from "./ui/Skeleton.tsx";
import CardActionButton from "./ui/CardActionButton.tsx";

interface TeacherCardProps {
  user?: UserInfo;
  isSelf?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  loading?: boolean;
  showPhoto?: boolean;
}

function TeacherCard({
  user,
  isSelf = false,
  onEdit,
  onDelete,
  loading = false,
  showPhoto = false,
}: Readonly<TeacherCardProps>) {
  const { t, i18n } = useTranslation();

  const roleLabels: Record<string, string> = {
    OWNER: t("admin.roles.OWNER"),
    TEACHER: t("admin.roles.TEACHER"),
    ADMIN: t("admin.roles.ADMIN"),
  };

  const formattedBirthday = user?.birthday
    ? new Intl.DateTimeFormat(i18n.language, {
        dateStyle: "medium",
      }).format(new Date(`${user.birthday}T00:00:00`))
    : t("admin.notAvailable");

  return (
    <article className="card-hover flex min-w-0 flex-col rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm">
      {showPhoto && (
        <div className="mb-lg flex justify-center">
          {loading && <Skeleton shape="circle" className="h-28 w-28" />}
          {!loading && user?.photoUrl && (
            <img
              src={user.photoUrl}
              alt={`${user.firstName} ${user.lastName}`}
              className="h-28 w-28 rounded-full border-4 border-green-100 object-cover shadow-sm"
              loading="lazy"
            />
          )}
          {!loading && !user?.photoUrl && (
            <div className="flex h-28 w-28 items-center justify-center rounded-full border-4 border-green-100 bg-green-50">
              <UserRoundIcon
                size={44}
                className="text-green-500"
                aria-hidden="true"
              />
            </div>
          )}
        </div>
      )}

      <header className="flex min-w-0 items-start justify-between gap-sm">
        {loading ? (
          <div className="min-w-0 flex-1">
            <Skeleton shape="line" className="h-5 w-1/2" />
            <Skeleton shape="line" className="mt-2 h-3 w-1/4" />
          </div>
        ) : (
          <div className="min-w-0">
            <h3 className="m-0 break-words font-heading text-h5 font-bold leading-snug text-heading">
              {user!.firstName} {user!.lastName}
            </h3>

            <p className="m-0 mt-2xs font-body text-body-sm text-neutral-500">
              {roleLabels[user!.role] ?? user!.role}
            </p>
          </div>
        )}
      </header>

      {loading ? (
        <>
          <Skeleton shape="line" className="mt-md h-3 w-2/3" />

          <Skeleton shape="line" className="mt-sm h-3 w-1/3" />
        </>
      ) : (
        <>
          <p className="m-0 mt-md break-all font-body text-body-sm text-body-text">
            {user!.email}
          </p>

          {user?.birthday && (
            <p className="m-0 mt-sm font-body text-body-sm text-body-text">
              <span className="font-semibold">{t("admin.birthday")}:</span>{" "}
              {formattedBirthday}
            </p>
          )}
        </>
      )}

      <div className="mt-auto flex justify-end gap-xs pt-lg">
        {loading ? (
          <>
            <Skeleton shape="circle" className="size-10" />

            <Skeleton shape="circle" className="size-10" />
          </>
        ) : (
          <>
            <CardActionButton
              action="edit"
              label={t("admin.edit")}
              onClick={onEdit}
              disabled={!onEdit}
            />

            <CardActionButton
              action="delete"
              label={t("admin.delete")}
              title={isSelf ? t("admin.selfDeleteNotAllowed") : undefined}
              disabled={isSelf || !onDelete}
              onClick={onDelete}
            />
          </>
        )}
      </div>
    </article>
  );
}

export default TeacherCard;
