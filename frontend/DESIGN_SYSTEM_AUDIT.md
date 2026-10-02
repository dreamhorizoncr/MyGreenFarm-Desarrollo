# Auditoría del sistema de diseño — My Green Farm (frontend)

Escaneo del código real (`frontend/src/**/*.tsx`) comparado contra los tokens ya definidos en `src/tokens/tokens.css`. El objetivo: mostrar qué tan consistente es lo que realmente se escribió versus lo que el sistema de tokens dice que debería usarse, y recomendar un único valor por categoría para que todo se vea igual.

Metodología: conteo de frecuencia de clases Tailwind por categoría en todo `frontend/src`, usando `ripgrep` sobre los `.tsx`. Los números son ocurrencias de texto, no "número de botones reales", pero son representativos.

---

## 1. Ya existe un sistema de tokens — y es bueno

`frontend/src/tokens/tokens.css` define una paleta de marca completa (verde, rosa, naranja, gris, fondos, estados) con alias semánticos (`--color-heading`, `--color-danger`, etc.), una escala de espaciado de 0 a 64px, radios, dos niveles de peso de fuente, y una escala tipográfica completa (`--text-h1` a `--text-body-sm`) con `clamp()` para que los títulos escalen con el viewport.

**El problema no es que falte un sistema — es que el código no lo usa de forma consistente.** Conviven tres o cuatro formas distintas de expresar lo mismo (un tamaño de texto, un color, un padding), dependiendo de quién escribió ese componente y cuándo.

---

## 2. Botones

### Altura (`h-*`)

| Clase | Ocurrencias | Equivale a |
|---|---:|---|
| `h-11` | 50 | 44px |
| `h-[47px]` | 33 | 47px (arbitrario) |
| `h-[38px]` | 21 | 38px (arbitrario, botones de icono) |
| `h-9` | 15 | 36px (botones de icono pequeños) |
| `h-12` | 13 | 48px |
| `h-10` | 10 | 40px |
| `h-[44px]` | 6 | 44px (duplica `h-11`, pero como arbitrario) |

**Hallazgo:** hay al menos 7 alturas distintas conviviendo para lo que conceptualmente son 2-3 tamaños de botón (grande/CTA, mediano, icono). `h-11` y `h-[44px]` son literalmente el mismo valor escrito de dos formas.

### Forma y relleno

- `rounded-full`: **240** ocurrencias — es, por lejos, la forma estándar de facto para botones. Buena noticia: aquí ya hay consenso real.
- Padding horizontal: `px-md` (95, = 16px) y `px-lg` (31, = 24px) dominan, pero compiten con **15+ variantes arbitrarias** (`px-[28px]`, `px-[18px]`, `px-[30px]`, `px-[20px]`, `px-[16px]`...) que casi siempre caen muy cerca de `px-md`/`px-lg`/`px-xl` sin usarlos.

### El componente `<Button>` existe pero casi no se usa

- `components/ui/Button.tsx` (variantes `primary`/`secondary`/`danger`/`success`, con loading state) se usa en **22 archivos**, casi siempre para los pares Cancelar/Confirmar de modales de confirmación.
- **69 archivos** tienen botones `<button>` con clases escritas a mano, cada uno con su propia combinación de alto/padding/radio/color.
- Además del `Button.tsx` genérico, existen **otros tres** componentes de botón en `components/ui/`: `PillButton.tsx`, `BlobButton.tsx`, `AuthButton.tsx` — cada uno con su propio estilo, sin que quede claro desde el nombre cuándo usar cuál.

---

## 3. Tipografía

Esta es la categoría más fragmentada. Conviven **tres sistemas tipográficos en paralelo**:

### Sistema A — tokens del proyecto (`--text-h1`...`--text-body-sm`)
| Clase | Ocurrencias |
|---|---:|
| `text-body` | 226 |
| `text-body-sm` | 71 |
| `text-h6` | 12 |
| `text-h4` | 8 |
| `text-h2` | 5 |
| `text-h5` | 5 |
| `text-h1` / `text-h3` / `text-body-lg` | 1 cada uno |

### Sistema B — escala por defecto de Tailwind (no definida por el proyecto)
| Clase | Ocurrencias | px (Tailwind default) |
|---|---:|---|
| `text-sm` | 187 | 14px |
| `text-base` | 67 | 16px |
| `text-xs` | 46 | 12px |
| `text-2xl` | 14 | 24px |
| `text-lg` | 8 | 18px |
| `text-xl` | 5 | 20px |
| `text-3xl` | 5 | 30px |

### Sistema C — valores arbitrarios sueltos (`text-[Npx]`)
| Clase | Ocurrencias |
|---|---:|
| `text-[15px]` | 75 |
| `text-[17px]` | 45 |
| `text-[34px]` | 20 |
| `text-[14px]` | 20 |
| `text-[13px]` | 20 |
| `text-[42px]` | 15 |
| `text-[16px]` | 13 |
| `text-[12px]` | 11 |
| ...y 13 valores más, cada uno con 1-9 usos |

**Hallazgo:** `text-[15px]` (75 usos) es casi idéntico a `text-body-sm` (que ya resuelve a 14-16px con `clamp()`). `text-[34px]` (20 usos, títulos de página H1 en casi todas las páginas admin) debería ser directamente `text-h1` o `text-h2`, pero nadie lo está usando ahí — cada página admin reinventa su propio tamaño de título a mano.

---

## 4. Colores

### Paleta de marca (vía overrides en `@theme`) — **esto está bien, aunque no se ve obvio**

`tokens.css` redefine `--color-green-500`, `--color-orange-500`, `--color-pink-400` y `--color-grey-500` para que apunten a los tonos reales de marca. Esto significa que `bg-green-500` (64 usos), `border-green-500` (44), `bg-orange-500` (37) **sí son el verde/naranja de marca real**, no el verde/naranja genérico de Tailwind — pero cualquiera que lea el código sin saber esto asumiría que es un color al azar de Tailwind.

### Colores que escaparon del sistema — esto sí es un problema real

| Clase | Ocurrencias | Nota |
|---|---:|---|
| `border-gray-300` | 12 | Tailwind genérico — el proyecto usa `grey`/`neutral`, no `gray` |
| `bg-red-50` / `text-red-500/600/700` | 24 en total | Rojo genérico de Tailwind, no `--color-danger` |
| `bg-gray-100` / `bg-gray-50` | 7 | Igual, `gray` no es un token del proyecto |
| `bg-yellow-400/500` | 2 | No existe token amarillo propio salvo `--warning-*` |

Si mañana cambia el rojo de "danger" o el gris neutral de la marca, estos usos **no se van a enterar** porque no pasan por los tokens semánticos.

### Tokens semánticos (el camino correcto) — uso real
`text-body-text` (223), `text-heading` (207), `border-neutral-200` (124), `text-neutral-500` (99), `text-danger` (80) — esta parte del sistema sí se usa bastante y es el patrón a imitar.

---

## 5. Border-radius

| Clase | Ocurrencias |
|---|---:|
| `rounded-full` | 240 |
| `rounded-2xl` (16px) | 80 |
| `rounded-xl` (12px) | 57 |
| `rounded-lg` (8px) | 19 |
| `rounded-3xl` | 16 |
| `rounded-[20px]` / `rounded-[22px]` / `rounded-[24px]` / `rounded-[16px]` / `rounded-[14px]` / `rounded-[13px]` | 18 en total, repartidos |

Bastante sano en general (`rounded-full`, `rounded-2xl`, `rounded-xl` son el 86% de los usos), pero los 18 valores arbitrarios son casi todos redundantes con `rounded-2xl`/`rounded-3xl` escritos de otra forma.

## 6. Sombras

`shadow` (el token custom del proyecto, 24 usos) convive con `shadow-sm`/`shadow-lg`/`shadow-xl`/`shadow-md` de Tailwind (52 usos combinados) — son valores **distintos** entre sí, no hay un único "shadow de card" ni "shadow de modal" definido.

---

## 7. Recomendación — qué usar para que todo se vea igual

No hace falta inventar nada nuevo: el sistema de tokens de `tokens.css` ya es sólido. La "serialización" correcta es **dejar de competir con él**. Concretamente:

### Botones
| Tamaño | Usar | Dejar de usar |
|---|---|---|
| CTA / botón principal | `h-11 rounded-full px-lg` (o mejor: `<Button>`) | `h-[47px]`, `h-[44px]`, `px-[28px]`, `px-[30px]` |
| Botón de icono circular | `size-9` o `size-10` (ya tokenizados) | `h-[38px]` suelto |
| Secundario/outline | variante `secondary` de `<Button>` | clases a mano repetidas en 69 archivos |

**Acción concreta:** decidir cuál de los 4 componentes de botón (`Button`, `PillButton`, `BlobButton`, `AuthButton`) es el estándar para cada contexto (ya, probablemente `Button` para acciones primarias/admin y `PillButton` para la parte pública), documentarlo en un comentario en cada archivo, y migrar los `<button>` sueltos de las páginas admin hacia `<Button>` — son la mayoría de los 69 archivos y comparten contexto (mismo layout, mismas acciones Guardar/Cancelar/Eliminar).

### Tipografía
| Para | Usar | Dejar de usar |
|---|---|---|
| Título H1 de página (admin, ~34px) | `text-h1` o `text-h2` (ya tiene `clamp()` responsivo) | `text-[34px]`, `text-[42px]`, `text-[46px]` sueltos en cada página |
| Texto de párrafo / body | `text-body` (ya el más usado, 226) | `text-base`, `text-[16px]`, `text-[15px]` |
| Texto secundario / ayuda | `text-body-sm` | `text-sm`, `text-xs`, `text-[13px]`, `text-[14px]` |

**Acción concreta:** `text-[15px]` y `text-[17px]` (120 usos combinados) son los dos valores sueltos más repetidos — son los primeros candidatos a reemplazar por `text-body`/`text-body-sm` en una pasada de buscar-y-reemplazar por archivo.

### Colores
| Para | Usar | Dejar de usar |
|---|---|---|
| Verde/naranja de marca | `bg-green-500`, `bg-orange-500` (ya están tokenizados vía `@theme`, son seguros) | — (están bien, solo falta un comentario en `tokens.css` que lo aclare) |
| Gris / neutral | `text-neutral-*`, `border-neutral-*`, `bg-neutral-*` | `gray-*` (Tailwind genérico, no es un token del proyecto) |
| Rojo / error | `text-danger`, `bg-danger`, `border-danger` | `red-50/500/600/700` sueltos |
| Amarillo / warning | `text-warning`, `bg-warning` (agregar a `@theme` si falta la utility) | `yellow-400/500` sueltos |

### Border-radius y sombra
- Reemplazar los `rounded-[Npx]` arbitrarios por `rounded-xl`/`rounded-2xl`/`rounded-3xl` (ya cubren el 86% de los casos reales).
- Definir en `tokens.css` dos sombras con nombre (ej. `--shadow-card`, `--shadow-modal`) en vez de mezclar el `shadow` propio con `shadow-sm/lg/xl` de Tailwind.

### Prioridad sugerida
1. **Tipografía** — es lo más fragmentado (3 sistemas en paralelo) y lo más visible al usuario.
2. **Botones** — consolidar en `<Button>`/`<PillButton>` reduce la mayor cantidad de código duplicado.
3. **Colores fuera del sistema** (`gray-*`, `red-*`, `yellow-*`) — pocos usos pero son los que de verdad rompen la consistencia de marca si cambia la paleta.
4. **Radios/sombras arbitrarios** — bajo impacto, se puede limpiar de paso al tocar cada archivo por los puntos anteriores.

No es necesario tocar todo de una vez: cada vez que se edite una página por otro motivo, es buen momento para reemplazar sus valores sueltos por el token equivalente de esta tabla.
