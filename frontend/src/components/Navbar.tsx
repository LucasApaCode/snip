import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'

export default function Navbar() {
  const { email, signOut } = useAuth()
  const { pathname } = useLocation()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  function handleLogout() {
    signOut()
    queryClient.clear()
    navigate('/login')
  }

  return (
    <nav className="bg-slate-50/80 dark:bg-[#0f0f1e]/80 backdrop-blur-xl sticky top-0 z-50 border-b border-slate-200/10 dark:border-[#3a3550]/30">
      <div className="flex justify-between items-center w-full px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-12">
          <Link to="/" className="text-2xl font-black tracking-tighter text-violet-600 no-underline">
            Snip
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <NavLink
              to="/dashboard"
              className={({ isActive }) =>
                isActive || pathname.startsWith('/analytics')
                  ? 'text-violet-700 dark:text-violet-400 font-bold border-b-2 border-violet-600 dark:border-violet-400 text-sm no-underline pb-0.5'
                  : 'text-slate-500 dark:text-[#a09ab8] font-medium hover:text-violet-600 dark:hover:text-violet-400 text-sm no-underline transition-colors'
              }
            >
              Dashboard
            </NavLink>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {email && (
            <span className="text-xs text-slate-400 dark:text-[#6b658a] font-medium hidden md:block">{email}</span>
          )}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-[#3a3550]/30 transition-colors"
            title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
          >
            <span className="material-symbols-outlined text-slate-600 dark:text-[#a09ab8]">
              {theme === 'light' ? 'dark_mode' : 'light_mode'}
            </span>
          </button>
          <button
            onClick={handleLogout}
            className="p-2 rounded-full hover:bg-slate-200/50 dark:hover:bg-[#3a3550]/30 transition-colors"
            title="Cerrar sesión"
          >
            <span className="material-symbols-outlined text-slate-600 dark:text-[#a09ab8]">logout</span>
          </button>
        </div>
      </div>
    </nav>
  )
}
