import { ImageResponse } from "next/og";
import { loadGoogleFont } from "@/lib/og";

export const size = { width: 64, height: 64 };
export const contentType = "image/png";

export default async function Icon() {
  const fontData = await loadGoogleFont("Lora", 700, "G");
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
          background: "#fafaf7",
          color: "#202122",
          fontSize: 52,
          fontFamily: "Lora",
          fontWeight: 700,
          lineHeight: 1,
        }}
      >
        G
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Lora", data: fontData, weight: 700, style: "normal" },
      ],
    },
  );
}
