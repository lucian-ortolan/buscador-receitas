// app/buscar/search-client.tsx
"use client";

import { useEffect, useMemo, useState, useRef, startTransition } from "react";
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
  const abortRef = useRef<AbortController | null>(null);

  // Página atual (URL: ?p=)
  const urlPage = Math.max(1, Number(searchParams.get("p") ?? "1"));
  const [page, setPage] = useState<number>(urlPage);
  const [lastPageCount, setLastPageCount] = useState<number>(0);

  // Sincroniza com a URL (compartilhável)
  useEffect(() => {
    const current = (searchParams.get("q") ?? "").trim();
    const p = Math.max(1, Number(searchParams.get("p") ?? "1"));

    if (current && (current !== q || p !== page)) {
      setQ(current);
      startTransition(() => {
        void runSearch(current, p);
      });
    } else if (!current) {
      setResults([]);
      setLastPageCount(0);
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
    startTransition(() => {
      void runSearch(query, 1);
    });
  }

  function pushUrl(query: string, nextPage: number) {
    const url = `/buscar?q=${encodeURIComponent(query)}&p=${nextPage}`;
    router.replace(url);
    setPage(nextPage);
  }

  async function runSearch(query: string, nextPage = 1) {
    // cancela requisição anterior se houver
    if (abortRef.current) {
      abortRef.current.abort();
    }
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);
    setResults([]);
    try {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(
          query
        )}&perPage=${PER_PAGE}&page=${nextPage}`,
        { signal: controller.signal, keepalive: true, cache: "no-store" }
      );
      if (!res.ok) throw new Error(`Falha ao buscar (${res.status})`);
      const raw: unknown = await res.json();
      // se foi abortado, não atualiza estado
      if (controller.signal.aborted) return;
      const data = toApiResponse(raw);
      setResults(data.items ?? []);
      setLastPageCount((data.items ?? []).length);
      setPage(nextPage);
    } catch (err: unknown) {
      if (isAbortError(err)) return;
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      if (!controller.signal.aborted) setLoading(false);
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

  // Paginação (server-side por página)
  const currentPage = page;
  const canPrev = currentPage > 1;
  const canNext = currentPage < MAX_PAGES && lastPageCount === PER_PAGE;

  // Navegação
  function goTo(newPage: number) {
    const normalized = Math.max(1, Math.min(MAX_PAGES, newPage));
    const trimmed = q.trim();
    pushUrl(trimmed, normalized);
    startTransition(() => {
      void runSearch(trimmed, normalized);
    });
  }

  function onPrev() {
    if (canPrev) goTo(currentPage - 1);
  }

  function onNext() {
    if (canNext) goTo(currentPage + 1);
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-rose-50">
      {/* HERO */}
      <header className="relative overflow-hidden border-b border-amber-100/70 bg-white/60 md:backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-10 sm:py-14">
          <div className="inline-flex items-center gap-2 self-start rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-500" />
            feito com amor pela cozinha
          </div>

          <h1 className="flex items-center gap-2 text-balance text-3xl font-extrabold tracking-tight text-stone-800 sm:text-4xl">
            <span className="mr-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500 via-orange-500 to-rose-500 p-1">
              <Link href="/" prefetch={false}>
                <Image
                  src="/logo.png"
                  alt="Logo do Brasil Receitas"
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
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
                Página <strong>{currentPage}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  onClick={onPrev}
                  disabled={!canPrev}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 shadow-sm disabled:opacity-50 cursor-pointer"
                  type="button"
                  aria-label="Página anterior"
                >
                  ←
                </button>
                <button
                  onClick={onNext}
                  disabled={!canNext}
                  className="rounded-lg border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-700 shadow-sm disabled:opacity-50 cursor-pointer"
                  type="button"
                  aria-label="Próxima página"
                >
                  →
                </button>
              </div>
            </div>

            {/* Lista da página atual */}
            <ul
              className="grid gap-4 sm:grid-cols-2"
              aria-live="polite"
              aria-busy={loading ? "true" : "false"}
            >
              {results.map((r, idx) => (
                <ResultCard key={`${r.link}-${idx}`} res={r} />
              ))}
            </ul>
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
  const proxied = res.image
    ? `/api/img?url=${encodeURIComponent(res.image)}&w=240&q=60`
    : null;

  const [imgSrc, setImgSrc] = useState<string | null>(
    proxied || res.image || null
  );

  return (
    <li className="group relative flex gap-4 overflow-hidden rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition hover:shadow-md">
      <div className="relative h-20 w-24 shrink-0 overflow-hidden rounded-xl bg-stone-100">
        {imgSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imgSrc}
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-[1.02]"
            loading="lazy"
            decoding="async"
            fetchPriority="low"
            referrerPolicy="no-referrer"
            sizes="(max-width: 640px) 100vw, 50vw"
            onError={() => {
              if (imgSrc !== res.image && res.image) {
                setImgSrc(res.image);
              } else {
                setImgSrc(null);
              }
            }}
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
            loading="lazy"
            decoding="async"
            fetchPriority="low"
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

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "AbortError"
  );
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
