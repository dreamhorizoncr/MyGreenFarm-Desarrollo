export type PopoverPlacement = 'top' | 'bottom'

// Decide si un panel que se abre pegado a `trigger` va abajo o arriba.
// Por defecto va abajo; si no cabe dentro del modal (form o dialog que lo contiene) ni de la pantalla,
// y arriba hay más espacio, se abre hacia arriba para no quedar afuera del modal.
export function placementFor(trigger: HTMLElement, panelHeight: number): PopoverPlacement {
  const rect = trigger.getBoundingClientRect()
  // Si el modal hace scroll por dentro, manda el área visible de ese scroll.
  const container = (trigger.closest('.modal-scroll') ?? trigger.closest('dialog, form'))?.getBoundingClientRect()
  const bottomLimit = Math.min(container?.bottom ?? window.innerHeight, window.innerHeight)
  const topLimit = Math.max(container?.top ?? 0, 0)
  const spaceBelow = bottomLimit - rect.bottom
  const spaceAbove = rect.top - topLimit
  return spaceBelow < panelHeight && spaceAbove > spaceBelow ? 'top' : 'bottom'
}

// Clases para colocar el panel (absolute) según la posición elegida.
export const placementClassName = (placement: PopoverPlacement) =>
  placement === 'top' ? 'bottom-full mb-xs' : 'top-full mt-xs'
