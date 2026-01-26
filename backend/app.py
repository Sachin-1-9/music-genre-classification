from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import pickle
import numpy as np
import pandas as pd
import librosa
import tempfile
from moviepy import VideoFileClip

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": ["http://localhost:3000", "http://localhost:3001"]}})

app.config["MAX_CONTENT_LENGTH"] = 300 * 1024 * 1024

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(BASE_DIR, ".."))

MODEL_PATH = os.path.join(ROOT_DIR, "model", "genre_classifier.pkl")
FEATURES_CSV_PATH = os.path.join(ROOT_DIR, "features.csv")

with open(MODEL_PATH, "rb") as f:
    model = pickle.load(f)

_expected_cols = list(pd.read_csv(FEATURES_CSV_PATH, nrows=0).columns)
if "label" in _expected_cols:
    _expected_cols.remove("label")

AUDIO_EXTENSIONS = [".wav", ".mp3", ".ogg", ".flac", ".m4a", ".au", ".aiff", ".aif"]
VIDEO_EXTENSIONS = [".mp4", ".mov", ".mkv", ".avi", ".webm"]

def extract_audio_from_video(video_path, out_wav_path):
    clip = VideoFileClip(video_path)
    if clip.audio is None:
        clip.close()
        raise ValueError("Uploaded video has no audio track.")
    clip.audio.write_audiofile(out_wav_path, logger=None)
    clip.close()

def extract_features_matching_schema(audio_path):
    y, sr = librosa.load(audio_path, duration=30, mono=True)

    # 55 features like your CSV: 40 MFCC + 12 chroma + centroid + rolloff + zcr
    mfcc_mean = np.mean(librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40).T, axis=0)   # 40
    chroma_mean = np.mean(librosa.feature.chroma_stft(y=y, sr=sr).T, axis=0)     # 12
    spec_centroid = float(np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))) # 1
    spec_rolloff  = float(np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr)))  # 1
    zcr           = float(np.mean(librosa.feature.zero_crossing_rate(y)))         # 1

    raw = np.hstack([mfcc_mean, chroma_mean, spec_centroid, spec_rolloff, zcr]).astype(np.float32)

    # match expected cols length
    if len(_expected_cols) == 55:
        return raw.reshape(1, -1)

    out = np.zeros(len(_expected_cols), dtype=np.float32)
    m = min(len(out), len(raw))
    out[:m] = raw[:m]
    return out.reshape(1, -1)

def top3_from_model(X):
    """
    Returns:
      pred_label: str
      top3: list of dicts [{genre, prob}]
    """
    pred = model.predict(X)[0]

    # Only works if SVC(probability=True) when trained
    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(X)[0]
        classes = list(model.classes_)
        idx = np.argsort(probs)[::-1][:3]
        top3 = [{"genre": str(classes[i]), "prob": float(probs[i])} for i in idx]
        return str(pred), top3

    # fallback if no proba
    return str(pred), [{"genre": str(pred), "prob": 1.0}]

@app.get("/")
def home():
    return jsonify({
        "message": "Music Genre Classification API running",
        "expected_features": len(_expected_cols),
        "use": "POST /predict with form-data key 'file' (audio or video)"
    })

@app.post("/predict")
def predict():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    f = request.files["file"]
    filename = (f.filename or "").lower()
    _, ext = os.path.splitext(filename)

    if ext not in AUDIO_EXTENSIONS + VIDEO_EXTENSIONS:
        return jsonify({"error": f"Unsupported file type: {ext}"}), 400

    temp_input = None
    temp_audio = None

    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            temp_input = tmp.name
            f.save(temp_input)

        if ext in VIDEO_EXTENSIONS:
            with tempfile.NamedTemporaryFile(delete=False, suffix=".wav") as tmpa:
                temp_audio = tmpa.name
            extract_audio_from_video(temp_input, temp_audio)
            audio_path = temp_audio
            source = "video"
        else:
            audio_path = temp_input
            source = "audio"

        X = extract_features_matching_schema(audio_path)
        pred, top3 = top3_from_model(X)

        return jsonify({
            "genre": pred,
            "top3": top3,
            "source": source,
            "features_used": int(X.shape[1]),
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        for p in [temp_input, temp_audio]:
            if p and os.path.exists(p):
                os.remove(p)

# --------- OPTIONAL: streaming endpoint for real progress (see Part B) ----------
@app.post("/predict_stream")
def predict_stream():
    # frontend will upload with XHR to see progress.
    return predict()

if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=False)
