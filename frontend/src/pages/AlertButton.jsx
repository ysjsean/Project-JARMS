import { useEffect, useMemo, useRef, useState } from "react";

const STATUS = {
  IDLE: "idle",
  RECORDING: "recording",
  SENDING: "sending",
  SUCCESS: "success",
  ERROR: "error",
};

const C = {
  bg: "#16181D",
  surface: "#1E2028",
  border: "#2C2F3A",
  borderSoft: "#252830",
  textPrimary: "#E8EAF0",
  textSecondary: "#8B90A0",
  textMuted: "#545868",
  accent: "#E55A5A",
  amber: "#D4883A",
  green: "#3EA876",
  blue: "#4C8BF5",
};

const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

export default function AlertButton() {
  const [status, setStatus] = useState(STATUS.IDLE);
  const [seconds, setSeconds] = useState(0);
  const [log, setLog] = useState([]);
  const [audioURL, setAudioURL] = useState(null);

  const [beneficiaries, setBeneficiaries] = useState([]);
  const [buttonId, setButtonId] = useState("");
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);

  const [caseData, setCaseData] = useState(null);
  const [triageResult, setTriageResult] = useState(null);
  const [triageError, setTriageError] = useState(null);

  const [nurseBotOpen, setNurseBotOpen] = useState(false);
  const [nurseBotConnected, setNurseBotConnected] = useState(false);
  const [nurseTranscript, setNurseTranscript] = useState("");
  const [nurseEvents, setNurseEvents] = useState([]);

  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollTimerRef = useRef(null);
  const nurseWsRef = useRef(null);

  const apiBase = import.meta.env.VITE_API_URL;

  const selectedCaseId = caseData?.case_id;

  const uploadDisabled =
    status === STATUS.RECORDING || status === STATUS.SENDING;

  const card = useMemo(
    () => ({
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: 10,
    }),
    [],
  );

  const sectionLabel = useMemo(
    () => ({
      fontSize: 10,
      fontWeight: 700,
      color: C.textSecondary,
      letterSpacing: "0.09em",
    }),
    [],
  );

  useEffect(() => {
    async function loadBeneficiaries() {
      try {
        const res = await fetch(`${apiBase}/beneficiaries`);
        const data = await res.json();
        const items = data.items || [];

        setBeneficiaries(items);

        if (items.length) {
          setButtonId(items[0].button_id);
          setSelectedBeneficiary(items[0]);
        }
      } catch (err) {
        console.error(err);
        addLog("Failed to load beneficiaries", "error");
      }
    }

    loadBeneficiaries();
  }, [apiBase]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      clearInterval(pollTimerRef.current);
      mediaRecorderRef.current?.stream?.getTracks().forEach((t) => t.stop());

      if (audioURL) URL.revokeObjectURL(audioURL);

      if (nurseWsRef.current) {
        nurseWsRef.current.close();
      }
    };
  }, [audioURL]);

  function addLog(msg, type = "info") {
    setLog((prev) =>
      [{ msg, type, ts: new Date().toLocaleTimeString() }, ...prev].slice(
        0,
        25,
      ),
    );
  }

  function addNurseEvent(msg) {
    setNurseEvents((prev) =>
      [{ msg, ts: new Date().toLocaleTimeString() }, ...prev].slice(0, 20),
    );
  }

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
    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioURL(URL.createObjectURL(blob));

    addLog(
      `Recording captured — ${(blob.size / 1024).toFixed(1)} KB`,
      "success",
    );

    await submitAudioBlob(blob, `alert-${Date.now()}.webm`);
  }

  async function submitAudioBlob(blob, filename) {
    setStatus(STATUS.SENDING);
    setCaseData(null);
    setTriageResult(null);
    setTriageError(null);
    setNurseBotOpen(false);
    setNurseBotConnected(false);
    setNurseTranscript("");
    setNurseEvents([]);

    addLog("Uploading audio + creating case…", "info");

    try {
      const result = await sendAlertAudio(blob, buttonId, filename, apiBase);

      setCaseData(result.case || null);
      setTriageResult(result.triage_pipeline_result || null);
      setTriageError(result.triage_pipeline_error || null);

      setStatus(STATUS.SUCCESS);
      addLog(`Case created: ${result.case?.case_id ?? "ok"}`, "success");

      if (result.case?.case_id) {
        startPollingCase(result.case.case_id);
      }
    } catch (err) {
      setStatus(STATUS.ERROR);
      addLog(`Send failed: ${err.message}`, "error");
    }
  }

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      if (audioURL) URL.revokeObjectURL(audioURL);
      setAudioURL(URL.createObjectURL(file));

      addLog(
        `Audio file selected — ${file.name} (${(file.size / 1024).toFixed(1)} KB)`,
        "info",
      );

      await submitAudioBlob(file, file.name);
    } finally {
      e.target.value = "";
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
    setCaseData(null);
    setTriageResult(null);
    setTriageError(null);
    setNurseBotOpen(false);
    setNurseBotConnected(false);
    setNurseTranscript("");
    setNurseEvents([]);
    clearInterval(timerRef.current);
    clearInterval(pollTimerRef.current);

    if (audioURL) URL.revokeObjectURL(audioURL);
    setAudioURL(null);
    setLog([]);
  }

  async function fetchCase(caseId) {
    const res = await fetch(`${apiBase}/cases/${caseId}`);
    if (!res.ok) {
      throw new Error("Failed to fetch case");
    }
    return res.json();
  }

  function startPollingCase(caseId) {
    clearInterval(pollTimerRef.current);

    pollTimerRef.current = setInterval(async () => {
      try {
        const updated = await fetchCase(caseId);
        setCaseData(updated);

        if (
          updated.status === "queued" ||
          updated.status === "requires_review" ||
          updated.status === "error" ||
          updated.status === "assigned" ||
          updated.status === "closed"
        ) {
          addLog(`Case status updated: ${updated.status}`, "info");
        }
      } catch (err) {
        console.error(err);
      }
    }, 4000);
  }

  function openNurseBot() {
    if (!selectedCaseId) return;

    const wsUrl = apiBase
      .replace(/^http/, "ws")
      .replace(/\/$/, "")
      .concat(`/cases/${selectedCaseId}/nurse-bot`);

    addNurseEvent("Connecting to Nurse Assistant...");
    setNurseBotOpen(true);

    const ws = new WebSocket(wsUrl);
    nurseWsRef.current = ws;

    ws.onopen = () => {
      setNurseBotConnected(true);
      addNurseEvent("Nurse Assistant connected");
    };

    ws.onclose = () => {
      setNurseBotConnected(false);
      addNurseEvent("Nurse Assistant disconnected");
    };

    ws.onerror = () => {
      setNurseBotConnected(false);
      addNurseEvent("Nurse Assistant connection error");
    };

    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "response.audio_transcript.delta" && data.delta) {
          setNurseTranscript((prev) => prev + data.delta);
        }

        if (data.type === "error") {
          addNurseEvent(`Error: ${data.error?.message || "Unknown error"}`);
        }

        if (data.type === "response.audio.delta" && data.delta) {
          addNurseEvent("Received nurse audio response");
        }
      } catch {
        addNurseEvent("Received nurse event");
      }
    };
  }

  function closeNurseBot() {
    nurseWsRef.current?.close();
    nurseWsRef.current = null;
    setNurseBotOpen(false);
    setNurseBotConnected(false);
  }

  const btnConfig = {
    idle: {
      bg: "#2C2F3A",
      color: C.textPrimary,
      label: "HOLD TO ALERT",
      icon: "🛡",
    },
    recording: {
      bg: C.accent,
      color: "#fff",
      label: `RECORDING ${fmt(seconds)}`,
      icon: "■",
    },
    sending: {
      bg: C.amber,
      color: "#fff",
      label: "SENDING…",
      icon: "↑",
    },
    success: {
      bg: C.green,
      color: "#fff",
      label: "SENT",
      icon: "✓",
    },
    error: {
      bg: C.accent,
      color: "#fff",
      label: "FAILED — RETRY",
      icon: "✕",
    },
  }[status];

  const logColors = {
    info: C.textSecondary,
    record: C.accent,
    success: C.green,
    error: C.accent,
  };

  return (
    <div style={{ background: C.bg, minHeight: "100vh" }}>
      <div
        className="page-container"
        style={{ fontFamily: "'DM Mono', 'Courier New', monospace" }}
      >
        <div style={{ maxWidth: 500, margin: "0 auto" }}>
          <div style={{ marginBottom: 24 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: C.textSecondary,
                border: `1px solid ${C.border}`,
                borderRadius: 20,
                padding: "3px 10px",
              }}
            >
              PERSONAL ALERT
            </span>

            <h1
              style={{
                fontSize: 20,
                fontWeight: 700,
                color: C.textPrimary,
                margin: "10px 0 4px",
                letterSpacing: "-0.02em",
              }}
            >
              Send an Alert
            </h1>

            <p style={{ fontSize: 12, color: C.textSecondary, margin: 0 }}>
              Select a beneficiary, then record or upload audio.
            </p>
          </div>

          <div style={{ ...card, overflow: "hidden", marginBottom: 20 }}>
            <div
              style={{
                padding: "10px 14px",
                borderBottom: `1px solid ${C.borderSoft}`,
              }}
            >
              <span style={sectionLabel}>BENEFICIARY</span>
            </div>

            <div style={{ padding: "12px 14px" }}>
              <select
                value={buttonId}
                onChange={(e) => {
                  const sel = beneficiaries.find(
                    (b) => b.button_id === e.target.value,
                  );
                  setButtonId(e.target.value);
                  setSelectedBeneficiary(sel);
                }}
                disabled={uploadDisabled}
                style={{
                  width: "100%",
                  border: `1px solid ${C.border}`,
                  borderRadius: 7,
                  padding: "9px 10px",
                  fontFamily: "inherit",
                  fontSize: 12,
                  color: C.textPrimary,
                  background: C.bg,
                  marginBottom: selectedBeneficiary ? 14 : 0,
                  cursor: uploadDisabled ? "default" : "pointer",
                }}
              >
                {beneficiaries.map((b) => (
                  <option key={b.button_id} value={b.button_id}>
                    {b.full_name} ({b.button_id})
                  </option>
                ))}
              </select>

              {selectedBeneficiary && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "10px 20px",
                  }}
                >
                  {[
                    ["NRIC", selectedBeneficiary.nric],
                    ["Language", selectedBeneficiary.primary_language],
                    ["Phone", selectedBeneficiary.phone_number],
                    [
                      "Emergency",
                      `${selectedBeneficiary.emergency_contact_name} (${selectedBeneficiary.emergency_contact})`,
                    ],
                    [
                      "Address",
                      `${selectedBeneficiary.address} ${selectedBeneficiary.unit_number}`,
                      true,
                    ],
                    [
                      "Medical",
                      selectedBeneficiary.patient_medical_summary || "—",
                      true,
                    ],
                  ].map(([label, value, full]) => (
                    <div
                      key={label}
                      style={{ gridColumn: full ? "1 / -1" : undefined }}
                    >
                      <div
                        style={{
                          ...sectionLabel,
                          fontSize: 9,
                          marginBottom: 2,
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: C.textPrimary,
                          lineHeight: 1.5,
                        }}
                      >
                        {value || "—"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              marginBottom: 20,
              position: "relative",
              height: 160,
            }}
          >
            {status === STATUS.RECORDING && (
              <>
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%,-50%)",
                    width: 160,
                    height: 160,
                    borderRadius: "50%",
                    border: `2px solid ${C.accent}`,
                    opacity: 0.25,
                    animation: "ripple 1.5s ease-out infinite",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%,-50%)",
                    width: 160,
                    height: 160,
                    borderRadius: "50%",
                    border: `2px solid ${C.accent}`,
                    opacity: 0.1,
                    animation: "ripple 1.5s ease-out infinite 0.6s",
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
                gap: 5,
                boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
                transition: "background 0.2s, transform 0.1s",
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%,-50%)",
                zIndex: 1,
              }}
              onMouseDown={(e) =>
                (e.currentTarget.style.transform =
                  "translate(-50%,-50%) scale(0.96)")
              }
              onMouseUp={(e) =>
                (e.currentTarget.style.transform =
                  "translate(-50%,-50%) scale(1)")
              }
            >
              <span style={{ fontSize: 20 }}>{btnConfig.icon}</span>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: "0.08em",
                  textAlign: "center",
                  lineHeight: 1.4,
                }}
              >
                {btnConfig.label}
              </span>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*,.webm,.wav,.mp3,.m4a,.ogg"
            onChange={handleFileUpload}
            style={{ display: "none" }}
          />

          <button
            type="button"
            disabled={uploadDisabled}
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: "100%",
              border: `1px solid ${C.border}`,
              borderRadius: 8,
              padding: "10px 12px",
              marginBottom: 20,
              background: "transparent",
              color: uploadDisabled ? C.textMuted : C.textSecondary,
              fontFamily: "inherit",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.06em",
              cursor: uploadDisabled ? "default" : "pointer",
            }}
          >
            ↑ UPLOAD AUDIO FILE
          </button>

          {audioURL && (
            <div style={{ ...card, padding: "12px 14px", marginBottom: 16 }}>
              <p style={{ ...sectionLabel, margin: "0 0 8px" }}>
                CAPTURED AUDIO
              </p>
              <audio
                controls
                src={audioURL}
                style={{ width: "100%", height: 32 }}
              />
            </div>
          )}

          {caseData && (
            <div style={{ ...card, padding: "12px 14px", marginBottom: 16 }}>
              <p style={{ ...sectionLabel, margin: "0 0 10px" }}>CASE RESULT</p>

              <div
                style={{ fontSize: 11, color: C.textPrimary, lineHeight: 1.6 }}
              >
                <div>
                  <strong>Case ID:</strong> {caseData.case_id}
                </div>
                <div>
                  <strong>Status:</strong> {caseData.status}
                </div>
                <div>
                  <strong>Bucket:</strong> {caseData.urgency_bucket}
                </div>
                <div>
                  <strong>Queue Score:</strong>{" "}
                  {caseData.live_queue_score ?? caseData.queue_score}
                </div>
                <div>
                  <strong>Transcript:</strong>{" "}
                  {caseData.transcript_english ||
                    caseData.transcript_raw ||
                    "—"}
                </div>
                <div>
                  <strong>Caption:</strong> {caseData.audio_caption_text || "—"}
                </div>
                <div>
                  <strong>Actions:</strong>{" "}
                  {Array.isArray(caseData.recommended_actions)
                    ? caseData.recommended_actions.join(", ")
                    : "—"}
                </div>
              </div>

              {triageError && (
                <div style={{ marginTop: 10, color: C.accent, fontSize: 11 }}>
                  Pipeline error: {triageError}
                </div>
              )}

              {caseData.status === "requires_review" && (
                <button
                  onClick={nurseBotOpen ? closeNurseBot : openNurseBot}
                  style={{
                    marginTop: 12,
                    width: "100%",
                    border: `1px solid ${C.blue}`,
                    borderRadius: 8,
                    padding: "10px 12px",
                    background: nurseBotOpen ? C.blue : "transparent",
                    color: C.textPrimary,
                    fontFamily: "inherit",
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.06em",
                    cursor: "pointer",
                  }}
                >
                  {nurseBotOpen
                    ? "CLOSE NURSE ASSISTANT"
                    : "TALK TO NURSE ASSISTANT"}
                </button>
              )}
            </div>
          )}

          {nurseBotOpen && (
            <div style={{ ...card, padding: "12px 14px", marginBottom: 16 }}>
              <p style={{ ...sectionLabel, margin: "0 0 10px" }}>
                NURSE ASSISTANT
              </p>

              <div
                style={{ fontSize: 11, color: C.textPrimary, marginBottom: 8 }}
              >
                Connection:{" "}
                {nurseBotConnected ? "connected" : "connecting / closed"}
              </div>

              <div
                style={{
                  minHeight: 60,
                  padding: 10,
                  border: `1px solid ${C.border}`,
                  borderRadius: 8,
                  color: C.textPrimary,
                  fontSize: 11,
                  marginBottom: 10,
                  whiteSpace: "pre-wrap",
                }}
              >
                {nurseTranscript || "Waiting for nurse assistant transcript..."}
              </div>

              <div
                style={{
                  fontSize: 10,
                  color: C.textSecondary,
                  marginBottom: 6,
                }}
              >
                EVENTS
              </div>

              <ul
                style={{
                  listStyle: "none",
                  margin: 0,
                  padding: 0,
                  maxHeight: 120,
                  overflowY: "auto",
                }}
              >
                {nurseEvents.map((entry, i) => (
                  <li
                    key={i}
                    style={{
                      fontSize: 10,
                      color: C.textSecondary,
                      padding: "4px 0",
                      borderBottom: `1px solid ${C.borderSoft}`,
                    }}
                  >
                    {entry.ts} — {entry.msg}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {log.length > 0 && (
            <div style={{ ...card, overflow: "hidden" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 14px",
                  borderBottom: `1px solid ${C.borderSoft}`,
                }}
              >
                <span style={sectionLabel}>TRANSMISSION LOG</span>
                <button
                  onClick={handleReset}
                  style={{
                    fontSize: 10,
                    color: C.textMuted,
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: 0,
                    fontFamily: "inherit",
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
                  maxHeight: 160,
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
                      borderBottom: `1px solid ${C.borderSoft}`,
                      fontSize: 11,
                    }}
                  >
                    <span style={{ color: C.textMuted, flexShrink: 0 }}>
                      {entry.ts}
                    </span>
                    <span
                      style={{ color: logColors[entry.type] || C.textPrimary }}
                    >
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
            0%   { transform: translate(-50%,-50%) scale(1); opacity: 0.4; }
            100% { transform: translate(-50%,-50%) scale(1.6); opacity: 0; }
          }
        `}</style>
      </div>
    </div>
  );
}

async function sendAlertAudio(blob, buttonId, filename, apiBase) {
  const formData = new FormData();
  formData.append("button_id", buttonId);
  formData.append("audio", blob, filename);

  const res = await fetch(`${apiBase}/cases/audio`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || "Upload failed");
  }

  return res.json();
}
