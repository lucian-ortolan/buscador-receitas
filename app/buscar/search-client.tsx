// app/buscar/search-client.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

/* =========================
   Tipos
========================= */
type Result = {
  title: string;
  link: string;
  displayLink: string;
  image?: string;
};
type ApiResponse = { items: Result[] };

/* =========================
   Constantes de UI
========================= */
const SUGGESTED_TAGS: string[] = [
  "bolo de cenoura",
  "lasanha vegana",
  "frango na airfryer",
  "sem glúten",
  "low carb",
  "sobremesa rápida",
  "macarrão de panela",
];

// paginação/carrossel
const PER_PAGE = 10;
const MAX_PAGES = 5; // até 50 resultados

export default function SearchClient({
  initialQuery,
}: {
  initialQuery: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [q, setQ] = useState<string>(initialQuery);
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<Result[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Página atual (URL: ?p=)
  const urlPage = Math.max(1, Number(searchParams.get("p") ?? "1"));
  const [page, setPage] = useState<number>(urlPage);

  // Sincroniza com a URL (compartilhável)
  useEffect(() => {
    const current = (searchParams.get("q") ?? "").trim();
    const p = Math.max(1, Number(searchParams.get("p") ?? "1"));

    if (current && current !== q) {
      setQ(current);
      // ao mudar a busca via URL, reseta internamente e busca
      void runSearch(current, p);
    } else {
      // se só mudar a página via URL, atualiza o estado da página
      setPage(p);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  // Busca inicial (se veio com ?q=)
  useEffect(() => {
    if (initialQuery) void runSearch(initialQuery, urlPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    // sempre inicia na página 1
    pushUrl(query, 1);
    await runSearch(query, 1);
  }

  function pushUrl(query: string, nextPage: number) {
    const url = `/buscar?q=${encodeURIComponent(query)}&p=${nextPage}`;
    router.push(url);
    setPage(nextPage);
  }

  async function runSearch(query: string, nextPage = 1) {
    setLoading(true);
    setError(null);
    setResults([]);
    try {
      // Buscamos até 50 itens (5 páginas x 10 por página)
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(query)}&perPage=${
          PER_PAGE * MAX_PAGES
        }&page=1`
      );
      if (!res.ok) throw new Error(`Falha ao buscar (${res.status})`);
      const raw: unknown = await res.json();
      const data = toApiResponse(raw);
      setResults(data.items ?? []);
      setPage(nextPage);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  function applyTag(tag: string) {
    setQ(tag);
    pushUrl(tag, 1);
    void runSearch(tag, 1);
  }

  const headerSubtitle = useMemo(
    () =>
      "Busque receitas em sites confiáveis. Mostramos o título, a foto e o link do site original.",
    []
  );

  const hasResults = results.length > 0;

  // Paginação (client-side)
  const totalPages = Math.min(
    MAX_PAGES,
    Math.max(1, Math.ceil(results.length / PER_PAGE))
  );

  const currentPage = Math.min(page, totalPages);
  const start = (currentPage - 1) * PER_PAGE;
  const end = start + PER_PAGE;
  const pageItems = results.slice(start, end);

  // Navegação do carrossel
  function goTo(newPage: number) {
    const normalized = Math.max(1, Math.min(totalPages, newPage));
    pushUrl(q.trim(), normalized);
  }

  function onPrev() {
    goTo(currentPage - 1);
  }

  function onNext() {
    goTo(currentPage + 1);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-rose-50">
      {/* HERO */}
      <header className="relative overflow-hidden border-b border-amber-100/70 bg-white/60 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-10 sm:py-14">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            feito com amor pela cozinha
          </div>

          <h1 className="flex items-center gap-2 text-balance text-3xl font-extrabold tracking-tight text-stone-800 sm:text-4xl">
            <span className="mr-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-1">
              <Link href="/">
                <Image
                  src="/logo.png"
                  alt="Logo do Brasil Receitas"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                  priority
                />
              </Link>
            </span>
            Brasil Receitas
          </h1>

          <p className="max-w-2xl text-pretty text-sm text-stone-600 sm:text-base">
            {headerSubtitle}
          </p>

          {/* Search Bar */}
          <form onSubmit={onSubmit} className="mt-2 flex w-full gap-2">
            <div className="flex w-full items-center gap-2 rounded-2xl border border-stone-200 bg-white pl-4 pr-2 shadow-sm ring-1 ring-transparent focus-within:border-amber-300 focus-within:ring-amber-200">
              <SearchIcon className="h-5 w-5 shrink-0 text-stone-400" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Ex.: risoto de cogumelos, brownie fácil, frango ao curry"
                aria-label="Buscar receitas"
                className="h-12 w-full rounded-2xl bg-transparent pr-2 text-stone-800 placeholder:text-stone-400 focus:outline-none"
              />
              <button
                type="submit"
                disabled={loading}
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:brightness-105 disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Spinner className="h-4 w-4" />
                    Buscando…
                  </>
                ) : (
                  <>
                    <SparkleIcon className="h-4 w-4" />
                    Buscar
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Tag chips */}
          <div className="mt-3 flex flex-wrap gap-2">
            {SUGGESTED_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => applyTag(tag)}
                disabled={loading}
                className="group inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700 transition hover:border-amber-300 hover:bg-amber-100 disabled:opacity-60"
                type="button"
              >
                <TagIcon className="h-3.5 w-3.5 text-amber-500 transition group-hover:scale-110" />
                {tag}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* RESULTS */}
      <section className="mx-auto max-w-4xl px-4 py-8 sm:py-10">
        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
            {error}
          </div>
        )}

        {loading && <CarouselSkeleton />}

        {!loading && !hasResults && !error && (
          <EmptyState onExampleClick={(t) => applyTag(t)} />
        )}

        {!loading && hasResults && (
          <div className="relative">
            {/* Controles */}
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm text-stone-600">
                Página <strong>{currentPage}</strong> de{" "}
                <strong>{totalPages}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={onPrev}
                  disabled={currentPage <= 1}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 shadow-sm disabled:opacity-50"
                  type="button"
                  aria-label="Página anterior"
                >
                  ←
                </button>
                <button
                  onClick={onNext}
                  disabled={currentPage >= totalPages}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 shadow-sm disabled:opacity-50"
                  type="button"
                  aria-label="Próxima página"
                >
                  →
                </button>
              </div>
            </div>

            {/* Carrossel (apenas renderiza a página atual para simplicidade e performance) */}
            <ul
              className="grid gap-4 sm:grid-cols-2"
              aria-live="polite"
              aria-busy={loading ? "true" : "false"}
            >
              {pageItems.map((r, idx) => (
                <ResultCard key={`${r.link}-${start + idx}`} res={r} />
              ))}
            </ul>

            {/* Dots */}
            <div className="mt-5 flex items-center justify-center gap-2">
              {Array.from({ length: totalPages }).map((_, i) => {
                const p = i + 1;
                const active = p === currentPage;
                return (
                  <button
                    key={p}
                    onClick={() => goTo(p)}
                    aria-label={`Ir para página ${p}`}
                    className={`h-2.5 w-2.5 rounded-full transition ${
                      active
                        ? "bg-amber-500"
                        : "bg-stone-300 hover:bg-stone-400"
                    }`}
                    type="button"
                  />
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* FOOTER */}
      <footer className="border-t border-amber-100/70 bg-white/60 py-6 text-center text-xs text-stone-500">
        Conteúdo pertence aos sites de origem. Nós apenas redirecionamos você
        para a receita original. Bon appétit! 🥐
        <p>
          <a
            href="https://www.lucianortolan.com"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Desenvolvido por Lucian Ortolan
          </a>
        </p>
      </footer>
    </main>
  );
}

/* =========================
   Componentes
========================= */

function ResultCard({ res }: { res: Result }) {
  const favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
    res.displayLink
  )}&sz=32`;

  return (
    <li className="group relative flex gap-4 overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-stone-100">
        {res.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={res.image}
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-2xl">
            🍽️
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <a
          href={res.link}
          target="_blank"
          rel="noopener noreferrer"
          className="line-clamp-2 text-lg font-semibold text-stone-800 decoration-amber-400 hover:underline"
          title={res.title}
        >
          {res.title}
        </a>

        <div className="mt-2 flex items-center gap-2 text-xs text-stone-500">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={favicon}
            alt=""
            className="h-4 w-4 rounded"
            width={16}
            height={16}
          />
          <span>{res.displayLink}</span>
        </div>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-amber-200/0 via-amber-200/70 to-rose-200/0 opacity-0 transition group-hover:opacity-100" />
      </div>
    </li>
  );
}

function EmptyState({
  onExampleClick,
}: {
  onExampleClick: (example: string) => void;
}) {
  const examples: string[] = [
    "torta de frango cremosa",
    "pão de queijo",
    "mousse de maracujá",
  ];

  return (
    <div className="mx-auto max-w-2xl rounded-2xl border border-dashed border-amber-200 bg-white/60 p-8 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
        🧑‍🍳
      </div>
      <h2 className="text-lg font-semibold text-stone-800">
        Comece buscando um prato
      </h2>
      <p className="mt-1 text-sm text-stone-600">
        Experimente uma das sugestões abaixo ou digite sua própria busca.
      </p>
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {examples.map((ex) => (
          <button
            key={ex}
            onClick={() => onExampleClick(ex)}
            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs text-stone-700 shadow-sm transition hover:border-amber-300 hover:bg-amber-50"
            type="button"
          >
            <SparkleIcon className="h-3.5 w-3.5 text-amber-500" />
            {ex}
          </button>
        ))}
      </div>
    </div>
  );
}

function CarouselSkeleton() {
  return (
    <>
      <div className="mb-3 flex items-center justify-between">
        <div className="h-4 w-40 animate-pulse rounded bg-stone-200" />
        <div className="flex gap-2">
          <div className="h-8 w-10 animate-pulse rounded bg-stone-200" />
          <div className="h-8 w-10 animate-pulse rounded bg-stone-200" />
        </div>
      </div>
      <ul className="grid gap-4 sm:grid-cols-2">
        {Array.from({ length: PER_PAGE }).map((_, i) => (
          <li
            key={i}
            className="flex gap-4 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm"
          >
            <div className="h-20 w-24 animate-pulse rounded-xl bg-stone-200" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-5/6 animate-pulse rounded bg-stone-200" />
              <div className="h-3 w-2/5 animate-pulse rounded bg-stone-200" />
              <div className="mt-1 h-3 w-3/4 animate-pulse rounded bg-stone-100" />
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-5 flex items-center justify-center gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-2.5 w-2.5 rounded-full bg-stone-200" />
        ))}
      </div>
    </>
  );
}

/* =========================
   Utilitários de tipos
========================= */
function toApiResponse(val: unknown): ApiResponse {
  if (
    typeof val === "object" &&
    val !== null &&
    Array.isArray((val as { items?: unknown[] }).items)
  ) {
    const rawItems = (val as { items: unknown[] }).items;
    const items: Result[] = rawItems
      .filter(
        (it): it is Result =>
          typeof (it as Result).title === "string" &&
          typeof (it as Result).link === "string" &&
          typeof (it as Result).displayLink === "string" &&
          (typeof (it as Result).image === "string" ||
            typeof (it as { image?: unknown }).image === "undefined")
      )
      .map((it) => ({
        title: (it as Result).title,
        link: (it as Result).link,
        displayLink: (it as Result).displayLink,
        image:
          typeof (it as Result).image === "string"
            ? (it as Result).image
            : undefined,
      }));

    return { items };
  }
  return { items: [] };
}

/* =========================
   Ícones (SVG puros)
========================= */
function SearchIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={props.className}
    >
      <path
        d="M21 21l-4.2-4.2M17 10.5A6.5 6.5 0 1 1 4 10.5a6.5 6.5 0 0 1 13 0Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SparkleIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={props.className}
    >
      <path
        d="M12 3l1.8 3.8L18 8.6l-3.2 2.9.9 4.2L12 13.8 8.3 15.7l.9-4.2L6 8.6l4.2-1.8L12 3Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TagIcon(props: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={props.className}
    >
      <path
        d="M20.5 13.5l-7 7a2 2 0 0 1-2.8 0l-7-7A2 2 0 0 1 3 12V6a2 2 0 0 1 2-2h6a2 2 0 0 1 1.4.6l8.1 8.1a2 2 0 0 1 0 2.8Z"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <circle cx="8" cy="8" r="1.2" fill="currentColor" />
    </svg>
  );
}

function Spinner(props: { className?: string }) {
  return (
    <svg
      className={props.className}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="currentColor"
        strokeOpacity="0.2"
        strokeWidth="3"
      />
      <path
        d="M21.5 12a9.5 9.5 0 0 0-9.5-9.5"
        stroke="currentColor"
        strokeWidth="3"
      />
    </svg>
  );
}
