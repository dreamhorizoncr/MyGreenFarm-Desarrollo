import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ChevronDown,
  FileText,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  User,
  type LucideIcon,
} from "lucide-react";
import { useLogin } from "../hooks/useLogin.ts";

type SidebarItemId =
  | "dashboard"
  | "docentes"
  | "cv"
  | "expedientes"
  | "miPerfil";

interface SidebarItem {
  id: SidebarItemId;
  icon: LucideIcon;
  path?: string;
}

function AdminSidebar() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { logout } = useLogin();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  const items: SidebarItem[] = [
    { id: "dashboard", icon: LayoutDashboard, path: "/admin/dashboard" },
    { id: "docentes", icon: GraduationCap, path: "/admin/users" },
    { id: "cv", icon: FileText },
    { id: "expedientes", icon: FolderOpen },
    { id: "miPerfil", icon: User },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const itemClasses =
    "flex w-full shrink-0 items-center gap-sm rounded-full px-md py-sm text-left font-body text-[15px] font-semibold text-body-text transition-colors duration-150 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2";
  const activeItem = items.find((item) => item.path === pathname) ?? items[0];
  const ActiveIcon = activeItem.icon;

  return (
    <aside className="w-full shrink-0 bg-bg-page p-md md:flex md:w-[260px] md:flex-col md:py-lg">
      {/*Menu Exclusivo de Admin*/}
      <div className="md:hidden">
        <button
          type="button"
          onClick={() => setOpen((prev) => !prev)}
          className="flex w-full items-center justify-between rounded-full bg-heading px-md py-sm font-body text-[15px] font-semibold text-white"
          aria-expanded={open}
        >
          <span className="flex items-center gap-sm">
            <span className="inline-flex size-[34px] items-center justify-center rounded-full bg-white text-heading">
              <ActiveIcon size={18} />
            </span>

            {t(`admin.sidebar.${activeItem.id}`)}
          </span>

          <ChevronDown
            size={18}
            className={`transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {/* Opciones al abrir */}
        {open && (
          <nav className="mt-sm flex flex-col gap-xs rounded-2xl bg-white p-sm shadow">
            {items.map(({ id, icon: Icon, path }) => {
              const isActive = path === pathname;
              const label = t(`admin.sidebar.${id}`);

              return path ? (
                <Link
                  key={id}
                  to={path}
                  onClick={() => setOpen(false)}
                  className={`${itemClasses}${
                    isActive ? " bg-heading text-white" : ""
                  }`}
                  aria-current={isActive ? "page" : undefined}
                >
                  <span
                    className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white text-heading"
                    aria-hidden="true"
                  >
                    <Icon size={18} />
                  </span>

                  <span>{label}</span>
                </Link>
              ) : (
                <button key={id} type="button" className={itemClasses}>
                  <span
                    className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white text-heading"
                    aria-hidden="true"
                  >
                    <Icon size={18} />
                  </span>

                  <span>{label}</span>
                </button>
              );
            })}

            <button
              type="button"
              className={`${itemClasses} text-danger`}
              onClick={handleLogout}
            >
              <span
                className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white text-danger"
                aria-hidden="true"
              >
                <LogOut size={18} />
              </span>

              <span>{t("profile.logout")}</span>
            </button>
          </nav>
        )}
      </div>

      {/*SideBar*/}
      <nav className="hidden flex-1 flex-col gap-sm md:flex">
        {items.map(({ id, icon: Icon, path }) => {
          const isActive = path === pathname;
          const label = t(`admin.sidebar.${id}`);
          const className = `${itemClasses}${
            isActive ? " bg-heading text-white" : ""
          }`;

          return path ? (
            <Link
              key={id}
              to={path}
              className={className}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white text-heading"
                aria-hidden="true"
              >
                <Icon size={18} />
              </span>

              <span>{label}</span>
            </Link>
          ) : (
            <button key={id} type="button" className={className}>
              <span
                className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white text-heading"
                aria-hidden="true"
              >
                <Icon size={18} />
              </span>

              <span>{label}</span>
            </button>
          );
        })}

        <button
          type="button"
          className={`${itemClasses} mt-auto text-danger`}
          onClick={handleLogout}
        >
          <span
            className="inline-flex size-[34px] shrink-0 items-center justify-center rounded-full bg-white text-danger"
            aria-hidden="true"
          >
            <LogOut size={18} />
          </span>

          <span>{t("profile.logout")}</span>
        </button>
      </nav>
    </aside>
  );
}

export default AdminSidebar;
