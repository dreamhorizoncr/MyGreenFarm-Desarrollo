import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDownIcon, SearchIcon, SendIcon } from '@animateicons/react/lucide'
import AdminLayout from '../layout/AdminLayout.tsx'
import ConfirmNewsletterUnsubscribeModal from '../components/ConfirmNewsletterUnsubscribeModal.tsx'
import Skeleton from '../components/ui/Skeleton.tsx'
import Pagination from '../components/ui/Pagination.tsx'
import useDismiss from '../hooks/useDismiss.ts'
import { useNewsletter } from '../hooks/useNewsletter.ts'
import { useClientPagination } from '../hooks/useClientPagination.ts'
import { useModalExit } from '../hooks/useModalExit.ts'
import { useDialogDismiss } from '../hooks/useDialogDismiss.ts'
import { notify, notifyError } from '../utils/notifications.ts'
import type { AudienceType, NewsletterRecipient } from '../types/newsletter.ts'
import { hasUnsafeText } from '../utils/validators.ts'
import ModalCloseButton from '../components/ui/ModalCloseButton.tsx'
import SkeletonList from '../components/ui/SkeletonList.tsx'
import { useSkeletonCount } from '../hooks/useSkeletonCount.ts'
import TabHighlight from '../components/ui/TabHighlight.tsx'
import FieldHint from '../components/ui/FieldHint.tsx'
import { tabCarouselClass, useTabCarousel } from '../hooks/useTabCarousel.ts'

interface SubscriberRowProps {
    item?: NewsletterRecipient
    onUnsubscribe?: () => void
    disabled?: boolean
    loading?: boolean
}

function SubscriberRow({ item, onUnsubscribe, disabled, loading = false }: Readonly<SubscriberRowProps>) {
    const { t } = useTranslation()

    if (loading) {
        return (
            <div className="rounded-xl border border-neutral-200 bg-white p-md shadow-sm">
                <div className="flex items-center justify-between gap-md">
                    <div className="min-w-0 flex-1">
                        <Skeleton shape="line" className="h-5 w-2/3" />
                        <Skeleton shape="line" className="mt-2 h-4 w-1/3" />
                    </div>
                    <Skeleton shape="pill" className="h-11 w-28 shrink-0" />
                </div>
            </div>
        )
    }

    return (
        <div className="rounded-xl border border-neutral-200 bg-white p-md shadow-sm card-hover">
            <div className="flex items-center justify-between gap-md">
                <div className="min-w-0">
                    <p className="break-all font-body font-semibold text-heading">{item!.email}</p>
                    <span className="inline-flex items-center gap-xs font-body text-body-sm font-semibold text-body-text">
                        <span
                            className={`inline-block size-2.5 rounded-full ${item!.type === 'SUBSCRIBER' ? 'bg-green-500' : 'bg-orange-500'}`}
                            aria-hidden="true"
                        />
                        {item!.type === 'SUBSCRIBER'
                            ? t('admin.newsletter.subscriber')
                            : t('admin.newsletter.parent')}
                    </span>
                </div>
                <button
                    type="button"
                    onClick={onUnsubscribe}
                    disabled={disabled}
                    className="flex h-11 shrink-0 items-center rounded-full border border-danger px-md font-body text-body-sm font-semibold text-danger transition-colors hover:bg-danger hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {t('admin.newsletter.unsubscribe')}
                </button>
            </div>
        </div>
    )
}

function AdminNewsletterPage() {
    const { t } = useTranslation()
    const { sendBroadcast, unsubscribe, unsubscribeParent, getSubscribers, loading: broadcastLoading } = useNewsletter()
    const [loadingSubscribers, setLoadingSubscribers] = useState(true)

    const [subscribers, setSubscribers] = useState<NewsletterRecipient[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [audienceFilter, setAudienceFilter] = useState<'SUBSCRIBERS' | 'PARENTS'>('SUBSCRIBERS')
    const tabRowRef = useTabCarousel(audienceFilter)

    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false)
    const { closing: broadcastClosing, requestClose: closeBroadcastModal } = useModalExit(() => setIsBroadcastModalOpen(false))
    const [recipientToUnsubscribe, setRecipientToUnsubscribe] = useState<NewsletterRecipient | null>(null)
    const [selectedAudience, setSelectedAudience] = useState<AudienceType>('BOTH')
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')
    const [isSendMenuOpen, setIsSendMenuOpen] = useState(false)
    const sendMenuRef = useRef<HTMLDivElement>(null)
    const broadcastDialogRef = useRef<HTMLDialogElement>(null)
    useDialogDismiss(broadcastDialogRef, closeBroadcastModal)

    useDismiss({
        ref: sendMenuRef,
        isOpen: isSendMenuOpen,
        onClose: () => setIsSendMenuOpen(false),
    })

    useEffect(() => {
        const fetchAudienceData = async () => {
            try {
                if (getSubscribers) {
                    const data = await getSubscribers()
                    setSubscribers(data)
                }
            } catch (error) {
                notifyError(t('admin.newsletter.loadError'), error)
            } finally {
                setLoadingSubscribers(false)
            }
        }
        void fetchAudienceData()
    }, [getSubscribers])

    const filterClassName = (active: boolean) =>
        `relative rounded-full border px-md py-xs font-body text-body-sm font-semibold transition-colors duration-300 ${active
            ? 'border-green-500 text-white'
            : 'border-green-500 bg-transparent text-heading hover:bg-green-50'
        }`

    const filteredItems = useMemo(() => {
        const term = searchTerm.trim().toLowerCase()

        return subscribers.filter((item) => {
            const matchesAudience =
                (audienceFilter === 'SUBSCRIBERS' && item.type === 'SUBSCRIBER') ||
                (audienceFilter === 'PARENTS' && item.type === 'PARENT')

            const matchesSearch = item.email.toLowerCase().includes(term)

            return matchesAudience && matchesSearch
        })
    }, [subscribers, searchTerm, audienceFilter])

    const { currentPage, setPage, totalPages, pageItems: pagedItems } = useClientPagination(filteredItems)

    const handleOpenBroadcast = (audience: AudienceType) => {
        setSelectedAudience(audience)
        setIsBroadcastModalOpen(true)
        setIsSendMenuOpen(false)
    }

    const handleUnsubscribe = async (recipient: NewsletterRecipient) => {
        if (recipient.type === 'PARENT') {
            await unsubscribeParent(recipient.email)
        } else {
            await unsubscribe(recipient.email)
        }
        setSubscribers((current) => current.filter((item) => item.id !== recipient.id))
        notify.success(t('admin.newsletter.unsubscribed'))
    }

    const broadcastModalTitle = (() => {
        if (selectedAudience === 'BOTH') return t('admin.newsletter.sendAll')
        if (selectedAudience === 'PARENTS') return t('admin.newsletter.sendParents')
        return t('admin.newsletter.sendSubscribers')
    })()

    const handleBroadcastSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        if (hasUnsafeText(subject) || hasUnsafeText(message)) {
            notify.error(t('validation.unsafeText'))
            return
        }
        try {
            await sendBroadcast({ audienceType: selectedAudience, subject, message })
            notify.success(t('admin.newsletter.sent'))
            closeBroadcastModal()
            setSubject('')
            setMessage('')
        } catch (err) {
            notifyError(t('admin.newsletter.sendError'), err)
        }
    }

    const skeletonCount = useSkeletonCount('admin-newsletter', loadingSubscribers, pagedItems.length, 4)

    return (
        <div id="admin-newsletter">
            <AdminLayout>
                <div className="flex flex-wrap items-center justify-between gap-md">
                    <div>
                        <h1 className="m-0 font-heading text-page-title font-bold leading-[1.15] text-heading">
                            {t('admin.newsletter.title')}
                        </h1>
                        <p className="mt-2 font-body text-body text-neutral-500">
                            {t('admin.newsletter.subtitle')}
                        </p>
                    </div>

                    <div className="relative inline-flex" ref={sendMenuRef}>
                        <button
                            type="button"
                            onClick={() => setIsSendMenuOpen((prev) => !prev)}
                            aria-expanded={isSendMenuOpen}
                            aria-haspopup="menu"
                            className="inline-flex h-[44px] items-center gap-xs whitespace-nowrap rounded-full border bg-orange-500 hover:bg-orange-600 px-md font-body text-body-sm font-semibold text-white transition-colors"
                        >
                            <SendIcon size={18} aria-hidden="true" />
                            <span>{t('admin.newsletter.sendBroadcast')}</span>
                            <ChevronDownIcon
                                size={16}
                                className={`transition-transform duration-200 ${isSendMenuOpen ? 'rotate-180' : ''}`}
                                aria-hidden="true"
                            />
                        </button>

                        {isSendMenuOpen && (
                            <div
                                className="absolute right-0 top-[calc(100%+var(--spacing-2xs))] z-30 min-w-[220px] rounded-xl border border-neutral-200 bg-white p-xs shadow animate-[admin-row-menu-in_0.12s_ease-out]"
                                role="menu"
                            >
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => handleOpenBroadcast('SUBSCRIBERS')}
                                    className="flex w-full cursor-pointer items-center gap-sm whitespace-nowrap rounded-lg px-md py-sm text-left font-body text-body-sm text-heading transition-colors duration-150 hover:bg-orange-100"
                                >
                                    {t('admin.newsletter.sendSubscribers')}
                                </button>
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => handleOpenBroadcast('PARENTS')}
                                    className="flex w-full cursor-pointer items-center gap-sm whitespace-nowrap rounded-lg px-md py-sm text-left font-body text-body-sm text-heading transition-colors duration-150 hover:bg-orange-100"
                                >
                                    {t('admin.newsletter.sendParents')}
                                </button>
                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => handleOpenBroadcast('BOTH')}
                                    className="flex w-full cursor-pointer items-center gap-sm whitespace-nowrap rounded-lg px-md py-sm text-left font-body text-body-sm text-heading transition-colors duration-150 hover:bg-orange-100"
                                >
                                    {t('admin.newsletter.sendAll')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mb-lg mt-xl flex flex-col-reverse gap-md md:flex-row md:items-center md:justify-between">
                    <div ref={tabRowRef} className={`${tabCarouselClass} -my-1 min-w-0 md:flex-1`}>
                        <button
                            type="button"
                            aria-pressed={audienceFilter === 'SUBSCRIBERS'}
                            onClick={() => setAudienceFilter('SUBSCRIBERS')}
                            className={filterClassName(audienceFilter === 'SUBSCRIBERS')}
                        >
                            {audienceFilter === 'SUBSCRIBERS' && <TabHighlight layoutId="newsletter-audience-tab" className="bg-green-500" />}
                            {t('admin.newsletter.filterSubscribers')}
                        </button>
                        <button
                            type="button"
                            aria-pressed={audienceFilter === 'PARENTS'}
                            onClick={() => setAudienceFilter('PARENTS')}
                            className={filterClassName(audienceFilter === 'PARENTS')}
                        >
                            {audienceFilter === 'PARENTS' && <TabHighlight layoutId="newsletter-audience-tab" className="bg-green-500" />}
                            {t('admin.newsletter.filterParents')}
                        </button>
                    </div>

                    <div className="flex h-11 w-full min-w-0 shrink-0 items-center gap-sm rounded-full border border-neutral-200 bg-white px-md transition-colors focus-within:border-green-500 md:w-[360px]">
                        <SearchIcon size={18} className="shrink-0 text-neutral-500" aria-hidden="true" />
                        <input
                            type="search"
                            className="h-full min-w-0 flex-1 border-none bg-transparent font-body text-body-sm text-body-text-dark outline-none placeholder:text-neutral-400"
                            placeholder={t('admin.newsletter.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label={t('admin.newsletter.searchPlaceholder')}
                        />
                    </div>
                </div>

                {loadingSubscribers && (
                    <div className="grid grid-cols-1 gap-md xl:grid-cols-2">
                        <SkeletonList count={skeletonCount}>{() => <SubscriberRow loading />}</SkeletonList>
                    </div>
                )}
                {!loadingSubscribers && filteredItems.length === 0 && (
                    <p className="m-0 p-xl text-center font-body text-body text-neutral-500">
                        {subscribers.length > 0 || searchTerm.trim()
                            ? t('admin.newsletter.noResults')
                            : t('admin.newsletter.noContacts')}
                    </p>
                )}
                {!loadingSubscribers && filteredItems.length > 0 && (
                    <>
                    <div className="grid grid-cols-1 gap-md xl:grid-cols-2">
                        {pagedItems.map((item) => (
                            <SubscriberRow
                                key={item.id}
                                item={item}
                                onUnsubscribe={() => setRecipientToUnsubscribe(item)}
                                disabled={broadcastLoading}
                            />
                        ))}
                    </div>
                    <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setPage} />
                    </>
                )}

                {isBroadcastModalOpen && (
                    <dialog
                        ref={(el) => {
                            broadcastDialogRef.current = el
                            if (el && !el.open) el.showModal()
                        }}
                        onClose={closeBroadcastModal}
                        aria-labelledby="newsletter-broadcast-title"
                        className={`text-left fixed inset-0 m-auto max-h-[90vh] w-[min(620px,92vw)] max-w-none modal-scroll rounded-[20px] border border-neutral-200 bg-white p-lg backdrop:bg-scrim md:p-xl ${broadcastClosing ? 'animate-[modal-out_0.32s_ease-in]' : 'animate-[modal-in_0.32s_ease-out]'}`}
                    >
                            <div className="flex items-center justify-between gap-md">
                                <h2 id="newsletter-broadcast-title" className="m-0 font-heading text-h4 font-bold text-heading">
                                    {broadcastModalTitle}
                                </h2>

                                <ModalCloseButton
                                    onClick={closeBroadcastModal}
                                    aria-label={t('admin.cancel')}
                                />
                            </div>

                            <form className="mt-lg grid gap-md" onSubmit={handleBroadcastSubmit}>
                                <label className="font-body text-body-sm font-semibold text-heading">
                                    {t('admin.newsletter.subject')}
                                    <input
                                        placeholder={t('fields.newsletter.subject.placeholder')}
                                        required
                                        value={subject}
                                        onChange={(event) => setSubject(event.target.value)}
                                        className="mt-xs h-11 w-full rounded-xl border border-neutral-200 bg-white px-md font-normal outline-none focus:border-heading"
                                    />
                                    <FieldHint>{t('fields.newsletter.subject.hint')}</FieldHint>
                                </label>
                                <label className="font-body text-body-sm font-semibold text-heading">
                                    {t('admin.newsletter.message')}
                                    <textarea
                                        placeholder={t('fields.newsletter.message.placeholder')}
                                        required
                                        rows={6}
                                        value={message}
                                        onChange={(event) => setMessage(event.target.value)}
                                        className="mt-xs w-full resize-y rounded-xl border border-neutral-200 bg-white p-md font-normal outline-none focus:border-heading"
                                    />
                                    <FieldHint>{t('fields.newsletter.message.hint')}</FieldHint>
                                </label>
                                <div className="mt-sm flex justify-end gap-md *:flex-1">
                                    <button
                                        type="button"
                                        onClick={closeBroadcastModal}
                                        className="h-11 rounded-full border border-green-500 px-lg font-body text-body-sm font-semibold text-heading transition-colors hover:bg-green-50"
                                    >
                                        {t('admin.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={broadcastLoading || !subject.trim() || !message.trim()}
                                        className="inline-flex h-11 items-center gap-xs rounded-full bg-orange-500 px-lg font-body text-body-sm font-semibold text-white transition-colors hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <SendIcon size={16} aria-hidden="true" />
                                        {t('admin.newsletter.send')}
                                    </button>
                                </div>
                            </form>
                    </dialog>
                )}
            </AdminLayout>
            {recipientToUnsubscribe && (
                <ConfirmNewsletterUnsubscribeModal
                    recipient={recipientToUnsubscribe}
                    onConfirm={handleUnsubscribe}
                    onClose={() => setRecipientToUnsubscribe(null)}
                />
            )}
        </div>
    )
}

export default AdminNewsletterPage