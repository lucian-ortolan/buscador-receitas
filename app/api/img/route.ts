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

    if (source.protocol !== "https:") {
      return NextResponse.json(
        { error: "Only https allowed" },
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
      headers: { "User-Agent": "BrasilReceitasBot/1.0 (+img-proxy)" },
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

    const arrayBuf = await upstream.arrayBuffer();

    const webp = await sharp(Buffer.from(arrayBuf))
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: qualityParam })
      .toBuffer();

    const ab = webp.buffer.slice(
      webp.byteOffset,
      webp.byteOffset + webp.byteLength
    );

    const res = new NextResponse(ab, {
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
