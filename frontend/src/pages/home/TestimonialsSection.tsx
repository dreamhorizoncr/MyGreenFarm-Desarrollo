import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useTranslation } from "react-i18next";
import { Blobatar } from "@blobatar/react";
import nubesDown from "../../assets/imgs/nubesDown.svg";
import Container from "../../components/home/Container.tsx";
import CarouselDots from "../../components/ui/CarouselDots.tsx";
import CarouselArrowIcon from "../../components/ui/CarouselArrowIcon.tsx";
import lapiz from "../../assets/imgs/lapiz.svg";
import Tijera from "../../assets/imgs/Tijera.svg";
import Goma from "../../assets/imgs/Goma.svg";
import Cabra from "../../assets/imgs/Cabra.svg";
import { animationsStopped } from "../../utils/reducedMotion";
import { useAccessibility } from "../../contexts/accessibility";

const testimonialStyles = [
  { accent: "#F37B25", initials: "MJA" },
  { accent: "#019F62", initials: "CR" },
  { accent: "#FF93A9", initials: "SV" },
];

const cardPosition = (index: number, activeIndex: number, total: number) => {
  if (index === activeIndex) return "active";
  return (index - activeIndex + total) % total === 1 ? "right" : "left";
};

const avatarAnimation = (
  stopped: boolean,
  playing: boolean,
): { animate?: "always" | "hover" } => {
  if (stopped) return {};
  return { animate: playing ? "always" : "hover" };
};

function TestimonialsSection() {
  const { stopAnimations } = useAccessibility();
  const { t } = useTranslation();
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const [inView, setInView] = useState(false);

  const testimonials = [
    {
      quote: t("home.testimonials.card1.quote"),
      author: t("home.testimonials.card1.author"),
    },
    {
      quote: t("home.testimonials.card2.quote"),
      author: t("home.testimonials.card2.author"),
    },
    {
      quote: t("home.testimonials.card3.quote"),
      author: t("home.testimonials.card3.author"),
    },
  ];

  const move = useCallback(
    (direction: 1 | -1) => {
      setActiveIndex(
        (current) =>
          (current + direction + testimonials.length) % testimonials.length,
      );
    },
    [testimonials.length],
  );

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return undefined;
    const observer = new IntersectionObserver(([entry]) =>
      setInView(entry.isIntersecting),
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (stopAnimations || animationsStopped() || isPaused || !inView)
      return undefined;
    const interval = window.setInterval(() => move(1), 6000);
    return () => window.clearInterval(interval);
  }, [inView, isPaused, move, stopAnimations]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [move]);

  return (
    <section
      ref={sectionRef}
      id="testimonials"
      className="relative flex min-h-[100svh] w-full flex-col"
    >
      <div className="relative w-full overflow-hidden leading-none">
        <img
          src={nubesDown}
          alt=""
          aria-hidden="true"
          data-scroll-bg="green"
          className="relative -mb-1 block w-[110vw] max-w-none -translate-x-1/2 left-1/2 object-cover"
        />
      </div>

      <div className="relative overflow-hidden fondo-cuadricula min-h-screen">
        <img
          src={lapiz}
          alt=""
          aria-hidden="true"
          className="absolute top-[1%] right-[3%] rotate-[18deg]
    w-[clamp(4.5rem,11vw,12rem)]
    sm:right-[2%] sm:top-[3%]
    lg:top-[6%] lg:right-[4%]
    pointer-events-none select-none opacity-50"
        />

        <img
          src={Goma}
          alt=""
          aria-hidden="true"
          className="absolute top-[11%] left-[1%] rotate-[-20deg]
    w-[clamp(3rem,6vw,6.5rem)]
    md:top-[4%] md:left-[8%]
    lg:left-[7%]
    pointer-events-none select-none opacity-50"
        />

        <img
          src={Tijera}
          alt=""
          aria-hidden="true"
          className="absolute bottom-[2%] left-[3%] rotate-[70deg]
    w-[clamp(4rem,10vw,11rem)]
    sm:left-[3%]
    lg:bottom-[5%] lg:left-[7%]
    pointer-events-none select-none opacity-50"
        />

        <img
          src={Cabra}
          alt=""
          aria-hidden="true"
          className="absolute bottom-[3%] right-[10%] rotate-[-14deg]
    w-[clamp(2.5rem,10vw,9rem)]
    md:right-[18%]
    lg:bottom-[6%] lg:right-[12%]
    pointer-events-none select-none opacity-50"
        />
        <div className="flex w-full flex-1 flex-col justify-center" />

        <Container className="flex flex-col items-center gap-lg py-1500">
          <h2 className="m-0 text-center font-heading text-h2 font-bold text-heading">
            {t("home.testimonials.title")}
          </h2>

          <div className="flex w-full flex-col items-center gap-1200">
            <p className="max-w-[30rem] text-center font-body text-body font-normal text-body-text">
              {t("home.testimonials.description")}
            </p>

            <div
              className="testimonial-carousel relative w-full"
              aria-roledescription="carousel"
              aria-label={t("home.testimonials.title")}
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onTouchStart={(event) => {
                touchStartX.current = event.touches[0]?.clientX ?? null;
              }}
              onTouchEnd={(event) => {
                if (touchStartX.current === null) return;
                const distance =
                  event.changedTouches[0]?.clientX - touchStartX.current;
                if (Math.abs(distance) > 40) move(distance < 0 ? 1 : -1);
                touchStartX.current = null;
              }}
            >
              {testimonials.map((testimonial, index) => {
                const isActive = index === activeIndex;
                const style = testimonialStyles[index];
                const position = cardPosition(
                  index,
                  activeIndex,
                  testimonials.length,
                );
                const [name, role = ""] = testimonial.author.split(" — ");

                return (
                  <button
                    key={testimonial.author}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    aria-label={`${name}, ${role}`}
                    aria-current={isActive ? "true" : undefined}
                    data-position={position}
                    className="testimonial-card absolute left-1/2 top-0 flex flex-col overflow-hidden rounded-2xl border-t-4 bg-white p-7 text-left"
                    style={
                      { "--testimonial-accent": style.accent } as CSSProperties
                    }
                  >
                    <span
                      className="testimonial-card__quote-mark"
                      aria-hidden="true"
                    >
                      “
                    </span>
                    <span className="testimonial-card__quote font-body">
                      {testimonial.quote}
                    </span>
                    <span className="mt-5 border-t border-[var(--grey-100)] pt-4">
                      <span className="flex items-center gap-3">
                        <Blobatar
                          name={name}
                          size={44}
                          {...avatarAnimation(
                            stopAnimations,
                            inView && isActive,
                          )}
                          title={name}
                          palette={{ head: style.accent }}
                          className="size-11 shrink-0 rounded-full"
                        />
                        <span className="flex min-w-0 flex-col">
                          <span className="font-body text-body-sm font-bold text-[var(--grey-800)]">
                            {name}
                          </span>
                          <span className="font-body text-caption text-[var(--grey-500)]">
                            {role}
                          </span>
                          <span className="sr-only">{style.initials}</span>
                        </span>
                      </span>
                    </span>
                  </button>
                );
              })}
              <button
                type="button"
                aria-label="Anterior"
                onClick={() => move(-1)}
                className="testimonial-carousel__arrow testimonial-carousel__arrow--left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--orange-500)]"
              >
                <CarouselArrowIcon flip />
              </button>
              <button
                type="button"
                aria-label="Siguiente"
                onClick={() => move(1)}
                className="testimonial-carousel__arrow testimonial-carousel__arrow--right focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--orange-500)]"
              >
                <CarouselArrowIcon />
              </button>
            </div>
            <CarouselDots
              count={testimonials.length}
              activeIndex={activeIndex}
              onSelect={setActiveIndex}
              ariaLabel={t("home.testimonials.navigation")}
              getItemLabel={(index) =>
                t("home.testimonials.goTo", { number: index + 1 })
              }
            />
          </div>
        </Container>
      </div>
    </section>
  );
}

export default TestimonialsSection;
