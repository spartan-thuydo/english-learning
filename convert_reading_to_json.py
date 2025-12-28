#!/usr/bin/env python3
"""
Script to convert reading DOCX files to JSON format
Includes: metadata, vocabulary, reading (with paragraphs), fillInTheBlanks
"""

from docx import Document
import json
import re

def extract_pronunciation(text):
    """Extract pronunciation from text like '/ˈpɝː.pəs/'"""
    match = re.search(r'/[^/]+/', text)
    return match.group(0) if match else ""

def extract_pos(text):
    """Extract part of speech like (n), (v), (adj), (adv)"""
    match = re.search(r'\(([nvadj,]+)\)', text)
    return match.group(1) if match else ""

def extract_meaning(text):
    """Extract meaning after colon"""
    if ':' in text:
        parts = text.split(':', 1)
        return parts[1].strip()
    return ""

def parse_vocabulary_line(line):
    """
    Parse vocabulary from format:
    Disease 		(n) 	/ˈdɪˌziːz/ 		: bệnh tật
    """
    # Clean multiple tabs/spaces
    line = re.sub(r'\s+', ' ', line)

    # Extract components
    pronunciation = extract_pronunciation(line)
    pos = extract_pos(line)
    meaning = extract_meaning(line)

    # Extract word (before pronunciation or pos)
    word = line
    if pronunciation:
        word = line.split(pronunciation)[0]
    word = re.sub(r'\([^)]+\)', '', word).strip()

    return {
        'word': word,
        'pronunciation': pronunciation,
        'pos': pos,
        'meaning': meaning,
        'definition': '',
        'exampleSimple': ''
    }

def is_vocabulary_line(line):
    """Check if line is a vocabulary entry"""
    # Has pronunciation OR part of speech OR colon
    return bool(
        re.search(r'/[^/]+/', line) or
        re.search(r'\([nvadj,]+\)', line) or
        (':' in line and len(line.split(':')) == 2)
    )

def is_paragraph_marker(line):
    """Check if line is a paragraph marker like 'A. Main idea:' or 'SEARCHING FOR NEW MEDICINES.'"""
    # Match A., B., C., etc. OR all caps title
    return bool(
        re.match(r'^[A-Z]\.\s+Main idea:', line) or
        (line.isupper() and len(line.split()) >= 2)
    )

def parse_reading_docx(docx_path, unit_number):
    """Parse reading DOCX file and convert to JSON structure"""

    doc = Document(docx_path)

    # Extract all paragraphs
    paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

    # Initialize JSON structure
    data = {
        "metadata": {
            "unit": f"Unit {unit_number}",
            "title": ""
        },
        "vocabulary": [],
        "reading": {
            "title": "",
            "paragraphs": []
        },
        "fillInTheBlanks": {
            "instructions": "Complete the sentences using the words from the box.",
            "tasks": []
        }
    }

    # State tracking
    vocab_id = 1
    fib_id = 1
    current_task = None
    current_paragraph = None
    reading_started = False

    i = 0
    while i < len(paragraphs):
        line = paragraphs[i]

        # Detect reading title (all caps ending with period, like "SEARCHING FOR NEW MEDICINES.")
        # Skip "READING COMPREHENSION:" which is just a section header
        if line.isupper() and len(line.split()) >= 2 and not reading_started:
            # Only accept if it ends with period (actual title) or doesn't contain colon
            if line.endswith('.') or ':' not in line:
                # Remove trailing period
                title = line.rstrip('.')
                data['reading']['title'] = title
                data['metadata']['title'] = title
                reading_started = True
                i += 1
                continue

        # Detect paragraph marker (A. Main idea:, B. Main idea:, etc.)
        if re.match(r'^([A-G])\.\s+Main idea:', line):
            # Save previous paragraph if exists
            if current_paragraph and current_paragraph.get('text'):
                data['reading']['paragraphs'].append(current_paragraph)

            # Extract paragraph letter
            para_letter = line[0].lower()

            # Start new paragraph
            current_paragraph = {
                "id": f"para_{para_letter}",
                "label": para_letter.upper(),
                "text": "",
                "translation": "",
                "mainIdea": ""
            }
            i += 1

            # Collect inline vocabulary and content for this paragraph
            while i < len(paragraphs):
                next_line = paragraphs[i]

                # Stop if we hit next paragraph marker or end
                if re.match(r'^[A-G]\.\s+Main idea:', next_line):
                    break

                # Check if it's vocabulary note (word followed by translation)
                # Format: "Rainforest (n): rừng mưa nhiệt đới"
                # We'll skip these - they're already in vocabulary section
                if is_vocabulary_line(next_line) and ':' in next_line:
                    i += 1
                    continue

                # Skip if it's main idea placeholder
                if '………' in next_line:
                    i += 1
                    continue

                # Accumulate text content
                if next_line and not next_line.startswith('Task'):
                    if current_paragraph['text']:
                        current_paragraph['text'] += ' '
                    current_paragraph['text'] += next_line

                i += 1

            continue

        # Parse vocabulary from Task 1
        if line.startswith('Task 1:') or line.startswith('Task 1 :'):
            i += 1
            # Collect vocabulary until Task 2
            while i < len(paragraphs):
                vocab_line = paragraphs[i]

                if vocab_line.startswith('Task'):
                    break

                if is_vocabulary_line(vocab_line):
                    vocab = parse_vocabulary_line(vocab_line)
                    if vocab.get('word'):
                        vocab['id'] = f"word_{vocab_id:03d}"
                        data['vocabulary'].append(vocab)
                        vocab_id += 1

                i += 1
            continue

        # Parse fill-in-the-blank tasks (similar to listening)
        if line.startswith('Task') and 'Task 1' not in line:
            # Save previous task
            if current_task and (current_task.get('wordBank') or current_task.get('questions')):
                data['fillInTheBlanks']['tasks'].append(current_task)

            task_number = len(data['fillInTheBlanks']['tasks']) + 1
            current_task = {
                "id": f"task_{task_number}",
                "title": line,
                "wordBank": [],
                "questions": []
            }

            i += 1

            # Collect word bank and questions
            temp_words = []
            while i < len(paragraphs):
                next_line = paragraphs[i]

                # Stop if we hit another Task or reading section
                if next_line.startswith('Task') or is_paragraph_marker(next_line):
                    break

                # Check if it's a word for word bank
                # Single word lines between task header and questions
                if len(next_line.split()) == 1 and next_line.isalpha():
                    temp_words.append(next_line.strip())
                    i += 1
                    continue

                # Check if it's a question (contains blanks __)
                if '__' in next_line or '………' in next_line:
                    # If we have accumulated words, use them as word bank
                    if temp_words and not current_task['wordBank']:
                        current_task['wordBank'] = temp_words.copy()
                        temp_words = []

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

        i += 1

    # Save last paragraph
    if current_paragraph and current_paragraph.get('text'):
        data['reading']['paragraphs'].append(current_paragraph)

    # Save last task
    if current_task and (current_task.get('wordBank') or current_task.get('questions')):
        data['fillInTheBlanks']['tasks'].append(current_task)

    # Remove empty tasks
    data['fillInTheBlanks']['tasks'] = [
        task for task in data['fillInTheBlanks']['tasks']
        if task.get('wordBank') or task.get('questions')
    ]

    return data

def main():
    """Main conversion function"""

    files_to_convert = [
        {
            "path": "lessons/reading/Unit 1 - c.Saving bugs to find new drug - đọc hiểu.docx",
            "unit": "1",
            "output": "public/lessons/json/unit1-reading.json"
        },
        {
            "path": "lessons/reading/Unit 2 - c. AUSTRALIAN CULTURE - đọc hiểu.docx",
            "unit": "2",
            "output": "public/lessons/json/unit2-reading-australian.json"
        },
        {
            "path": "lessons/reading/Unit 2 - c.Autumn leaves - đọc hiểu.docx",
            "unit": "2",
            "output": "public/lessons/json/unit2-reading-autumn.json"
        },
        {
            "path": "lessons/reading/Unit 3 - c. Battle against malaria.docx",
            "unit": "3",
            "output": "public/lessons/json/unit3-reading-malaria.json"
        },
        {
            "path": "lessons/reading/Unit 3 - c.Mekete project - đọc hiểu.docx",
            "unit": "3",
            "output": "public/lessons/json/unit3-reading-mekete.json"
        },
        {
            "path": "lessons/reading/Unit 3 - c.Sahara.docx",
            "unit": "3",
            "output": "public/lessons/json/unit3-reading-sahara.json"
        },
        {
            "path": "lessons/reading/Unit 4 - c. SEARCHING FOR NEW MEDICINES - đọc hiểu.docx",
            "unit": "4",
            "output": "public/lessons/json/unit4-reading.json"
        },
        {
            "path": "lessons/reading/Unit 4 - c. WHAT'S IN THE NAME.docx",
            "unit": "4",
            "output": "public/lessons/json/unit4-reading-name.json"
        },
        {
            "path": "lessons/reading/Unit 4 - c.Should we try - đọc hiểu.docx",
            "unit": "4",
            "output": "public/lessons/json/unit4-should-we-try.json"
        },
        {
            "path": "lessons/reading/Unit 5 - c. Crop-growing skyscrapers.docx",
            "unit": "5",
            "output": "public/lessons/json/unit5-reading-crops.json"
        },
        {
            "path": "lessons/reading/Unit 5 - c.ORGANIC FOOD.docx",
            "unit": "5",
            "output": "public/lessons/json/unit5-reading-organic.json"
        },
        {
            "path": "lessons/reading/Unit 5 - stadium - file word.docx",
            "unit": "5",
            "output": "public/lessons/json/unit5-reading-stadium.json"
        }
    ]

    success_count = 0
    fail_count = 0

    for file_info in files_to_convert:
        print(f"\n{'='*60}")
        print(f"Converting: {file_info['path']}")
        print(f"{'='*60}")

        try:
            data = parse_reading_docx(
                file_info['path'],
                file_info['unit']
            )

            # Save to JSON file
            with open(file_info['output'], 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

            print(f"✓ Saved to {file_info['output']}")
            print(f"  - Title: {data['metadata']['title']}")
            print(f"  - Vocabulary: {len(data['vocabulary'])} words")
            print(f"  - Reading paragraphs: {len(data['reading']['paragraphs'])}")
            print(f"  - Fill-in-blank tasks: {len(data['fillInTheBlanks']['tasks'])}")

            # Show paragraph breakdown
            for para in data['reading']['paragraphs']:
                char_count = len(para.get('text', ''))
                print(f"    • {para['id']} ({para['label']}): {char_count} chars")

            # Show task breakdown
            total_questions = sum(len(task['questions']) for task in data['fillInTheBlanks']['tasks'])
            print(f"  - Total questions: {total_questions}")

            success_count += 1

        except Exception as e:
            print(f"✗ Error: {e}")
            import traceback
            traceback.print_exc()
            fail_count += 1

    print(f"\n{'='*60}")
    print(f"Conversion Summary:")
    print(f"{'='*60}")
    print(f"✓ Success: {success_count}/{len(files_to_convert)}")
    print(f"✗ Failed: {fail_count}/{len(files_to_convert)}")

if __name__ == "__main__":
    main()
