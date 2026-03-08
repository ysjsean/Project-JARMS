from typing import List, Dict, Any
from core.supabase import supabase

BOT_TRIGGER_BUCKETS = {
    "requires_review",
}

BOT_TRIGGER_OBSERVATIONS = {
    "low_confidence_ai",
    "conflicting_ai_outputs",
}


async def evaluate_and_flag(
    case_id: str,
    urgency_bucket: str,
    observations: List[str] | None = None,
) -> bool:
    """
    Trigger Nurse Bot when:
    1. bucket is requires_review
    2. caption observations contain low-confidence / conflicting signals
    """
    observations = observations or []

    has_conflicting_signal = any(
        obs in BOT_TRIGGER_OBSERVATIONS for obs in observations
    )

    should_trigger = urgency_bucket in BOT_TRIGGER_BUCKETS or has_conflicting_signal

    if should_trigger:
        print(
            f"[NURSE_BOT] Trigger detected for Case {case_id} "
            f"(Bucket: {urgency_bucket}, Observations: {observations})"
        )

        try:
            supabase.table("cases").update(
                {
                    "status": "needs_review",
                }
            ).eq("case_id", case_id).execute()
        except Exception as e:
            print(f"[NURSE_BOT] Could not update case status: {e}")

    return should_trigger


def generate_conversation_starter(triage_result: Dict[str, Any]) -> str:
    """
    Generates a personalized opener for the bot based on the triage findings.
    """
    bucket = triage_result.get("urgency_bucket", "unknown")
    reasoning = triage_result.get("reasoning", "")

    if bucket == "unknown":
        return "Hello, I noticed the emergency system detected silence or an unclear sound. I'm a nurse assistant checking in to see if you can hear me and if you're okay?"

    if bucket == "requires_review":
        return "Hi there, I've received your alert. The system wasn't quite sure about the situation, so I'm here to talk with you and see how I can help."

    return f"Hello, I'm checking in about your alert. The system noted that {reasoning}. Can you tell me more about how you're feeling right now?"
