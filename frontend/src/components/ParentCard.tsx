import type { Parent } from "../types/parent.ts";
import { Pencil, Trash2 } from "@animateicons/react/lucide";

interface ParentCardProps {
    parent: Parent;
    onEdit: (parent: Parent) => void;
    onDelete: (parent: Parent) => void;
}

// Convierte el código del idioma a un texto más fácil de leer
function getLanguageLabel(language: string) {

    if (language === "en") return "English";
    if (language === "fr") return "Français";

    return "Español";
}

function ParentCard({
    parent,
    onEdit,
    onDelete,
}: Readonly<ParentCardProps>) {
    return (
        <article className="rounded-2xl border border-neutral-200 bg-white p-lg shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
        {/* Nombre y acciones */}
        <div className="flex items-start justify-between gap-4">
        {/* Nombre completo */}
        <h2 className="font-heading text-xl font-bold text-heading">
            {parent.firstName} {parent.lastName}
        </h2>

        {/* Botones de editar y eliminar */}
        <div className="flex shrink-0 items-center gap-2">
            <button
                type="button"
                onClick={() => onEdit(parent)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-green-500 text-green-500 transition hover:bg-green-50"
            >
            <Pencil size={16} />
            </button>

            <button
                type="button"
                onClick={() => onDelete(parent)}
                className="flex h-10 w-10 items-center justify-center rounded-full border border-red-300 text-danger transition hover:bg-red-50"
            >
                <Trash2 size={16} />
            </button>
        </div>
    </div>

      {/* Información principal */}
        <div className="mt-4 space-y-2 font-body text-body-text">
            <p>
            <span className="font-bold">Identificación: </span>
            {parent.identification}
            </p>

            <p>
            <span className="font-bold">Idioma: </span>
            {getLanguageLabel(parent.language)}
            </p>
        </div>

      {/* Información adicional */}
        <div className="mt-6 flex flex-col gap-5 border-t border-neutral-100 pt-5 sm:flex-row">
            {/* Correo */}
            <div className="min-w-0 flex-1">
            <h3 className="font-body text-body font-bold text-heading">
                Correo electrónico
            </h3>

            <p className="mt-2 break-words font-body text-body-sm leading-relaxed text-body-text">
                {parent.email}
            </p>
            </div>

        {/* Contacto */}
            <div className="min-w-0 flex-1">
            <h3 className="font-body text-body font-bold text-heading">
                Contacto
            </h3>

            <p className="mt-2 break-words font-body text-body-sm leading-relaxed text-body-text">
                <span className="font-bold">Teléfono: </span>
                {parent.phoneNumber}
            </p>

            <p className="mt-2 break-words font-body text-body-sm leading-relaxed text-body-text">
                <span className="font-bold">Dirección: </span>
                {parent.address}
            </p>
            </div>
        </div>
        </article>
    );
}

export default ParentCard;