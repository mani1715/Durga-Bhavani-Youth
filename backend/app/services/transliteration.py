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
