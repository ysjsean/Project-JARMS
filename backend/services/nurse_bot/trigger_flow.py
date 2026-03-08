from typing import Dict, Any, Optional
import os
from core.supabase import supabase

# Urgency buckets that qualify for a Nurse Bot follow-up check
# Typically these are non-life-threatening but ambiguous or low-acuity
BOT_TRIGGER_BUCKETS = {
    "unknown",
    "requires_review",
    "minor_emergency",
    "non_emergency"
}

async def evaluate_and_flag(case_id: str, triage_result: Dict[str, Any]) -> bool:
    """
    Evaluates a triage outcome and flags the case for Nurse Bot attention if it meets
    the criteria for 'low confidence' or 'low urgency' follow-up.
    """
    urgency_bucket = triage_result.get("urgency_bucket", "unknown")
    triage_flags = triage_result.get("triage_flags", {})
    low_confidence = triage_flags.get("low_confidence_ai") or triage_flags.get("conflicting_ai_outputs")

    # If it's a life-threatening or emergency case, we don't wait for a bot to talk.
    # We only trigger the bot for cases that are 'Low Score' or 'Low Confidence'.
    should_trigger = urgency_bucket in BOT_TRIGGER_BUCKETS or low_confidence

    if should_trigger:
        print(f"[NURSE_BOT] Trigger detected for Case {case_id} (Bucket: {urgency_bucket}, LowConfidence: {low_confidence})")
        
        # In a real system, we'd update a specific column or notify a queue.
        # Here we update the case status to 'needs_review' to signal to the frontend
        # that the Nurse Bot capability should be offered.
        try:
            supabase.table("cases").update({
                "status": "needs_review",
                "nurse_bot_eligible": True
            }).eq("case_id", case_id).execute()
        except Exception as e:
            print(f"[NURSE_BOT] Optional: Could not update case flags: {e}")
            # We don't fail the whole pipeline if this metadata update fails

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
