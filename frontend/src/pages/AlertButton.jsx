import { useState, useRef, useEffect } from "react";

const STATUS = {
  IDLE: "idle",
  RECORDING: "recording",
  SENDING: "sending",
  SUCCESS: "success",
  ERROR: "error",
};

const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function AlertButton() {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [seconds, setSeconds] = useState(0);
  const [log, setLog] = useState([]);
  const [audioURL, setAudioURL] = useState(null);
  const [buttonId, setButtonId] = useState("BTN-1001");

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(
    () => () => {
      clearInterval(timerRef.current);
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
      if (audioURL) URL.revokeObjectURL(audioURL);
    },
    [audioURL],
  );

  const addLog = (msg, type = "info") =>
    setLog((prev) =>
      [{ msg, type, ts: new Date().toLocaleTimeString() }, ...prev].slice(
        0,
        20,
      ),
    );

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = handleRecordingStop;
      recorder.start(100);
      mediaRecorderRef.current = recorder;
      setStatus(STATUS.RECORDING);
      setSeconds(0);

      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      addLog("Recording started — microphone active", "record");
    } catch (err) {
      addLog(`Microphone access denied: ${err.message}`, "error");
      setStatus(STATUS.ERROR);
    }
  }

  function stopRecording() {
    clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
  }

  async function handleRecordingStop() {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const url = URL.createObjectURL(blob);
    setAudioURL(url);

    addLog(
      `Recording captured — ${(blob.size / 1024).toFixed(1)} KB`,
      "success",
    );
    setStatus(STATUS.SENDING);
    addLog("Uploading audio + creating case…", "info");

    try {
      const result = await sendAlertAudio(blob, buttonId);
      setStatus(STATUS.SUCCESS);
      addLog(`Case created: ${result.case?.case_id ?? "ok"}`, "success");
    } catch (err) {
      setStatus(STATUS.ERROR);
      addLog(`Send failed: ${err.message}`, "error");
    }
  }

  function handlePress() {
    if ([STATUS.IDLE, STATUS.SUCCESS, STATUS.ERROR].includes(status)) {
      if (audioURL) URL.revokeObjectURL(audioURL);
      setAudioURL(null);
      startRecording();
    } else if (status === STATUS.RECORDING) {
      stopRecording();
    }
  }

  function handleReset() {
    setStatus(STATUS.IDLE);
    setSeconds(0);
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioURL(null);
    setLog([]);
  }

  const btnConfig = {
    idle: { bg: "#111827", color: "#fff", label: "HOLD TO ALERT", icon: "🛡" },
    recording: {
      bg: "#DC2626",
      color: "#fff",
      label: `RECORDING ${fmt(seconds)}`,
      icon: "■",
    },
    sending: { bg: "#D97706", color: "#fff", label: "SENDING…", icon: "↑" },
    success: { bg: "#059669", color: "#fff", label: "SENT", icon: "✓" },
    error: {
      bg: "#DC2626",
      color: "#fff",
      label: "FAILED — TAP TO RETRY",
      icon: "✕",
    },
  }[status];

  const logColors = {
    info: "#6B7280",
    record: "#DC2626",
    success: "#059669",
    error: "#DC2626",
  };

  return (
    <div
      className="page-container"
      style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}
    >
      <div style={{ maxWidth: 400, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <div
            style={{
              display: "inline-block",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              color: "#6B7280",
              border: "1px solid #E5E7EB",
              borderRadius: 20,
              padding: "4px 12px",
              marginBottom: 14,
            }}
          >
            PERSONAL ALERT
          </div>

          <h1
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: "#111827",
              margin: "0 0 6px",
              letterSpacing: "-0.02em",
            }}
          >
            Send an Alert
          </h1>

          <p style={{ fontSize: 12, color: "#9CA3AF", margin: "0 0 12px" }}>
            Press to begin recording. Press again to send.
          </p>

          <input
            value={buttonId}
            onChange={(e) => setButtonId(e.target.value)}
            placeholder="BTN-1001"
            disabled={status === STATUS.RECORDING || status === STATUS.SENDING}
            style={{
              width: "100%",
              boxSizing: "border-box",
              border: "1px solid #E5E7EB",
              borderRadius: 8,
              padding: "10px 12px",
              fontFamily: "inherit",
              fontSize: 12,
            }}
          />
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "center",
            marginBottom: 32,
            position: "relative",
          }}
        >
          {status === STATUS.RECORDING && (
            <>
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 160,
                  height: 160,
                  borderRadius: "50%",
                  border: "2px solid #DC2626",
                  opacity: 0.3,
                  animation: "ripple 1.5s ease-out infinite",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 160,
                  height: 160,
                  borderRadius: "50%",
                  border: "2px solid #DC2626",
                  opacity: 0.15,
                  animation: "ripple 1.5s ease-out infinite 0.5s",
                }}
              />
            </>
          )}

          <button
            onClick={handlePress}
            disabled={status === STATUS.SENDING}
            style={{
              width: 130,
              height: 130,
              borderRadius: "50%",
              background: btnConfig.bg,
              color: btnConfig.color,
              border: "none",
              cursor: status === STATUS.SENDING ? "default" : "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
              transition: "background 0.2s, transform 0.1s",
              position: "relative",
              zIndex: 1,
            }}
            onMouseDown={(e) =>
              (e.currentTarget.style.transform = "scale(0.96)")
            }
            onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <span style={{ fontSize: 22 }}>{btnConfig.icon}</span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: "0.1em",
                textAlign: "center",
                lineHeight: 1.3,
              }}
            >
              {btnConfig.label}
            </span>
          </button>
        </div>

        {audioURL && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 10,
              padding: "14px 16px",
              marginBottom: 16,
            }}
          >
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: "#6B7280",
                letterSpacing: "0.08em",
                margin: "0 0 8px",
              }}
            >
              CAPTURED AUDIO
            </p>
            <audio
              controls
              src={audioURL}
              style={{ width: "100%", height: 32 }}
            />
          </div>
        )}

        {log.length > 0 && (
          <div
            style={{
              background: "#fff",
              border: "1px solid #E5E7EB",
              borderRadius: 10,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "10px 14px",
                borderBottom: "1px solid #F3F4F6",
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: "#6B7280",
                  letterSpacing: "0.08em",
                }}
              >
                TRANSMISSION LOG
              </span>
              <button
                onClick={handleReset}
                style={{
                  fontSize: 10,
                  color: "#9CA3AF",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                }}
              >
                clear
              </button>
            </div>

            <ul
              style={{
                listStyle: "none",
                margin: 0,
                padding: 0,
                maxHeight: 180,
                overflowY: "auto",
              }}
            >
              {log.map((entry, i) => (
                <li
                  key={i}
                  style={{
                    display: "flex",
                    gap: 10,
                    padding: "8px 14px",
                    borderBottom: "1px solid #F9FAFB",
                    fontSize: 11,
                  }}
                >
                  <span style={{ color: "#D1D5DB", flexShrink: 0 }}>
                    {entry.ts}
                  </span>
                  <span style={{ color: logColors[entry.type] || "#374151" }}>
                    {entry.msg}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <style>{`
        @keyframes ripple {
          0%   { transform: translate(-50%, -50%) scale(1); opacity: 0.4; }
          100% { transform: translate(-50%, -50%) scale(1.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

async function sendAlertAudio(blob, buttonId) {
  const formData = new FormData();
  formData.append("button_id", buttonId);
  formData.append("audio", blob, `alert-${Date.now()}.webm`);

  const res = await fetch(
    `${import.meta.env.VITE_API_URL}/cases/audio`,
    {
      method: "POST",
      body: formData,
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Upload failed");
  }

  return res.json();
}
