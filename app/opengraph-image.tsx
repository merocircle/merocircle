import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MeroCircle - Support Creators in Nepal";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(145deg, #ffffff 0%, #faf5f5 50%, #f5eaea 100%)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Decorative circles */}
        <div
          style={{
            position: "absolute",
            top: -120,
            right: -120,
            width: 400,
            height: 400,
            borderRadius: "50%",
            border: "1px solid rgba(153, 0, 0, 0.06)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: -80,
            left: -80,
            width: 300,
            height: 300,
            borderRadius: "50%",
            border: "1px solid rgba(153, 0, 0, 0.06)",
            display: "flex",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 200,
            left: 100,
            width: 200,
            height: 200,
            borderRadius: "50%",
            border: "1px solid rgba(153, 0, 0, 0.04)",
            display: "flex",
          }}
        />

        {/* Logo icon */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: "20px",
            background: "#990000",
            marginBottom: 32,
            fontSize: 40,
            color: "#fff",
            fontWeight: 800,
          }}
        >
          M
        </div>

        {/* Title */}
        <div
          style={{
            display: "flex",
            fontSize: 56,
            fontWeight: 800,
            color: "#0f0f0f",
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            marginBottom: 16,
          }}
        >
          MeroCircle
        </div>

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontSize: 24,
            color: "#6b7280",
            fontWeight: 400,
            maxWidth: 600,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          Support the creators who inspire you.
        </div>

        {/* Bottom accent line */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 6,
            background: "linear-gradient(90deg, #990000, #cc3333, #990000)",
            display: "flex",
          }}
        />

        {/* URL */}
        <div
          style={{
            position: "absolute",
            bottom: 28,
            display: "flex",
            fontSize: 16,
            color: "#990000",
            fontWeight: 600,
            letterSpacing: "0.02em",
          }}
        >
          merocircle.app
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
