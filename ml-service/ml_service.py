"""
Sprint Risk ML Prediction Microservice
=======================================
FastAPI server that loads the trained Random Forest model and serves
risk predictions via a REST endpoint.

Endpoints:
    POST /predict — Predict risk from sprint features
    GET  /health  — Health check

Usage:
    uvicorn ml_service:app --host 0.0.0.0 --port 5001 --reload
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import Optional

import numpy as np
import joblib
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), "risk_model.pkl")
ENCODER_PATH = os.path.join(os.path.dirname(__file__), "label_encoder.pkl")

logger = logging.getLogger("ml_service")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")

# ---------------------------------------------------------------------------
# Model holder (loaded once at startup)
# ---------------------------------------------------------------------------
model = None
label_encoder = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Load the model on startup."""
    global model, label_encoder
    if os.path.exists(MODEL_PATH) and os.path.exists(ENCODER_PATH):
        model = joblib.load(MODEL_PATH)
        label_encoder = joblib.load(ENCODER_PATH)
        logger.info("[OK] ML model loaded successfully")
        logger.info(f"   Classes: {list(label_encoder.classes_)}")
    else:
        logger.warning("[WARN] Model files not found. Run train_model.py first.")
    yield


app = FastAPI(
    title="Sprint Risk ML Service",
    description="Machine Learning microservice for sprint risk prediction",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow .NET backend to call us
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------

class PredictRequest(BaseModel):
    """Input features for risk prediction."""
    cvr: float = Field(..., ge=0, le=5, description="Commitment-to-Velocity Ratio")
    spillover: int = Field(..., ge=0, le=1, description="Had spillover in previous sprint (0/1)")
    dependencies: int = Field(..., ge=0, description="Number of external dependencies")
    teamAvailability: int = Field(..., ge=0, le=100, description="Team availability percentage")
    committedPoints: int = Field(..., ge=0, description="Story points committed")
    completedPoints: int = Field(..., ge=0, description="Story points completed (historical avg)")
    dependencyDensity: Optional[float] = Field(None, ge=0, description="Dependencies / team size (auto-calculated if absent)")
    teamSize: Optional[int] = Field(None, ge=1, description="Team size (used for dependencyDensity)")


class PredictResponse(BaseModel):
    """ML prediction result."""
    mlRisk: str = Field(..., description="Predicted risk level: LOW, MEDIUM, or HIGH")
    confidence: float = Field(..., ge=0, le=1, description="Prediction confidence (probability)")
    probabilities: dict = Field(..., description="Class probabilities")


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health():
    """Health check endpoint."""
    return {
        "status": "healthy" if model is not None else "model_not_loaded",
        "model_loaded": model is not None,
    }


@app.post("/predict", response_model=PredictResponse)
def predict(data: PredictRequest):
    """Predict sprint risk level using the trained ML model."""
    if model is None or label_encoder is None:
        raise HTTPException(status_code=503, detail="ML model not loaded. Run train_model.py first.")

    # Calculate dependencyDensity if not provided
    dep_density = data.dependencyDensity
    if dep_density is None:
        team_size = data.teamSize if data.teamSize and data.teamSize > 0 else 5
        dep_density = data.dependencies / team_size

    # Build feature vector in the same order used during training
    features = np.array([[
        data.cvr,
        data.spillover,
        data.dependencies,
        data.teamAvailability,
        data.committedPoints,
        data.completedPoints,
        dep_density,
    ]])

    # Predict
    prediction = model.predict(features)[0]
    probabilities = model.predict_proba(features)[0]

    predicted_label = label_encoder.inverse_transform([prediction])[0]
    confidence = float(max(probabilities))

    # Build probability dict
    prob_dict = {
        label: round(float(prob), 4)
        for label, prob in zip(label_encoder.classes_, probabilities)
    }

    logger.info(
        f"Prediction: {predicted_label} (confidence={confidence:.2%}) | "
        f"Input: CVR={data.cvr:.2f}, Spillover={data.spillover}, "
        f"Deps={data.dependencies}, Avail={data.teamAvailability}%, "
        f"Committed={data.committedPoints}, Completed={data.completedPoints}"
    )

    return PredictResponse(
        mlRisk=predicted_label,
        confidence=round(confidence, 4),
        probabilities=prob_dict,
    )
