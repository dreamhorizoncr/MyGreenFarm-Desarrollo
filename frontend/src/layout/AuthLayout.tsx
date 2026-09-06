import type { ReactNode } from "react";
import illustration from "../assets/imgs/IlustrationAuth.png";
import LanguageSwitcher from "../components/LanguageSwitcher.tsx";

interface AuthLayoutProps {
  overtitle: string;
  rightPanelClassName?: string;
  contentClassName?: string;
  children: ReactNode;
}

function AuthLayout({
  overtitle,
  rightPanelClassName = "px-[15px] pb-[28px] pt-[65px] md:px-[70px] md:py-[55px]",
  contentClassName = "max-w-[430px]",
  children,
}: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-bg-page px-[30px] py-[30px] md:px-6 md:py-10">
      
      {/* Contenedor Principal */}
      <section className="relative flex w-full max-w-[333px] flex-col overflow-hidden rounded-[13px] bg-bg-card shadow md:h-[650px] md:max-w-[1180px] md:flex-row md:rounded-2xl">

        {/* Panel de Ilustración */}
        <div className="relative h-[205px] w-full shrink-0 overflow-hidden md:h-full md:w-1/2">

          {/* Ilustración */}
          <img
            src={illustration}
            alt="My Green Farm"
            className="absolute inset-0 h-full w-full object-cover object-[center_65%] md:object-center"
          />

          {/* Welcome */}
          <div className="absolute left-0 top-[18px] z-10 w-full text-center md:top-[9%]">
            <h1 className="m-0 font-heading text-[20px] leading-none tracking-wide text-white md:text-[45px]">
              {overtitle}
            </h1>
          </div>

        </div>

        {/* Panel Derecho */}
        <div
          className={`relative flex w-full flex-col bg-bg-card md:w-1/2 ${rightPanelClassName}`}
        >

          {/* Selector de idioma */}
          <div className="absolute right-[15px] top-[30px] z-20 md:right-[30px] md:top-[25px]">
            <LanguageSwitcher />
          </div>

          {/* Contenido */}
          <div
            className={`mx-auto flex w-full flex-col justify-start md:h-full md:justify-center ${contentClassName}`}
          >
            {children}
          </div>

        </div>

      </section>

    </main>
  );
}

export default AuthLayout;
