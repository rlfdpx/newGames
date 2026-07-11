'use client'

export default function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string | null
  onDismiss: () => void
}) {
  if (!message) return null

  return (
    <div
      className="fixed left-0 right-0 z-[100] flex items-center justify-between gap-4"
      style={{
        top: 0,
        background: 'var(--nd-surface)',
        borderBottom: '1px solid var(--nd-accent)',
        color: 'var(--nd-accent)',
        fontFamily: 'var(--font-space-mono), monospace',
        fontSize: 12,
        letterSpacing: '0.02em',
        padding: '10px 20px',
      }}
    >
      <span>[ {message} ]</span>
      <button
        onClick={onDismiss}
        className="nd-btn-ghost"
        style={{ color: 'var(--nd-accent)', flexShrink: 0 }}
      >
        [Dismiss]
      </button>
    </div>
  )
}
