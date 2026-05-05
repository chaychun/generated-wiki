export async function loadGoogleFont(
  family: string,
  weight: number,
  text?: string,
): Promise<ArrayBuffer> {
  const url = new URL("https://fonts.googleapis.com/css2");
  url.searchParams.set("family", `${family}:wght@${weight}`);
  if (text) url.searchParams.set("text", text);
  const cssRes = await fetch(url.toString(), {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  if (!cssRes.ok) throw new Error(`font css fetch failed: ${cssRes.status}`);
  const css = await cssRes.text();
  const match = css.match(/src:\s*url\((https:\/\/[^)]+)\)/);
  if (!match) throw new Error(`font url not found for ${family}@${weight}`);
  const fontRes = await fetch(match[1]);
  if (!fontRes.ok) throw new Error(`font fetch failed: ${fontRes.status}`);
  return await fontRes.arrayBuffer();
}
