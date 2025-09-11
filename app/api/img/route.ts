import { NextResponse } from "next/server";
import sharp from "sharp";

export const runtime = "nodejs";

// Limites seguros
const MAX_WIDTH = 800; // proteção básica
const DEFAULT_WIDTH = 240; // ideal para os cards (~120px CSS @2x)
const DEFAULT_QUALITY = 60;

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const urlParam = searchParams.get("url");
    if (!urlParam) {
      return NextResponse.json({ error: "Missing url" }, { status: 400 });
    }

    let source: URL;
    try {
      source = new URL(urlParam);
    } catch {
      return NextResponse.json({ error: "Invalid url" }, { status: 400 });
    }

    if (source.protocol !== "https:" && source.protocol !== "http:") {
      return NextResponse.json(
        { error: "Only http/https allowed" },
        { status: 400 }
      );
    }

    const widthParam = Math.max(
      1,
      Number(searchParams.get("w") ?? DEFAULT_WIDTH)
    );
    const qualityParam = Math.max(
      1,
      Math.min(100, Number(searchParams.get("q") ?? DEFAULT_QUALITY))
    );

    const width = Math.min(widthParam, MAX_WIDTH);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const upstream = await fetch(source.toString(), {
      signal: controller.signal,
      headers: {
        "User-Agent": "BrasilReceitasBot/1.0 (+img-proxy)",
        Accept: "image/avif,image/webp,image/*;q=0.8,*/*;q=0.5",
        Referer: source.origin,
      },
    }).catch((err: unknown) => {
      if (isAbortError(err)) {
        throw new Error("Upstream timeout");
      }
      throw err;
    });

    clearTimeout(timeout);

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream error ${upstream.status}` },
        { status: 502 }
      );
    }

    const ctype = upstream.headers.get("content-type") || "";
    if (!ctype.includes("image")) {
      return NextResponse.json(
        { error: "Upstream returned non-image content-type" },
        { status: 502 }
      );
    }

    const arrayBuf = await upstream.arrayBuffer();

    const webp = await sharp(Buffer.from(arrayBuf))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: qualityParam })
      .toBuffer();

    const u8 = new Uint8Array(webp);
    const blob = new Blob([u8], { type: "image/webp" });

    const res = new NextResponse(blob, {
      status: 200,
      headers: {
        "Content-Type": "image/webp",
        // Cache curto no navegador e CDN (ajuste conforme estratégia)
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    });

    return res;
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unexpected error" },
      { status: 500 }
    );
  }
}

function isAbortError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: unknown }).name === "AbortError"
  );
}
