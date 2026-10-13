import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Hallowing, horror and prank videos";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpenGraphImage() {
  const logo = await readFile(join(process.cwd(), "public/logo.png"));
  const src = `data:image/png;base64,${logo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          background: "#080808",
          color: "#f3f3f3",
          padding: "72px",
        }}
      >
        <img src={src} alt="Hallowing" width={180} height={180} style={{ borderRadius: 36 }} />
        <div style={{ display: "flex", flexDirection: "column", marginLeft: 48 }}>
          <div style={{ fontSize: 84, lineHeight: 1 }}>Hallowing</div>
          <div style={{ marginTop: 18, fontSize: 34, color: "#e8783a" }}>Horror and prank videos. Gift your favorites.</div>
        </div>
      </div>
    ),
    size,
  );
}
