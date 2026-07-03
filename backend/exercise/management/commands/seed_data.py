from django.core.management.base import BaseCommand
from datasets import load_dataset
from ...models import Exercise

class Command(BaseCommand):
    def handle(self, *args, **options):
        dataset = load_dataset("nlile/hendrycks-MATH-benchmark", split="train")
        dataset = dataset.select(range(300))
        exercises = []
        for row in dataset:
            difficulty = Exercise.Difficulty.from_level(row['level'])
            exercises.append(Exercise(
                topic=row['subject'],
                difficulty=difficulty,
                question_text=row['problem'],
                answer_text=row['answer'],
                source=Exercise.Source.SEED_DATASET,
            ))
        
        Exercise.objects.bulk_create(exercises)
        self.stdout.write(self.style.SUCCESS(f"Seeded {len(exercises)} exercises"))