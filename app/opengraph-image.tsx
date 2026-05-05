import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og";

export const alt =
  "generated.wiki — Wikipedia, but every article is generated on demand";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const [serifBold, serifRegular] = await Promise.all([
    loadGoogleFont("Lora", 700),
    loadGoogleFont("Lora", 400),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          height: "100%",
          background: "#fafaf7",
          padding: 80,
          justifyContent: "space-between",
          fontFamily: "Lora",
        }}
      >
        <div
          style={{
            display: "flex",
            height: 1,
            background: "#a2a9b1",
            width: "100%",
          }}
        />

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 128,
              fontWeight: 700,
              color: "#202122",
              lineHeight: 1,
              letterSpacing: -2,
            }}
          >
            generated.wiki
          </div>
          <div
            style={{
              marginTop: 28,
              fontSize: 40,
              color: "#4a5260",
              lineHeight: 1.3,
              maxWidth: 980,
              fontWeight: 400,
            }}
          >
            Wikipedia, but every article is generated on demand by an LLM —
            adapted to how you read.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            fontSize: 24,
            color: "#5a6070",
          }}
        >
          <div style={{ display: "flex" }}>
            github.com/chaychun/generated-wiki
          </div>
          <div
            style={{
              display: "flex",
              fontWeight: 700,
              color: "#202122",
              fontSize: 56,
              lineHeight: 1,
            }}
          >
            G
          </div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Lora", data: serifRegular, weight: 400, style: "normal" },
        { name: "Lora", data: serifBold, weight: 700, style: "normal" },
      ],
    },
  );
}
