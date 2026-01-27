#  Music Genre Classification System

This project is a full-stack machine learning web application that predicts the music genre from an uploaded audio or video file. The system extracts audio features from the file, applies a trained Support Vector Machine (SVM) model, and displays the predicted genre through a clean and user-friendly web interface.

The application supports both audio and video uploads. For video files, the audio track is extracted automatically before feature processing. The focus of this project is to demonstrate the complete pipeline of data preprocessing, model training, backend integration, and frontend interaction.

---

## Project Overview

The goal of this project is to classify music into genres using machine learning techniques. Audio features such as MFCCs, spectral centroid, chroma features, and zero-crossing rate are extracted using librosa. These features are then used to train an SVM classifier, which is well-suited for high-dimensional feature spaces and performs reliably on medium-sized datasets.

The trained model is saved and loaded in the backend to make predictions on newly uploaded files through a REST API.

---
## Dataset & Usage

This project uses the **GTZAN Music Genre Dataset**, a publicly available dataset widely used for music genre classification research.

**Dataset Source:**  
(https://www.kaggle.com/datasets/andradaolteanu/gtzan-dataset-music-genre-classification)  

The dataset contains audio tracks categorized into multiple genres including Blues, Classical, Country, Disco, Hip-Hop, Jazz, Metal, Pop, Reggae, and Rock. Each audio file is approximately 30 seconds long and primarily stored in `.wav` format.

**How to Add the Dataset:**
1. Download the GTZAN dataset from the link above.
2. Extract the downloaded files.
3. Place the extracted folder inside the project directory as shown below:
music-genre-classification/
└── dataset/
└── genres_original/


Each genre must be stored in its own subfolder containing the corresponding audio files.

**Feature Extraction:**
Run the following command to extract audio features:
python extract_features.py

This script extracts important audio features such as MFCCs, chroma features, spectral contrast, and zero-crossing rate. The extracted data is saved into `features.csv`.

**Model Training:**
Train the genre classification model using:
python train_model.py

The trained model is saved as `model/genre_classifier.pkl` and is later used by the backend for genre prediction.

**Note:**  
The dataset is not included in this repository to reduce repository size. Users must manually download and add the dataset by following 


## Tech Stack Used

Frontend:
- React
- Custom CSS 

Backend:
- Python
- Flask
- Flask-CORS

Machine Learning & Audio Processing:
- librosa
- scikit-learn
- numpy
- scipy

---



## How the System Works

1. Audio files are collected and preprocessed.
2. Audio features are extracted using librosa.
3. The extracted features are used to train an SVM classifier.
4. The trained model is saved as a pickle file.
5. The Flask backend loads the model and exposes an API endpoint.
6. The React frontend allows users to upload files and view predictions.
7. The predicted genre is returned and displayed in the UI.

---

---

### Backend Setup

```bash
cd music-genre-classification
python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip
pip install -r backend/requirements.txt
python backend/app.py
```

### FrontEnd Setup

```bash
cd frontend
npm install
npm start

