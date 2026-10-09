import logging
from typing import List, Optional
import httpx

logger = logging.getLogger(__name__)

class TransliterationProvider:
    def transliterate_to_telugu(self, text: str) -> List[str]:
        raise NotImplementedError

class GoogleInputToolsTeluguProvider(TransliterationProvider):
    """
    Telugu transliteration provider using Google Input Tools API.
    Does not require external API keys. Fast, phonetic, highly accurate for Indian names.
    Sends ONLY the raw name string; no PII, amounts, phones, or addresses are ever transmitted.
    """
    ENDPOINT = "https://inputtools.google.com/request"

    def transliterate_to_telugu(self, text: str) -> List[str]:
        cleaned = text.strip()
        if not cleaned:
            return []

        # If already Telugu characters, return as-is
        # Telugu unicode range: \u0C00 - \u0C7F
        if any('\u0c00' <= char <= '\u0c7f' for char in cleaned):
            return [cleaned]

        words = cleaned.split()
        if not words:
            return []

        try:
            # Handle multi-word names cleanly by transliterating tokens
            word_suggestions = []
            with httpx.Client(timeout=4.0) as client:
                for word in words:
                    # If token is pure symbols or numbers, keep as-is
                    if not any(c.isalpha() for c in word):
                        word_suggestions.append([word])
                        continue

                    resp = client.get(
                        self.ENDPOINT,
                        params={"text": word, "itc": "te-t-i0-und", "num": 5, "cp": 0, "cs": 1, "ie": "utf-8", "oe": "utf-8"}
                    )
                    if resp.status_code == 200:
                        data = resp.json()
                        if data and data[0] == "SUCCESS" and len(data) > 1 and data[1]:
                            candidates = data[1][0][1]
                            word_suggestions.append(candidates if candidates else [word])
                        else:
                            word_suggestions.append([word])
                    else:
                        word_suggestions.append([word])

            # Combine primary suggestions
            if word_suggestions:
                # Primary full phrase
                primary = " ".join(candidates[0] for candidates in word_suggestions)
                results = [primary]
                # Additional alternatives if first word has multiple
                if len(word_suggestions[0]) > 1:
                    for alt in word_suggestions[0][1:3]:
                        alt_phrase = " ".join([alt] + [w[0] for w in word_suggestions[1:]])
                        if alt_phrase not in results:
                            results.append(alt_phrase)
                return results

            return []
        except Exception as e:
            logger.warning(f"Transliteration lookup failed (graceful degradation): {e}")
            return []

_transliteration_provider = GoogleInputToolsTeluguProvider()

def get_transliteration_provider() -> TransliterationProvider:
    return _transliteration_provider

# Standard Puja Materials & Ritual Terms Dictionary
PUJA_TERMS_DICTIONARY = {
    "coconut": "కొబ్బరికాయ",
    "coconuts": "కొబ్బరికాయలు",
    "turmeric": "పసుపు",
    "pasupu": "పసుపు",
    "kumkum": "కుంకుమ",
    "kumkuma": "కుంకుమ",
    "flower": "పువ్వు",
    "flowers": "పుష్పాలు / పూలు",
    "garland": "పూలమాల",
    "garlands": "పూలమాలలు",
    "fruits": "పండ్లు",
    "fruit": "పండు",
    "camphor": "కర్పూరం",
    "karpooram": "కర్పూరం",
    "incense": "అగరబత్తులు",
    "incense stick": "అగరబత్తి",
    "incense sticks": "అగరబత్తులు",
    "agarbathi": "అగరబత్తులు",
    "agarbatti": "అగరబత్తులు",
    "betel leaf": "తమలపాకు",
    "betel leaves": "తమలపాకులు",
    "tamalapakulu": "తమలపాకులు",
    "betel nuts": "వక్కలు",
    "vakkalu": "వక్కలు",
    "ghee": "ఆవు నెయ్యి",
    "neyyi": "నెయ్యి",
    "oil": "దీపపు నూనె",
    "sesame oil": "నువ్వుల నూనె",
    "milk": "ఆవు పాలు",
    "curd": "పెరుగు",
    "honey": "తేనె",
    "sugar": "పంచదార",
    "jaggery": "బెల్లం",
    "bellam": "బెల్లం",
    "rice": "బియ్యం",
    "biyyam": "బియ్యం",
    "akshinthalu": "అక్షింతలు",
    "akshintalu": "అక్షింతలు",
    "sandalwood": "గంధం",
    "gandham": "గంధం",
    "banana": "అరటిపండు",
    "bananas": "అరటిపండ్లు",
    "arati pandlu": "అరటిపండ్లు",
    "blouse piece": "జాకెట్ గుడ్డ (రవికెల ముక్క)",
    "kalasam": "కలశం",
    "kalash": "కలశం",
    "coin": "నాణెం",
    "coins": "నాణేలు",
    "dakshina": "దక్షిణ",
    "cotton wicks": "దీపపు వత్తులు",
    "wicks": "వత్తులు",
    "vattulu": "వత్తులు",
    "matchbox": "అగ్గిపెట్టె",
    "lamp": "దీపపు కుంది",
    "deepam": "దీపం",
    "bell": "పూజా గంట",
    "harathi": "హారతి",
    "harathi plate": "హారతి పళ్లెం",
    "mango leaves": "మామిడి ఆకులు",
    "panchamrutam": "పంచామృతం",
    "prasadam": "ప్రసాదం / నైవేద్యం",
    "naivedyam": "నైవేద్యం",
    "cloth": "వస్త్రం",
    "red cloth": "ఎరుపు వస్త్రం",
    "yellow cloth": "పసుపు వస్త్రం",
    "white cloth": "తెలుపు వస్త్రం",
    "dry fruits": "ఎండు ఫలాలు (డ్రై ఫ్రూట్స్)",
    "dates": "ఖర్జూరం",
    "cashew": "జీడిపప్పు",
    "raisins": "కిస్మిస్",
    "cardamom": "యాలకులు",
    "cloves": "లవంగాలు",
}

def suggest_telugu_text(text: str, context: str = "name") -> dict:
    """
    Returns suggested Telugu text:
    - If context is 'name': Uses phonetic transliteration (Google Input Tools).
    - If context is 'material' or 'instruction': Checks puja terms dictionary first,
      then falls back to transliteration.
    - If input already contains Telugu letters, returns as-is.
    """
    cleaned = (text or "").strip()
    if not cleaned:
        return {"original": "", "suggestion": "", "alternatives": []}

    # Already Telugu?
    if any('\u0c00' <= char <= '\u0c7f' for char in cleaned):
        return {"original": cleaned, "suggestion": cleaned, "alternatives": [cleaned]}

    lower_cleaned = cleaned.lower()

    # Dictionary match for materials
    if context in ("material", "instruction", "general"):
        if lower_cleaned in PUJA_TERMS_DICTIONARY:
            telugu_term = PUJA_TERMS_DICTIONARY[lower_cleaned]
            return {"original": cleaned, "suggestion": telugu_term, "alternatives": [telugu_term]}
        # Multi-word partial dictionary check
        for k, v in PUJA_TERMS_DICTIONARY.items():
            if k == lower_cleaned:
                return {"original": cleaned, "suggestion": v, "alternatives": [v]}

    # Fallback to phonetic transliteration
    suggestions = _transliteration_provider.transliterate_to_telugu(cleaned)
    primary = suggestions[0] if suggestions else cleaned
    return {
        "original": cleaned,
        "suggestion": primary,
        "alternatives": suggestions
    }

