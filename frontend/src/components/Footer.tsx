export default function Footer() {
  return (
    <footer className="bg-slate-50 dark:bg-[#0f0f1e] py-12 border-t border-slate-200/10 dark:border-[#3a3550]/30">
      <div className="flex flex-col md:flex-row justify-between items-center w-full px-8 max-w-7xl mx-auto gap-8">
        <div className="flex flex-col gap-2 items-center md:items-start">
          <span className="text-violet-600 font-black tracking-tighter text-xl mb-2">Snip</span>
          <p className="text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-[#6b658a]">
            © 2024 Snip. Todos los derechos reservados.
          </p>
        </div>
        <div className="flex items-center gap-8">
          {['Privacy', 'Terms', 'API', 'Status'].map(link => (
            <a
              key={link}
              href="#"
              className="text-xs font-medium uppercase tracking-widest text-slate-400 dark:text-[#6b658a] hover:text-violet-500 underline-offset-4 hover:underline transition-opacity opacity-80 hover:opacity-100"
            >
              {link}
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
