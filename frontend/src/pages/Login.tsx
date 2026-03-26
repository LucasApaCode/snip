import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginApi, registerApi } from '../api'
import { useAuth } from '../context/AuthContext'
import Footer from '../components/Footer'

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const { signIn } = useAuth()
  const navigate = useNavigate()

  function switchMode() {
    setMode(m => m === 'login' ? 'register' : 'login')
    setEmail('')
    setPassword('')
    setError('')
    setPasswordError('')
    setShowPassword(false)
  }

  function validatePassword(val: string) {
    if (mode === 'register' && val.length > 0 && val.length < 8) {
      setPasswordError('Mínimo 8 caracteres')
    } else {
      setPasswordError('')
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (mode === 'register' && password.length < 8) {
      setPasswordError('Mínimo 8 caracteres')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = mode === 'login'
        ? await loginApi(email, password)
        : await registerApi(email, password)
      signIn(data.access_token, data.email)
      navigate('/')
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-[#f8f9fa] dark:bg-[#0f0f1e] text-[#191c1d] dark:text-[#e6e0ff] min-h-screen flex flex-col">
      {/* Decorative blobs */}
      <div className="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[60%] rounded-full bg-[#5323e6]/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[60%] rounded-full bg-[#5f52a7]/10 blur-[120px]" />
      </div>

      <main className="flex-grow flex flex-col items-center justify-center px-6 py-12">
        {/* Logo */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-black tracking-tighter text-[#5323e6] font-headline">Snip</h1>
          <p className="text-[#484556] dark:text-[#b0aacc] text-sm mt-2 font-medium tracking-tight">Gestión de URLs con precisión</p>
        </div>

        {/* Card */}
        <div className="w-full max-w-[420px] bg-white dark:bg-[#1a1a2e] p-8 md:p-10 rounded-xl shadow-[0_8px_24px_rgba(25,28,29,0.06)] ring-1 ring-[#c9c3d9]/10 dark:ring-[#3a3550]/30">

          {/* Header — animated on mode change */}
          <header className="mb-8 transition-all duration-200 text-center">
            <h2 className="text-2xl font-bold font-headline tracking-tight text-[#191c1d] dark:text-[#e6e0ff]">
              {mode === 'login' ? 'Bienvenido de nuevo' : 'Crear cuenta'}
            </h2>
            <p className="text-[#484556] dark:text-[#b0aacc] text-sm mt-1">
              {mode === 'login'
                ? 'Ingresa tus datos para continuar.'
                : 'Empieza a acortar URLs con precisión.'}
            </p>
          </header>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#484556]/80 dark:text-[#b0aacc]/80 ml-1" htmlFor="email">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="architect@snip.io"
                required
                className="w-full px-4 py-3 bg-[#f3f4f5] dark:bg-[#17172a] border-none rounded-lg text-[#191c1d] dark:text-[#e6e0ff] focus:outline-none focus:ring-2 focus:ring-[#5323e6]/20 transition-all placeholder:text-[#c9c3d9]"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <div className="flex justify-between items-end px-1">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#484556]/80 dark:text-[#b0aacc]/80" htmlFor="password">
                  Contraseña
                  {mode === 'register' && (
                    <span className="normal-case font-normal text-[#797588] dark:text-[#7a7494] ml-1">(mín. 8 caracteres)</span>
                  )}
                </label>
                {mode === 'login' && (
                  <a href="#" className="text-[11px] font-bold text-[#5323e6] hover:underline underline-offset-4 tracking-tight">
                    ¿OLVIDASTE?
                  </a>
                )}
              </div>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => { setPassword(e.target.value); validatePassword(e.target.value) }}
                  placeholder="••••••••"
                  required
                  className={`w-full pl-4 pr-11 py-3 bg-[#f3f4f5] dark:bg-[#17172a] border-none rounded-lg text-[#191c1d] dark:text-[#e6e0ff] focus:outline-none focus:ring-2 transition-all placeholder:text-[#c9c3d9] ${
                    passwordError ? 'focus:ring-[#ba1a1a]/20' : 'focus:ring-[#5323e6]/20'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#797588] dark:text-[#7a7494] hover:text-[#484556] dark:hover:text-[#b0aacc] transition-colors"
                  tabIndex={-1}
                >
                  <span className="material-symbols-outlined text-xl">
                    {showPassword ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
              {passwordError && (
                <p className="text-xs text-[#ba1a1a] ml-1">{passwordError}</p>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 bg-[#ffdad6] dark:bg-[#ba1a1a]/18 rounded-lg">
                <span className="material-symbols-outlined text-[#ba1a1a] text-lg flex-shrink-0">error</span>
                <p className="text-sm text-[#ba1a1a] font-medium">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 px-6 bg-gradient-to-r from-[#6c47ff] to-[#5323e6] text-white font-bold rounded-lg shadow-lg shadow-[#5323e6]/20 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  <span>Por favor esperá...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}</span>
                  <span className="material-symbols-outlined text-lg group-hover:translate-x-1 transition-transform">
                    arrow_forward
                  </span>
                </>
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="mt-8 text-center text-sm text-[#484556] dark:text-[#b0aacc] font-medium">
            {mode === 'login' ? '¿No tienes cuenta?' : '¿Ya tienes cuenta?'}
            <button
              onClick={switchMode}
              className="text-[#5323e6] font-bold hover:underline underline-offset-4 ml-1 transition-colors"
            >
              {mode === 'login' ? 'Regístrate' : 'Inicia sesión'}
            </button>
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}
