import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ChevronUpIcon } from '@animateicons/react/lucide'

const PUBLIC_PAGES = ['/', '/news', '/multimedia', '/booking']

function ScrollToTopButton() {
	const { t } = useTranslation()
	const { pathname } = useLocation()
	const [visible, setVisible] = useState(false)

	useEffect(() => {
		if (!PUBLIC_PAGES.includes(pathname) && !pathname.startsWith('/albumes/')) return
		const onScroll = () => setVisible(window.scrollY > 400)
		onScroll()
		window.addEventListener('scroll', onScroll, { passive: true })
		return () => window.removeEventListener('scroll', onScroll)
	}, [pathname])

	if (!PUBLIC_PAGES.includes(pathname) && !pathname.startsWith('/albumes/')) return null

	return (
		<button
			type="button"
			onClick={() => window.scrollTo(0, 0)}
			aria-label={t('common.scrollToTop')}
			className={`fixed bottom-6 right-6 z-40 flex size-12 items-center justify-center rounded-full bg-green-500 text-white shadow-lg transition-all duration-200 hover:bg-green-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-link ${
				visible ? 'translate-y-0 opacity-100' : 'pointer-events-none translate-y-3 opacity-0'
			}`}
		>
			<ChevronUpIcon size={22} isAnimated={false} aria-hidden="true" />
		</button>
	)
}

export default ScrollToTopButton