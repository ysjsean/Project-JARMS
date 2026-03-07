from __future__ import annotations

import os
from datetime import datetime, timezone
from uuid import uuid4
import traceback

from fastapi import APIRouter, File, Form, HTTPException, UploadFile

from core.supabase import supabase

router = APIRouter()

AUDIO_BUCKET = os.getenv("SUPABASE_AUDIO_BUCKET", "pab_audio")


@router.get("/")
async def list_cases():
    try:
        response = (
            supabase.table("cases")
            .select(
                """
                *,
                pab_beneficiaries(*)
                """
            )
            .order("opened_at", desc=True)
            .execute()
        )

        return {"items": response.data}

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/audio")
async def create_case_from_audio(
    button_id: str = Form(...),
    audio: UploadFile = File(...),
):
    try:
        # 1) Validate beneficiary by button_id
        beneficiary_res = (
            supabase.table("pab_beneficiaries")
            .select("*")
            .eq("button_id", button_id)
            .single()
            .execute()
        )

        beneficiary = beneficiary_res.data
        if not beneficiary:
            raise HTTPException(
                status_code=404,
                detail="Beneficiary not found for button_id",
            )

        # 2) Read uploaded audio
        audio_bytes = await audio.read()
        if not audio_bytes:
            raise HTTPException(status_code=400, detail="Empty audio file")

        # 3) Pre-generate case_id so storage path and case row match
        case_id = str(uuid4())

        file_ext = "webm"
        if audio.filename and "." in audio.filename:
            file_ext = audio.filename.rsplit(".", 1)[-1].lower()

        storage_path = f"{button_id}/{case_id}/raw.{file_ext}"

        # 4) Upload audio to Supabase Storage
        supabase.storage.from_(AUDIO_BUCKET).upload(
            path=storage_path,
            file=audio_bytes,
            file_options={
                "content-type": audio.content_type or "audio/webm",
                "upsert": "false",
            },
        )

        # 5) Insert case row
        now_iso = datetime.now(timezone.utc).isoformat()

        case_payload = {
            "case_id": case_id,
            "nric": beneficiary["nric"],
            "button_id": button_id,
            "status": "new",
            "urgency_bucket": "requires_review",
            "queue_score": 60,
            "source": "pab_audio",
            "transcript_raw": None,
            "transcript_english": None,
            "audio_caption_text": None,
            "sbar_json": {
                "situation": "PAB audio received",
                "background": f"Patient: {beneficiary['full_name']}",
                "assessment": "Awaiting AI transcription and audio analysis",
                "recommendation": "Place into review queue",
            },
            "triage_flags_json": {
                "audio_received": True,
                "low_confidence_ai": True,
            },
            "recommended_actions_json": {
                "primary_action": "call_patient_now",
                "secondary_actions": ["call_emergency_contact_now"],
            },
            "audio_file_url": storage_path,
            "audio_duration_seconds": None,
            "audio_uploaded_at": now_iso,
        }

        case_res = supabase.table("cases").insert(case_payload).execute()
        case_row = case_res.data[0] if case_res.data else None

        return {
            "message": "Audio uploaded and case created",
            "case": case_row,
            "beneficiary": {
                "nric": beneficiary["nric"],
                "full_name": beneficiary["full_name"],
                "primary_language": beneficiary.get("primary_language"),
                "address": beneficiary.get("address"),
                "unit_number": beneficiary.get("unit_number"),
                "phone_number": beneficiary.get("phone_number"),
                "emergency_contact_name": beneficiary.get("emergency_contact_name"),
                "emergency_contact": beneficiary.get("emergency_contact"),
            },
        }
    except HTTPException:
        raise
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
