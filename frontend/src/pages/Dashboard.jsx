import { useState } from "react";

const alerts = [
  {
    id: 1,
    tier: "URGENT",
    source: "btn",
    sourceNote: "bg noise",
    keyword: "nevermind",
    languages: ["Cantonese", "Teochew"],
    location: "Blk 451 Tampines",
    pitch: 3,
    time: "5s ago",
    status: "unresolved",
  },
  {
    id: 2,
    tier: "URGENT",
    source: "btn",
    sourceNote: "multi-click",
    keyword: "faulty",
    languages: ["Tamil", "Mandarin"],
    location: "Blk 841 #6-10, Clementi",
    pitch: 5,
    time: "12s ago",
    status: "unresolved",
  },
  {
    id: 3,
    tier: "MED",
    source: "audio",
    sourceNote: "silence",
    keyword: "呼叫无应",
    languages: ["Teochew", "Mandarin"],
    location: "Blk 777 #16-97, Woodlands",
    pitch: 42,
    time: "34s ago",
    status: "unresolved",
  },
  {
    id: 4,
    tier: "MED",
    source: "audio",
    sourceNote: "",
    keyword: "silence",
    languages: ["Teochew"],
    location: "Blk 832 #12-63, Clementi",
    pitch: 22,
    time: "1m ago",
    status: "unresolved",
  },
  {
    id: 5,
    tier: "MED",
    source: "audio",
    sourceNote: "",
    keyword: "tiada respon",
    languages: ["Mandarin"],
    location: "Blk 808 #7-71, Bishan",
    pitch: 46,
    time: "2m ago",
    status: "unresolved",
  },
  {
    id: 6,
    tier: "LOW",
    source: "btn",
    sourceNote: "bg noise",
    keyword: "help",
    languages: ["English"],
    location: "Blk 12 #03-22, Jurong",
    pitch: 8,
    time: "4m ago",
    status: "claimed",
  },
  {
    id: 7,
    tier: "LOW",
    source: "audio",
    sourceNote: "",
    keyword: "tolong",
    languages: ["Malay"],
    location: "Blk 334 #11-05, Bedok",
    pitch: 11,
    time: "6m ago",
    status: "claimed",
  },
];

const TIER_CONFIG = {
  URGENT: {
    label: "Urgent",
    color: "#DC2626",
    bg: "#FEF2F2",
    border: "#FECACA",
    dot: "#DC2626",
  },
  MED: {
    label: "Medium",
    color: "#D97706",
    bg: "#FFFBEB",
    border: "#FDE68A",
    dot: "#D97706",
  },
  LOW: {
    label: "Low",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    dot: "#2563EB",
  },
};

const LANG_COLORS = {
  Cantonese: "#7C3AED",
  Teochew: "#059669",
  Mandarin: "#DC2626",
  Tamil: "#D97706",
  English: "#2563EB",
  Malay: "#0891B2",
};

function PitchBar({ value }) {
  const color = value >= 40 ? "#DC2626" : value >= 20 ? "#D97706" : "#2563EB";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <div
        style={{
          width: 64,
          height: 5,
          background: "#E5E7EB",
          borderRadius: 999,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: color,
            borderRadius: 999,
            transition: "width 0.4s ease",
          }}
        />
      </div>
      <span style={{ fontSize: 11, color, fontWeight: 600, minWidth: 26 }}>
        {value}%
      </span>
    </div>
  );
}

function TierBadge({ tier }) {
  const c = TIER_CONFIG[tier];
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: "0.06em",
        color: c.color,
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: 4,
        padding: "2px 7px",
      }}
    >
      {c.label}
    </span>
  );
}

function LangTag({ lang }) {
  const color = LANG_COLORS[lang] || "#6B7280";
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        color,
        border: `1px solid ${color}22`,
        background: `${color}10`,
        borderRadius: 3,
        padding: "1px 6px",
      }}
    >
      {lang}
    </span>
  );
}

function AlertRow({ alert }) {
  const [claimed, setClaimed] = useState(alert.status === "claimed");
  return (
    <tr
      style={{
        borderBottom: "1px solid #F3F4F6",
        transition: "background 0.15s",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "#F9FAFB")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
        <TierBadge tier={alert.tier} />
      </td>
      <td style={{ padding: "12px 16px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "#111827" }}>
          {alert.source}
        </div>
        {alert.sourceNote && (
          <div style={{ fontSize: 11, color: "#9CA3AF", marginTop: 1 }}>
            ⚠ {alert.sourceNote}
          </div>
        )}
      </td>
      <td style={{ padding: "12px 16px" }}>
        <div
          style={{
            display: "inline-block",
            fontSize: 12,
            fontWeight: 700,
            fontStyle: "italic",
            color: "#111827",
            background: "#F3F4F6",
            borderRadius: 4,
            padding: "2px 8px",
            marginBottom: 6,
          }}
        >
          "{alert.keyword}"
        </div>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {alert.languages.map((l) => (
            <LangTag key={l} lang={l} />
          ))}
        </div>
      </td>
      <td
        style={{
          padding: "12px 16px",
          fontSize: 12,
          color: "#374151",
          whiteSpace: "nowrap",
        }}
      >
        {alert.location}
      </td>
      <td style={{ padding: "12px 16px" }}>
        <PitchBar value={alert.pitch} />
      </td>
      <td
        style={{
          padding: "12px 16px",
          fontSize: 11,
          color: "#9CA3AF",
          whiteSpace: "nowrap",
        }}
      >
        {alert.time}
      </td>
      <td style={{ padding: "12px 16px" }}>
        <button
          onClick={() => setClaimed(true)}
          disabled={claimed}
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "0.05em",
            padding: "5px 14px",
            borderRadius: 5,
            cursor: claimed ? "default" : "pointer",
            border: "none",
            transition: "all 0.2s",
            background: claimed ? "#E5E7EB" : "#111827",
            color: claimed ? "#9CA3AF" : "#FFFFFF",
          }}
        >
          {claimed ? "Claimed" : "CLAIM"}
        </button>
      </td>
    </tr>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("ALL");

  const tabs = [
    { key: "ALL", label: "All Active", count: 24 },
    { key: "URGENT", label: "Urgent", count: 7 },
    { key: "MED", label: "Medium", count: 9 },
    { key: "LOW", label: "Low", count: 8 },
  ];

  const filtered =
    activeTab === "ALL" ? alerts : alerts.filter((a) => a.tier === activeTab);

  const stats = [
    {
      value: 7,
      label: "URGENT (True Positive)",
      sub: "Auto-deploy triggered",
      color: "#DC2626",
    },
    {
      value: 9,
      label: "MED (False Negative)",
      sub: "Silent / no keyword",
      color: "#D97706",
    },
    {
      value: 8,
      label: "LOW (Negative)",
      sub: "BG noise / extra clicks",
      color: "#2563EB",
    },
    {
      value: 24,
      label: "TOTAL ACTIVE",
      sub: "All unresolved",
      color: "#111827",
    },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F8FAFC",
        fontFamily: "'DM Mono', 'Courier New', monospace",
      }}
    >
      <div style={{ padding: "24px 28px", maxWidth: 1200 }}>
        {/* Stats Row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16,
            marginBottom: 24,
          }}
        >
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                background: "#FFFFFF",
                borderRadius: 10,
                border: "1px solid #E5E7EB",
                padding: "18px 20px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 700,
                  color: s.color,
                  lineHeight: 1,
                  fontFamily: "'DM Mono', monospace",
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#374151",
                  marginTop: 6,
                  letterSpacing: "0.03em",
                }}
              >
                {s.label}
              </div>
              <div style={{ fontSize: 10, color: "#9CA3AF", marginTop: 2 }}>
                {s.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: 0 }}>
          {tabs.map((tab) => {
            const active = activeTab === tab.key;
            const cfg = TIER_CONFIG[tab.key];
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: "9px 18px",
                  fontSize: 12,
                  fontWeight: 600,
                  borderRadius: "8px 8px 0 0",
                  cursor: "pointer",
                  border: "1px solid #E5E7EB",
                  borderBottom: active
                    ? "1px solid #FFFFFF"
                    : "1px solid #E5E7EB",
                  background: active ? "#FFFFFF" : "#F3F4F6",
                  color: active ? cfg?.color || "#111827" : "#6B7280",
                  transition: "all 0.15s",
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                }}
              >
                {cfg && (
                  <span
                    style={{
                      width: 7,
                      height: 7,
                      borderRadius: "50%",
                      background: cfg.dot,
                      display: "inline-block",
                    }}
                  />
                )}
                {tab.label}
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    background: active ? cfg?.bg || "#F3F4F6" : "#E5E7EB",
                    color: active ? cfg?.color || "#374151" : "#6B7280",
                    borderRadius: 10,
                    padding: "1px 7px",
                  }}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div
          style={{
            background: "#FFFFFF",
            border: "1px solid #E5E7EB",
            borderRadius: "0 8px 8px 8px",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr
                style={{
                  background: "#F9FAFB",
                  borderBottom: "1px solid #E5E7EB",
                }}
              >
                {[
                  "TIER",
                  "SOURCE",
                  "KEYWORDS + LANGUAGES",
                  "LOCATION",
                  "PITCH",
                  "TIME",
                  "ACTION",
                ].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: "10px 16px",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.08em",
                      color: "#6B7280",
                      textAlign: "left",
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((alert) => (
                <AlertRow key={alert.id} alert={alert} />
              ))}
            </tbody>
          </table>
        </div>

        <div
          style={{
            marginTop: 12,
            fontSize: 11,
            color: "#9CA3AF",
            textAlign: "right",
          }}
        >
          Showing {filtered.length} of {alerts.length} alerts
        </div>
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
