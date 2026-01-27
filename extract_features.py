import os
import librosa
import numpy as np
import pandas as pd
from tqdm import tqdm

DATASET_PATH = "dataset/gtzan"
OUTPUT_FILE = "features.csv"

def extract_features(file_path):
    y, sr = librosa.load(file_path, duration=30)
    
    mfcc = np.mean(librosa.feature.mfcc(y=y, sr=sr, n_mfcc=40).T, axis=0)
    chroma = np.mean(librosa.feature.chroma_stft(y=y, sr=sr).T, axis=0)
    spec_centroid = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
    spec_rolloff = np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr))
    zcr = np.mean(librosa.feature.zero_crossing_rate(y))

    return np.hstack([mfcc, chroma, spec_centroid, spec_rolloff, zcr])

features, labels = [], []

for genre in os.listdir(DATASET_PATH):
    genre_path = os.path.join(DATASET_PATH, genre)
    if not os.path.isdir(genre_path):
        continue

    for file in tqdm(os.listdir(genre_path), desc=f"Processing {genre}"):
        try:
            file_path = os.path.join(genre_path, file)
            features.append(extract_features(file_path))
            labels.append(genre)
        except Exception as e:
            print(f"Error: {file} -> {e}")

df = pd.DataFrame(features)
df["label"] = labels
df.to_csv(OUTPUT_FILE, index=False)

print("✅ Features extracted successfully")
