import os
from django.core.management.base import BaseCommand
from datasets import load_dataset
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score
import joblib
from ...models import Exercise


class Command(BaseCommand):
    def handle(self, *args, **options):
        dataset = load_dataset("nlile/hendrycks-MATH-benchmark", split="train")

        question_texts = [row["problem"] for row in dataset]
        difficulties = [Exercise.Difficulty.from_level(row["level"]) for row in dataset]

        vectorizer = TfidfVectorizer()
        vectors = vectorizer.fit_transform(question_texts)

        X_train, X_test, y_train, y_test = train_test_split(
            vectors, difficulties, test_size=0.2, random_state=42
        )

        model = LogisticRegression(max_iter=1000)
        model.fit(X_train, y_train)

        predictions = model.predict(X_test)
        accuracy = accuracy_score(y_test, predictions)

        models_dir = os.path.join(os.path.dirname(__file__), "..", "..", "ml_models")
        os.makedirs(models_dir, exist_ok=True)
        joblib.dump(vectorizer, os.path.join(models_dir, "vectorizer.joblib"))
        joblib.dump(model, os.path.join(models_dir, "difficulty_classifier.joblib"))

        self.stdout.write(
            self.style.SUCCESS(
                f"Trained on {len(y_train)} exercises (full dataset), "
                f"tested on {len(y_test)}, accuracy: {accuracy:.2%}"
            )
        )