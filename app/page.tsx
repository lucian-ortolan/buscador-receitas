// app/page.tsx
"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  const router = useRouter();
  const [q, setQ] = useState("");

  const headerSubtitle = useMemo(
    () =>
      "Busque receitas em sites confiáveis. Mostramos o título, a foto e o link do site original.",
    []
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const query = q.trim();
    if (!query) return;
    // usa replace para evitar histórico extra e reduzir custo de navegação repetida
    router.replace(`/buscar?q=${encodeURIComponent(query)}`);
  }

  const tags: string[] = [
    "bolo de cenoura",
    "lasanha vegana",
    "frango na airfryer",
    "sem glúten",
    "low carb",
    "sobremesa rápida",
    "macarrão de panela",
  ];

  return (
    <main className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-rose-50">
      <header className="relative overflow-hidden border-b border-amber-100/70 bg-white/60 backdrop-blur">
        <div className="mx-auto flex max-w-4xl flex-col gap-4 px-4 py-14">
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
                className="inline-flex h-10 items-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-rose-500 px-4 text-sm font-semibold text-white shadow-sm transition hover:brightness-105"
              >
                Buscar
              </button>
            </div>
          </form>

          <div className="mt-3 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() =>
                  router.push(`/buscar?q=${encodeURIComponent(tag)}`)
                }
                className="group inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs text-amber-700 transition hover:border-amber-300 hover:bg-amber-100"
                type="button"
              >
                <TagIcon className="h-3.5 w-3.5 text-amber-500 transition group-hover:scale-110" />
                {tag}
              </button>
            ))}
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-4xl px-4 py-10 text-center text-stone-600">
        <p>
          Digite o que você quer cozinhar e aperte <strong>Buscar</strong>.
          Vamos te levar diretamente às melhores receitas nos sites originais.
          🍝
        </p>
      </section>

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
