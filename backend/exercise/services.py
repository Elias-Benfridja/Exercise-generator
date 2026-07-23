import os 
import json
from google import genai
from groq import Groq
from dotenv import load_dotenv
from .models import Exercise
from collections import Counter
import joblib
from google.genai import types
from django.contrib.auth.models import User

load_dotenv()

# Gemini is kept only for tag_and_solve_from_file, since it's the one
# function that sends raw file bytes (PDF/image) for multimodal
# understanding — Groq's free tier doesn't support PDF input.
gemini_client = genai.Client(api_key=os.environ.get('GEMINI_API_KEY'))

# Groq handles every plain-text generation/tagging call, since its free
# tier has no credit-card requirement and higher practical throughput
# for demo purposes than Gemini's free tier.
groq_client = Groq(api_key=os.environ.get('GROQ_API_KEY'))
GROQ_MODEL = "llama-3.3-70b-versatile"


_DIFFICULTY_WEIGHT = {"E": 3, "M": 2, "H": 1}

_INTERVAL_BY_WEIGHT_SUM = {
    2: 1,
    3: 2,
    4: 3,
    5: 5,
    6: 7,
}

_WEAKNESS_POINTS = {
    ('H', 'H'): 2, ('H', 'M'): 1, ('H', 'E'): 0,
    ('M', 'H'): 3, ('M', 'M'): 1, ('M', 'E'): 0,
    ('E', 'H'): 4, ('E', 'M'): 2, ('E', 'E'): 0,
}

RECENT_PIN_WINDOW = 5

_ml_models_dir = os.path.join(os.path.dirname(__file__), "ml_models")
_vectorizer = joblib.load(os.path.join(_ml_models_dir, "vectorizer.joblib"))
_classifier = joblib.load(os.path.join(_ml_models_dir, "difficulty_classifier.joblib"))


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

Also produce a list of hints that guide a student toward the solution
without giving away the final answer. Each hint should reveal one more
step than the last, so a student reading them in order gets progressively
closer to solving it themselves. The final hint should NOT state the
final answer outright — it should set up the last step, not complete it.
Use 3 to 5 hints depending on how many steps the exercise actually has.
Wrap math notation in hints the same way as above (single dollar signs).

Also identify the single most common mistake or misconception a student
is likely to make on this specific type of problem — for example a sign
error, forgetting a case, misapplying a formula, or a conceptual mix-up.
Phrase it as a short, specific tip (one sentence) a tutor might give
before the student starts, e.g. "Watch out for: forgetting to check
both roots when factoring." Wrap math notation the same way as above.

Also determine a short, general topic label for this exercise (2-6 words,
lowercase) — but keep it at the level of a textbook chapter or unit, NOT
a narrow sub-skill. For example, use "limits" rather than "squeeze
theorem", "integration techniques" rather than "integration by parts",
"quadratic equations" rather than "completing the square". Ignore extra
descriptive words the user may have included in their request (e.g. if
the request was "quadratic equations exercises that use the discriminant",
the label should just be "quadratic equations"). Use consistent, standard
terminology so exercises testing related sub-skills within the same unit
all get grouped under the same broader label.

Return ONLY a single JSON object, no array, no markdown, no explanation, in exactly this format:
{{
  "topic": "...",
  "question": "...",
  "answer": "...",
  "hints": ["...", "...", "..."],
  "common_misconception": "..."
}}"""


def get_exercise(topic: str, difficulty: str, user=None, examples: list = None) -> dict:
    if examples is None:
        examples = get_similar_exercises(topic)
    prompt = build_prompt(topic, difficulty, examples)
    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as e:
        raise Exception(f"Groq API error: {str(e)}")
    raw = response.choices[0].message.content.strip()
    start = raw.index('{')
    end = raw.rindex('}') + 1
    raw = raw[start:end]
    try:
        exercise = json.loads(raw)
    except Exception as e:
        raise Exception(f"Failed to parse Groq response: {raw}") from e
    saved_exercise = Exercise.objects.create(
        topic=exercise.get("topic", topic).lower(),
        difficulty=Exercise.Difficulty.from_label(difficulty),
        answer_text=exercise["answer"],
        question_text=exercise["question"],
        hints=exercise.get("hints", []),
        common_misconception=exercise.get("common_misconception", ""),
        source='G',
        user=user
    )
    return saved_exercise

def build_tagging_prompt(exercises: list[str]) -> str:
    numbered = "\n".join(f"{i}: {ex}" for i, ex in enumerate(exercises))
    return f"""You are a math curriculum classifier and solver.

For each exercise below:
1. Identify the broader lesson or unit it belongs to — think textbook
   chapter level, NOT a narrow sub-skill. For example, use "limits"
   rather than "squeeze theorem", "integration techniques" rather than
   "integration by substitution", "quadratic equations" rather than
   "solving quadratic equations by factoring", "trigonometric identities"
   rather than "law of cosines".
2. Determine its difficulty.
3. Solve it and give the final answer.
4. Produce a list of hints that guide a student toward the solution
   without giving away the final answer. Each hint should reveal one
   more step than the last. Use 3 to 5 hints depending on how many
   steps the exercise actually has. The final hint should NOT state
   the final answer outright.
5. Identify the single most common mistake or misconception a student
   is likely to make on this specific type of problem — for example a
   sign error, forgetting a case, misapplying a formula, or a
   conceptual mix-up. Phrase it as a short, specific tip (one sentence).

Rules:
- Lesson names must be short (2-6 words), lowercase, and consistent —
  use the same exact wording for exercises testing related sub-skills
  within the same broader unit, so they all group under one label.
- Difficulty must be exactly one of: "easy", "medium", "hard".
- The answer must be a single final value or simplified expression,
  not a worked solution.

Exercises:
{numbered}

Return ONLY a JSON array, no markdown, no explanation, with exactly one
object per exercise, in the same order, in this format:
[
  {{"index": 0, "lesson": "...", "difficulty": "...", "answer": "...", "hints": ["...", "..."], "common_misconception": "..."}},
  {{"index": 1, "lesson": "...", "difficulty": "...", "answer": "...", "hints": ["...", "..."], "common_misconception": "..."}}
]"""


def tag_and_solve_exercises(exercises: list[str], user=None) -> str:
    prompt = build_tagging_prompt(exercises)
    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as e:
        raise Exception(f"Groq API error: {str(e)}")
    # Clean and parse response
    raw = response.choices[0].message.content.strip()
    start = raw.index('[')
    end = raw.rindex(']') + 1
    raw = raw[start:end]
    try:
        tags = json.loads(raw)
    except Exception as e:
        raise Exception(f"Failed to parse Groq response: {raw}") from e
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
            hints=tag.get("hints", []),
            common_misconception=tag.get("common_misconception", ""),
            source=Exercise.Source.UPLOADED,
            user=user
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
            result = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
            )
            normalized = result.choices[0].message.content.strip().lower().replace(" ", "")
            answers.append(normalized)
        except Exception as e:
            raise Exception(f"Groq API error: {str(e)}")

    counts = Counter(answers)
    consensus, votes = counts.most_common(1)[0]
    original_normalized = exercise.answer_text.strip().lower().replace(" ", "")

    return {
        "match": consensus == original_normalized,
        "consensus_answer": consensus,
        "original_answer": exercise.answer_text,
        "votes": votes,
    }

def predict_difficulty(question_text: str) -> str:
    vector = _vectorizer.transform([question_text])
    predicted_code = _classifier.predict(vector)[0]
    return Exercise.Difficulty.to_label(predicted_code)




def build_file_tagging_prompt() -> str:
    return """You are looking at an image or document containing math exercises
(this could be a scanned exam, a photo of a worksheet, or a typed document).

For each distinct exercise you can identify in this file:
1. Transcribe the exercise's question text.
2. Identify the broader lesson or unit it belongs to — think textbook
   chapter level, NOT a narrow sub-skill. For example, use "limits"
   rather than "squeeze theorem", "integration techniques" rather than
   "integration by substitution", "quadratic equations" rather than
   "solving quadratic equations by factoring", "trigonometric identities"
   rather than "law of cosines".
3. Determine its difficulty: "easy", "medium", or "hard".
4. Solve it and give the final answer.
5. Produce a list of hints that guide a student toward the solution
   without giving away the final answer. Each hint should reveal one
   more step than the last. Use 3 to 5 hints depending on how many
   steps the exercise actually has. The final hint should NOT state
   the final answer outright.
6. Identify the single most common mistake or misconception a student
   is likely to make on this specific type of problem — for example a
   sign error, forgetting a case, misapplying a formula, or a
   conceptual mix-up. Phrase it as a short, specific tip (one sentence).

Wrap all mathematical notation in single dollar signs for LaTeX rendering,
e.g. "$x^2$", "$\\frac{2}{3}$".

Rules:
- Lesson names must be short (2-6 words), lowercase, and consistent —
  use the same exact wording for exercises testing related sub-skills
  within the same broader unit, so they all group under one label.
- Ignore anything in the file that isn't a math exercise (headers, instructions, page numbers).

Return ONLY a JSON array, no markdown, no explanation, in this format:
[
  {"question": "...", "lesson": "...", "difficulty": "...", "answer": "...", "hints": ["...", "..."], "common_misconception": "..."}
]"""


def tag_and_solve_from_file(file_bytes: bytes, mime_type: str, user = None) -> list:
    prompt = build_file_tagging_prompt()
    file_part = types.Part.from_bytes(data=file_bytes, mime_type=mime_type)

    try:
        response = gemini_client.models.generate_content(
            model='gemini-2.5-flash',
            contents=[prompt, file_part]
        )
    except Exception as e:
        raise Exception(f"Gemini API error: {str(e)}")

    raw = response.text.strip()
    start = raw.index('[')
    end = raw.rindex(']') + 1
    raw = raw[start:end]
    try:
        tagged = json.loads(raw)
    except Exception as e:
        raise Exception(f"Failed to parse Gemini response: {raw}") from e

    saved = []
    for item in tagged:
        saved.append(Exercise(
            topic=item["lesson"],
            difficulty=Exercise.Difficulty.from_label(item["difficulty"]),
            question_text=item["question"],
            answer_text=item["answer"],
            hints=item.get("hints", []),
            common_misconception=item.get("common_misconception", ""),
            source=Exercise.Source.UPLOADED,
            user = user
        ))

    Exercise.objects.bulk_create(saved)
    return saved

def get_auto_review_days(exercise_difficulty: str, user_difficulty: str) -> int:
    weight_sum = _DIFFICULTY_WEIGHT[exercise_difficulty] + _DIFFICULTY_WEIGHT[user_difficulty]
    return _INTERVAL_BY_WEIGHT_SUM[weight_sum]

def build_trend_narrative_prompt(exercises: list) -> str:
    listed = "\n".join(
        f'- [{ex.difficulty}] {ex.topic}: {ex.question_text}'
        for ex in exercises
    )

    return f"""You are a math tutor reviewing a batch of a student's practice exercises.

Here are the exercises, each tagged with its difficulty and lesson topic:
{listed}

Write a short 2-3 sentence summary of the pattern across this batch. Focus on
what concepts or skills these exercises collectively test, and call out any
notable spread — for example if most exercises test one concept but a few
also require a related or prerequisite skill, mention that as a possible gap.

Write in plain, encouraging language directed at the student. Do not just
restate which topic is most common — say something a good tutor would
actually notice. Return ONLY the summary text, no markdown, no headers,
no preamble."""

def generate_trend_narrative(exercises: list) -> str:
    prompt = build_trend_narrative_prompt(exercises)
    try:
        response = groq_client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[{"role": "user", "content": prompt}],
        )
    except Exception as e:
        raise Exception(f"Groq API error: {str(e)}")
    return response.choices[0].message.content.strip()

def get_suggested_exercises_per_topic(saved: list, user=None) -> list:
    exercises_by_topic = {}
    for exercise in saved:
        exercises_by_topic.setdefault(exercise.topic, []).append(exercise)

    suggestions = []
    for topic, topic_exercises in exercises_by_topic.items():
        difficulty_code = get_most_common(topic_exercises, "difficulty")
        difficulty_label = Exercise.Difficulty.to_label(difficulty_code)
        suggestion = get_exercise(topic, difficulty_label, user, examples=topic_exercises)
        suggestions.append(suggestion)

    return suggestions