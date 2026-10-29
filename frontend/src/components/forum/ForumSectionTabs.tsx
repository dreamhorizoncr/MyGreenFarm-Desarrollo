import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import TabHighlight from '../ui/TabHighlight.tsx'
import { tabCarouselClass, useTabCarousel } from '../../hooks/useTabCarousel.ts'

const SECTIONS = [
  { id: 'forum-about', labelKey: 'forum.about.title' },
  { id: 'forum-latest', labelKey: 'forum.latest.title' },
  { id: 'forum-popular', labelKey: 'forum.popular.title' },
] as const

type SectionId = (typeof SECTIONS)[number]['id']

function ForumSectionTabs() {
  const { t } = useTranslation()
  const [active, setActive] = useState<SectionId>(SECTIONS[0].id)
  const navRef = useTabCarousel<HTMLElement>(active)
  const lockUntil = useRef(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (Date.now() < lockUntil.current) return
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0]
        if (visible) setActive(visible.target.id as SectionId)
      },
      { rootMargin: '-30% 0px -60% 0px' },
    )
    const observed = new Set<Element>()
    const attach = () => {
      for (const { id } of SECTIONS) {
        const el = document.getElementById(id)
        if (el && !observed.has(el)) {
          observed.add(el)
          observer.observe(el)
        }
      }
    }
    attach()
    const mutations = new MutationObserver(attach)
    mutations.observe(document.body, { childList: true, subtree: true })
    return () => {
      mutations.disconnect()
      observer.disconnect()
    }
  }, [])

  return (
    <nav
      ref={navRef}
      aria-label={t('forum.sidebarLabel')}
      className={`${tabCarouselClass} mt-[calc(var(--spacing-sm)-4px)] lg:hidden`}
    >
      {SECTIONS.map(({ id, labelKey }) => {
        const isActive = id === active
        return (
          <a
            key={id}
            href={`#${id}`}
            data-section={id}
            aria-current={isActive ? 'true' : undefined}
            onClick={() => {
              lockUntil.current = Date.now() + 900
              setActive(id)
            }}
            className={`relative rounded-full border border-green-500 px-md py-xs font-body text-body-sm transition duration-300 focus-visible:outline-2 focus-visible:outline-link focus-visible:outline-offset-2 ${
              isActive ? 'text-white' : 'bg-transparent text-heading hover:bg-green-50'
            }`}
          >
            {isActive && <TabHighlight layoutId="forum-section-tab" className="bg-green-500" />}
            {t(labelKey)}
          </a>
        )
      })}
    </nav>
  )
}

export default ForumSectionTabs
