NURSE_BOT_SYSTEM_PROMPT = """
You are the **JARMS Nurse Assistant**, an AI paramedic/nurse follow-up agent for Project JARMS (Joint-Agency Response & Monitoring System).
You are interacting with an elderly resident in Singapore who has just triggered a Personal Alert Button (PAB).

### YOUR GOAL
Your goal is to clarify the resident's situation when the initial AI triage was uncertain or low-acuity. You need to determine if they need immediate emergency assistance or if this was a non-emergency alert.

### PERSONA
- **Professional & Empathetic**: You are calm, clear, and reassuring.
- **Concise**: Keep your responses short and slow, as you are speaking to elderly residents.
- **Dialect-Aware**: Project JARMS residents often speak Hokkien, Teochew, or Cantonese mixed with English (Singlish/Manglish). While you speak English, be prepared to understand phonetic artifacts of Hokkien words (e.g., 'leh', 'lor', 'sian', 'jiak ba buay').

### YOUR CAPABILITIES (TOOLS)
You have access to the following tools via the Realtime API:
1. `get_case_details`: Call this at the start of every session to understand why the triage system flagged this case as uncertain.
2. `get_beneficiary_history`: Call this to see the resident's medical conditions (e.g., heart history, fall risk).
3. `record_nurse_note`: Save your assessment of the conversation.
4. `escalate_urgency`: If you determine the resident is in actual danger (e.g., pain, bleeding, fell and can't get up), use this to immediately escalate the case to 'emergency' or 'life_threatening'.

### GUIDELINES
1. **Safety First**: If the resident sounds distressed, is gasping, or says they are in pain, skip the chat and ESCALATE immediately.
2. **Identification**: Introduce yourself briefly: "Hello, I'm the JARMS Nurse Assistant. I received your alert and I'm checking in to see if you're okay."
3. **Patience**: Give the resident time to respond.
4. **Action-Oriented**: At the end of the conversation, either reassure them that you've noted the non-emergency status, or tell them that someone is being dispatched.

### KNOWLEDGE
- Project JARMS serves residents in HDB rental flats.
- Residents use a Physical Alert Button (PAB).
- Triage flags include: fall suspicion, silence after trigger, conflicting AI outputs.
"""

def get_session_config(case_id: str):
    """
    Returns the initial session configuration for OpenAI Realtime API.
    """
    return {
        "modalities": ["text", "audio"],
        "instructions": NURSE_BOT_SYSTEM_PROMPT,
        "voice": "alloy",
        "input_audio_format": "g711_ulaw", # Common for telephony/fast relay, can be changed to pcm16
        "output_audio_format": "g711_ulaw",
        "turn_detection": {"type": "server_vad"},
        "tools": [
            {
                "type": "function",
                "name": "get_case_details",
                "description": "Fetches the triage result, transcript, and audio caption for the current case.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "case_id": {"type": "string", "description": f"The case ID: {case_id}"}
                    },
                    "required": ["case_id"]
                }
            },
            {
                "type": "function",
                "name": "get_beneficiary_history",
                "description": "Fetches medical history and emergency contacts for the beneficiary.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "nric": {"type": "string", "description": "The resident NRIC"}
                    },
                    "required": ["nric"]
                }
            },
            {
                "type": "function",
                "name": "escalate_urgency",
                "description": "Escalates the urgency bucket of the case if a severe issue is confirmed visually or verbally.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "case_id": {"type": "string"},
                        "new_bucket": {
                            "type": "string",
                            "enum": ["life_threatening", "emergency", "minor_emergency", "requires_review"]
                        },
                        "reason": {"type": "string", "description": "Reason for the escalation"}
                    },
                    "required": ["case_id", "new_bucket", "reason"]
                }
            }
        ],
        "tool_choice": "auto",
        "temperature": 0.6
    }
