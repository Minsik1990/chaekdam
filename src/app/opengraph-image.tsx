import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "독독 — 독서를 두드리다";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#00704A",
        gap: "24px",
      }}
    >
      {/* 로고 영역 — 책 아이콘 + 독독 텍스트 */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
        }}
      >
        {/* 책 아이콘 (SVG 인라인) */}
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none">
          <path
            d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2V3zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7V3z"
            fill="white"
            stroke="white"
            strokeWidth="1.5"
          />
        </svg>
        <span
          style={{
            fontSize: "96px",
            fontWeight: 800,
            color: "white",
            letterSpacing: "-2px",
          }}
        >
          독독
        </span>
      </div>
      {/* 서브 텍스트 */}
      <span
        style={{
          fontSize: "32px",
          fontWeight: 500,
          color: "rgba(255, 255, 255, 0.85)",
        }}
      >
        읽고, 느끼고, 기록하다
      </span>
      {/* 설명 */}
      <span
        style={{
          fontSize: "22px",
          fontWeight: 400,
          color: "rgba(255, 255, 255, 0.6)",
          marginTop: "8px",
        }}
      >
        독서 모임 전용 기록 웹앱
      </span>
    </div>,
    { ...size }
  );
}
