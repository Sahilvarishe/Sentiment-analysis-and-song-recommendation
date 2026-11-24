# MindPulse AI - Frontend Documentation
## Mental Health Detection & Song Recommendation Using Facial Recognition

### 🧠 Project Overview
**MindPulse AI** is an intelligent emotional wellness support system that pairs real-time **Computer Vision & Convolutional Neural Networks (CNNs)** with **Psychoacoustic Music Therapy**. By non-invasively capturing facial micro-expressions through a webcam, the system classifies core emotional states—**Happiness, Sadness, Anger, Fear, Surprise, and Neutrality**—and prescribes personalized music designed to elevate mood, induce somatic calming, or maintain cognitive equilibrium.

---

### 📂 Frontend Directory Structure
```
frontend/
├── index.html              # Main single-page application dashboard
├── css/
│   ├── style.css           # Core design system, HSL color tokens, dark mode, typography
│   └── components.css      # Component styles: HUD scanner, audio dock, meters, modals
├── js/
│   ├── app.js              # Application orchestrator & tab controller
│   ├── camera.js           # HTML5 Webcam stream, facial mesh HUD, frame capture
│   ├── recommendations.js  # Psychoacoustic song database & clinical mapping
│   ├── player.js           # Music playback controller, scrubber & canvas visualizer
│   ├── audio-synth.js      # Zero-latency Web Audio API synthesizer & soundscapes
│   └── analytics.js        # Longitudinal mood tracker, doughnut charts & metrics
└── README.md               # Complete architecture & integration documentation
```

---

### 🎨 Visual & Technical Highlights
1. **Glassmorphic Cyber-Wellness Aesthetics**: Sleek dark mode palette (`#0a0d14`), soft glowing radial gradients, and modern typography (*Outfit* & *Inter* via Google Fonts).
2. **Futuristic Face Recognition HUD**:
   - Real-time webcam viewport with corner brackets and animated scanning beam.
   - Interactive facial mesh overlay targeting landmarks (eyes, brows, mouth) with dynamic color shifts matching the detected emotion.
   - Instant live probability meters for all 6 core emotions with smooth animated bars.
3. **Dual-Mode Operation (Hybrid Smart Fallback)**:
   - **Flask CNN Backend Mode**: Sends base64 frames to your Flask API (`POST /predict_emotion`).
   - **Browser Neural Simulation Mode**: Allows immediate testing and demonstrations even when the Python/Flask server is not currently running.
   - One-click manual testing pills to instantly preview music and diagnosis for any emotion.
4. **Zero-Failure Psychoacoustic Audio Engine**:
   - Built-in **Web Audio API synthesizer** generating real therapeutic tones (528Hz Solfeggio, 432Hz Vagus Nerve Soother, Binaural Alpha Beats, Rain Noise).
   - Real-time **Canvas Frequency Visualizer** with animated bouncing neon bars.
   - Persistent bottom dock player with play/pause, seek scrubber, volume control, repeat, and shuffle.
5. **Mental Health Analytics & Longitudinal Tracker**:
   - Dynamic Canvas Doughnut Chart for emotional distribution.
   - Wellness Balance Index (0–100) and estimated Stress Attenuation %.
   - Session scan history with timestamps and `localStorage` persistence.
6. **Zen Sanctuary**:
   - 4-4-4-4 Box Breathing interactive sphere with animated expansion/contraction and ambient rain/waves/forest soundscapes.

---

### 🚀 How to Run the Frontend Locally

#### Option A: Direct Browser Launch
Simply double-click or open `frontend/index.html` in Google Chrome, Microsoft Edge, Brave, or Firefox.

#### Option B: Using a Lightweight HTTP Server (Recommended for Camera Permissions)
Run any of the following commands in the terminal:

```bash
# Using Python 3 (Already installed on most systems):
cd "c:/Users/Sahil/Documents/final year project/frontend"
python -m http.server 3000
```
Then navigate to: **`http://127.0.0.1:3000`** in your browser.

```bash
# Or using Node.js (npx serve):
npx -y serve "c:/Users/Sahil/Documents/final year project/frontend"
```

### Account access
Open `register.html` to create an account, then sign in through `login.html`. The Flask API must be running, and the frontend origin must be listed in backend `CORS_ORIGINS` for session cookies to work. The dashboard and its protected APIs require login; use the dashboard sign-out button to end the session. Password reset is not currently configured.

---

### 🔌 Flask Backend API Integration Specification

The frontend is pre-configured to communicate seamlessly with a Python Flask backend running at `http://127.0.0.1:5000`.

#### 1. Emotion Prediction Endpoint
- **URL**: `POST http://127.0.0.1:5000/predict_emotion`
- **Headers**: `Content-Type: application/json`
- **Request Body**:
  ```json
  {
    "image": "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQ..."
  }
  ```
- **Expected Successful Response (`200 OK`)**:
  ```json
  {
    "status": "success",
    "emotion": "happy",
    "confidence": 0.94,
    "emotions": {
      "happy": 0.94,
      "sad": 0.02,
      "angry": 0.01,
      "fear": 0.01,
      "surprise": 0.01,
      "neutral": 0.01
    }
  }
  ```

#### 2. Health Check Endpoint
- **URL**: `GET http://127.0.0.1:5000/health`
- **Response**: `{"status": "online"}`

#### 3. Sample Minimal Flask Server (`app.py`) for Reference
```python
from flask import Flask, request, jsonify
from flask_cors import CORS
import base64
import numpy as np
import cv2

app = Flask(__name__)
CORS(app)  # Enable Cross-Origin requests from the frontend

@app.route('/health', methods=['GET'])
def health():
    return jsonify({"status": "online"})

@app.route('/predict_emotion', methods=['POST'])
def predict_emotion():
    data = request.get_json()
    image_b64 = data.get('image', '').split(',')[-1]
    image_bytes = base64.b64decode(image_b64)
    nparr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

    # 1. Detect face using OpenCV Haar Cascade or MediaPipe
    # 2. Preprocess face ROI (grayscale, resize to 48x48, normalize)
    # 3. Model prediction using Keras/TensorFlow CNN:
    #    preds = model.predict(roi)
    
    # Example response:
    return jsonify({
        "status": "success",
        "emotion": "happy",
        "confidence": 0.91,
        "emotions": {
            "happy": 0.91,
            "sad": 0.02,
            "angry": 0.02,
            "fear": 0.01,
            "surprise": 0.02,
            "neutral": 0.02
        }
    })

if __name__ == '__main__':
    app.run(port=5000, debug=True)
```

---

### 🎵 Emotion to Music Psychoacoustic Mapping
| Emotion | Clinical Neural Target | Music Frequency / Tempo | Primary Recommendation |
| :--- | :--- | :--- | :--- |
| **Happy** | Dopamine & Serotonin Amplification | 528 Hz / 120+ BPM Upbeat | *Sunlit Horizons* (Aura Soundscapes) |
| **Sad** | Catharsis & Prolactin Release | 432 Hz / 60–70 BPM Minor Piano | *Weightless Raindrops* (Echoes of Silence) |
| **Angry** | Sympathetic De-escalation & Cortisol Lowering | 174 Hz Sub-Bass / 55–65 BPM | *Tranquil Fire* (Resonance Flow) |
| **Fear** | Vagus Nerve Stimulation & Anti-Panic | 432 Hz + Theta Waves / 50 BPM | *Safe Harbor Sanctuary* (Binaural Mind) |
| **Surprise** | Cognitive Clarity & Attention Grounding | 639 Hz Neo-Classical | *Crystal Resonance* (Neo-Classical Arcs) |
| **Neutral** | Alpha Brainwave Entrainment & Focus | 432 Hz Lo-Fi Chords / 80 BPM | *Deep Flow State* (MindPulse Lab) |
