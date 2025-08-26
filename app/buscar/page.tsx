// app/buscar/page.tsx
import type { Metadata } from "next";
import SearchClient from "./search-client";

type Props = {
  searchParams: { q?: string };
};

export async function generateMetadata({
  searchParams,
}: Props): Promise<Metadata> {
  const q = (searchParams.q ?? "").trim();

  if (!q) {
    return {
      title: "Buscar receitas",
      description:
        "Busque receitas em sites confiáveis. Mostramos o título, a foto e o link do site original.",
      alternates: { canonical: "/buscar" },
    };
  }

  const readable = q.length > 60 ? `${q.slice(0, 60)}…` : q;

  return {
    title: `Resultados para "${readable}"`,
    description: `Resultados de receitas para "${readable}" em sites confiáveis.`,
    alternates: { canonical: `/buscar?q=${encodeURIComponent(q)}` },
    openGraph: {
      title: `Resultados para "${readable}"`,
      description: `Resultados de receitas para "${readable}" em sites confiáveis.`,
      url: `/buscar?q=${encodeURIComponent(q)}`,
    },
    twitter: {
      title: `Resultados para "${readable}"`,
      description: `Resultados de receitas para "${readable}" em sites confiáveis.`,
    },
  };
}

export default function BuscarPage({ searchParams }: Props) {
  const q = (searchParams.q ?? "").trim();
  return <SearchClient initialQuery={q} />;
}
