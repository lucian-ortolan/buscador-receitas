// app/layout.tsx
import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { Analytics } from "@vercel/analytics/next";

const siteUrl = new URL("https://brasilreceitas.com.br");

// ... (toda a sua configuração de metadata continua igual aqui)
export const metadata: Metadata = {
  metadataBase: siteUrl,
  title: {
    default: "Brasil Receitas - Buscador de receitas",
    template: "%s | Brasil Receitas",
  },
  // ... resto do metadata
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const isProd = process.env.NODE_ENV === "production";

  return (
    <html lang="pt-BR">
      <head>
        {/* O <head> agora fica mais limpo, focando em meta tags e links.
            Os scripts de carregamento tardio foram movidos para o final do <body>
            para uma melhor performance de carregamento da página. */}
      </head>

      <body>
        {children}
        <SpeedInsights />
        <Analytics />

        {/* --- ÁREA DE SCRIPTS --- */}

        {/* JSON-LD: WebSite + SearchAction */}
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
              target: `${siteUrl.toString()}buscar?q={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          })}
        </Script>

        {/* Scripts do Google (somente em produção) */}
        {isProd && (
          <>
            {/* Script de inicialização do AdSense */}
            <Script
              id="adsense-init"
              async
              strategy="afterInteractive"
              src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-8277247376209096"
              crossOrigin="anonymous"
            />

            {/* Scripts do Google Ads (gtag.js) - ADICIONADO AQUI */}
            <Script
              id="google-ads-library"
              strategy="afterInteractive"
              src="https://www.googletagmanager.com/gtag/js?id=AW-17528868804"
            />
            <Script id="google-ads-config" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', 'AW-17528868804');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
