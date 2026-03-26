import { useState } from "react";
import { Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { shortenUrl, type ShortenResponse } from "../api";
import { useTheme } from "../context/ThemeContext";

const SLUG_RE = /^[a-zA-Z0-9][a-zA-Z0-9\-]{1,48}[a-zA-Z0-9]$/;

function validateSlug(slug: string): string {
  if (slug.length < 3) return "Mínimo 3 caracteres";
  if (slug.length > 50) return "Máximo 50 caracteres";
  if (!SLUG_RE.test(slug)) return "Solo letras, números y guiones (no al inicio/final)";
  return "";
}

export default function Home() {
  const { theme } = useTheme();
  const [url, setUrl] = useState("");
  const [customSlug, setCustomSlug] = useState("");
  const [expirationHours, setExpirationHours] = useState<string>("none");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [slugError, setSlugError] = useState("");
  const [result, setResult] = useState<ShortenResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  function handleSlugChange(val: string) {
    setCustomSlug(val);
    setSlugError(val ? validateSlug(val) : "");
  }

  async function handleShorten(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    if (customSlug && slugError) return;
    setLoading(true);
    setError("");
    setResult(null);
    try {
      let expiresAt: string | undefined;
      if (expirationHours !== "none") {
        const ms = parseInt(expirationHours, 10) * 60 * 60 * 1000;
        expiresAt = new Date(Date.now() + ms).toISOString();
      }
      const data = await shortenUrl(url.trim(), customSlug.trim() || undefined, expiresAt);
      setResult(data);
      setUrl("");
      setCustomSlug("");
      setSlugError("");
      setExpirationHours("none");
      setShowAdvanced(false);
      queryClient.invalidateQueries({ queryKey: ["urls"] });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      setError(
        msg.includes("ya está en uso")
          ? `El slug "${customSlug}" ya está en uso. Prueba otro.`
          : "No se pudo acortar la URL. Verificá que sea válida."
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.short_url);
    setCopied(true);
    toast.success("Link copiado");
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8f9fa] dark:bg-[#0f0f1e] font-body text-[#191c1d] dark:text-[#e6e0ff]">
      <Navbar />

      <main className="flex-grow flex flex-col justify-center py-12">
        <div className="w-full max-w-7xl mx-auto px-6">
          {/* Hero */}
          <section className="flex flex-col items-center text-center mb-10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#5323e6] mb-3">
              Acortador de URLs
            </p>
            <h1 className="font-headline text-3xl md:text-4xl font-extrabold tracking-tighter text-[#191c1d] dark:text-[#e6e0ff] mb-8 leading-tight">
              Links concisos. Datos reales.
            </h1>

            {/* Form */}
            <form onSubmit={handleShorten} className="w-full max-w-3xl">
              {/* Main input row */}
              <div className="bg-[#f3f4f5] dark:bg-[#17172a] p-2 rounded-xl flex flex-col md:flex-row gap-2 shadow-sm">
                <div className="relative flex-grow group">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#797588] dark:text-[#7a7494] transition-colors group-focus-within:text-[#5323e6]">
                    link
                  </span>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="Pega tu URL larga aquí..."
                    required
                    className="w-full pl-12 pr-4 py-4 bg-white dark:bg-[#1a1a2e] border-none rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5323e6]/20 text-[#191c1d] dark:text-[#e6e0ff] placeholder:text-[#797588]/50 font-medium transition-all"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading || (!!customSlug && !!slugError)}
                  className="bg-gradient-to-r from-[#6c47ff] to-[#5323e6] text-white font-bold px-10 py-4 rounded-lg transition-transform scale-100 hover:scale-[1.02] active:scale-[0.98] shadow-lg shadow-[#5323e6]/20 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {loading ? "Acortando..." : "Acortar"}
                </button>
              </div>

              {/* Advanced options toggle */}
              <div className="mt-3 flex items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="text-xs font-semibold text-[#797588] dark:text-[#7a7494] hover:text-[#5323e6] transition-colors flex items-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">
                    {showAdvanced ? "expand_less" : "tune"}
                  </span>
                  {showAdvanced ? "Ocultar opciones" : "Personalizar slug"}
                </button>
              </div>

              {/* Custom slug input */}
              {showAdvanced && (
                <div className="mt-3 bg-[#f3f4f5] dark:bg-[#17172a] rounded-xl p-4 text-left">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-[#484556]/80 dark:text-[#b0aacc]/80 mb-2">
                    Slug personalizado
                    <span className="normal-case font-normal text-[#797588] dark:text-[#7a7494] ml-1">(opcional)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-[#797588] dark:text-[#7a7494] font-medium whitespace-nowrap">
                      {window.location.host}/
                    </span>
                    <input
                      type="text"
                      value={customSlug}
                      onChange={(e) => handleSlugChange(e.target.value)}
                      placeholder="mi-slug"
                      maxLength={50}
                      className="flex-1 px-3 py-2 bg-white dark:bg-[#1a1a2e] border-none rounded-lg text-[#191c1d] dark:text-[#e6e0ff] text-sm focus:outline-none focus:ring-2 focus:ring-[#5323e6]/20 transition-all placeholder:text-[#c9c3d9]"
                    />
                  </div>
                  {slugError && (
                    <p className="mt-1.5 text-xs text-[#ba1a1a]">{slugError}</p>
                  )}
                  {!slugError && customSlug && (
                    <p className="mt-1.5 text-xs text-[#5323e6] font-medium">
                      ✓ {window.location.host}/{customSlug}
                    </p>
                  )}
                  <div className="mt-4">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-[#484556]/80 dark:text-[#b0aacc]/80 mb-2">
                      Expiración
                      <span className="normal-case font-normal text-[#797588] dark:text-[#7a7494] ml-1">(opcional)</span>
                    </label>
                    <select
                      value={expirationHours}
                      onChange={(e) => setExpirationHours(e.target.value)}
                      className="w-full px-3 py-2 bg-white dark:bg-[#1a1a2e] border-none rounded-lg text-[#191c1d] dark:text-[#e6e0ff] text-sm focus:outline-none focus:ring-2 focus:ring-[#5323e6]/20 transition-all"
                    >
                      <option value="none">Sin expiración</option>
                      <option value="1">1 hora</option>
                      <option value="24">24 horas</option>
                      <option value="168">7 días</option>
                      <option value="720">30 días</option>
                    </select>
                  </div>
                </div>
              )}

              <p className="mt-4 text-xs font-medium text-[#797588] dark:text-[#7a7494] flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">bolt</span>
                Generación instantánea. Cero latencia.
              </p>
              {error && <p className="mt-3 text-sm text-[#ba1a1a]">{error}</p>}
            </form>
          </section>

          {/* Results */}
          <section className="max-w-2xl mx-auto space-y-4">
            {result && (
              <div className="bg-white dark:bg-[#1a1a2e] rounded-xl p-6 flex flex-col md:flex-row items-center gap-6 group transition-all duration-300 hover:shadow-2xl hover:shadow-[#191c1d]/5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-[#5323e6] opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="w-44 h-44 bg-white dark:bg-[#1a1a2e] rounded-lg flex items-center justify-center p-2 flex-shrink-0 border border-[#c9c3d9]/20 dark:border-[#3a3550]/50 self-center">
                  <QRCodeSVG
                    value={result.short_url}
                    size={160}
                    fgColor={theme === "dark" ? "#ffffff" : "#191c1d"}
                    bgColor={theme === "dark" ? "#1a1a2e" : "#ffffff"}
                  />
                </div>
                <div className="flex-grow text-left min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#797588] dark:text-[#7a7494] uppercase tracking-tighter">
                      Tu Snip
                    </span>
                  </div>
                  <h3 className="text-2xl font-black font-headline text-[#191c1d] dark:text-[#e6e0ff] tracking-tight">
                    {result.short_url.replace(/https?:\/\//, "")}
                  </h3>
                  <p className="text-sm text-[#797588] dark:text-[#7a7494] truncate max-w-xs mt-1">
                    {result.original_url}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-2 px-4 py-2 bg-[#e7e8e9] dark:bg-[#242440] rounded-lg text-sm font-bold text-[#484556] dark:text-[#b0aacc] hover:bg-[#e1e3e4] dark:hover:bg-[#2a2a4a] transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {copied ? "check" : "content_copy"}
                    </span>
                    {copied ? "Copiado" : "Copiar"}
                  </button>
                  <Link
                    to={`/analytics/${result.slug}`}
                    className="p-2 bg-[#f3f4f5] dark:bg-[#17172a] rounded-lg text-[#484556] dark:text-[#b0aacc] hover:bg-[#5323e6]/10 hover:text-[#5323e6] transition-colors"
                  >
                    <span className="material-symbols-outlined">analytics</span>
                  </Link>
                </div>
              </div>
            )}

            {!result && (
              <div className="bg-white/50 dark:bg-[#1a1a2e]/50 opacity-60 rounded-xl p-6 flex items-center justify-between group grayscale hover:grayscale-0 hover:opacity-100 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-[#e7e8e9] dark:bg-[#242440] rounded flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#797588] dark:text-[#7a7494]">link</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#191c1d] dark:text-[#e6e0ff]">snip.ly/tu-link</h4>
                    <p className="text-xs text-[#797588] dark:text-[#7a7494]">Tu URL acortada aparecerá aquí</p>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}
