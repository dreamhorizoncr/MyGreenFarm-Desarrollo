import { useEffect } from 'react';
import { CalendarDays, MapPin, X} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAnnouncementImages } from '../hooks/useAnnouncementImages.ts';

import type { Announcement, AnnouncementType } from '../types/announcement.ts';

interface NewsDetailModalProps{
    announcement: Announcement;
    onClose: () => void;
}

const TYPE_LABEL_KEY: Record<AnnouncementType,
    |'newspage.category1'
    |'newspage.category2'
    |'newspage.category3'
    |'newspage.category4'
    |'newspage.category5'
    > = {
        NEWS: 'newspage.category2',
        EVENT: 'newspage.category3',
        NOTICE: 'newspage.category4',
        GENERAL: 'newspage.category5',
    };

//Método para formatear la fecha de la noticia según el idioma actual
function formatDate(
    iso: string|null|undefined,
    lang: string,
    ):string{
        if(!iso) return "";

    return new Date(iso).toLocaleDateString(lang,{
        day: "numeric",
        month: "long",
        year: "numeric",
    });
}

function NewsDetailModal({
    announcement,
    onClose,
}: NewsDetailModalProps) {
    const { t, i18n } = useTranslation();

    //Hook que se encarga de obtener y cargar las imágenes de la noticia
    const {
        images,
        loading,
        error,
        fetchImages,
    } = useAnnouncementImages();

    //Cada vez que cambia la noticia, se trae las imágenes desde el backend
    useEffect(() => {
        void fetchImages([announcement.id]);

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [announcement.id]);

    //Se encarga de cerrar el modal cuando se presiona la tecla Escape y de deshabilitar el scroll del body mientras el modal está abierto
    useEffect(() => {
        const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
            onClose();
        }
    };

    document.addEventListener("keydown", handleEscape);

    //Se guarda el overflow anterior del body para restaurarlo cuando se cierre el modal
    const previousOverflow = document.body.style.overflow;
    //Se bloquea el scroll del body mientras el modal está abierto
    document.body.style.overflow = "hidden";

    //Limpia el event listener y restaura el overflow del body cuando se cierra el modal
    return () => {
        document.removeEventListener("keydown", handleEscape);
        document.body.style.overflow = previousOverflow;
        };
    }, [onClose]);

    //Obtenemos todas las imágenes que pertenezcan a la noticia seleccionada. En caso de que no hayan, se asigna un array vacío
    const announcementImages = images[announcement.id] ?? [];

    //Busca específicamente la imagen de portada. Si no hay ninguna marcada como portada, entonces usa la primera imagen que esté disponible del array.
    const coverImage =
    announcementImages.find((image) => image.isCover) ??
    announcementImages[0];

    //Todas las imágenes que no sean la portada pasan a formar parte de la galería. Si no hay, se le asigna un array vacío.
    const galleryImages = announcementImages.filter(
        (image) => !image.isCover,
    );

    return (
        //Fondo oscuro que cubre toda la pantalla y que al hacer click, cierra el modal.
        <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-[16px] md:p-[30px]"
        onClick={onClose}
        >
        {/*Contenedor Principal*/}
        <article
            className="relative max-h-[92vh] w-full max-w-[1100px] overflow-y-auto rounded-[24px] bg-bg-page"
            onClick={(event) => event.stopPropagation()}
        >
            {/* Cerrar */}
            <button
                type="button"
                onClick={onClose}
                aria-label="Cerrar noticia"
                className="sticky left-full top-[18px] z-20 mr-[18px] flex size-[42px] items-center justify-center rounded-full bg-white text-heading shadow-sm transition hover:bg-neutral-100"
                >
                <X size={20} />
            </button>

        {/*Contenido Interno*/}
        <div className="px-[22px] pb-[45px] pt-[5px] md:px-[55px] md:pb-[60px]">

          {/* Encabezado */}
            <header className="mx-auto max-w-[850px] text-center">

            {/*Tipo de Noticia*/}
            <span className="inline-flex rounded-full bg-orange-500 px-[14px] py-[6px] font-body text-[11px] text-white">
                    {t(TYPE_LABEL_KEY[announcement.type])}
            </span>
            {/* Título */}
            <h2 className="mt-[16px] font-heading text-[32px] font-bold leading-[1.15] text-heading md:text-[44px]">
                {announcement.title}
            </h2>
            {/* Fecha y Ubicación */}
            <div className="mt-[16px] flex flex-wrap items-center justify-center gap-x-[18px] gap-y-[8px] font-body text-[13px] text-neutral-500">

                {announcement.eventDate && (
                    <div className="flex items-center gap-[6px]">
                        <CalendarDays size={16} />

                    <span>
                        {formatDate(
                        announcement.eventDate,
                        i18n.language,
                        )}
                    </span>
                    </div>
                )}

                {announcement.location && (
                    <div className="flex items-center gap-[6px]">
                    <MapPin size={16} />
                    <span>{announcement.location}</span>
                    </div>
                )}

            </div>
            </header>

            {/* Estado de carga de las imágenes */}
                {loading && (
                <p className="mt-[35px] text-center font-body text-[14px] text-neutral-500">
                    {t("common.loading")}
                </p>
            )}

            {/* Error cargando imágenes */}
                {error && (
                <p className="mt-[35px] text-center font-body text-[14px] text-danger">
                    {error}
                </p>
            )}

            {/* Portada */}
                {!loading && coverImage && (
                    <div className="mt-[40px] overflow-hidden rounded-[22px]">
                        <img
                            src={coverImage.fileUrl}
                            alt={announcement.title}
                            className="h-[260px] w-full object-cover sm:h-[360px] md:h-[480px]"
                        />
                    </div>
                )}

            {/* Contenido */}
            <section className="mx-auto mt-[40px] max-w-[820px]">
                <p className="whitespace-pre-line font-body text-[15px] leading-[1.85] text-body-text md:text-[16px]">
                    {announcement.content}
                    </p>
            </section>

            {/* Galería de imágenes */}
                {!loading && galleryImages.length > 0 && (
                    <section className="mt-[45px]">

                <h3 className="mb-[18px] font-heading text-[26px] font-bold text-heading">
                    {t("newspage.gallery")}
                </h3>

                <div
                    className={`grid gap-[12px] ${
                        galleryImages.length === 1
                        ? "grid-cols-1"
                        : galleryImages.length === 2
                        ? "grid-cols-1 sm:grid-cols-2"
                        : "grid-cols-1 sm:grid-cols-2 md:grid-cols-4"
                    }`}
                >
                    {galleryImages.map((image) => (
                    <div
                        key={image.id}
                        className="overflow-hidden rounded-[16px]"
                    >
                        <img
                        src={image.fileUrl}
                        alt=""
                        className="h-[220px] w-full object-cover transition duration-300 hover:scale-[1.03]"
                        />
                    </div>
                    ))}
                </div>

            </section>
            )}

            </div>
        </article>
    </div>
    );
}

export default NewsDetailModal;

