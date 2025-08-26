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

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim();

  if (!q) return NextResponse.json({ items: [] as Result[] });

  const key = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CSE_ID;

  if (!key || !cx) {
    return NextResponse.json(
      { error: "Credenciais ausentes." },
      { status: 500 }
    );
  }

  const apiUrl = new URL("https://www.googleapis.com/customsearch/v1");
  apiUrl.searchParams.set("key", key);
  apiUrl.searchParams.set("cx", cx);
  apiUrl.searchParams.set("q", q);
  apiUrl.searchParams.set("num", "10");
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

  const items: Result[] = (data.items ?? [])
    .filter(
      (
        it
      ): it is Required<Pick<GoogleItem, "title" | "link" | "displayLink">> &
        GoogleItem =>
        typeof it.title === "string" &&
        typeof it.link === "string" &&
        typeof it.displayLink === "string"
    )
    .map((it) => {
      const image =
        it.pagemap?.cse_image?.[0]?.src ??
        it.pagemap?.thumbnail?.[0]?.src ??
        undefined;

      return {
        title: it.title,
        link: it.link,
        displayLink: it.displayLink,
        image,
      };
    });

  return NextResponse.json({ items });
}
