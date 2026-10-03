import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronUpIcon } from '@animateicons/react/lucide'

const ADMIN_SCROLL_CONTAINER_ID = 'admin-scroll-container'

function isDashboardPath(pathname: string) {
	return pathname.startsWith('/admin') || pathname === '/profile'
}

// The button now shows on every page; only how it scrolls (window vs the
// dashboard's own container) depends on the route.
function supportsScrollToTop(_pathname: string) {
	return true
}

// Dashboard pages scroll inside AdminLayout's own container, not the window,
// so the button has to track and scroll that element instead on those routes.
function getScrollElement(pathname: string): HTMLElement | null {
	return isDashboardPath(pathname) ? document.getElementById(ADMIN_SCROLL_CONTAINER_ID) : null
}

// Checks what's actually painted behind the button's own position so it can
// swap to a color that still contrasts when it lands over a green section
// (e.g. the public-page hero bands, marked with data-scroll-bg="green").
function isOverGreenSection(button: HTMLElement): boolean {
	const rect = button.getBoundingClientRect()
	const x = rect.left + rect.width / 2
	const y = rect.top + rect.height / 2

	const previousPointerEvents = button.style.pointerEvents
	button.style.pointerEvents = 'none'
	const elementBelow = document.elementFromPoint(x, y)
	button.style.pointerEvents = previousPointerEvents

	return !!elementBelow?.closest('[data-scroll-bg="green"]')
}

function ScrollToTopButton() {
	const { t } = useTranslation()
	const { pathname } = useLocation()
	const [visible, setVisible] = useState(false)
	const [overGreen, setOverGreen] = useState(false)
	const buttonRef = useRef<HTMLButtonElement>(null)

	useEffect(() => {
		const el = getScrollElement(pathname)
		if (el) el.scrollTo({ top: 0, left: 0, behavior: 'auto' })
		else window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

		if (!supportsScrollToTop(pathname)) return
		const target: HTMLElement | Window = el ?? window
		const onScroll = () => {
			setVisible((el ? el.scrollTop : window.scrollY) > 400)
			if (buttonRef.current) setOverGreen(isOverGreenSection(buttonRef.current))
		}
		onScroll()
		target.addEventListener('scroll', onScroll, { passive: true })
		return () => target.removeEventListener('scroll', onScroll)
	}, [pathname])

	if (!supportsScrollToTop(pathname)) return null

	const handleClick = () => {
		const el = getScrollElement(pathname)
		if (el) el.scrollTo({ top: 0, behavior: 'auto' })
		else window.scrollTo(0, 0)
	}

	return (
		<button
			ref={buttonRef}
			type="button"
			onClick={handleClick}
			aria-label={t('common.scrollToTop')}
			className={`fixed bottom-6 right-6 z-40 flex size-12 items-center justify-center rounded-full text-white shadow-lg transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link ${
				overGreen ? 'bg-orange-500 hover:bg-orange-600' : 'bg-green-500 hover:bg-green-600'
			} ${visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'}`}
		>
			<ChevronUpIcon size={22} isAnimated={false} aria-hidden="true" />
		</button>
	)
}

export default ScrollToTopButton
