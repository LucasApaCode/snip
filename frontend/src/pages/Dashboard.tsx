import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ConfirmModal from "../components/ConfirmModal";
import { listUrls, deleteUrl, type UrlItem } from "../api";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

const PAGE_SIZE = 10;

export default function Dashboard() {
  const [page, setPage] = useState(0);
  const [deletingSlug, setDeletingSlug] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<UrlItem | null>(null);
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["urls", page],
    queryFn: () => listUrls(page, PAGE_SIZE),
  });

  async function confirmDelete() {
    if (!pendingDelete) return;
    const slug = pendingDelete.slug;
    setPendingDelete(null);
    setDeletingSlug(slug);
    try {
      await deleteUrl(slug);
      toast.success("Link eliminado");
      if (data && data.items.length === 1 && page > 0) {
        setPage((p) => p - 1);
      } else {
        queryClient.invalidateQueries({ queryKey: ["urls"] });
      }
    } catch {
      toast.error("No se pudo eliminar el link");
    } finally {
      setDeletingSlug(null);
    }
  }

  async function handleCopy(item: UrlItem) {
    await navigator.clipboard.writeText(item.short_url);
    setCopiedSlug(item.slug);
    toast.success("Link copiado");
    setTimeout(() => setCopiedSlug(null), 2000);
  }

  const urls = data?.items ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="bg-[#f8f9fa] dark:bg-[#0f0f1e] text-[#191c1d] dark:text-[#e6e0ff]">
      <Navbar />

      {pendingDelete && (
        <ConfirmModal
          title="¿Eliminar este link?"
          description={`El link "${pendingDelete.short_url.replace(/https?:\/\//, "")}" se eliminará permanentemente y dejará de redirigir.`}
          confirmLabel="Eliminar"
          onConfirm={confirmDelete}
          onCancel={() => setPendingDelete(null)}
        />
      )}

      <main className="max-w-7xl mx-auto px-6 py-12 min-h-screen">
        {/* Header */}
        <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <h1 className="font-headline text-5xl font-extrabold tracking-tighter text-[#191c1d] dark:text-[#e6e0ff] mb-2">
              Mis Links
            </h1>
            <p className="text-[#484556] dark:text-[#b0aacc] text-lg">
              Administra y monitorea tus links acortados.
            </p>
          </div>
          <Link
            to="/"
            className="bg-gradient-to-r from-[#6c47ff] to-[#5323e6] text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 shadow-lg shadow-[#5323e6]/20 scale-100 hover:scale-[1.02] active:scale-95 transition-all no-underline w-fit"
          >
            <span className="material-symbols-outlined">add</span>
            Acortar URL
          </Link>
        </header>

        {/* Stat cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 md:max-w-2xl">
          <div className="bg-white dark:bg-[#1a1a2e] p-6 rounded-xl border border-[#c9c3d9]/15 dark:border-[#3a3550]/40 flex flex-col justify-between h-32">
            <span className="font-medium text-[#484556] dark:text-[#b0aacc] uppercase tracking-widest text-xs">
              Total Links
            </span>
            <span className="text-4xl font-headline font-bold text-[#191c1d] dark:text-[#e6e0ff]">
              {isLoading ? "—" : total.toLocaleString()}
            </span>
          </div>
          <div className="bg-white dark:bg-[#1a1a2e] p-6 rounded-xl border border-[#c9c3d9]/15 dark:border-[#3a3550]/40 flex flex-col justify-between h-32">
            <span className="font-medium text-[#484556] dark:text-[#b0aacc] uppercase tracking-widest text-xs">
              Total Clicks
            </span>
            <span className="text-4xl font-headline font-bold text-[#191c1d] dark:text-[#e6e0ff]">
              {isLoading
                ? "—"
                : urls.reduce((s, u) => s + u.click_count, 0).toLocaleString()}
            </span>
          </div>
        </div>

        {/* Table — desktop (md+) */}
        <div className="hidden md:block bg-white dark:bg-[#1a1a2e] rounded-xl shadow-sm border border-[#c9c3d9]/15 dark:border-[#3a3550]/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#f3f4f5]/50 dark:bg-[#17172a]/50">
                  {[
                    "Link Corto",
                    "URL Original",
                    "Clicks",
                    "Fecha",
                    "Expira",
                    "Acciones",
                  ].map((col) => (
                    <th
                      key={col}
                      className="px-6 py-4 font-headline text-sm font-bold text-[#484556] dark:text-[#b0aacc] border-b border-[#c9c3d9]/10 dark:border-[#3a3550]/30"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#c9c3d9]/10 dark:divide-[#3a3550]/30">
                {isLoading && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-sm text-[#797588] dark:text-[#7a7494]"
                    >
                      Cargando...
                    </td>
                  </tr>
                )}
                {isError && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-sm text-[#ba1a1a]"
                    >
                      No se pudieron cargar los links.
                    </td>
                  </tr>
                )}
                {!isLoading && !isError && urls.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-16 text-center text-sm text-[#484556] dark:text-[#b0aacc]"
                    >
                      Todavía no tienes links.{" "}
                      <Link to="/" className="text-[#5323e6] hover:underline">
                        Acorta tu primera URL
                      </Link>
                    </td>
                  </tr>
                )}
                {urls.map((item) => (
                  <tr
                    key={item.slug}
                    className="group hover:bg-[#f8f9fa] dark:hover:bg-[#17172a] transition-colors"
                  >
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-2">
                        <a
                          href={item.short_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-[#5323e6] underline underline-offset-4 decoration-[#5323e6]/30 hover:decoration-[#5323e6] transition-all"
                        >
                          {item.short_url.replace(/https?:\/\//, "")}
                        </a>
                        <button
                          onClick={() => handleCopy(item)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#e7e8e9] dark:hover:bg-[#242440] rounded"
                          title="Copiar"
                        >
                          <span className="material-symbols-outlined text-sm text-[#797588] dark:text-[#7a7494]">
                            {copiedSlug === item.slug
                              ? "check"
                              : "content_copy"}
                          </span>
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-6">
                      <span className="text-[#484556] dark:text-[#b0aacc] text-sm block max-w-xs truncate">
                        {item.original_url}
                      </span>
                    </td>
                    <td className="px-6 py-6">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#e6deff] dark:bg-[#2d1f6e] text-[#1b0161] dark:text-[#c9beff] text-xs font-bold">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#5323e6]" />
                        {item.click_count.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-sm text-[#484556] dark:text-[#b0aacc] font-medium">
                      {formatDate(item.created_at)}
                    </td>
                    <td className="px-6 py-6 text-sm font-medium">
                      {item.expires_at === null ? (
                        <span className="text-[#484556] dark:text-[#b0aacc]">
                          —
                        </span>
                      ) : new Date(item.expires_at) <= new Date() ? (
                        <span className="text-[#ba1a1a] font-semibold">
                          Expirado
                        </span>
                      ) : (
                        <span className="text-[#484556] dark:text-[#b0aacc]">
                          {new Date(item.expires_at).toLocaleDateString(
                            "es-CL",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-6">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => navigate(`/analytics/${item.slug}`)}
                          className="text-sm font-bold text-[#5323e6] hover:text-[#6c47ff] transition-colors px-3 py-2 hover:bg-[#5323e6]/5 rounded-lg"
                        >
                          Analytics
                        </button>
                        <button
                          onClick={() => setPendingDelete(item)}
                          disabled={deletingSlug === item.slug}
                          className="p-2 text-[#797588] hover:text-[#ba1a1a] hover:bg-[#ba1a1a]/5 rounded-lg transition-colors disabled:opacity-40"
                          title="Eliminar"
                        >
                          <span className="material-symbols-outlined text-sm">
                            {deletingSlug === item.slug
                              ? "hourglass_empty"
                              : "delete"}
                          </span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination — desktop */}
          <div className="p-6 bg-[#f3f4f5]/30 dark:bg-[#17172a]/30 border-t border-[#c9c3d9]/10 dark:border-[#3a3550]/30 flex items-center justify-between">
            <span className="text-sm text-[#484556] dark:text-[#b0aacc]">
              {total > 0
                ? `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} de ${total} links`
                : "0 links"}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-4 py-2 border border-[#c9c3d9]/20 dark:border-[#3a3550]/50 rounded-lg text-sm font-bold text-[#191c1d] dark:text-[#e6e0ff] hover:bg-[#e7e8e9] dark:hover:bg-[#242440] transition-colors disabled:opacity-40"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-4 py-2 border border-[#c9c3d9]/20 dark:border-[#3a3550]/50 rounded-lg text-sm font-bold text-[#191c1d] dark:text-[#e6e0ff] hover:bg-[#e7e8e9] dark:hover:bg-[#242440] transition-colors disabled:opacity-40"
              >
                Siguiente
              </button>
            </div>
          </div>
        </div>

        {/* Cards — mobile (< md) */}
        <div className="md:hidden">
          {isLoading && (
            <p className="py-16 text-center text-sm text-[#797588] dark:text-[#7a7494]">
              Cargando...
            </p>
          )}
          {isError && (
            <p className="py-16 text-center text-sm text-[#ba1a1a]">
              No se pudieron cargar los links.
            </p>
          )}
          {!isLoading && !isError && urls.length === 0 && (
            <p className="py-16 text-center text-sm text-[#484556] dark:text-[#b0aacc]">
              Todavía no tienes links.{" "}
              <Link to="/" className="text-[#5323e6] hover:underline">
                Acorta tu primera URL
              </Link>
            </p>
          )}

          <div className="space-y-3">
            {urls.map((item) => (
              <div
                key={item.slug}
                className="bg-white dark:bg-[#1a1a2e] border border-[#c9c3d9]/15 dark:border-[#3a3550]/40 rounded-xl p-4 shadow-sm"
              >
                {/* Row 1: link corto + clicks badge */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <a
                      href={item.short_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-[#5323e6] underline underline-offset-4 decoration-[#5323e6]/30 hover:decoration-[#5323e6] transition-all truncate"
                    >
                      {item.short_url.replace(/https?:\/\//, "")}
                    </a>
                    <button
                      onClick={() => handleCopy(item)}
                      className="shrink-0 p-1 hover:bg-[#e7e8e9] dark:hover:bg-[#242440] rounded transition-colors"
                      title="Copiar"
                    >
                      <span className="material-symbols-outlined text-sm text-[#797588] dark:text-[#7a7494]">
                        {copiedSlug === item.slug ? "check" : "content_copy"}
                      </span>
                    </button>
                  </div>
                  <div className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#e6deff] dark:bg-[#2d1f6e] text-[#1b0161] dark:text-[#c9beff] text-xs font-bold">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#5323e6]" />
                    {item.click_count.toLocaleString()}
                  </div>
                </div>

                {/* Row 2: URL original truncada */}
                <p className="text-sm text-[#484556] dark:text-[#b0aacc] truncate mb-2">
                  {item.original_url}
                </p>

                {/* Row 3: fecha · expiración */}
                <p className="text-xs text-[#797588] dark:text-[#7a7494] mb-4">
                  {formatDate(item.created_at)}
                  {item.expires_at !== null && (
                    <>
                      {" · "}
                      {new Date(item.expires_at) <= new Date() ? (
                        <span className="text-[#ba1a1a] font-semibold">
                          Expirado
                        </span>
                      ) : (
                        <span>
                          Expira{" "}
                          {new Date(item.expires_at).toLocaleDateString(
                            "es-CL",
                            { day: "2-digit", month: "short", year: "numeric" },
                          )}
                        </span>
                      )}
                    </>
                  )}
                </p>

                {/* Row 4: acciones */}
                <div className="flex items-center justify-between border-t border-[#c9c3d9]/10 dark:border-[#3a3550]/30 pt-3">
                  <button
                    onClick={() => navigate(`/analytics/${item.slug}`)}
                    className="text-sm font-bold text-[#5323e6] hover:text-[#6c47ff] transition-colors px-3 py-2 hover:bg-[#5323e6]/5 rounded-lg"
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => setPendingDelete(item)}
                    disabled={deletingSlug === item.slug}
                    className="p-2 text-[#797588] hover:text-[#ba1a1a] hover:bg-[#ba1a1a]/5 rounded-lg transition-colors disabled:opacity-40"
                    title="Eliminar"
                  >
                    <span className="material-symbols-outlined text-sm">
                      {deletingSlug === item.slug
                        ? "hourglass_empty"
                        : "delete"}
                    </span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination — mobile */}
          {total > 0 && (
            <div className="mt-4 flex items-center justify-between">
              <span className="text-sm text-[#484556] dark:text-[#b0aacc]">
                {`${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} de ${total}`}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-4 py-2 border border-[#c9c3d9]/20 dark:border-[#3a3550]/50 rounded-lg text-sm font-bold text-[#191c1d] dark:text-[#e6e0ff] hover:bg-[#e7e8e9] dark:hover:bg-[#242440] transition-colors disabled:opacity-40"
                >
                  Anterior
                </button>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(totalPages - 1, p + 1))
                  }
                  disabled={page >= totalPages - 1}
                  className="px-4 py-2 border border-[#c9c3d9]/20 dark:border-[#3a3550]/50 rounded-lg text-sm font-bold text-[#191c1d] dark:text-[#e6e0ff] hover:bg-[#e7e8e9] dark:hover:bg-[#242440] transition-colors disabled:opacity-40"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
