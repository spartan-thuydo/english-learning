#!/usr/bin/env python3
"""
Script to convert listening DOCX files to JSON format
- vocabulary: all words in one array (with definition OR pronunciation OR word type)
- fillInTheBlanks.tasks: grouped by tasks with proper wordBank
"""

from docx import Document
import json
import re

def extract_pronunciation(text):
    """Extract pronunciation from text like '/ˈpɝː.pəs/'"""
    match = re.search(r'/[^/]+/', text)
    return match.group(0) if match else ""

def extract_word_type(text):
    """Extract word type like (n), (v), (adj), (adv)"""
    match = re.search(r'\(([nvadj,]+)\)', text)
    return match.group(1) if match else ""

def is_vocabulary_word(line, next_line):
    """Check if a line is a vocabulary word"""
    # Has pronunciation
    if '/' in line and line.count('/') >= 2:
        return True

    # Has word type (n), (v), (adj), (adv)
    if re.search(r'\([nvadj,]+\)', line):
        return True

    # Next line has definition
    if next_line and next_line.startswith('Definition:'):
        return True

    return False

def parse_vocabulary_line(lines, start_idx):
    """Parse a vocabulary entry from the document lines"""
    vocab = {}

    line = lines[start_idx]

    # Extract word (before tabs or word type)
    # Remove word type and pronunciation first
    word_clean = re.sub(r'\([nvadj,]+\)', '', line)  # Remove (n), (v), etc.
    word_clean = re.sub(r'/[^/]+/', '', word_clean)  # Remove pronunciation
    parts = word_clean.split('\t')
    word = parts[0].strip()

    vocab['word'] = word
    vocab['pronunciation'] = extract_pronunciation(line)

    # Parse definition from next line if exists
    meaning = ""
    if start_idx + 1 < len(lines):
        def_line = lines[start_idx + 1]
        if def_line.startswith('Definition:'):
            meaning = def_line.replace('Definition:', '').strip()

    vocab['meaning'] = meaning
    vocab['definition'] = meaning

    return vocab

def is_valid_question(text):
    """Check if a text line is a valid fill-in-the-blank question"""
    if not ('………' in text or '……' in text):
        return False

    # Skip headers
    if text.startswith('Exercise') or text.startswith('Task'):
        return False

    # Skip if the line is ONLY dots (no actual text)
    text_without_dots = text.replace('…', '').replace('.', '').strip()
    if len(text_without_dots) < 5:
        return False

    # Skip lines that are just blank separators
    if text.count('…') > 50:
        return False

    return True

def parse_docx_to_json(docx_path, unit_number, title):
    """Parse DOCX file and convert to JSON structure"""

    doc = Document(docx_path)

    # Extract all paragraphs
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

    # Initialize JSON structure
    data = {
        "metadata": {
            "unit": f"Unit {unit_number}",
            "title": title
        },
        "vocabulary": [],
        "fillInTheBlanks": {
            "instructions": "Complete the sentences using the words from the box.",
            "tasks": []
        }
    }

    # Parse vocabulary and tasks
    current_task = None
    current_task_vocab_words = []  # Track vocab words for current task
    vocab_id = 1
    fib_id = 1

    i = 0
    while i < len(paragraphs):
        line = paragraphs[i]
        next_line = paragraphs[i + 1] if i + 1 < len(paragraphs) else ""

        # Detect Task header
        if line.startswith('Task'):
            # Save previous task if exists
            if current_task and (current_task['wordBank'] or current_task['questions']):
                data['fillInTheBlanks']['tasks'].append(current_task)

            # Start new task
            task_number = len(data['fillInTheBlanks']['tasks']) + 1
            current_task = {
                "id": f"task_{task_number}",
                "title": line,
                "wordBank": [],
                "questions": []
            }
            current_task_vocab_words = []
            i += 1
            continue

        # Detect Exercise header - now we need to find wordBank
        if line.startswith('Exercise') and current_task:
            # Look backward from here to find the word list (before "Exercise")
            # Typically there's a line like "Từ vựng: word1, word2, word3..."
            # Or the words are listed above
            j = i - 1
            temp_words = []

            # Look for word list in previous few lines
            while j >= 0 and j > i - 20:  # Check up to 20 lines back
                prev_line = paragraphs[j]

                # Stop if we hit another Exercise or Task
                if prev_line.startswith('Task') or prev_line.startswith('Exercise'):
                    break

                # Check if this line lists words (contains commas or is a vocabulary word)
                # Common patterns: "Từ vựng: word1 / word2 / word3"
                if any(keyword in prev_line.lower() for keyword in ['từ vựng:', 'round', 'vocabulary:']):
                    # Extract words after colon
                    if ':' in prev_line:
                        words_part = prev_line.split(':', 1)[1]
                        # Split by / or comma
                        words = re.split(r'[/,]', words_part)
                        temp_words = [w.strip() for w in words if w.strip()]
                        break

                j -= 1

            # If we found words, use them; otherwise use vocabulary from current task
            if temp_words:
                current_task['wordBank'] = temp_words
            else:
                current_task['wordBank'] = current_task_vocab_words.copy()

            # Collect questions for this exercise
            i += 1
            while i < len(paragraphs):
                next_line = paragraphs[i]

                # Stop if we hit next Task or Exercise
                if next_line.startswith('Task') or next_line.startswith('Exercise'):
                    break

                # Check if it's a valid question
                if is_valid_question(next_line):
                    question = {
                        "id": f"fib_{fib_id:03d}",
                        "sentence": next_line,
                        "answer": "",
                        "translation": ""
                    }
                    current_task['questions'].append(question)
                    fib_id += 1

                i += 1

            continue

        # Parse vocabulary (if we're in a task and it's a vocab word)
        if current_task and is_vocabulary_word(line, next_line):
            vocab = parse_vocabulary_line(paragraphs, i)
            if vocab.get('word'):
                vocab['id'] = f"word_{vocab_id:03d}"
                vocab['exampleSimple'] = ""

                # Add to main vocabulary array
                data['vocabulary'].append(vocab)

                # Track for current task
                current_task_vocab_words.append(vocab['word'])

                vocab_id += 1

            # Skip next line if it's a definition
            if next_line.startswith('Definition:'):
                i += 2
            else:
                i += 1
            continue

        i += 1

    # Don't forget to save the last task
    if current_task and (current_task['wordBank'] or current_task['questions']):
        data['fillInTheBlanks']['tasks'].append(current_task)

    # Remove empty tasks
    data['fillInTheBlanks']['tasks'] = [
        task for task in data['fillInTheBlanks']['tasks']
        if task['wordBank'] or task['questions']
    ]

    return data

def main():
    """Main conversion function"""

    files_to_convert = [
        {
            "path": "lessons/listening/Unit 1 - PRE-CLASS.docx",
            "unit": "1",
            "title": "Dolphin Conservation Trust",
            "output": "public/lessons/json/unit1-listening.json"
        },
        {
            "path": "lessons/listening/Unit 2 - PRE-CLASS - PS CAMPING.docx",
            "unit": "2",
            "title": "PS Camping",
            "output": "public/lessons/json/unit2-listening.json"
        },
        {
            "path": "lessons/listening/Unit 3 - PRE-CLASS - a.VOLUNTEERING.docx",
            "unit": "3",
            "title": "Volunteering Work",
            "output": "public/lessons/json/unit3-listening.json"
        }
    ]

    for file_info in files_to_convert:
        print(f"\nConverting {file_info['path']}...")

        try:
            data = parse_docx_to_json(
                file_info['path'],
                file_info['unit'],
                file_info['title']
            )

            # Save to JSON file
            with open(file_info['output'], 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            print(f"✓ Saved to {file_info['output']}")
            print(f"  - Vocabulary: {len(data['vocabulary'])} words (all in one array)")
            print(f"  - Fill-in-blank tasks: {len(data['fillInTheBlanks']['tasks'])}")

            total_questions = sum(
                len(task['questions'])
                for task in data['fillInTheBlanks']['tasks']
            )
            print(f"  - Total questions: {total_questions}")

            # Show task breakdown
            for task in data['fillInTheBlanks']['tasks']:
                print(f"    • {task['id']}: {len(task['wordBank'])} words in bank, {len(task['questions'])} questions")

        except Exception as e:
            print(f"✗ Error: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    main()
