"""
stt_triage.py — LLM-based Urgency Triage
==========================================
Project JARMS | Alibaba Cloud / DashScope

Purpose:
  Given a transcript, situation evaluation, and audio caption,
  classify urgency and produce structured SBAR output with
  recommended actions drawn from the policy-defined allowed list.

Model: qwen3-235b-a22b
"""

import json
import os
import re
from pathlib import Path
from typing import Optional, List

from openai import OpenAI
from dotenv import load_dotenv
from core.supabase import supabase as _supabase_client

load_dotenv()

# -----------------------------
# CONFIG
# -----------------------------

DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY", "YOUR_DASHSCOPE_KEY")

TRIAGE_MODEL = "qwen3-235b-a22b"
TRIAGE_PROTOCOL_FILE = str(Path(__file__).parent / "triage_protocol.md")
POLICY_FILE = str(Path(__file__).parent / "policy.json")

# Valid buckets from policy.json — no others are permitted
VALID_BUCKETS = [
    "life_threatening",
    "emergency",
    "requires_review",
    "minor_emergency",
    "non_emergency",
]

# -----------------------------
# CLIENT
# -----------------------------

client = OpenAI(
    api_key=DASHSCOPE_API_KEY,
    base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
)

# -----------------------------
# HELPERS
# -----------------------------


def load_triage_protocol(filepath: str = TRIAGE_PROTOCOL_FILE) -> str:
    with open(filepath, "r", encoding="utf-8") as f:
        return f.read()


def _load_policy() -> dict:
    """Load the full policy.json."""
    try:
        with open(POLICY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}


def _load_allowed_actions() -> List[str]:
    return _load_policy().get("allowed_actions", [])


def _load_discretionary_actions() -> List[str]:
    return _load_policy().get("discretionary_actions", [])


def _load_mandatory_actions(bucket: str) -> List[str]:
    return _load_policy().get("mandatory_actions_by_bucket", {}).get(bucket, [])


# -----------------------------
# LLM Triage
# -----------------------------


def run_triage(
    transcript: str,
    protocol: str,
    situation_eval: Optional[dict] = None,
    caption: Optional[dict] = None,
    primary_language: str = "unknown",
    secondary_language: Optional[str] = None,
    patient_medical_summary: Optional[dict] = None,
) -> dict:
    """
    Run triage analysis using qwen3-235b-a22b.

    Args:
        transcript:              English translation of the audio.
        protocol:                Triage protocol markdown text.
        situation_eval:          Output from situationeval.py (observed risks).
        caption:                 Output from captioner.py (scene description).
        primary_language:        Beneficiary's primary language.
        secondary_language:      Beneficiary's secondary language (if any).
        patient_medical_summary: Dict of relevant medical history from
                                 pab_beneficiaries (conditions, medications, etc.).

    Returns:
        Structured triage dict with urgency_bucket, triage_flags,
        reasoning, recommended_actions, and sbar.
    """
    transcript = transcript or "NO_SPEECH_DETECTED"

    silence_note = ""
    if "SILENCE_DETECTED" in transcript:
        silence_note = (
            "\n[SYSTEM NOTE: Audio contained silence or was too poor to transcribe.]"
        )

    # -- Build situation evaluation context --
    situation_str = ""
    if situation_eval:
        severity = situation_eval.get("severity") or "unknown"
        observed_risks = situation_eval.get("observed_risks") or []
        reasoning = situation_eval.get("reasoning") or "No reasoning provided."
        situation_str = f"""
=== SITUATION EVALUATION (NON-VERBAL / PARALINGUISTIC SIGNALS) ===
- Severity: {severity}
- Observed Risks: {', '.join(observed_risks) if isinstance(observed_risks, list) else observed_risks}
- Signal Reasoning: {reasoning}
"""

    # -- Build caption context --
    caption_str = ""
    if caption:
        description = caption.get("caption") or "No caption provided."
        notable = caption.get("notable_events") or []
        caption_str = f"""
=== AUDIO CAPTION (AI SCENE INTERPRETATION) ===
- Description: {description}
- Notable Events: {', '.join(notable) if isinstance(notable, list) else notable}
"""

    # -- Build patient context --
    patient_str = ""
    language_info = f"Primary language: {primary_language}"
    if secondary_language:
        language_info += f", Secondary language: {secondary_language}"

    patient_str = f"\n=== PATIENT CONTEXT ===\n- {language_info}\n"

    if patient_medical_summary:
        conditions = patient_medical_summary.get("medical_conditions") or []
        medications = patient_medical_summary.get("medications") or []
        allergies = patient_medical_summary.get("allergies") or []
        age = patient_medical_summary.get("age")
        mobility = patient_medical_summary.get("mobility_status")

        if age:
            patient_str += f"- Age: {age}\n"
        if mobility:
            patient_str += f"- Mobility: {mobility}\n"
        if conditions:
            cond_str = (
                ", ".join(conditions) if isinstance(conditions, list) else conditions
            )
            patient_str += f"- Medical Conditions: {cond_str}\n"
        if medications:
            med_str = (
                ", ".join(medications) if isinstance(medications, list) else medications
            )
            patient_str += f"- Medications: {med_str}\n"
        if allergies:
            allergy_str = (
                ", ".join(allergies) if isinstance(allergies, list) else allergies
            )
            patient_str += f"- Allergies: {allergy_str}\n"
    else:
        patient_str += "- Medical history: Not available\n"

    # -- Build action context for the prompt --
    allowed_actions = _load_allowed_actions()
    discretionary_actions = _load_discretionary_actions()
    discretionary_str = (
        ", ".join(f'"{a}"' for a in discretionary_actions)
        if discretionary_actions
        else ""
    )

    system_prompt = f"""You are an AI triage assistant for Project JARMS — a 24/7 emergency monitoring service for elderly residents living alone in Singapore.

=== TRIAGE PROTOCOL ===
{protocol}
=== END PROTOCOL ===

CRITICAL RULES:
1. Prioritise ACOUSTIC/SITUATION SIGNALS over transcription if they conflict.
2. Always follow the classification rules in order.
3. urgency_bucket MUST be one of: life_threatening, emergency, requires_review, minor_emergency, non_emergency.
4. Mandatory actions for each bucket are applied automatically by the system — you do NOT need to include them.
5. Your job is to decide which ADDITIONAL discretionary actions are needed based on the specific situation.
6. recommended_actions MUST only contain values from this discretionary list: [{discretionary_str}]
7. Think carefully: does this situation need police (call_999)? Fire/ambulance (call_995)? Private ambulance (call_private_ambulance_1777)? Volunteers (call_sgsecure_volunteers)? Lift lobby notification (notify_lift_lobby)?
8. Use the patient context (language, medical history) to apply Patient History Modifiers from the protocol.
9. The SBAR section is mandatory and must be clinically useful for a human operator.
10. Return ONLY a valid JSON object. No markdown fences, no preamble.

Return JSON with keys:
- urgency_bucket: one of the five valid buckets
- triage_flags: object of boolean flags as defined in the protocol
- reasoning: concise explanation referencing specific signals
- recommended_actions: list of DISCRETIONARY actions you recommend for this specific situation
- sbar: object with situation, background, assessment, recommendation
"""

    user_prompt = f"""Analyse these PAB audio inputs and return structured triage JSON:

{patient_str}
{situation_str}
{caption_str}

TRANSCRIPT:
{transcript}
{silence_note}
"""

    try:
        response = client.chat.completions.create(
            model=TRIAGE_MODEL,
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            extra_body={"enable_thinking": False},
            temperature=0.1,
        )
        raw_output = response.choices[0].message.content
        cleaned = re.sub(r"```(?:json)?\s*|\s*```", "", raw_output).strip()
        result = json.loads(cleaned)
        result["raw_output"] = raw_output

        # Validate and normalise the urgency bucket
        bucket = result.get("urgency_bucket") or result.get("urgency")
        if bucket not in VALID_BUCKETS:
            result["urgency_bucket"] = "requires_review"
        else:
            result["urgency_bucket"] = bucket

        # Build final recommended_actions:
        #   1. Start with mandatory actions for this bucket (always applied)
        #   2. Validate LLM's discretionary picks against allowed list
        #   3. Merge: mandatory first, then validated discretionary additions
        bucket = result["urgency_bucket"]
        mandatory = _load_mandatory_actions(bucket)

        raw_actions = result.get("recommended_actions") or []
        if isinstance(raw_actions, str):
            raw_actions = [raw_actions]
        validated_discretionary = [a for a in raw_actions if a in allowed_actions]

        # Merge: mandatory first, then discretionary additions (deduped)
        merged = list(mandatory)
        for action in validated_discretionary:
            if action not in merged:
                merged.append(action)
        result["recommended_actions"] = merged if merged else ["call_patient_now"]

        # Ensure sbar is present
        if "sbar" not in result or not isinstance(result.get("sbar"), dict):
            result["sbar"] = {
                "situation": "AI triage completed for PAB audio.",
                "background": f"Language: {primary_language}. Medical history: {'available' if patient_medical_summary else 'not available'}.",
                "assessment": f"Urgency bucket: {result['urgency_bucket']}.",
                "recommendation": "Review recommended actions and place into queue.",
            }

        return result

    except Exception as e:
        print(f"[TRIAGE] Error: {e}")
        return {
            "urgency_bucket": "requires_review",
            "triage_flags": {},
            "reasoning": f"Triage processing failed: {e}. Escalating to requires_review.",
            "recommended_actions": ["call_patient_now", "inform_emergency_contact"],
            "sbar": {
                "situation": "Triage processing failed — manual review required.",
                "background": f"Language: {primary_language}. Medical history: {'available' if patient_medical_summary else 'not available'}.",
                "assessment": "Unable to determine urgency automatically. Defaulting to requires_review.",
                "recommendation": "Operator must review audio and patient context manually.",
            },
            "pab_flags": ["triage_failure"],
        }


def print_summary(stt: dict, triage: dict):
    print("\n" + "=" * 60)
    print("🚑 PROJECT JARMS — TRIAGE SUMMARY")
    print("=" * 60)
    tx = stt.get("transcript") or "N/A"
    print(f"STT Transcript : {tx[:100]}...")
    print(f"Urgency Bucket : {str(triage.get('urgency_bucket')).upper()}")
    print(f"Reasoning      : {triage.get('reasoning')}")
    print(f"Actions        : {triage.get('recommended_actions')}")
    print(f"Flags          : {triage.get('pab_flags')}")

    sbar = triage.get("sbar")
    if sbar and isinstance(sbar, dict):
        print(f"SBAR Situation : {sbar.get('situation')}")
        print(f"SBAR Background: {sbar.get('background')}")
        print(f"SBAR Assessment: {sbar.get('assessment')}")
        print(f"SBAR Recommend : {sbar.get('recommendation')}")

    print("=" * 60)
