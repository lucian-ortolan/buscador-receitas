// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const siteUrl = new URL("https://brasilreceitas.com.br");

export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Brasil Receitas – Buscador de receitas",
    template: "%s | Brasil Receitas",
  },
  description:
    "Busque receitas em sites confiáveis. Mostramos o título, imagem e link da receita no site original.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: siteUrl.toString(),
    siteName: "Brasil Receitas",
    title: "Brasil Receitas – Buscador de receitas",
    description:
      "Busque receitas em sites confiáveis. Nós só redirecionamos para o site original.",
    images: [
      {
        url: "/og-cover.png", // opcional: coloque uma imagem em public/og-cover.png (1200x630)
        width: 1200,
        height: 630,
        alt: "Brasil Receitas",
      },
    ],
    locale: "pt_BR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Brasil Receitas – Buscador de receitas",
    description:
      "Busque receitas em sites confiáveis. Nós só redirecionamos para o site original.",
    images: ["/og-cover.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>

      {/* JSON-LD: WebSite + SearchAction (ajuda o Google a entender sua busca interna) */}
      <Script
        id="ld-json-website"
        type="application/ld+json"
        strategy="afterInteractive"
      >
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          url: siteUrl.toString(),
          name: "Brasil Receitas",
          potentialAction: {
            "@type": "SearchAction",
            target: `${siteUrl.toString()}?q={search_term_string}`,
            "query-input": "required name=search_term_string",
          },
        })}
      </Script>
    </html>
  );
}
