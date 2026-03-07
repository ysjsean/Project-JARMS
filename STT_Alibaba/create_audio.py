# generate_demo_audios.py
# Project JARMS | Alibaba Cloud / DashScope + OpenAI
#
# 5 demo scenarios — one per urgency bucket, matched to pab_beneficiaries.
#
# BUCKET               BENEFICIARY             TTS ENGINE
# life_threatening     Tan Ah Kow  (PAB-002)   DashScope  (Hokkien - Roy)
# emergency            Chen Xiu Lan (PAB-005)   DashScope  (Mandarin - Katerina)
# requires_review      Ramasamy    (PAB-004)   OpenAI     (Tamil/English - ash)
# minor_emergency      Wong Siu Fong (PAB-003)  DashScope  (Cantonese - Kiki)
# non_emergency        Aminah      (PAB-001)   OpenAI     (Malay/English - nova)

import os
from pathlib import Path

import requests
import dashscope
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

# ------------------------------------------------------------------
# CONFIG
# ------------------------------------------------------------------
DASHSCOPE_API_KEY = os.getenv("DASHSCOPE_API_KEY")
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")

TTS_MODEL_DASHSCOPE = os.getenv("TTS_MODEL", "qwen3-tts-flash")
TTS_MODEL_OPENAI = "gpt-4o-mini-tts"

DASHSCOPE_BASE_URL = os.getenv(
    "DASHSCOPE_BASE_URL",
    "https://dashscope-intl.aliyuncs.com/api/v1",
)

OUTPUT_DIR = Path(os.getenv("OUTPUT_DIR", "generated_audio")).expanduser().resolve()

# ------------------------------------------------------------------
# DASHSCOPE VOICES
# ------------------------------------------------------------------
HOKKIEN_VOICE = "Roy"  # Southern Min male
MANDARIN_VOICE = "Katerina"  # Mature woman
CANTONESE_VOICE = "Kiki"  # Cantonese female

# ------------------------------------------------------------------
# OPENAI VOICES + INSTRUCTIONS
# ------------------------------------------------------------------
OPENAI_VOICE_RAMASAMY = "ash"  # Male voice for elderly Tamil man
OPENAI_VOICE_AMINAH = "nova"  # Female voice for elderly Malay woman

OPENAI_INSTRUCTIONS_RAMASAMY = (
    "You are voicing an 88-year-old Tamil man who is frightened and distressed. "
    "He sounds scared — his voice is shaking and pleading. He mixes Tamil and "
    "broken English. Speak with a trembling, weak elderly voice. When he says "
    "'vendaam' (don't/stop) it should sound desperate and pleading. "
    "The 'ayyoo' should sound like a cry of pain. He is clearly afraid of "
    "someone in the room with him."
)

OPENAI_INSTRUCTIONS_AMINAH = (
    "You are voicing a 72-year-old Malay grandmother who just woke "
    "up from a nap. Speak in a calm, slightly groggy, reassuring tone. "
    "She is not in distress — just mildly annoyed her grandchild "
    "pressed the alarm button. The Malay should sound natural and "
    "warm, like a typical Singaporean makcik. Relaxed pace."
)


# =====================================================================
# SCENARIO 1 — LIFE_THREATENING  (DashScope)
# Tan Ah Kow (PAB-002), 84yo, Hokkien/Mandarin
# Medical: Insulin-dependent diabetes, heart stents, ON WARFARIN,
#          history of hypos, uses walking frame.
#
# Story:  Hypoglycaemic episode → fell in bathroom → hit head on wall
#         → bleeding. Can't get up. Alone. Hasn't taken insulin.
#
# Why life_threatening:
#   - Head injury + active bleeding + on warfarin
#   - Possible hypoglycaemic crisis
#   - Protocol Rule 1: major_bleeding, head_injury + anticoag modifier
# =====================================================================
TAN_AH_KOW_SCRIPT = (
    "救命啊…有人無？…我跌倒啊… "
    "我佇便所跋倒去啊…起袂來… "
    "頭殼暈暈…目睭前烏烏… "
    "我今仔日猶未食藥…猶未注射… "
    "尻川骨真痛…腰脊嘛痛甲袂忍得… "
    "頭殼有去撞著壁…流一淡薄仔血… "
    "阿明啊…你佇佗位…緊來啊… "
    "我一個人…真驚…起袂來… "
    "救命啊…緊來幫我…"
)

# =====================================================================
# SCENARIO 2 — EMERGENCY  (DashScope)
# Chen Xiu Lan (PAB-005), 69yo, Mandarin/Hokkien
# Medical: Hypertension, mild depression, independent.
#
# Story:  Oil pan caught fire. Smoke filling flat. Coughing. She
#         turned off gas, retreated to living room. Panicked but
#         coherent — gives address.
#
# Why emergency (not life_threatening):
#   - Active fire + smoke → breathing difficulty
#   - But conscious, coherent, moved to safety, gas off
#   - Protocol Rule 2: severe_pain_distress, breathlessness
# =====================================================================
CHEN_XIU_LAN_SCRIPT = (
    "救命！救命啊！厨房着火了！ "
    "油锅起火了…烟很大…咳咳… "
    "我一个人在家…我不知道怎么办… "
    "我已经关了煤气…但是火还是很大… "
    "烟越来越多…我呼吸很辛苦…咳…咳咳… "
    "我现在在客厅…不敢过去… "
    "请快点派人来…我住大巴窑七巷二十二座… "
    "十一楼…快来帮忙啊…"
)

# =====================================================================
# SCENARIO 3 — REQUIRES_REVIEW  (OpenAI — Tamil/English)
# Ramasamy s/o Suppiah (PAB-004), 88yo, Tamil/English
# Medical: Vascular dementia (MMSE 18/30), 3 falls in 6 months,
#          hip fracture (pinned 2023), on rivaroxaban + donepezil,
#          wanders at night. DNR=true.
#
# Story:  Evening. Ramasamy's son-in-law visits and becomes aggressive
#         — possibly over money or caregiving frustration. Ramasamy is
#         frightened, pleading him to stop. Sounds of raised voices.
#         Ramasamy cries out in pain at one point. He presses the PAB.
#         Mixes Tamil and broken English. Unclear if he has been
#         physically struck or just threatened.
#
# Why requires_review:
#   - Multiple voices detected (raised voice in background)
#   - Ramasamy sounds distressed, pleading, possible pain cry
#   - Ambiguous: could be verbal aggression or physical abuse
#   - No clear life-threatening medical flags triggered
#   - Protocol Rule 3: insufficient info to confirm severity
#   - EXPECTED DISCRETIONARY ACTION: call_999 (police)
# =====================================================================
RAMASAMY_SCRIPT = (
    "...yaaraavathu help pannunga... please help... "
    "...avan ennai adikkiraan... he is hitting me... "
    "...vendaam... vendaam... please stop... "
    "...Priya... Priya, un purushan ennai... your husband is... "
    "...en panam vendaam... I don't have money... "
    "...ayyoo... ennai thallaadhey... don't push me... "
    "...please... somebody help... "
    "...I am scared... ayyoo..."
)

# =====================================================================
# SCENARIO 4 — MINOR_EMERGENCY  (DashScope)
# Wong Siu Fong (PAB-003), 78yo, Cantonese/English
# Medical: COPD (moderate GOLD II), ex-smoker, hypertension,
#          hearing aid right ear. Two hospitalisations past year.
#
# Story:  Cough worse since morning. Low fever. Wheezing but inhaler
#         still partially helping. Alert, speaking full sentences.
#         Asking if she should see a doctor. Wants son Kai Wen called.
#
# Why minor_emergency:
#   - cough_present = true, fever_or_hot_to_touch = true
#   - Inhaler partially effective, no acute distress
#   - Protocol Rule 4: cough + fever → minor_emergency
# =====================================================================
WONG_SIU_FONG_SCRIPT = (
    "喂？有冇人呀？ "
    "我今日咳得好犀利…從朝早開始… "
    "好似有少少發燒…個身好熱… "
    "我用咗個噴霧劑…好咗少少…但係都仲有啲喘… "
    "唔係好辛苦…但係我驚變差… "
    "我之前入過兩次院…唔想再入院… "
    "你哋覺得我使唔使去睇醫生呀？ "
    "可唔可以幫我打畀我個仔呀？佢叫Kai Wen…"
)

# =====================================================================
# SCENARIO 5 — NON_EMERGENCY  (OpenAI — Malay/English)
# Aminah Bte Yusof (PAB-001), 72yo, Malay/English
# Medical: Mild osteoarthritis, otherwise healthy and independent.
#
# Story:  Aminah's grandchild pressed the PAB while playing. Aminah
#         woke up from her nap and is now speaking to the operator
#         herself. Reassuring, calm, mildly annoyed. Mixes Malay
#         and English like a typical Singaporean makcik.
#
# Why non_emergency:
#   - No distress at all — she is calm and reassuring
#   - Confirms she is fine, grandchild was just playing
#   - Protocol Rule 5: no flags, low-acuity → non_emergency
# =====================================================================
AMINAH_SCRIPT = (
    "Hello? Assalamualaikum... "
    "Aah, maaf ye, cucu saya yang tekan butang tu tadi. "
    "Dia main-main je. Saya okay, tak apa-apa. "
    "Saya tadi tengah tidur, dia kejutkan saya. "
    "Sorry ah, menyusahkan you all. "
    "Saya sihat, alhamdulillah. Lutut sakit sikit je macam biasa. "
    "Tak payah hantar orang, semua okay. Terima kasih ye."
)


# ------------------------------------------------------------------
# AUDIO GENERATION SCENARIOS
# ------------------------------------------------------------------
DASHSCOPE_SCENARIOS = [
    {
        "name": "life_threatening__tan_ah_kow_fall",
        "beneficiary": "PAB-002 / Tan Ah Kow / S2345678B",
        "expected_bucket": "life_threatening",
        "voice": HOKKIEN_VOICE,
        "language_type": "Chinese",
        "text": TAN_AH_KOW_SCRIPT,
        "output_file": OUTPUT_DIR / "PAB-002_life_threatening_tan_ah_kow_fall.mp3",
    },
    {
        "name": "emergency__chen_xiu_lan_fire",
        "beneficiary": "PAB-005 / Chen Xiu Lan / S5678901E",
        "expected_bucket": "emergency",
        "voice": MANDARIN_VOICE,
        "language_type": "Chinese",
        "text": CHEN_XIU_LAN_SCRIPT,
        "output_file": OUTPUT_DIR / "PAB-005_emergency_chen_xiu_lan_fire.mp3",
    },
    {
        "name": "minor_emergency__wong_siu_fong_copd",
        "beneficiary": "PAB-003 / Wong Siu Fong / S3456789C",
        "expected_bucket": "minor_emergency",
        "voice": CANTONESE_VOICE,
        "language_type": "Cantonese",
        "text": WONG_SIU_FONG_SCRIPT,
        "output_file": OUTPUT_DIR / "PAB-003_minor_emergency_wong_siu_fong_copd.mp3",
    },
]

OPENAI_SCENARIOS = [
    {
        "name": "requires_review__ramasamy_domestic_abuse",
        "beneficiary": "PAB-004 / Ramasamy s/o Suppiah / S4567890D",
        "expected_bucket": "requires_review",
        "expected_discretionary": ["call_999"],
        "voice": OPENAI_VOICE_RAMASAMY,
        "instructions": OPENAI_INSTRUCTIONS_RAMASAMY,
        "text": RAMASAMY_SCRIPT,
        "output_file": OUTPUT_DIR
        / "PAB-004_requires_review_ramasamy_domestic_abuse.mp3",
    },
    {
        "name": "non_emergency__aminah_false_alarm",
        "beneficiary": "PAB-001 / Aminah Bte Yusof / S1234567A",
        "expected_bucket": "non_emergency",
        "voice": OPENAI_VOICE_AMINAH,
        "instructions": OPENAI_INSTRUCTIONS_AMINAH,
        "text": AMINAH_SCRIPT,
        "output_file": OUTPUT_DIR / "PAB-001_non_emergency_aminah_false_alarm.mp3",
    },
]


# ------------------------------------------------------------------
# DASHSCOPE TTS
# ------------------------------------------------------------------


def _extract_dashscope_audio_url(response) -> str:
    try:
        return response.output.audio.url
    except Exception:
        pass
    try:
        return response["output"]["audio"]["url"]
    except Exception:
        pass
    try:
        output = getattr(response, "output", None)
        if isinstance(output, dict):
            audio = output.get("audio", {})
            if isinstance(audio, dict) and audio.get("url"):
                return audio["url"]
    except Exception:
        pass
    raise RuntimeError(f"Could not extract audio URL from response: {response}")


def generate_dashscope_audio(
    *,
    text: str,
    output_path: Path,
    voice: str,
    language_type: str,
) -> bool:
    if not DASHSCOPE_API_KEY:
        print("[dashscope] ❌ DASHSCOPE_API_KEY is not set.")
        return False

    dashscope.api_key = DASHSCOPE_API_KEY
    dashscope.base_http_api_url = DASHSCOPE_BASE_URL
    output_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        print(
            f"[dashscope] Sending | model={TTS_MODEL_DASHSCOPE} "
            f"| voice={voice} | lang={language_type}"
        )
        response = dashscope.MultiModalConversation.call(
            model=TTS_MODEL_DASHSCOPE,
            text=text,
            voice=voice,
            language_type=language_type,
            stream=False,
        )

        status_code = getattr(response, "status_code", None)
        if status_code != 200:
            code = getattr(response, "code", "unknown_code")
            message = getattr(response, "message", "unknown_error")
            print(
                f"[dashscope] ❌ API error: status={status_code}, code={code}, msg={message}"
            )
            return False

        audio_url = _extract_dashscope_audio_url(response)
        print(f"[dashscope] Downloading: {audio_url[:100]}...")

        audio_response = requests.get(audio_url, timeout=60)
        audio_response.raise_for_status()

        with open(output_path, "wb") as f:
            f.write(audio_response.content)

        print(f"[dashscope] ✅ Saved: {output_path}")
        return True

    except Exception as e:
        print(f"[dashscope] ❌ Error: {e}")
        return False


# ------------------------------------------------------------------
# OPENAI TTS
# ------------------------------------------------------------------


def generate_openai_audio(
    *,
    text: str,
    output_path: Path,
    voice: str,
    instructions: str,
) -> bool:
    if not OPENAI_API_KEY:
        print("[openai] ❌ OPENAI_API_KEY is not set.")
        return False

    output_path.parent.mkdir(parents=True, exist_ok=True)

    try:
        client = OpenAI(api_key=OPENAI_API_KEY)
        print(f"[openai] Sending | model={TTS_MODEL_OPENAI} " f"| voice={voice}")

        response = client.audio.speech.create(
            model=TTS_MODEL_OPENAI,
            voice=voice,
            input=text,
            instructions=instructions,
            response_format="mp3",
        )

        response.stream_to_file(str(output_path))

        print(f"[openai] ✅ Saved: {output_path}")
        return True

    except Exception as e:
        print(f"[openai] ❌ Error: {e}")
        return False


# ------------------------------------------------------------------
# MAIN
# ------------------------------------------------------------------
if __name__ == "__main__":
    print("=" * 60)
    print("🎙️  Project JARMS — Demo Audio Generator")
    print("   One scenario per urgency bucket")
    print("   DashScope: Hokkien, Mandarin, Cantonese")
    print("   OpenAI:    Tamil, Malay")
    print("=" * 60)
    print(f"[out] Output directory: {OUTPUT_DIR}")

    total = len(DASHSCOPE_SCENARIOS) + len(OPENAI_SCENARIOS)
    successes = 0

    # --- DashScope scenarios ---
    print("\n" + "=" * 60)
    print(f"PART 1: DASHSCOPE TTS ({len(DASHSCOPE_SCENARIOS)} scenarios)")
    print("=" * 60)

    for s in DASHSCOPE_SCENARIOS:
        print("-" * 60)
        print(f"[bucket]       {s['expected_bucket']}")
        print(f"[scenario]     {s['name']}")
        print(f"[beneficiary]  {s['beneficiary']}")
        print(f"[engine]       DashScope / {s['voice']}")
        print(f"[preview]      {s['text'][:80]}...")
        ok = generate_dashscope_audio(
            text=s["text"],
            output_path=s["output_file"],
            voice=s["voice"],
            language_type=s["language_type"],
        )
        if ok:
            successes += 1

    # --- OpenAI scenarios ---
    print("\n" + "=" * 60)
    print(f"PART 2: OPENAI TTS ({len(OPENAI_SCENARIOS)} scenarios)")
    print("=" * 60)

    for s in OPENAI_SCENARIOS:
        print("-" * 60)
        print(f"[bucket]       {s['expected_bucket']}")
        print(f"[scenario]     {s['name']}")
        print(f"[beneficiary]  {s['beneficiary']}")
        print(f"[engine]       OpenAI / {s['voice']}")
        print(f"[instructions] {s['instructions'][:80]}...")
        print(f"[preview]      {s['text'][:80]}...")
        ok = generate_openai_audio(
            text=s["text"],
            output_path=s["output_file"],
            voice=s["voice"],
            instructions=s["instructions"],
        )
        if ok:
            successes += 1

    # --- Summary ---
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Audio generated: {successes}/{total}")
    print()
    print("  BUCKET              ENGINE      FILE")
    print("  ─────────────────── ────────── ─────────────────────────────────────")
    for s in DASHSCOPE_SCENARIOS:
        print(f"  {s['expected_bucket']:<20} DashScope  {s['output_file'].name}")
    for s in OPENAI_SCENARIOS:
        print(f"  {s['expected_bucket']:<20} OpenAI     {s['output_file'].name}")
    print("=" * 60)
