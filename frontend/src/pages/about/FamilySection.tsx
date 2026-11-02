import {
  forwardRef,
  useImperativeHandle,
  useRef,
  type ForwardRefExoticComponent,
  type ReactNode,
  type RefAttributes,
} from 'react'
import { motion, useAnimationControls, useReducedMotion } from 'motion/react'
import {
  BlocksIcon,
  FootprintsIcon,
  GlobeIcon,
  HeartIcon,
  HouseIcon,
  QuoteIcon,
  RabbitIcon,
  RocketIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SunIcon,
  SunriseIcon,
  UsersIcon,
} from '@animateicons/react/lucide'
import { useTranslation } from 'react-i18next'

import familiaFundadora from '../../assets/imgs/familiaFundadora.jpeg'
import Container from '../../components/home/Container.tsx'

type IconHandle = { startAnimation: () => void; stopAnimation: () => void }
type AnimatedIcon = ForwardRefExoticComponent<{ size?: number; className?: string } & RefAttributes<IconHandle>>

const DEVELOPMENT = ['emotional', 'social', 'physical', 'cognitive'] as const

const PILLARS: { key: 'play' | 'nature' | 'languages' | 'values'; Icon: AnimatedIcon; color: string }[] = [
  { key: 'play', Icon: BlocksIcon, color: 'bg-[var(--orange-500)]' },
  { key: 'nature', Icon: RabbitIcon, color: 'bg-green-500' },
  { key: 'languages', Icon: GlobeIcon, color: 'bg-[var(--pink-400)]' },
  { key: 'values', Icon: HeartIcon, color: 'bg-[var(--orange-400)]' },
]

const DREAMS: { key: 'participate' | 'safe' | 'adventure'; Icon: AnimatedIcon; color: string }[] = [
  { key: 'participate', Icon: UsersIcon, color: 'bg-green-500' },
  { key: 'safe', Icon: ShieldCheckIcon, color: 'bg-[var(--pink-400)]' },
  { key: 'adventure', Icon: RocketIcon, color: 'bg-[var(--orange-500)]' },
]

const FilledHeart = forwardRef<IconHandle, { size?: number; className?: string }>(({ size = 24, className = '' }, ref) => {
  const controls = useAnimationControls()
  const reduceMotion = useReducedMotion()

  useImperativeHandle(ref, () => ({
    startAnimation: () => {
      if (reduceMotion) return
      void controls.start({ scale: [1, 1.25, 0.95, 1.15, 1], transition: { duration: 0.8, ease: 'easeInOut' } })
    },
    stopAnimation: () => void controls.start({ scale: 1, transition: { duration: 0.2 } }),
  }))

  return (
    <motion.svg
      animate={controls}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`shrink-0 ${className}`}
    >
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </motion.svg>
  )
})

function useHoverIcon() {
  const ref = useRef<IconHandle>(null)
  return {
    ref,
    hover: {
      onMouseEnter: () => ref.current?.startAnimation(),
      onMouseLeave: () => ref.current?.stopAnimation(),
    },
  }
}

function ChapterTitle({ Icon, color, children }: Readonly<{ Icon: AnimatedIcon; color: string; children: ReactNode }>) {
  const { ref, hover } = useHoverIcon()
  return (
    <h3 {...hover} className="m-0 flex items-center gap-sm font-heading text-h4 font-bold leading-snug text-heading">
      <span className={`flex size-11 shrink-0 items-center justify-center rounded-full ${color}`} aria-hidden="true">
        <Icon ref={ref} size={22} />
      </span>
      {children}
    </h3>
  )
}

function PillarItem({ Icon, color, label, index }: Readonly<{ Icon: AnimatedIcon; color: string; label: string; index: number }>) {
  const reduceMotion = useReducedMotion()
  const { ref, hover } = useHoverIcon()
  return (
    <motion.li
      {...hover}
      initial={{ rotate: index % 2 === 0 ? -6 : 6 }}
      whileHover={reduceMotion ? undefined : { rotate: 0, scale: 1.08, y: -4 }}
      transition={{ type: 'spring', stiffness: 260, damping: 14 }}
      className="flex flex-col items-center gap-xs text-center"
    >
      <span
        className={`flex size-16 items-center justify-center rounded-full border-4 border-white text-white shadow-md ${color}`}
        aria-hidden="true"
      >
        <Icon ref={ref} size={28} />
      </span>
      <span className="rounded-full bg-[var(--green-50)] px-sm py-0.5 font-heading text-body-sm font-bold text-heading">
        {label}
      </span>
    </motion.li>
  )
}

function DreamItem({ Icon, color, label }: Readonly<{ Icon: AnimatedIcon; color: string; label: string }>) {
  const { ref, hover } = useHoverIcon()
  return (
    <li {...hover} className="relative flex items-center gap-md">
      <span
        className={`flex size-10 shrink-0 items-center justify-center rounded-full text-white ring-4 ring-white ${color}`}
        aria-hidden="true"
      >
        <Icon ref={ref} size={20} />
      </span>
      <span className="font-heading text-h6 font-bold leading-snug text-heading">{label}</span>
    </li>
  )
}

function FamilySection() {
  const { t } = useTranslation()
  const reduceMotion = useReducedMotion()
  const { ref: heartRef, hover: heartHover } = useHoverIcon()
  const { ref: sunRef, hover: sunHover } = useHoverIcon()
  const { ref: davidRef, hover: davidHover } = useHoverIcon()
  const { ref: homeRef, hover: homeHover } = useHoverIcon()
  const { ref: signatureRef, hover: signatureHover } = useHoverIcon()

  const reveal = (delay = 0) =>
    reduceMotion
      ? {}
      : {
          initial: { opacity: 0, y: 24 },
          whileInView: { opacity: 1, y: 0 },
          viewport: { once: true, amount: 0.2 },
          transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
        }

  const paragraph = 'm-0 font-body text-body leading-[1.7] text-body-text'

  return (
    <section id="our-family" aria-labelledby="our-family-title" className="relative w-full overflow-hidden">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-24 top-24 size-72 rounded-full bg-[var(--pink-200)] opacity-20 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-24 top-1/2 size-80 rounded-full bg-green-500 opacity-10 blur-3xl"
      />

      <Container className="relative flex flex-col gap-1100 text-left py-1000 sm:py-1200 lg:gap-1500 lg:py-1500">
        <div className="grid items-center gap-xl lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-1100">
          <motion.figure
            {...reveal(0.1)}
            onMouseEnter={() => {
              heartHover.onMouseEnter()
              sunHover.onMouseEnter()
            }}
            onMouseLeave={() => {
              heartHover.onMouseLeave()
              sunHover.onMouseLeave()
            }}
            className="relative mx-auto m-0 w-full max-w-[24rem]"
          >
            <div className="relative -rotate-2 rounded-[2rem] border-[3px] border-dashed border-green-500 bg-white p-sm shadow-sm transition-transform duration-500 hover:rotate-0">
              <img
                src={familiaFundadora}
                alt={t('aboutUsPage.family.imageAlt')}
                loading="lazy"
                width={1214}
                height={1600}
                className="block aspect-[4/5] w-full rounded-[1.5rem] object-cover object-top"
              />
            </div>

            <div
              aria-hidden="true"
              className="absolute -left-4 -top-4 flex size-14 -rotate-12 items-center justify-center rounded-full bg-white text-[var(--pink-400)] shadow-sm"
            >
              <FilledHeart ref={heartRef} size={28} />
            </div>
            <div
              aria-hidden="true"
              className="absolute -right-3 top-1/3 flex size-12 rotate-12 items-center justify-center rounded-full bg-white text-[var(--orange-500)] shadow-sm"
            >
              <SunIcon ref={sunRef} size={28} />
            </div>

            <figcaption className="mx-auto -mt-5 w-fit rotate-1 rounded-full bg-green-500 px-md py-xs font-heading text-body-sm font-bold text-white shadow-sm">
              {t('aboutUsPage.family.caption')}
            </figcaption>
          </motion.figure>

          <motion.div {...reveal(0.2)} className="flex min-w-0 flex-col items-start text-left">
            <span className="rounded-full bg-[var(--pink-400)] px-sm py-2xs font-body text-caption font-semibold text-white">
              {t('aboutUsPage.family.eyebrow')}
            </span>

            <h2 id="our-family-title" className="m-0 mt-md text-balance font-heading text-h2 font-bold leading-tight text-heading">
              {t('aboutUsPage.family.title')}
            </h2>

            <p className="m-0 mt-md font-body text-body-lg leading-[1.6] text-[var(--body-text-dark)]">
              {t('aboutUsPage.family.lead')}
            </p>

            <div className="mt-lg flex w-full flex-col gap-sm border-t-2 border-dashed border-[var(--green-100)] pt-lg">
              <ChapterTitle Icon={SunriseIcon} color="bg-[var(--green-50)] text-green-500">
                {t('aboutUsPage.family.chapters.dream')}
              </ChapterTitle>
              <p className={paragraph}>{t('aboutUsPage.family.paragraph1')}</p>

              <ul className="m-0 mt-xs flex list-none flex-wrap gap-xs p-0">
                {DEVELOPMENT.map((key) => (
                  <li
                    key={key}
                    className="rounded-full border border-green-500/30 bg-white px-md py-1 font-body text-body-sm font-semibold text-green-500"
                  >
                    {t(`aboutUsPage.family.development.${key}`)}
                  </li>
                ))}
              </ul>
            </div>
          </motion.div>
        </div>

        <div className="grid gap-lg md:grid-cols-2">
          <motion.article
            {...reveal()}
            {...davidHover}
            className="relative flex flex-col gap-md overflow-hidden rounded-3xl bg-[var(--pink-50)] p-lg md:p-xl"
          >
            <ChapterTitle Icon={FootprintsIcon} color="bg-white text-[var(--pink-600)]">
              {t('aboutUsPage.family.chapters.david')}
            </ChapterTitle>
            <p className={paragraph}>{t('aboutUsPage.family.paragraph2')}</p>
            <FilledHeart
              ref={davidRef}
              size={64}
              className="pointer-events-none absolute -bottom-3 right-3 rotate-12 text-[var(--pink-200)] opacity-70"
            />
          </motion.article>

          <motion.article
            {...reveal(0.1)}
            {...homeHover}
            className="relative flex flex-col gap-md overflow-hidden rounded-3xl bg-[var(--orange-50)] p-lg md:p-xl"
          >
            <ChapterTitle Icon={HouseIcon} color="bg-white text-[var(--orange-500)]">
              {t('aboutUsPage.family.chapters.puzzle')}
            </ChapterTitle>
            <p className={paragraph}>{t('aboutUsPage.family.paragraph3')}</p>
            <BlocksIcon
              ref={homeRef}
              size={64}
              aria-hidden="true"
              className="pointer-events-none absolute -bottom-3 right-3 -rotate-12 text-[var(--orange-200)] opacity-80"
            />
          </motion.article>
        </div>

        <motion.blockquote
          {...reveal()}
          className="relative m-0 overflow-hidden rounded-[2rem] bg-green-500 px-lg py-1000 text-center sm:px-1100"
        >
          <QuoteIcon
            size={120}
            aria-hidden="true"
            className="pointer-events-none absolute -left-4 -top-6 text-white opacity-15"
          />
          <SparklesIcon
            size={90}
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-5 -right-3 text-white opacity-15"
          />
          <p className="relative mx-auto m-0 max-w-[44rem] font-heading text-h3 font-bold leading-snug text-white">
            {t('aboutUsPage.family.quote')}
          </p>
        </motion.blockquote>

        <div className="grid items-stretch gap-lg lg:grid-cols-2">
          <motion.div
            {...reveal()}
            className="relative flex flex-col gap-md rounded-[2rem] border-[3px] border-dashed border-[var(--green-300)] bg-white p-lg md:p-xl"
          >
            <ChapterTitle Icon={SunIcon} color="bg-[var(--green-50)] text-green-500">
              {t('aboutUsPage.family.chapters.together')}
            </ChapterTitle>
            <p className={paragraph}>{t('aboutUsPage.family.paragraph4')}</p>

            <ul className="m-0 mt-auto grid list-none grid-cols-2 gap-x-sm gap-y-md p-0 pt-md sm:grid-cols-4">
              {PILLARS.map(({ key, Icon, color }, index) => (
                <PillarItem
                  key={key}
                  Icon={Icon}
                  color={color}
                  index={index}
                  label={t(`aboutUsPage.family.pillars.${key}`)}
                />
              ))}
            </ul>
          </motion.div>

          <motion.div
            {...reveal(0.1)}
            className="relative flex flex-col gap-md rounded-[2rem] border-[3px] border-dashed border-[var(--orange-300)] bg-white p-lg md:p-xl"
          >
            <ChapterTitle Icon={SparklesIcon} color="bg-[var(--orange-50)] text-[var(--orange-500)]">
              {t('aboutUsPage.family.chapters.future')}
            </ChapterTitle>
            <p className={paragraph}>{t('aboutUsPage.family.paragraph5')}</p>

            <ol className="relative m-0 mt-auto flex list-none flex-col gap-md p-0 pt-xs">
              <span
                aria-hidden="true"
                className="absolute bottom-5 left-5 top-5 border-l-[3px] border-dotted border-[var(--orange-300)]"
              />
              {DREAMS.map(({ key, Icon, color }) => (
                <DreamItem key={key} Icon={Icon} color={color} label={t(`aboutUsPage.family.dreams.${key}`)} />
              ))}
            </ol>
          </motion.div>
        </div>

        <motion.p
          {...reveal()}
          {...signatureHover}
          className="mx-auto m-0 flex items-center gap-sm text-center font-heading text-h6 font-bold text-heading"
        >
          <FilledHeart ref={signatureRef} size={20} className="text-[var(--pink-400)]" />
          {t('aboutUsPage.family.signature')}
        </motion.p>
      </Container>
    </section>
  )
}

export default FamilySection
