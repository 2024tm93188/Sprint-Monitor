"""
Sprint Risk ML Model Training Script
=====================================
Trains a Random Forest classifier on historical sprint data from the Sprint Monitor database.
Features: CVR, Spillover (0/1), Dependencies, TeamAvailability, CommittedPoints, CompletedPoints
Target:   RiskLabel (LOW / MEDIUM / HIGH) — derived from actual sprint outcomes.

Usage:
    python train_model.py
"""

import os
import sys
import warnings
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing import LabelEncoder
import joblib

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# 1. Load data from SQL Server (or fall back to synthetic data for dev)
# ---------------------------------------------------------------------------
DB_CONNECTION_STRING = (
    "DRIVER={ODBC Driver 17 for SQL Server};"
    "SERVER=(localdb)\\MSSQLLocalDB;"
    "DATABASE=SprintMonitorDb;"
    "Trusted_Connection=yes;"
)


def load_sprint_data() -> pd.DataFrame:
    """Load completed sprint data from the SQL Server database."""
    try:
        import pyodbc

        conn = pyodbc.connect(DB_CONNECTION_STRING)
        query = """
        SELECT
            s.SprintId,
            s.TeamId,
            s.CommittedPoints,
            s.CompletedPoints,
            s.AddedPoints,
            s.RemovedPoints,
            s.TeamAvailability,
            s.TeamSize,
            s.HadSpillover,
            s.ExternalDependencies
        FROM Sprints s
        WHERE s.CompletedPoints > 0
        ORDER BY s.TeamId, s.SprintId
        """
        df = pd.read_sql(query, conn)
        conn.close()

        # Use SprintId as ordering proxy if SprintNumber is absent
        if "SprintNumber" not in df.columns:
            df["SprintNumber"] = df.groupby("TeamId").cumcount() + 1

        if len(df) < 5:
            print(f"[INFO] Only {len(df)} sprints found in DB — augmenting with synthetic data.")
            df = pd.concat([df, _generate_synthetic_data()], ignore_index=True)
        else:
            print(f"[INFO] Loaded {len(df)} sprint records from database.")
        return df

    except Exception as e:
        print(f"[WARN] Could not connect to SQL Server: {e}")
        print("[INFO] Falling back to synthetic training data.")
        return _generate_synthetic_data()


def _generate_synthetic_data() -> pd.DataFrame:
    """Generate synthetic sprint data for initial model training."""
    np.random.seed(42)
    n = 200

    committed = np.random.randint(15, 80, n)
    # Completion ratio varies — good teams finish 85-105%, risky ones 40-75%
    completion_ratio = np.clip(np.random.normal(0.85, 0.20, n), 0.30, 1.10)
    completed = (committed * completion_ratio).astype(int)
    availability = np.random.choice([60, 70, 75, 80, 85, 90, 95, 100], n, p=[0.03, 0.05, 0.07, 0.10, 0.15, 0.25, 0.20, 0.15])
    dependencies = np.random.choice([0, 1, 2, 3, 4, 5, 6], n, p=[0.25, 0.20, 0.20, 0.15, 0.10, 0.05, 0.05])
    spillover = (completed < committed).astype(int)
    added = np.random.randint(0, 10, n)
    removed = np.random.randint(0, 5, n)
    team_size = np.random.choice([3, 4, 5, 6, 7, 8], n)

    df = pd.DataFrame({
        "SprintId": range(1, n + 1),
        "TeamId": np.random.choice([1, 2, 3], n),
        "CommittedPoints": committed,
        "CompletedPoints": completed,
        "AddedPoints": added,
        "RemovedPoints": removed,
        "TeamAvailability": availability,
        "TeamSize": team_size,
        "HadSpillover": spillover,
        "ExternalDependencies": dependencies,
        "SprintNumber": np.tile(range(1, n // 3 + 2), 3)[:n],
    })
    return df


# ---------------------------------------------------------------------------
# 2. Feature Engineering
# ---------------------------------------------------------------------------

def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    """Derive ML features from raw sprint data."""

    # Compute rolling average velocity per team (proxy for avg_velocity)
    df = df.sort_values(["TeamId", "SprintNumber"])
    df["AvgVelocity"] = df.groupby("TeamId")["CompletedPoints"].transform(
        lambda s: s.expanding().mean().shift(1).fillna(s.mean())
    )

    # CVR = committed / avg_velocity  (capped to avoid infinities)
    df["CVR"] = np.where(
        df["AvgVelocity"] > 0,
        df["CommittedPoints"] / df["AvgVelocity"],
        1.0,
    )
    df["CVR"] = df["CVR"].clip(0, 3)

    # Spillover binary
    df["Spillover"] = df["HadSpillover"].astype(int)

    # Dependency density: dependencies / team_size
    df["DependencyDensity"] = np.where(
        df["TeamSize"] > 0,
        df["ExternalDependencies"] / df["TeamSize"],
        0,
    )

    # Completion ratio
    df["CompletionRatio"] = np.where(
        df["CommittedPoints"] > 0,
        df["CompletedPoints"] / df["CommittedPoints"],
        1.0,
    )

    return df


def derive_risk_label(row) -> str:
    """
    Derive the ground-truth risk label from actual sprint outcomes.
    This is what we're training the model to predict.
    """
    completion = row["CompletionRatio"]
    spillover = row["Spillover"]
    deps = row["ExternalDependencies"]

    risk_score = 0

    # Completion-based
    if completion < 0.6:
        risk_score += 3
    elif completion < 0.8:
        risk_score += 2
    elif completion < 0.95:
        risk_score += 1

    # Spillover
    if spillover:
        risk_score += 2

    # Dependencies
    if deps > 4:
        risk_score += 2
    elif deps > 2:
        risk_score += 1

    # Availability
    if row["TeamAvailability"] < 75:
        risk_score += 2
    elif row["TeamAvailability"] < 90:
        risk_score += 1

    if risk_score >= 5:
        return "HIGH"
    elif risk_score >= 3:
        return "MEDIUM"
    else:
        return "LOW"


# ---------------------------------------------------------------------------
# 3. Train & Save
# ---------------------------------------------------------------------------

FEATURE_COLS = [
    "CVR",
    "Spillover",
    "ExternalDependencies",
    "TeamAvailability",
    "CommittedPoints",
    "CompletedPoints",
    "DependencyDensity",
]

MODEL_PATH = os.path.join(os.path.dirname(__file__), "risk_model.pkl")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "label_encoder.pkl")


def train():
    print("=" * 60)
    print("Sprint Risk ML Model — Training")
    print("=" * 60)

    df = load_sprint_data()
    df = engineer_features(df)
    df["RiskLabel"] = df.apply(derive_risk_label, axis=1)

    print(f"\nDataset size : {len(df)} records")
    print(f"Label distribution:\n{df['RiskLabel'].value_counts().to_string()}")

    X = df[FEATURE_COLS].values
    le = LabelEncoder()
    y = le.fit_transform(df["RiskLabel"])

    model = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        min_samples_split=5,
        class_weight="balanced",
        random_state=42,
    )

    # Cross-validate
    scores = cross_val_score(model, X, y, cv=5, scoring="accuracy")
    print(f"\nCross-validation accuracy: {scores.mean():.2%} ± {scores.std():.2%}")

    # Train final model on all data
    model.fit(X, y)

    # Feature importance
    importances = model.feature_importances_
    print("\nFeature importances:")
    for name, imp in sorted(zip(FEATURE_COLS, importances), key=lambda x: -x[1]):
        print(f"  {name:25s} {imp:.4f}")

    # Save
    joblib.dump(model, MODEL_PATH)
    joblib.dump(le, ENCODER_PATH)
    print(f"\n[OK] Model saved to {MODEL_PATH}")
    print(f"[OK] Label encoder saved to {ENCODER_PATH}")
    print(f"   Classes: {list(le.classes_)}")


if __name__ == "__main__":
    train()
