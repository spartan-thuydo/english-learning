#!/usr/bin/env python3
"""
Auto-fill missing pronunciation, definition, meaning, and examples for vocabulary
Uses Dictionary API and MyMemory Translation API
"""

import json
import requests
import time
from typing import Dict, Optional

# API Endpoints
DICTIONARY_API = "https://api.dictionaryapi.dev/api/v2/entries/en"
MYMEMORY_TRANSLATE_API = "https://api.mymemory.translated.net/get"

def fetch_from_dictionary_api(word: str) -> Optional[Dict]:
    """
    Fetch word data from Dictionary API
    Returns: {pronunciation, definition, examples, partOfSpeech, synonyms}
    """
    try:
        url = f"{DICTIONARY_API}/{word}"
        response = requests.get(url, timeout=10)

        if response.status_code != 200:
            print(f"  ⚠ Dictionary API failed for '{word}': {response.status_code}")
            return None

        data = response.json()
        if not data or len(data) == 0:
            return None

        entry = data[0]
        meanings = entry.get('meanings', [])

        # Prioritize common parts of speech
        priority_order = ['pronoun', 'verb', 'adjective', 'adverb', 'noun']
        meaning = None

        for pos in priority_order:
            meaning = next((m for m in meanings if m.get('partOfSpeech') == pos), None)
            if meaning:
                break

        if not meaning:
            meaning = meanings[0] if meanings else {}

        definitions = meaning.get('definitions', [])
        definition_obj = definitions[0] if definitions else {}

        # Extract phonetic
        phonetic = entry.get('phonetic', '')
        if not phonetic and entry.get('phonetics'):
            for p in entry.get('phonetics', []):
                if p.get('text'):
                    phonetic = p['text']
                    break

        return {
            'pronunciation': phonetic,
            'definition': definition_obj.get('definition', ''),
            'exampleSimple': definition_obj.get('example', ''),
            'partOfSpeech': meaning.get('partOfSpeech', ''),
            'synonyms': definition_obj.get('synonyms', [])
        }

    except Exception as e:
        print(f"  ⚠ Error fetching from Dictionary API for '{word}': {e}")
        return None


def translate_to_vietnamese(text: str) -> str:
    """
    Translate text to Vietnamese using MyMemory Translation API
    """
    if not text or text.strip() == '':
        return ''

    try:
        url = f"{MYMEMORY_TRANSLATE_API}?q={requests.utils.quote(text)}&langpair=en|vi"
        response = requests.get(url, timeout=10)

        if response.status_code != 200:
            print(f"  ⚠ Translation API failed: {response.status_code}")
            return ''

        data = response.json()
        if data.get('responseData') and data['responseData'].get('translatedText'):
            return data['responseData']['translatedText']

        return ''

    except Exception as e:
        print(f"  ⚠ Error translating: {e}")
        return ''


def auto_fill_word(word: Dict, index: int, total: int) -> Dict:
    """
    Auto-fill missing data for a single vocabulary word
    """
    word_text = word.get('word', '')

    if not word_text:
        return word

    print(f"\n[{index + 1}/{total}] Processing: {word_text}")

    # Check what's missing
    needs_pronunciation = not word.get('pronunciation')
    needs_definition = not word.get('definition')
    needs_meaning = not word.get('meaning')
    needs_example = not word.get('exampleSimple')
    needs_pos = not word.get('pos')

    # If everything is filled, skip
    if not (needs_pronunciation or needs_definition or needs_meaning or needs_example or needs_pos):
        print(f"  ✓ Already complete")
        return word

    # For phrases with multiple words, skip Dictionary API (won't work well)
    is_phrase = len(word_text.split()) > 1 or '/' in word_text or 'sth' in word_text.lower()

    if is_phrase:
        print(f"  ℹ Detected phrase, using translation only")

        # For phrases, just translate if needed
        if needs_meaning:
            meaning = translate_to_vietnamese(word_text)
            if meaning:
                word['meaning'] = meaning
                print(f"  ✓ Meaning: {meaning}")
            time.sleep(0.5)  # Rate limiting

        # Set empty values for other fields
        if needs_pronunciation:
            word['pronunciation'] = ''
        if needs_definition:
            word['definition'] = word_text
        if needs_example:
            word['exampleSimple'] = ''
        if needs_pos:
            word['pos'] = ''

        return word

    # For single words, use Dictionary API
    api_data = fetch_from_dictionary_api(word_text)

    if api_data:
        # Fill pronunciation
        if needs_pronunciation and api_data.get('pronunciation'):
            word['pronunciation'] = api_data['pronunciation']
            print(f"  ✓ Pronunciation: {api_data['pronunciation']}")

        # Fill definition
        if needs_definition and api_data.get('definition'):
            word['definition'] = api_data['definition']
            print(f"  ✓ Definition: {api_data['definition'][:60]}...")

        # Fill example
        if needs_example and api_data.get('exampleSimple'):
            word['exampleSimple'] = api_data['exampleSimple']
            print(f"  ✓ Example: {api_data['exampleSimple'][:60]}...")

        # Fill part of speech
        if needs_pos and api_data.get('partOfSpeech'):
            word['pos'] = api_data['partOfSpeech']
            print(f"  ✓ POS: {api_data['partOfSpeech']}")

        # Translate definition to Vietnamese if needed
        if needs_meaning and api_data.get('definition'):
            time.sleep(0.5)  # Rate limiting for translation API
            meaning = translate_to_vietnamese(api_data['definition'])
            if meaning:
                word['meaning'] = meaning
                print(f"  ✓ Meaning (VN): {meaning[:60]}...")

    else:
        print(f"  ⚠ Dictionary API returned no data")

        # Fallback: just translate the word
        if needs_meaning:
            time.sleep(0.5)
            meaning = translate_to_vietnamese(word_text)
            if meaning:
                word['meaning'] = meaning
                print(f"  ✓ Meaning (fallback): {meaning}")

    # Small delay to respect API rate limits
    time.sleep(0.3)

    return word


def auto_fill_vocabulary(data: Dict) -> Dict:
    """
    Auto-fill missing data for all vocabulary words
    """
    vocabulary = data.get('vocabulary', [])
    total = len(vocabulary)

    print(f"\n{'='*60}")
    print(f"Auto-filling {total} vocabulary words...")
    print(f"{'='*60}")

    for i, word in enumerate(vocabulary):
        word = auto_fill_word(word, i, total)

    return data


def auto_fill_reading_translations(data: Dict) -> Dict:
    """
    Auto-fill missing translations for reading paragraphs
    """
    reading = data.get('reading', {})
    paragraphs = reading.get('paragraphs', [])

    if not paragraphs:
        return data

    print(f"\n{'='*60}")
    print(f"Auto-filling reading translations...")
    print(f"{'='*60}")

    for i, para in enumerate(paragraphs):
        para_id = para.get('id', f'para_{i}')
        text = para.get('text', '')

        # Skip if already has translation
        if para.get('translation'):
            print(f"[{i+1}/{len(paragraphs)}] {para_id}: ✓ Already has translation")
            continue

        if not text:
            print(f"[{i+1}/{len(paragraphs)}] {para_id}: ⚠ No text to translate")
            continue

        print(f"[{i+1}/{len(paragraphs)}] {para_id}: Translating {len(text)} chars...")

        # Translate paragraph (may need to split if too long)
        # MyMemory has 500 char limit per request
        if len(text) > 450:
            # Split into sentences and translate separately
            import re
            sentences = re.split(r'(?<=[.!?])\s+', text)
            translated_parts = []

            for sentence in sentences:
                if sentence.strip():
                    time.sleep(0.5)  # Rate limiting
                    translation = translate_to_vietnamese(sentence)
                    if translation:
                        translated_parts.append(translation)
                    else:
                        translated_parts.append(sentence)

            para['translation'] = ' '.join(translated_parts)
        else:
            time.sleep(0.5)  # Rate limiting
            translation = translate_to_vietnamese(text)
            para['translation'] = translation if translation else ''

        if para['translation']:
            print(f"  ✓ Translated: {para['translation'][:80]}...")
        else:
            print(f"  ⚠ Translation failed")

        # MainIdea is left empty for manual input
        if not para.get('mainIdea'):
            para['mainIdea'] = ''

    return data


def auto_fill_fillInTheBlanks_translations(data: Dict) -> Dict:
    """
    Auto-fill missing translations and answers for fill-in-the-blank questions
    """
    fib = data.get('fillInTheBlanks', {})
    tasks = fib.get('tasks', [])

    if not tasks:
        return data

    print(f"\n{'='*60}")
    print(f"Auto-filling fill-in-the-blank translations...")
    print(f"{'='*60}")

    for task_idx, task in enumerate(tasks):
        task_id = task.get('id', f'task_{task_idx}')
        questions = task.get('questions', [])

        if not questions:
            continue

        print(f"\nTask {task_id}: {len(questions)} questions")

        for q_idx, question in enumerate(questions):
            q_id = question.get('id', f'q_{q_idx}')
            sentence = question.get('sentence', '')

            # Skip if already has translation
            if question.get('translation'):
                continue

            if not sentence:
                continue

            # Translate sentence
            time.sleep(0.5)  # Rate limiting
            translation = translate_to_vietnamese(sentence)

            if translation:
                question['translation'] = translation
                print(f"  [{q_idx+1}/{len(questions)}] {q_id}: ✓ Translated")
            else:
                question['translation'] = ''
                print(f"  [{q_idx+1}/{len(questions)}] {q_id}: ⚠ Translation failed")

            # Answer is left empty for manual input
            if not question.get('answer'):
                question['answer'] = ''

    return data


def main():
    """
    Main function - process JSON files
    """
    import sys

    # Check if file path is provided
    if len(sys.argv) > 1:
        files = [sys.argv[1]]
    else:
        # Default files - all lessons
        files = [
            # Listening lessons
            'public/lessons/json/unit1-listening.json',
            'public/lessons/json/unit2-listening.json',
            'public/lessons/json/unit3-listening.json',
            # Reading lessons
            'public/lessons/json/unit1-reading.json',
            'public/lessons/json/unit2-reading-australian.json',
            'public/lessons/json/unit2-reading-autumn.json',
            'public/lessons/json/unit3-reading-malaria.json',
            'public/lessons/json/unit3-reading-mekete.json',
            'public/lessons/json/unit3-reading-sahara.json',
            'public/lessons/json/unit4-reading.json',
            'public/lessons/json/unit4-reading-name.json',
            'public/lessons/json/unit4-should-we-try.json',
            'public/lessons/json/unit5-reading-crops.json',
            'public/lessons/json/unit5-reading-organic.json',
            'public/lessons/json/unit5-reading-stadium.json',
        ]

    for filename in files:
        print(f"\n{'='*60}")
        print(f"Processing: {filename}")
        print(f"{'='*60}")

        try:
            # Load JSON
            with open(filename, 'r', encoding='utf-8') as f:
                data = json.load(f)

            # Auto-fill missing data
            data = auto_fill_vocabulary(data)
            data = auto_fill_reading_translations(data)
            # Skip fillInTheBlanks translation - questions have blanks, translation not useful yet

            # Save back
            with open(filename, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            # Statistics
            vocab = data.get('vocabulary', [])
            filled_meaning = sum(1 for w in vocab if w.get('meaning'))
            filled_definition = sum(1 for w in vocab if w.get('definition'))
            filled_pronunciation = sum(1 for w in vocab if w.get('pronunciation'))
            filled_example = sum(1 for w in vocab if w.get('exampleSimple'))

            # Reading statistics
            reading = data.get('reading', {})
            paragraphs = reading.get('paragraphs', [])
            filled_translations = sum(1 for p in paragraphs if p.get('translation'))

            print(f"\n{'='*60}")
            print(f"✅ Completed: {filename}")
            print(f"{'='*60}")
            print(f"  Vocabulary: {len(vocab)} words")
            print(f"    - With meaning (VN): {filled_meaning}/{len(vocab)}")
            print(f"    - With definition (EN): {filled_definition}/{len(vocab)}")
            print(f"    - With pronunciation: {filled_pronunciation}/{len(vocab)}")
            print(f"    - With examples: {filled_example}/{len(vocab)}")
            if paragraphs:
                print(f"  Reading: {len(paragraphs)} paragraphs")
                print(f"    - With translation: {filled_translations}/{len(paragraphs)}")

        except FileNotFoundError:
            print(f"⚠ File not found: {filename}, skipping...")
        except Exception as e:
            print(f"✗ Error processing {filename}: {e}")
            import traceback
            traceback.print_exc()

    print(f"\n{'='*60}")
    print("✅ Auto-fill completed!")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
