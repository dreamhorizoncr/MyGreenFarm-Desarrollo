import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import ModalCloseButton from "../components/ui/ModalCloseButton.tsx";
import illustration from "../assets/imgs/portadaTemporal.jpeg";
import Navbar from "../components/Navbar.tsx";

interface AuthLayoutProps {
  overtitle: string;
  rightPanelClassName?: string;
  contentClassName?: string;
  containerClassName?: string;
  scrollable?: boolean;
  closeTo?: string;
  children: ReactNode;
}

function AuthLayout({
  overtitle,
  rightPanelClassName = "px-[15px] pb-[28px] pt-[65px] md:px-[70px] md:py-[55px]",
  contentClassName = "max-w-[430px]",
  containerClassName = "md:max-w-[900px]",
  scrollable = false,
  closeTo = "/",
  children,
}: Readonly<AuthLayoutProps>) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-bg-page">
  <Navbar />

  <main className="flex items-center justify-center px-[30px] py-[30px] md:px-6 md:py-16">
    <section
      className={`relative flex w-full max-w-[333px] flex-col rounded-[13px] bg-bg-card shadow md:min-h-[500px] md:max-h-[calc(100svh-8rem)] md:flex-row md:rounded-2xl ${scrollable ? "overflow-y-auto" : "overflow-hidden"} ${containerClassName}`}
    >
      <div className="relative h-[205px] w-full shrink-0 overflow-hidden md:h-auto md:w-1/2">
        <img
          src={illustration}
          alt="My Green Farm"
          className="absolute inset-0 h-full w-full object-cover object-[center_65%] md:object-center"
        />

        <div className="absolute left-0 top-[18px] z-10 w-full text-center md:top-[9%]">
          <h1 className="m-0 font-heading text-h6 leading-none tracking-wide text-heading md:text-h1">
            {overtitle}
          </h1>
        </div>
      </div>

      <div className="relative flex w-full flex-col bg-bg-card md:min-h-0 md:w-1/2">
        <ModalCloseButton
          onClick={() => navigate(closeTo)}
          aria-label={t("common.close")}
          className="absolute right-[15px] top-[26px] z-20 md:right-[30px] md:top-[22px]"
        />

        <div
          className={`flex flex-col md:min-h-0 md:flex-1 md:overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${rightPanelClassName}`}
        >
          <div
            className={`mx-auto flex w-full shrink-0 flex-col justify-start md:my-auto ${contentClassName}`}
          >
            {children}
          </div>
        </div>
      </div>
    </section>
  </main>
</div>
  );
}

export default AuthLayout;
