/**
 * Shared prop interface contracts for the darkTunes Charts component library.
 *
 * These interfaces enforce Inversion of Control (IoC) and prevent prop
 * drilling beyond two levels.  Any component that renders a "section",
 * opens a "dialog", or manages an "admin panel" should implement the
 * relevant interface rather than defining its own ad-hoc prop types.
 */

/**
 * Base props accepted by every top-level section component.
 * Allows callers to inject additional Tailwind classes for layout overrides.
 */
export interface SectionProps {
  className?: string
}

/**
 * Props for modal / dialog components.
 * The parent controls open state; the dialog signals close via `onClose`.
 */
export interface DialogProps {
  open: boolean
  onClose: () => void
}

/**
 * Generic props for admin panel components that load, display, and persist
 * a typed data object.
 *
 * @typeParam T - The shape of the entity being managed (e.g. `Band`, `Track`).
 */
export interface AdminPanelProps<T> {
  data: T
  onSave: (data: T) => Promise<void>
  isLoading?: boolean
}
