import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { SendIcon, UserSearchIcon, XIcon } from '@animateicons/react/lucide'
import AdminLayout from '../layout/AdminLayout.tsx'
import ConfirmNewsletterUnsubscribeModal from '../components/ConfirmNewsletterUnsubscribeModal.tsx'
import { useNewsletter } from '../hooks/useNewsletter.ts'
import { notify } from '../utils/notifications.ts'
import type { AudienceType } from '../types/newsletter.ts'
import type { NewsletterRecipient } from '../types/newsletter.ts'

function AdminNewsletterPage() {
    const { t } = useTranslation()
    // Asegúrate de que tu hook useNewsletter exponga también fetchSubscribers o similar si ya lo tienes implementado
    const { sendBroadcast, unsubscribe, unsubscribeParent, getSubscribers, loading: broadcastLoading } = useNewsletter()

    const [subscribers, setSubscribers] = useState<NewsletterRecipient[]>([])
    const [searchTerm, setSearchTerm] = useState('')
    const [audienceFilter, setAudienceFilter] = useState<'SUBSCRIBERS' | 'PARENTS'>('SUBSCRIBERS')

    const [isBroadcastModalOpen, setIsBroadcastModalOpen] = useState(false)
    const [recipientToUnsubscribe, setRecipientToUnsubscribe] = useState<NewsletterRecipient | null>(null)
    const [selectedAudience, setSelectedAudience] = useState<AudienceType>('BOTH')
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')

    // Cargar los suscriptores y padres al montar el componente
    useEffect(() => {
        const fetchAudienceData = async () => {
            try {
                if (getSubscribers) {
                    const data = await getSubscribers()
                    setSubscribers(data)
                }
            } catch (error) {
                notify.error(t('admin.newsletter.loadError'))
            }
        }
        fetchAudienceData()
    }, [getSubscribers])

    const filterClassName = (active: boolean) =>
        `rounded-full px-md py-sm font-body text-sm font-semibold transition-colors ${active
            ? 'bg-green-500 text-white'
            : 'bg-[var(--grey-100)] text-body-text hover:bg-[var(--grey-200)]'
        }`

    // Lógica de filtrado para Suscriptores y Padres + Búsqueda por texto
    const filteredItems = useMemo(() => {
        const term = searchTerm.trim().toLowerCase()

        return subscribers.filter((item) => {
            // Filtro por tipo de audiencia seleccionado en las píldoras
            const matchesAudience =
                (audienceFilter === 'SUBSCRIBERS' && item.type === 'SUBSCRIBER') ||
                (audienceFilter === 'PARENTS' && item.type === 'PARENT')

            // Filtro por término de búsqueda en el correo
            const matchesSearch = item.email.toLowerCase().includes(term)

            return matchesAudience && matchesSearch
        })
    }, [subscribers, searchTerm, audienceFilter])

    const handleOpenBroadcast = (audience: AudienceType) => {
        setSelectedAudience(audience)
        setIsBroadcastModalOpen(true)
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

    const handleBroadcastSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault()
        try {
            await sendBroadcast({ audienceType: selectedAudience, subject, message })
            notify.success(t('admin.newsletter.sent'))
            setIsBroadcastModalOpen(false)
            setSubject('')
            setMessage('')
        } catch {
            notify.error(t('admin.newsletter.sendError'))
        }
    }

    return (
        <div id="admin-newsletter">
            <AdminLayout>
                <h1 className="m-0 font-heading text-[34px] font-bold leading-[1.15] text-heading">
                    {t('admin.newsletter.title')}
                </h1>
                <p className="mt-2 font-body text-base text-neutral-500">
                    {t('admin.newsletter.subtitle')}
                </p>

                {/* Barra de búsqueda y Botones de envío masivo para las 3 audiencias */}
                <div className="mb-[var(--spacing-lg)] mt-[var(--spacing-xl)] flex flex-wrap items-center justify-between gap-md">
                    <div className="flex h-[44px] min-w-[240px] max-w-[420px] flex-1 items-center gap-sm rounded-full border border-neutral-200 bg-white px-md transition-colors focus-within:border-green-500">
                        <UserSearchIcon size={18} className="shrink-0 text-neutral-500" aria-hidden="true" />
                        <input
                            type="search"
                            className="h-full min-w-0 flex-1 border-none bg-transparent font-body text-[15px] text-body-text outline-none placeholder:text-neutral-400"
                            placeholder={t('admin.newsletter.searchPlaceholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            aria-label={t('admin.newsletter.searchPlaceholder')}
                        />
                    </div>

                    {/* Botones para enviar a suscriptores, padres o todos */}
                    <div className="flex flex-wrap gap-sm">
                        <button
                            type="button"
                            onClick={() => handleOpenBroadcast('SUBSCRIBERS')}
                            className="inline-flex h-[44px] items-center gap-xs whitespace-nowrap rounded-full border border-orange-500 px-md font-body text-[15px] font-semibold text-orange-500 transition-colors hover:bg-orange-500 hover:text-white"
                        >
                            <SendIcon size={18} aria-hidden="true" />
                            <span>{t('admin.newsletter.sendSubscribers')}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleOpenBroadcast('PARENTS')}
                            className="inline-flex h-[44px] items-center gap-xs whitespace-nowrap rounded-full border border-orange-500 px-md font-body text-[15px] font-semibold  text-orange-500 transition-colors hover:bg-orange-500 hover:text-white"
                        >
                            <SendIcon size={18} aria-hidden="true" />
                            <span>{t('admin.newsletter.sendParents')}</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => handleOpenBroadcast('BOTH')}
                            className="inline-flex h-[44px] items-center gap-xs whitespace-nowrap rounded-full border border-orange-500 px-md font-body text-[15px] font-semibold  text-orange-500 transition-colors hover:bg-orange-500 hover:text-white"
                        >
                            <SendIcon size={18} aria-hidden="true" />
                            <span>{t('admin.newsletter.sendAll')}</span>
                        </button>
                    </div>
                </div>

                {/* Filtros de audiencia; al desactivar una opción se muestran ambas listas */}
                <div className="-mt-sm mb-lg flex flex-wrap gap-sm">
                    <button
                        type="button"
                        aria-pressed={audienceFilter === 'SUBSCRIBERS'}
                        onClick={() => setAudienceFilter('SUBSCRIBERS')}
                        className={filterClassName(audienceFilter === 'SUBSCRIBERS')}
                    >
                        {t('admin.newsletter.filterSubscribers')}
                    </button>
                    <button
                        type="button"
                        aria-pressed={audienceFilter === 'PARENTS'}
                        onClick={() => setAudienceFilter('PARENTS')}
                        className={filterClassName(audienceFilter === 'PARENTS')}
                    >
                        {t('admin.newsletter.filterParents')}
                    </button>
                </div>

                {/* Listado filtrado */}
                {filteredItems.length === 0 ? (
                    <p className="m-0 p-xl text-center font-body text-base text-neutral-500">
                        {subscribers.length > 0 || searchTerm.trim()
                            ? t('admin.newsletter.noResults')
                            : t('admin.newsletter.noContacts')}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 gap-md xl:grid-cols-2">
                        {filteredItems.map((item) => (
                            <div key={item.id} className="rounded-xl border border-neutral-200 bg-white p-md shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
                                <div className="flex items-center justify-between gap-md">
                                    <div className="min-w-0">
                                        <p className="break-all font-body font-semibold text-heading">{item.email}</p>
                                        <span className="inline-flex items-center gap-xs font-body text-sm font-semibold text-body-text">
                                            <span
                                                className={`inline-block size-2.5 rounded-full ${item.type === 'SUBSCRIBER' ? 'bg-green-500' : 'bg-orange-500'}`}
                                                aria-hidden="true"
                                            />
                                            {item.type === 'SUBSCRIBER'
                                                ? t('admin.newsletter.subscriber')
                                                : t('admin.newsletter.parent')}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setRecipientToUnsubscribe(item)}
                                        disabled={broadcastLoading}
                                        className="shrink-0 rounded-full border border-danger px-md py-sm font-body text-sm font-semibold text-danger transition-colors hover:bg-danger hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {t('admin.newsletter.unsubscribe')}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {isBroadcastModalOpen && (
                    <div className="fixed inset-0 z-100 grid place-items-center bg-scrim p-lg">
                        <section
                            className="relative w-[min(560px,92vw)] rounded-2xl bg-bg-card p-xl shadow-xl"
                            role="dialog"
                            aria-modal="true"
                            aria-labelledby="newsletter-broadcast-title"
                        >
                            <button
                                type="button"
                                className="absolute right-md top-md inline-flex size-10 items-center justify-center rounded-full text-body-text"
                                onClick={() => setIsBroadcastModalOpen(false)}
                                        aria-label={t('admin.cancel')}
                            >
                                <XIcon size={20} aria-hidden="true" />
                            </button>
                            <h2 id="newsletter-broadcast-title" className="mb-lg pr-12 font-heading text-2xl font-bold text-heading">
                                {selectedAudience === 'BOTH'
                                    ? t('admin.newsletter.sendAll')
                                    : selectedAudience === 'PARENTS'
                                        ? t('admin.newsletter.sendParents')
                                        : t('admin.newsletter.sendSubscribers')}
                            </h2>
                            <form className="flex flex-col gap-md" onSubmit={handleBroadcastSubmit}>
                                <label className="flex flex-col gap-xs font-body text-sm font-semibold text-heading">
                                    {t('admin.newsletter.subject')}
                                    <input
                                        required
                                        value={subject}
                                        onChange={(event) => setSubject(event.target.value)}
                                        className="rounded-full border border-neutral-300 bg-white px-md py-sm font-normal text-body-text outline-none focus:border-green-500"
                                    />
                                </label>
                                <label className="flex flex-col gap-xs font-body text-sm font-semibold text-heading">
                                    {t('admin.newsletter.message')}
                                    <textarea
                                        required
                                        rows={6}
                                        value={message}
                                        onChange={(event) => setMessage(event.target.value)}
                                        className="resize-y rounded-xl border border-neutral-300 bg-white px-md py-sm font-normal text-body-text outline-none focus:border-green-500"
                                    />
                                </label>
                                <div className="mt-sm flex justify-end gap-sm">
                                    <button
                                        type="button"
                                        onClick={() => setIsBroadcastModalOpen(false)}
                                        className="rounded-full px-md py-sm font-body text-sm text-green-500 font-semibold text-body-text border border-neutral-300"
                                    >
                                        {t('admin.cancel')}
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={broadcastLoading}
                                        className="inline-flex items-center gap-xs rounded-full bg-green-500 px-md py-sm font-body text-sm font-semibold text-white  disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        <SendIcon size={16} aria-hidden="true" />
                                        {t('admin.newsletter.send')}
                                    </button>
                                </div>
                            </form>
                        </section>
                    </div>
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