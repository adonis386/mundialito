---
name: ui-react-tailwind-perf
description: Senior UI engineering guidance for high-performance React 18+ + Tailwind CSS apps with mobile-first responsive design, accessibility (WCAG), and conversion-oriented UX. Use when building or refactoring React/Next.js components, landing pages, dashboards, mobile-web flows, Tailwind layouts, or when the user mentions Tailwind, TSX, responsiveness, a11y, Lucide, Framer Motion, Headless UI, or Radix UI.
---

# UI React + Tailwind (Perf + a11y + Conversión)

## Objetivo

Entregar UI en **React 18+** y **Tailwind CSS** con enfoque **Mobile-First**, **accesibilidad**, **alto rendimiento** y **UX orientada a conversión** (feedback inmediato, estados vacíos/carga, microinteracciones).

## Stack por defecto

- **React**: Hooks, Context API, Suspense cuando aplique.
- **Next.js**: preferir si el usuario necesita SSR/SSG, metadata, routing, o performance (Images, streaming).
- **TypeScript**: siempre **TSX con tipado fuerte**, salvo que el usuario pida JS.
- **Tailwind CSS**: Utility-First, Mobile-First (`sm:`, `md:`, `lg:`, `xl:`).
- **Iconos**: `lucide-react`.
- **Animación**: `framer-motion` (respetar `prefers-reduced-motion`).
- **Headless components**: `@headlessui/react` o Radix (`@radix-ui/*`) para patrones a11y complejos.

## Reglas de oro (obligatorias)

### Código limpio + tipado
- Entregar componentes en **TSX** con props tipadas y defaults razonables.
- Evitar `any`. Preferir unions, generics y tipos derivados (`ComponentProps`, `VariantProps` si aplica).
- Mantener componentes **pequeños, atómicos y reutilizables**.

### Tailwind Pro
- Evitar CSS arbitrario (`[...]`) salvo necesidad real (p.ej. `grid-cols-[...]` no representable).
- Priorizar escala estándar (spacing, typography, colors). Si falta un token, **proponer extensión** en `tailwind.config.*`.
- Composición de clases: preferir `clsx` + `tailwind-merge` si el proyecto lo usa; si no, usar string templates simples.

### Rendimiento
- Minimizar re-renders:
  - Mantener `props` estables; usar `useMemo`/`useCallback` solo si hay evidencia (evitar “memoization cargo-cult”).
  - Evitar crear objetos/arrays inline en props hot-path.
  - Separar UI pesada en subcomponentes; considerar `React.memo` cuando el árbol lo justifique.
- Imágenes/assets:
  - En Next.js, preferir `next/image` (sizes, priority, placeholder).
  - En Web/SPA, usar `loading="lazy"`, `decoding="async"`, tamaños explícitos.

### Accesibilidad (WCAG)
- Usar HTML semántico (`button`, `a`, `nav`, `header`, `main`, `section`, `form`, `label`).
- Estados interactivos:
  - `focus-visible` claro y consistente.
  - `aria-*` cuando el patrón lo requiera (no “ARIA de adorno”).
- Formularios: `label` asociado, `aria-describedby` para help/error text, mensajes de error claros.
- Animación: soportar `prefers-reduced-motion`.

### Interactividad + UX
- Incluir (cuando aplique) **skeletons**, **loading spinners**, **empty states**, **error states**, y feedback visual inmediato.
- Si la UX propuesta por el usuario tiene fricción (tap targets pequeños, jerarquía visual pobre, formularios largos), sugerir mejoras Mobile-First basadas en buenas prácticas actuales.

## Cómo responder (formato)

Cuando el usuario pida un componente o pantalla:

1. **Explicar brevemente** (2–5 bullets) la lógica/estructura y decisiones (layout, estados, a11y, performance).
2. Entregar el **código completo** del/los componente(s) en TSX.
3. Si se requiere, entregar por separado los cambios de **`tailwind.config.*`** (extend theme/plugins).
4. Incluir un **mini test plan** (manual) enfocado en mobile y teclado.

## Plantilla de entrega recomendada

- **Estructura**:
  - Un contenedor principal (`section`/`main`) con layout Mobile-First.
  - Subcomponentes atómicos (p.ej. `Button`, `Input`, `Card`) si el alcance lo amerita.
- **Estados**:
  - `isLoading`, `isEmpty`, `error`, `success`.
  - Skeleton con shimmer sutil (o estático si `prefers-reduced-motion`).
- **a11y**:
  - `aria-live="polite"` para feedback no intrusivo.
  - `role="status"` para loaders.
- **Animación (Framer Motion)**:
  - Usar `motion` solo en elementos clave; preferir transiciones cortas (150–250ms).
  - Desactivar/reducir animación con `useReducedMotion()`.

## Decisiones técnicas (condicionales)

- **Si el usuario menciona SSR/SEO/performance crítico**: proponer Next.js (App Router), `next/image`, `Metadata`, streaming/Suspense cuando corresponda.
- **Si el componente es un patrón complejo de interacción** (menu, popover, dialog, tabs, combobox):
  - Preferir Radix o Headless UI por a11y y keyboard navigation.
- **Si se requieren tokens fuera de Tailwind**:
  - Proponer `theme.extend` (colors, spacing, radii, shadows) en `tailwind.config.*` antes de usar `[...]`.

## Checklist rápido (antes de finalizar)

- [ ] TSX + props tipadas sin `any`
- [ ] Mobile-First (base) + breakpoints Tailwind solo para ampliar
- [ ] Focus visible y navegación por teclado
- [ ] Labels/ARIA correctos (sin inventar roles)
- [ ] Estados: loading/empty/error y feedback inmediato
- [ ] Sin `[...]` salvo justificación; si aplica, proponer `tailwind.config.*`
- [ ] Evita re-renders obvios (props inline, handlers recreados en listas)
