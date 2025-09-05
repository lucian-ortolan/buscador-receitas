// app/api/search/route.ts
import { NextResponse } from "next/server";

type GoogleImage = { src?: string };
type GoogleItem = {
  title?: string;
  link?: string;
  displayLink?: string;
  pagemap?: {
    cse_image?: GoogleImage[];
    thumbnail?: GoogleImage[];
  };
};
type GoogleResponse = {
  items?: GoogleItem[];
};

type Result = {
  title: string;
  link: string;
  displayLink: string;
  image?: string;
};

const GOOGLE_ENDPOINT = "https://www.googleapis.com/customsearch/v1";
const GOOGLE_MAX_NUM = 10; // limite do Google por request
const MAX_PER_PAGE = 50; // 5 páginas * 10
const MAX_TOTAL_RESULTS = 100; // limite geral do Google CSE

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();

  // paginação opcional (para uso futuro; o SearchClient atual sempre envia page=1)
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const perPageRaw = Math.max(
    1,
    Number(url.searchParams.get("perPage") ?? "10")
  );
  const perPage = Math.min(MAX_PER_PAGE, perPageRaw); // cap em 50

  if (!q) return NextResponse.json({ items: [] as Result[] });

  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;
  if (!key || !cx) {
    return NextResponse.json(
      { error: "Credenciais ausentes." },
      { status: 500 }
    );
  }

  // Índice inicial global (Google é 1-based). Se passar de 100, não há resultados.
  // Ex.: page=2, perPage=50 -> startGlobal = 51
  let startGlobal = (page - 1) * perPage + 1;
  if (startGlobal > MAX_TOTAL_RESULTS) {
    return NextResponse.json({ items: [] as Result[] });
  }

  const results: GoogleItem[] = [];
  let remaining = Math.min(perPage, MAX_TOTAL_RESULTS - (startGlobal - 1));

  // Fazemos múltiplas chamadas de no máx. 10 resultados cada
  while (remaining > 0 && startGlobal <= MAX_TOTAL_RESULTS) {
    const take = Math.min(
      GOOGLE_MAX_NUM,
      remaining,
      MAX_TOTAL_RESULTS - (startGlobal - 1)
    );

    const apiUrl = new URL(GOOGLE_ENDPOINT);
    apiUrl.searchParams.set("key", key);
    apiUrl.searchParams.set("cx", cx);
    apiUrl.searchParams.set("q", q);
    apiUrl.searchParams.set("num", String(take));
    apiUrl.searchParams.set("start", String(startGlobal));
    apiUrl.searchParams.set("safe", "active");
    apiUrl.searchParams.set("gl", "br");
    apiUrl.searchParams.set("hl", "pt-BR");

    const resp = await fetch(apiUrl.toString());
    if (!resp.ok) {
      return NextResponse.json(
        { error: `Falha na busca. Status ${resp.status}` },
        { status: 500 }
      );
    }

    const data = (await resp.json()) as GoogleResponse;
    const batch = data.items ?? [];

    // Se o Google não retornar nada neste start, interrompe (evita loop)
    if (batch.length === 0) break;

    results.push(...batch);

    startGlobal += take;
    remaining -= take;
  }

  // Mapeia e remove duplicatas por link (por garantia)
  const seen = new Set<string>();
  const items: Result[] = [];
  for (const it of results) {
    if (
      typeof it.title === "string" &&
      typeof it.link === "string" &&
      typeof it.displayLink === "string" &&
      !seen.has(it.link)
    ) {
      seen.add(it.link);
      const image =
        it.pagemap?.cse_image?.[0]?.src ??
        it.pagemap?.thumbnail?.[0]?.src ??
        undefined;

      items.push({
        title: it.title,
        link: it.link,
        displayLink: it.displayLink,
        image,
      });
    }
  }

  return NextResponse.json({ items });
}
