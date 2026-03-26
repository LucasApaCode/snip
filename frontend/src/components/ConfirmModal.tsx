interface Props {
  title: string
  description: string
  confirmLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ title, description, confirmLabel = 'Eliminar', onConfirm, onCancel }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#191c1d]/40 dark:bg-[#00000f]/65 backdrop-blur-sm" onClick={onCancel} />

      {/* Dialog */}
      <div className="relative bg-white dark:bg-[#1a1a2e] rounded-2xl shadow-2xl w-full max-w-sm p-8 flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[#ffdad6] dark:bg-[#ba1a1a]/18 flex items-center justify-center flex-shrink-0">
            <span className="material-symbols-outlined text-[#ba1a1a] text-xl">delete</span>
          </div>
          <div>
            <h2 className="font-headline text-lg font-bold text-[#191c1d] dark:text-[#e6e0ff]">{title}</h2>
            <p className="text-sm text-[#484556] dark:text-[#b0aacc] mt-1">{description}</p>
          </div>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-[#484556] dark:text-[#b0aacc] bg-[#f3f4f5] dark:bg-[#17172a] hover:bg-[#e7e8e9] dark:hover:bg-[#242440] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2.5 rounded-lg text-sm font-bold text-white bg-[#ba1a1a] hover:bg-[#a51515] transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
