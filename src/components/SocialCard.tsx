import { CATEGORIES, TOOLS } from "@/data/tools";

const COLORS = {
  cream: "#f7f0e6",
  card: "#fffdfa",
  espresso: "#2a201a",
  muted: "#6f6255",
  terracotta: "#b4522e",
  terracottaLight: "#d98a67",
  border: "#e6dccc",
};

export default function SocialCard() {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        background: COLORS.cream,
        color: COLORS.espresso,
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          opacity: 0.52,
          backgroundImage:
            "linear-gradient(#e6dccc 1px, transparent 1px), linear-gradient(90deg, #e6dccc 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "-180px",
          right: "-90px",
          display: "flex",
          width: "570px",
          height: "570px",
          borderRadius: "999px",
          background:
            "radial-gradient(circle, rgba(217,138,103,.78) 0%, rgba(180,82,46,.24) 48%, rgba(180,82,46,0) 72%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          right: "58px",
          bottom: "48px",
          display: "flex",
          width: "300px",
          height: "300px",
          border: `2px solid ${COLORS.terracotta}`,
          borderRadius: "999px",
          opacity: 0.18,
        }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          margin: "42px",
          padding: "56px 62px",
          border: `2px solid ${COLORS.border}`,
          borderRadius: "34px",
          background: "rgba(255,253,250,.9)",
          boxShadow: "0 28px 80px rgba(42,32,26,.12)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "82px",
                height: "82px",
                borderRadius: "24px",
                background: `linear-gradient(145deg, ${COLORS.terracottaLight}, ${COLORS.terracotta})`,
                boxShadow: "0 14px 30px rgba(180,82,46,.25)",
              }}
            >
              <svg
                width="52"
                height="52"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#fdf3ea"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
              </svg>
            </div>
            <div
              style={{
                display: "flex",
                fontSize: "30px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
              }}
            >
              Tools by Soumendra
            </div>
          </div>
          <div
            style={{
              display: "flex",
              padding: "12px 20px",
              border: `1px solid ${COLORS.border}`,
              borderRadius: "999px",
              background: COLORS.cream,
              color: COLORS.muted,
              fontSize: "20px",
              fontWeight: 600,
            }}
          >
            Free · open source · no sign-up
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              display: "flex",
              maxWidth: "850px",
              fontSize: "76px",
              fontWeight: 800,
              lineHeight: 1.02,
              letterSpacing: "-0.055em",
            }}
          >
            Tiny tools that just work.
          </div>
          <div
            style={{
              display: "flex",
              maxWidth: "820px",
              marginTop: "24px",
              color: COLORS.muted,
              fontSize: "28px",
              lineHeight: 1.35,
            }}
          >
            Focused browser utilities for building, measuring, creating, and
            getting on with your day.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: COLORS.muted,
            fontSize: "21px",
          }}
        >
          <div style={{ display: "flex" }}>tools.soumendrak.com</div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              color: COLORS.terracotta,
              fontWeight: 700,
            }}
          >
            <span style={{ display: "flex" }}>{TOOLS.length} tools</span>
            <span style={{ display: "flex", opacity: 0.5 }}>•</span>
            <span style={{ display: "flex" }}>
              {CATEGORIES.length} categories
            </span>
            <span style={{ display: "flex", opacity: 0.5 }}>•</span>
            <span style={{ display: "flex" }}>0 accounts</span>
          </div>
        </div>
      </div>
    </div>
  );
}
