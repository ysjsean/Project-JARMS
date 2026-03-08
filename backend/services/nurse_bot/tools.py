# services/nurse_bot/tools.py
from typing import Dict, Any, Optional
from core.supabase import supabase


async def get_case_details(case_id: str) -> Dict[str, Any]:
    """
    Fetches the full context of a case for the Nurse Bot.
    """
    try:
        res = (
            supabase.table("cases")
            .select("*")
            .eq("case_id", case_id)
            .single()
            .execute()
        )
        if not res.data:
            return {"error": "Case not found"}

        case = res.data
        return {
            "case_id": case.get("case_id"),
            "nric": case.get("nric"),
            "initial_urgency": case.get("urgency_bucket"),
            "initial_status": case.get("status"),
            "raw_transcript": case.get("transcript_raw"),
            "english_translation": case.get("transcript_english"),
            "audio_caption": case.get("audio_caption_text"),
            "ai_reasoning": case.get("sbar_json", {}).get(
                "assessment", "No reasoning available"
            ),
        }
    except Exception as e:
        return {"error": str(e)}


async def get_beneficiary_history(nric: str) -> Dict[str, Any]:
    """
    Fetches medical history for the resident.
    """
    try:
        # Assuming table is 'pab_beneficiaries' based on my previous research
        res = (
            supabase.table("pab_beneficiaries")
            .select("*")
            .eq("nric", nric)
            .single()
            .execute()
        )
        if not res.data:
            return {"error": "Beneficiary not found"}

        b = res.data
        return {
            "full_name": b.get("full_name"),
            "medical_summary": b.get("patient_medical_summary"),
            "primary_language": b.get("primary_language"),
            "emergency_contact": b.get("emergency_contact_name"),
        }
    except Exception as e:
        return {"error": str(e)}


async def escalate_urgency(
    case_id: str, new_bucket: str, reason: str
) -> Dict[str, Any]:
    """
    Updates the urgency level of a case based on the Nurse Bot's assessment.
    """
    try:
        # Update the urgency and the reasoning in the DB
        update_payload = {
            "urgency_bucket": new_bucket,
            "status": (
                "assigned"
                if new_bucket in ["life_threatening", "emergency"]
                else "processing"
            ),
        }

        # We append the nurse bot reason to the existing assessment if possible
        res_current = (
            supabase.table("cases")
            .select("sbar_json")
            .eq("case_id", case_id)
            .single()
            .execute()
        )
        sbar = res_current.data.get("sbar_json") or {}

        if isinstance(sbar, dict):
            sbar["assessment"] = (
                f"{sbar.get('assessment', '')}\n\n[Nurse Bot Escalation]: {reason}"
            )
            update_payload["sbar_json"] = sbar

        supabase.table("cases").update(update_payload).eq("case_id", case_id).execute()

        return {"success": True, "new_bucket": new_bucket, "reason": reason}
    except Exception as e:
        return {"error": str(e)}


async def record_nurse_note(case_id: str, note: str) -> Dict[str, Any]:
    """
    Adds a note from the Nurse Bot to the case.
    """
    try:
        # For now, we append to a 'triage_history' or similar.
        # In this simplistic version, we'll prefix it to the reasoning.
        res_current = (
            supabase.table("cases")
            .select("sbar_json")
            .eq("case_id", case_id)
            .single()
            .execute()
        )
        sbar = res_current.data.get("sbar_json") or {}

        if isinstance(sbar, dict):
            existing = sbar.get("assessment", "")
            sbar["assessment"] = f"{existing}\n\n[Nurse Bot Note]: {note}"
            supabase.table("cases").update({"sbar_json": sbar}).eq(
                "case_id", case_id
            ).execute()

        return {"success": True}
    except Exception as e:
        return {"error": str(e)}
