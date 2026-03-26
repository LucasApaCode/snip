import { useParams, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { getAnalytics } from '../api'
import { useTheme } from '../context/ThemeContext'

function countryFlag(code: string): string {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(0x1f1e0 - 65 + c.charCodeAt(0)))
}

function countryName(code: string): string {
  try {
    return new Intl.DisplayNames(['es'], { type: 'region' }).of(code) ?? code
  } catch {
    return code
  }
}

function formatDay(day: string) {
  const d = new Date(day + 'T00:00:00')
  return d.toLocaleDateString('es-CL', { month: 'short', day: '2-digit' })
}

interface BreakdownListProps {
  title: string
  icon: string
  items: { label: string; count: number }[]
}

function BreakdownList({ title, icon, items }: BreakdownListProps) {
  if (items.length === 0) return null
  const total = items.reduce((s, i) => s + i.count, 0)
  return (
    <div className="bg-white dark:bg-[#1a1a2e] p-8 rounded-xl">
      <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-[#191c1d] dark:text-[#e6e0ff]">
        <span className="material-symbols-outlined text-[#5323e6]">{icon}</span>
        {title}
      </h3>
      <div className="space-y-5">
        {items.map((item, i) => {
          const pct = Math.round((item.count / total) * 100)
          return (
            <div key={i} className="flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-[#edeeef] dark:bg-[#1e1e35] flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-[#484556] dark:text-[#b0aacc]">{i + 1}</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-bold text-[#191c1d] dark:text-[#e6e0ff]">{item.label}</span>
                  <span className="text-sm font-semibold text-[#484556] dark:text-[#b0aacc]">{pct}%</span>
                </div>
                <div className="w-full h-2 bg-[#edeeef] dark:bg-[#1e1e35] rounded-full overflow-hidden">
                  <div className="h-full bg-[#5323e6] rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function Analytics() {
  const { slug } = useParams<{ slug: string }>()
  const { theme } = useTheme()

  const { data, isLoading, isError } = useQuery({
    queryKey: ['analytics', slug],
    queryFn: () => getAnalytics(slug!),
    enabled: !!slug,
  })

  const isDark = theme === 'dark'
  const tickColor = isDark ? '#b0aacc' : '#484556'
  const tooltipBg = isDark ? 'rgba(26,26,46,0.97)' : 'rgba(255,255,255,0.9)'
  const tooltipShadow = isDark
    ? '0 8px 24px rgba(0,0,10,0.4)'
    : '0 8px 24px rgba(25,28,29,0.10)'
  const tooltipColor = isDark ? '#e6e0ff' : '#191c1d'

  async function handleCopy() {
    if (!data) return
    await navigator.clipboard.writeText(`${window.location.origin}/${data.slug}`)
    toast.success('Link copiado')
  }

  const avgPerDay = data && data.visits_by_day.length > 0
    ? Math.round(data.total_clicks / data.visits_by_day.length)
    : 0

  const chartData = data?.visits_by_day.map(v => ({
    day: formatDay(v.day),
    clicks: v.count,
  })) ?? []

  if (isLoading) {
    return (
      <div className="bg-[#f8f9fa] dark:bg-[#0f0f1e] min-h-screen">
        <Navbar />
        <main className="max-w-7xl mx-auto px-6 py-12">
          <div className="mb-12 animate-pulse">
            <div className="h-3 w-24 bg-[#e7e8e9] dark:bg-[#242440] rounded mb-4" />
            <div className="h-10 w-72 bg-[#e7e8e9] dark:bg-[#242440] rounded mb-3" />
            <div className="h-4 w-56 bg-[#e7e8e9] dark:bg-[#242440] rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#1a1a2e] p-8 rounded-xl min-h-[160px] animate-pulse flex flex-col justify-between">
                <div className="h-3 w-28 bg-[#e7e8e9] dark:bg-[#242440] rounded" />
                <div className="h-12 w-20 bg-[#e7e8e9] dark:bg-[#242440] rounded" />
              </div>
            ))}
          </div>
          <div className="bg-white dark:bg-[#1a1a2e] p-8 rounded-xl mb-12 animate-pulse">
            <div className="h-6 w-36 bg-[#e7e8e9] dark:bg-[#242440] rounded mb-10" />
            <div className="h-80 bg-[#e7e8e9] dark:bg-[#242440] rounded-lg" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="bg-white dark:bg-[#1a1a2e] p-8 rounded-xl animate-pulse">
                <div className="h-5 w-32 bg-[#e7e8e9] dark:bg-[#242440] rounded mb-8" />
                <div className="space-y-5">
                  {Array.from({ length: 4 }).map((_, j) => (
                    <div key={j} className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-[#e7e8e9] dark:bg-[#242440] flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-[#e7e8e9] dark:bg-[#242440] rounded w-3/4" />
                        <div className="h-2 bg-[#e7e8e9] dark:bg-[#242440] rounded-full" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="bg-[#f8f9fa] dark:bg-[#0f0f1e] min-h-screen">
        <Navbar />
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <p className="text-[#ba1a1a] text-sm">Link no encontrado.</p>
          <Link to="/dashboard" className="text-[#5323e6] text-sm hover:underline">← Volver al Dashboard</Link>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#f8f9fa] dark:bg-[#0f0f1e] min-h-screen">
      <Navbar />

      <main className="max-w-7xl mx-auto px-6 py-12">

        {/* Header */}
        <header className="mb-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <span className="text-sm font-semibold text-[#5323e6] uppercase tracking-widest mb-2 block">
                Link Analytics
              </span>
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-[#191c1d] dark:text-[#e6e0ff] font-headline">
                {data.short_url?.replace(/https?:\/\//, '') ?? `${window.location.host}/${data.slug}`}
              </h1>
              <p className="text-[#484556] dark:text-[#b0aacc] mt-2 font-medium flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">link</span>
                {data.original_url}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleCopy}
                className="px-6 py-3 rounded-xl bg-[#e7e8e9] dark:bg-[#242440] text-[#191c1d] dark:text-[#e6e0ff] font-semibold hover:bg-[#e1e3e4] dark:hover:bg-[#2a2a4a] transition-colors flex items-center gap-2"
              >
                <span className="material-symbols-outlined">content_copy</span>
                Copiar link
              </button>
              <Link
                to="/dashboard"
                className="px-6 py-3 rounded-xl bg-[#6c47ff] text-white font-semibold shadow-lg shadow-[#5323e6]/20 hover:opacity-90 transition-opacity flex items-center gap-2 no-underline"
              >
                <span className="material-symbols-outlined">arrow_back</span>
                Dashboard
              </Link>
            </div>
          </div>
        </header>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-[#1a1a2e] p-8 rounded-xl flex flex-col justify-between min-h-[160px]">
            <span className="text-[#484556] dark:text-[#b0aacc] font-semibold tracking-tight text-sm">Total de Clicks</span>
            <div>
              <span className="text-5xl font-extrabold tracking-tighter text-[#191c1d] dark:text-[#e6e0ff]">
                {data.total_clicks.toLocaleString()}
              </span>
              <div className="w-full h-1 bg-[#edeeef] dark:bg-[#1e1e35] mt-4 rounded-full overflow-hidden">
                <div className="h-full bg-[#5323e6] w-3/4" />
              </div>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a1a2e] p-8 rounded-xl flex flex-col justify-between min-h-[160px]">
            <div className="flex justify-between items-start">
              <span className="text-[#484556] dark:text-[#b0aacc] font-semibold tracking-tight text-sm">Días Activo</span>
              <span className="material-symbols-outlined text-[#6c47ff]">groups</span>
            </div>
            <div>
              <span className="text-5xl font-extrabold tracking-tighter text-[#191c1d] dark:text-[#e6e0ff]">
                {data.visits_by_day.length}
              </span>
              <p className="text-xs text-[#484556] dark:text-[#b0aacc] mt-2 font-medium">días con visitas registradas</p>
            </div>
          </div>
          <div className="bg-white dark:bg-[#1a1a2e] p-8 rounded-xl flex flex-col justify-between min-h-[160px]">
            <div className="flex justify-between items-start">
              <span className="text-[#484556] dark:text-[#b0aacc] font-semibold tracking-tight text-sm">Prom. Clicks/Día</span>
              <span className="material-symbols-outlined text-[#8d3b00]">trending_up</span>
            </div>
            <span className="text-5xl font-extrabold tracking-tighter text-[#191c1d] dark:text-[#e6e0ff]">
              {avgPerDay.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white dark:bg-[#1a1a2e] p-8 rounded-xl mb-12">
          <h2 className="text-2xl font-bold tracking-tight mb-10 text-[#191c1d] dark:text-[#e6e0ff]">Clicks por día</h2>
          {chartData.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-[#797588] dark:text-[#7a7494] text-sm">Sin datos aún</div>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="clicksGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#5323e6" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="#5323e6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 10, fill: tickColor, fontFamily: 'Inter', fontWeight: 700 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fill: tickColor, fontFamily: 'Inter' }}
                  axisLine={false}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    background: tooltipBg,
                    backdropFilter: 'blur(12px)',
                    border: 'none',
                    borderRadius: '0.75rem',
                    boxShadow: tooltipShadow,
                    fontFamily: 'Inter',
                    fontSize: 12,
                    color: tooltipColor,
                  }}
                  cursor={{ stroke: '#5323e6', strokeWidth: 1, strokeDasharray: '4 4' }}
                />
                <Area
                  type="monotone"
                  dataKey="clicks"
                  stroke="#5323e6"
                  strokeWidth={4}
                  fill="url(#clicksGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: '#5323e6', strokeWidth: 0 }}
                  strokeLinecap="round"
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Breakdowns grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <BreakdownList
            title="Dispositivos"
            icon="devices"
            items={data.top_devices.map(d => ({ label: d.device_type, count: d.count }))}
          />
          <BreakdownList
            title="Navegadores"
            icon="web"
            items={data.top_browsers.map(b => ({ label: b.browser, count: b.count }))}
          />
        </div>

        {/* Top countries */}
        {data.top_countries.length > 0 && (
          <div className="bg-white dark:bg-[#1a1a2e] p-8 rounded-xl mb-6">
            <h3 className="text-xl font-bold mb-8 flex items-center gap-2 text-[#191c1d] dark:text-[#e6e0ff]">
              <span className="material-symbols-outlined text-[#5323e6]">public</span>
              Países
            </h3>
            <div className="space-y-5">
              {data.top_countries.map((item) => {
                const total = data.top_countries.reduce((s, c) => s + c.count, 0)
                const pct = Math.round((item.count / total) * 100)
                return (
                  <div key={item.country_code} className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-[#edeeef] dark:bg-[#1e1e35] flex items-center justify-center flex-shrink-0 text-lg leading-none">
                      {countryFlag(item.country_code)}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-[#191c1d] dark:text-[#e6e0ff]">
                          {countryName(item.country_code)}
                        </span>
                        <span className="text-sm font-semibold text-[#484556] dark:text-[#b0aacc]">{pct}%</span>
                      </div>
                      <div className="w-full h-2 bg-[#edeeef] dark:bg-[#1e1e35] rounded-full overflow-hidden">
                        <div className="h-full bg-[#5323e6] rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Top referers */}
        {data.top_referers.length > 0 && (
          <BreakdownList
            title="Principales fuentes"
            icon="language"
            items={data.top_referers.map(r => ({ label: r.referer, count: r.count }))}
          />
        )}
      </main>

      <Footer />
    </div>
  )
}
