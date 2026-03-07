import { useState, useRef, useEffect } from "react";
import "./AlertButton.css";

const STATUS = {
  IDLE: "idle",
  RECORDING: "recording",
  SENDING: "sending",
  SUCCESS: "success",
  ERROR: "error",
};

const BACKEND_URL = "/api/alert/audio"; // replace with your real endpoint

export default function AlertButton() {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [seconds, setSeconds] = useState(0);
  const [log, setLog] = useState([]);
  const [audioURL, setAudioURL] = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  // Cleanup on unmount
  useEffect(
    () => () => {
      clearInterval(timerRef.current);
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
    },
    [],
  );

  const addLog = (msg, type = "info") =>
    setLog((prev) =>
      [{ msg, type, ts: new Date().toLocaleTimeString() }, ...prev].slice(
        0,
        20,
      ),
    );

  /* ── START recording ── */
  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = handleRecordingStop;

      recorder.start(100); // collect every 100 ms
      mediaRecorderRef.current = recorder;

      setStatus(STATUS.RECORDING);
      setSeconds(0);
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      addLog("🔴  Recording started — microphone active", "record");
    } catch (err) {
      addLog(`❌  Microphone access denied: ${err.message}`, "error");
      setStatus(STATUS.ERROR);
    }
  }

  /* ── STOP recording ── */
  function stopRecording() {
    clearInterval(timerRef.current);
    mediaRecorderRef.current?.stop();
    mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());
  }

  /* ── After recording stops → send to backend ── */
  async function handleRecordingStop() {
    const blob = new Blob(chunksRef.current, { type: "audio/webm" });
    const url = URL.createObjectURL(blob);
    setAudioURL(url);
    addLog(
      `✅  Recording captured — ${(blob.size / 1024).toFixed(1)} KB`,
      "success",
    );

    setStatus(STATUS.SENDING);
    addLog(`📡  Sending to ${BACKEND_URL} …`, "info");

    try {
      /* ── SIMULATED fetch — replace body with real FormData / fetch ── */
      await simulatedSend(blob);

      setStatus(STATUS.SUCCESS);
      addLog("🟢  Server confirmed receipt", "success");
    } catch (err) {
      setStatus(STATUS.ERROR);
      addLog(`❌  Send failed: ${err.message}`, "error");
    }
  }

  /* ── Toggle handler ── */
  function handlePress() {
    if (
      status === STATUS.IDLE ||
      status === STATUS.SUCCESS ||
      status === STATUS.ERROR
    ) {
      setAudioURL(null);
      startRecording();
    } else if (status === STATUS.RECORDING) {
      stopRecording();
    }
  }

  function handleReset() {
    setStatus(STATUS.IDLE);
    setSeconds(0);
    setAudioURL(null);
    setLog([]);
  }

  const fmt = (s) =>
    `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  return (
    <main className="alert-page">
      <div className="alert-container">
        {/* ── Header ── */}
        <header className="alert-header">
          <span className="alert-badge">⬡ Personal Alert</span>
          <h1 className="alert-title">Alert Panel</h1>
          <p className="alert-sub">
            Press to begin recording. Press again to send.
          </p>
        </header>

        {/* ── Big button ── */}
        <div className="btn-zone">
          {status === STATUS.RECORDING && <div className="pulse-ring" />}
          {status === STATUS.RECORDING && <div className="pulse-ring delay" />}

          <button
            className={`alert-btn ${status}`}
            onClick={handlePress}
            disabled={status === STATUS.SENDING}
            aria-label={
              status === STATUS.RECORDING
                ? "Stop and send alert"
                : "Start alert recording"
            }
          >
            <span className="btn-icon">
              {status === STATUS.IDLE && "⬡"}
              {status === STATUS.RECORDING && "■"}
              {status === STATUS.SENDING && <span className="spinner" />}
              {status === STATUS.SUCCESS && "✓"}
              {status === STATUS.ERROR && "✕"}
            </span>
            <span className="btn-label">
              {status === STATUS.IDLE && "HOLD TO ALERT"}
              {status === STATUS.RECORDING && `RECORDING  ${fmt(seconds)}`}
              {status === STATUS.SENDING && "SENDING…"}
              {status === STATUS.SUCCESS && "SENT"}
              {status === STATUS.ERROR && "FAILED"}
            </span>
          </button>
        </div>

        {/* ── Playback ── */}
        {audioURL && (
          <div className="playback">
            <p className="playback-label">Captured audio</p>
            <audio controls src={audioURL} className="audio-player" />
          </div>
        )}

        {/* ── Log ── */}
        {log.length > 0 && (
          <div className="log-panel">
            <div className="log-header">
              <span>Transmission log</span>
              <button className="log-clear" onClick={handleReset}>
                clear
              </button>
            </div>
            <ul className="log-list">
              {log.map((entry, i) => (
                <li key={i} className={`log-entry ${entry.type}`}>
                  <span className="log-ts">{entry.ts}</span>
                  <span>{entry.msg}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}

/* ─────────────────────────────────────────────
   Simulated backend send  (1.2 s delay)
   Replace with real fetch() call:

   const form = new FormData();
   form.append("audio", blob, "alert.webm");
   const res = await fetch(BACKEND_URL, { method: "POST", body: form });
   if (!res.ok) throw new Error(await res.text());
───────────────────────────────────────────── */
function simulatedSend(blob) {
  return new Promise((resolve, reject) => {
    console.info("[SafeSignal] Sending blob to backend:", blob);
    setTimeout(() => {
      // swap `resolve()` → `reject(new Error("500"))` to test error path
      resolve({ ok: true });
    }, 1200);
  });
}
