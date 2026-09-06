import { useState } from "react";

import NavBar from "../components/Navbar";
import { useTranslation } from "react-i18next";

import news1 from "../assets/imgs/news1.png";
import news2 from "../assets/imgs/news2.png";
import news3 from "../assets/imgs/news3.png";
import news4 from "../assets/imgs/news4.png";

// import Footer from '../layout/Footer'

type NewsCategory = "All" | "Académicos" | "Events" | "Community";

function NewsPage() {
  const { t } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<NewsCategory>("All");

  return (
    <div id="news-page" className="min-h-screen bg-bg-page">
      <NavBar />

      {/* Hero de Noticias */}
      <section className="flex min-h-[360px] items-center bg-green-500 px-[30px] py-[60px] text-center text-white md:min-h-[420px]">
        <div className="mx-auto w-full max-w-[700px]">
          <h1 className="m-0 font-heading text-[34px] font-bold leading-tight text-white md:text-[46px]">
            {t("newspage.title")}
          </h1>

          <p className="mx-auto mt-[20px] max-w-[560px] font-body text-[13px] leading-[1.6] text-white md:text-[15px]">
            {t("newspage.description")}
          </p>

          {/* Filtros */}
          <div className="mt-[24px] flex flex-wrap justify-center gap-[10px]">
            <button
              type="button"
              onClick={() => setActiveCategory("All")}
              className={`rounded-full px-[18px] py-[8px] font-body text-[12px] text-white transition md:text-[14px] ${
                activeCategory === "All" ? "bg-orange-500" : "bg-orange-400"
              }`}
            >
              {t("newspage.category1")}
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory("Académicos")}
              className={`rounded-full px-[18px] py-[8px] font-body text-[12px] text-white transition md:text-[14px] ${
                activeCategory === "Académicos"
                  ? "bg-orange-500"
                  : "bg-orange-400"
              }`}
            >
              {t("newspage.category2")}
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory("Events")}
              className={`rounded-full px-[18px] py-[8px] font-body text-[12px] text-white transition md:text-[14px] ${
                activeCategory === "Events" ? "bg-orange-500" : "bg-orange-400"
              }`}
            >
              {t("newspage.category3")}
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory("Community")}
              className={`rounded-full px-[18px] py-[8px] font-body text-[12px] text-white transition md:text-[14px] ${
                activeCategory === "Community"
                  ? "bg-orange-500"
                  : "bg-orange-400"
              }`}
            >
              {t("newspage.category4")}
            </button>
          </div>
        </div>
      </section>

      {/* Sección de Noticias */}
      <main className="mx-auto max-w-[1120px] px-[30px] py-[70px] md:px-[40px] md:py-[80px]">
        <div className="flex flex-col gap-[18px]">
          {/* Primera fila */}
          <div className="grid grid-cols-1 gap-[18px] md:grid-cols-12">
            {/* Card 1 */}
            {(activeCategory === "All" || activeCategory === "Community") && (
              <article className="overflow-hidden rounded-[16px] border border-neutral-200 bg-white md:col-span-8 md:grid md:h-[340px] md:grid-cols-12">
                {/* Imagen */}
                <div className="relative h-[240px] md:col-span-6 md:h-full">
                  <img
                    src={news1}
                    alt="Evento 1"
                    className="h-full w-full object-cover"
                  />

                  <span className="absolute left-[14px] top-[14px] rounded-full bg-orange-500 px-[12px] py-[5px] font-body text-[11px] text-white">
                    Comunidad
                  </span>
                </div>

                {/* Contenido */}
                <div className="flex flex-col items-start p-[22px] text-left md:col-span-6">
                  <span className="font-body text-[11px] text-neutral-500">
                    18 de octubre
                  </span>

                  <h2 className="mt-[10px] font-heading text-[28px] font-bold text-heading">
                    Evento 1
                  </h2>

                  <p className="mt-[14px] font-body text-[13px] leading-[1.6] text-body-text">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua.
                  </p>

                  <button
                    type="button"
                    className="mt-[26px] w-fit rounded-full border border-pink-400 px-[16px] py-[7px] font-body text-[11px] uppercase text-pink-500"
                  >
                    Leer más
                  </button>
                </div>
              </article>
            )}

            {/* Card 2 */}
            {(activeCategory === "All" || activeCategory === "Events") && (
              <article className="overflow-hidden rounded-[16px] border border-neutral-200 bg-white md:col-span-4 md:flex md:h-[340px] md:flex-col">
                <div className="relative h-[200px] md:h-[125px] md:shrink-0">
                  <img
                    src={news2}
                    alt="Evento 2"
                    className="h-full w-full object-cover"
                  />

                  <span className="absolute left-[14px] top-[14px] rounded-full bg-orange-500 px-[12px] py-[5px] font-body text-[11px] text-white">
                    Eventos
                  </span>
                </div>

                <div className="flex flex-1 flex-col items-start p-[20px] text-left">
                  <span className="font-body text-[11px] text-neutral-500">
                    8 de enero
                  </span>

                  <h2 className="mt-[8px] font-heading text-[28px] font-bold text-heading">
                    Evento 2
                  </h2>

                  <p className="mt-[2px] font-body text-[12px] leading-[1.55] text-body-text">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua.
                  </p>

                  <button
                    type="button"
                    className="mt-auto w-fit rounded-full border border-pink-400 px-[16px] py-[7px] font-body text-[11px] uppercase text-pink-500"
                  >
                    Leer más
                  </button>
                </div>
              </article>
            )}
          </div>

          {/* Segunda fila */}
          <div className="grid grid-cols-1 gap-[18px] md:grid-cols-12">
            {/* Card 3 */}
            {(activeCategory === "All" || activeCategory === "Académicos") && (
              <article className="overflow-hidden rounded-[16px] border border-neutral-200 bg-white md:col-span-4 md:flex md:h-[340px] md:flex-col">
                <div className="relative h-[200px] md:h-[125px] md:shrink-0">
                  <img
                    src={news3}
                    alt="Evento Académico"
                    className="h-full w-full object-cover"
                  />

                  <span className="absolute left-[14px] top-[14px] rounded-full bg-orange-500 px-[12px] py-[5px] font-body text-[11px] text-white">
                    Académicos
                  </span>
                </div>

                <div className="flex flex-1 flex-col items-start p-[20px] text-left">
                  <span className="font-body text-[11px] text-neutral-500">
                    6 de enero
                  </span>

                  <h2 className="mt-[8px] font-heading text-[28px] font-bold text-heading">
                    Evento Académico
                  </h2>

                  <p className="mt-[2px] font-body text-[12px] leading-[1.55] text-body-text">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua.
                  </p>

                  <button
                    type="button"
                    className="mt-auto w-fit rounded-full border border-pink-400 px-[16px] py-[7px] font-body text-[11px] uppercase text-pink-500"
                  >
                    Leer más
                  </button>
                </div>
              </article>
            )}

            {/* Card 4 */}
            {(activeCategory === "All" || activeCategory === "Community") && (
              <article className="overflow-hidden rounded-[16px] border border-neutral-200 bg-white md:col-span-8 md:grid md:h-[340px] md:grid-cols-12">
                {/* Imagen */}
                <div className="relative h-[240px] md:col-span-6 md:h-full">
                  <img
                    src={news4}
                    alt="Evento 1"
                    className="h-full w-full object-cover"
                  />

                  <span className="absolute left-[14px] top-[14px] rounded-full bg-orange-500 px-[12px] py-[5px] font-body text-[11px] text-white">
                    Comunidad
                  </span>
                </div>

                {/* Contenido */}
                <div className="flex flex-col items-start p-[22px] text-left md:col-span-6">
                  <span className="font-body text-[11px] text-neutral-500">
                    30 de octubre
                  </span>

                  <h2 className="mt-[10px] font-heading text-[28px] font-bold text-heading">
                    Evento 1
                  </h2>

                  <p className="mt-[14px] font-body text-[13px] leading-[1.6] text-body-text">
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed
                    do eiusmod tempor incididunt ut labore et dolore magna
                    aliqua.
                  </p>

                  <button
                    type="button"
                    className="mt-[26px] w-fit rounded-full border border-pink-400 px-[16px] py-[7px] font-body text-[11px] uppercase text-pink-500"
                  >
                    Leer más
                  </button>
                </div>
              </article>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default NewsPage;
