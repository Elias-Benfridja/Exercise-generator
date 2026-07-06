import os 
import json
from google import genai
from dotenv import load_dotenv
from .models import Exercise
from collections import Counter

load_dotenv()

client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))


def build_prompt(topic: str, difficulty: str, examples: list = None) -> str:
    difficulty_criteria = {
        "easy": "a single-step problem requiring direct application of one formula or concept",
        "medium": "a multi-step problem combining two related concepts",
        "hard": "a multi-step problem requiring a non-obvious insight or combining three or more concepts",
    }
    criteria = difficulty_criteria.get(difficulty.lower(), difficulty)

    examples_block = ""
    if examples:
        formatted = "\n".join(
            f'- Question: {ex.question_text}\n  Answer: {ex.answer_text}'
            for ex in examples
        )
        examples_block = f"""
Here are real examples of exercises on this topic, to guide your style,
notation, and difficulty calibration (do not copy them, just match their style):
{formatted}
"""

    return f"""You are a math exercise generator.
Create ONE exercise about the topic "{topic}" at {difficulty} difficulty.

A {difficulty} exercise is defined as: {criteria}.
{examples_block}
Wrap all mathematical notation in single dollar signs for LaTeX rendering,
e.g. "$x^2$", "$\\frac{{2}}{{3}}$", "$\\sqrt{{x+1}}$". Keep surrounding
sentence text in plain English outside the dollar signs.
The answer must be a single final value or simplified expression, also
wrapped in dollar signs if it contains math notation (e.g. "$x = 2$").

Return ONLY a single JSON object, no array, no markdown, no explanation, in exactly this format:
{{
  "topic": "...",
  "question": "...",
  "answer": "..."
}}"""


def get_exercise(topic: str, difficulty: str) -> dict:
    examples = get_similar_exercises(topic)
    prompt = build_prompt(topic, difficulty, examples)
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
    except Exception as e:
        raise Exception(f"Gemini API error: {str(e)}")
    raw = response.text.strip()
    start = raw.index('{')
    end = raw.rindex('}') + 1
    raw = raw[start:end]
    try:
        exercise = json.loads(raw)
    except Exception as e:
        raise Exception(f"Failed to parse Gemini response: {raw}") from e
    saved_exercise = Exercise.objects.create(
        topic=topic.lower(),
        difficulty=Exercise.Difficulty.from_label(difficulty),
        answer_text=exercise["answer"],
        question_text=exercise["question"],
        source='G'
    )
    return saved_exercise

def build_tagging_prompt(exercises: list[str]) -> str:
    numbered = "\n".join(f"{i}: {ex}" for i, ex in enumerate(exercises))
    return f"""You are a math curriculum classifier and solver.

For each exercise below:
1. Identify the specific lesson or concept it tests
   (e.g. "solving quadratic equations by factoring", "law of cosines",
   "integration by substitution").
2. Determine its difficulty.
3. Solve it and give the final answer.

Rules:
- Lesson names must be short (2-6 words), lowercase, and consistent —
  use the same exact wording for exercises testing the same concept.
- Difficulty must be exactly one of: "easy", "medium", "hard".
- The answer must be a single final value or simplified expression,
  not a worked solution.

Exercises:
{numbered}

Return ONLY a JSON array, no markdown, no explanation, with exactly one
object per exercise, in the same order, in this format:
[
  {{"index": 0, "lesson": "...", "difficulty": "...", "answer": "..."}},
  {{"index": 1, "lesson": "...", "difficulty": "...", "answer": "..."}}
]"""


def tag_and_solve_exercises(exercises: list[str]) -> str:
    prompt = build_tagging_prompt(exercises)
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents=prompt
        )
    except Exception as e:
        raise Exception(f"Gemini API error: {str(e)}")
    # Clean and parse response
    raw = response.text.strip()
    start = raw.index('[')
    end = raw.rindex(']') + 1
    raw = raw[start:end]
    try:
        tags = json.loads(raw)
    except Exception as e:
        raise Exception(f"Failed to parse Gemini response: {raw}") from e
    # Save cache
    saved = []
    for tag in tags:
        i = tag["index"]
        if i < 0 or i >= len(exercises):
          continue
        saved.append(Exercise(
            topic=tag["lesson"],
            difficulty=Exercise.Difficulty.from_label(tag["difficulty"]),
            question_text=exercises[i],
            answer_text=tag["answer"],
            source=Exercise.Source.UPLOADED,
        ))

    Exercise.objects.bulk_create(saved)
    return saved

def get_most_common(saved: list, attr: str) -> str:
    if not saved:
        raise Exception(f"No exercises available to compute {attr}")
    values = [getattr(exercise, attr) for exercise in saved]
    counts = Counter(values)
    top_value, _ = counts.most_common(1)[0]
    return top_value

def get_similar_exercises(topic: str, limit: int = 3) -> list:
    return list(Exercise.objects.filter(
        topic__icontains=topic,
        source=Exercise.Source.SEED_DATASET,
    )[:limit])
    

def verify_exercise(exercise_id: int) -> dict:
    try:
        exercise = Exercise.objects.get(id=exercise_id)
    except Exercise.DoesNotExist:
        raise Exception(f"No exercise found with id {exercise_id}")

    prompt = f"""Solve this math problem and give ONLY the final answer,
no explanation, no steps, just the final value or expression.

Problem: {exercise.question_text}"""

    answers = []
    for _ in range(3):
        try:
            result = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=prompt
            )
            normalized = result.text.strip().lower().replace(" ", "")
            answers.append(normalized)
        except Exception as e:
            raise Exception(f"Gemini API error: {str(e)}")

    counts = Counter(answers)
    consensus, votes = counts.most_common(1)[0]
    original_normalized = exercise.answer_text.strip().lower().replace(" ", "")

    return {
        "match": consensus == original_normalized,
        "consensus_answer": consensus,
        "original_answer": exercise.answer_text,
        "votes": votes,
    }