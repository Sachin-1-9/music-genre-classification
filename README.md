
#  Music Genre Classification using Machine Learning

A full-stack machine learning project that classifies music into genres such as **rock, jazz, classical, pop, hiphop, metal**, etc., using audio signal processing and a trained ML model.

---

##  Features
- Upload **audio files** (`mp3`, `wav`, `flac`, `ogg`, etc.)
- Upload **video files** (`mp4`, `mov`, `mkv`) — audio is extracted automatically
- Predicts **music genre** using a trained **SVM classifier**
- Modern **React frontend** with responsive design
- Professional UI with preview, progress indicator, and highlighted result

---

##  How It Works
1. Audio features such as **MFCCs, chroma, spectral centroid, roll-off, and zero-crossing rate** are extracted using **Librosa**
2. These features are used to train a **Support Vector Machine (SVM)** model
3. During prediction, the uploaded file is processed using the same feature extraction pipeline
4. The trained model predicts the most likely music genre

---

##  Tech Stack
- **Python**
- **Librosa**
- **Scikit-learn**
- **Flask**
- **React**
- **MoviePy**
- **HTML / CSS**

---