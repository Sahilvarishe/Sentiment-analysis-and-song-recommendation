/**
 * MindPulse AI - Webcam Stream & Facial Expression Recognition Controller
 * Handles camera feeds, canvas HUD facial mesh rendering, Flask API communication,
 * and intelligent offline fallback inference.
 */

class CameraController {
  constructor() {
    this.videoElement = document.getElementById('webcamVideo');
    this.overlayCanvas = document.getElementById('detectionOverlayCanvas');
    this.canvasCtx = this.overlayCanvas ? this.overlayCanvas.getContext('2d') : null;
    this.cameraOffOverlay = document.getElementById('cameraOffOverlay');
    this.scanBeam = document.getElementById('scanBeam');
    
    this.stream = null;
    this.isStreaming = false;
    this.facingMode = 'user'; // 'user' or 'environment'
    this.autoScanInterval = null;
    this.isAutoScanning = false;
    this.isAnalyzing = false;
    this.lastDetectedEmotion = 'neutral';
    
    // Virtual Face Tracker Coordinates for HUD animation
    this.tracker = {
      x: 0.25,
      y: 0.2,
      w: 0.5,
      h: 0.6,
      targetX: 0.25,
      targetY: 0.2,
      targetW: 0.5,
      targetH: 0.6,
      points: []
    };

    this.animationFrameId = null;
  }

  async initCamera() {
    try {
      if (this.stream) {
        this.stopCamera();
      }

      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: this.facingMode
        },
        audio: false
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoElement.srcObject = this.stream;
      
      await new Promise(resolve => {
        this.videoElement.onloadedmetadata = () => {
          this.videoElement.play();
          this.isStreaming = true;
          this.resizeCanvas();
          this.cameraOffOverlay.classList.add('hidden');
          this.startHudLoop();
          resolve(true);
        };
      });

      if (window.app) {
        window.app.showToast("Camera feed connected successfully.", "success");
      }

      // Automatically analyze emotion on initial startup
      setTimeout(() => {
        this.analyzeExpression();
      }, 600);

      return true;
    } catch (err) {
      console.warn("Camera access failed or denied:", err);
      this.cameraOffOverlay.classList.remove('hidden');
      this.isStreaming = false;
      if (window.app) {
        window.app.showToast("Webcam unavailable. You can use manual emotion buttons to test.", "info");
      }
      return false;
    }
  }

  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.isStreaming = false;
    this.stopAutoScan();
    this.cameraOffOverlay.classList.remove('hidden');
    if (this.canvasCtx) {
      this.canvasCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
    }
  }

  toggleCamera() {
    if (this.isStreaming) {
      this.stopCamera();
      return false;
    } else {
      this.initCamera();
      return true;
    }
  }

  switchCamera() {
    this.facingMode = this.facingMode === 'user' ? 'environment' : 'user';
    this.initCamera();
  }

  resizeCanvas() {
    if (!this.overlayCanvas || !this.videoElement) return;
    this.overlayCanvas.width = this.videoElement.videoWidth || 640;
    this.overlayCanvas.height = this.videoElement.videoHeight || 480;
  }

  // Draw Futuristic AI Face Recognition HUD
  startHudLoop() {
    const render = () => {
      if (!this.isStreaming) return;
      this.drawHudOverlay();
      this.animationFrameId = requestAnimationFrame(render);
    };
    render();
  }

  drawHudOverlay() {
    if (!this.canvasCtx || !this.overlayCanvas) return;
    const ctx = this.canvasCtx;
    const w = this.overlayCanvas.width;
    const h = this.overlayCanvas.height;

    ctx.clearRect(0, 0, w, h);

    // Smooth subtle movement of face tracker
    this.tracker.x += (this.tracker.targetX - this.tracker.x) * 0.05;
    this.tracker.y += (this.tracker.targetY - this.tracker.y) * 0.05;
    this.tracker.w += (this.tracker.targetW - this.tracker.w) * 0.05;
    this.tracker.h += (this.tracker.targetH - this.tracker.h) * 0.05;

    const fx = this.tracker.x * w;
    const fy = this.tracker.y * h;
    const fw = this.tracker.w * w;
    const fh = this.tracker.h * h;

    // 1. Draw Bounding Reticle
    const emotionColor = this.getEmotionColor(this.lastDetectedEmotion);
    ctx.strokeStyle = emotionColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = emotionColor;
    ctx.shadowBlur = 10;

    // Corner brackets around face
    const cornerSize = 20;
    // Top-Left
    ctx.beginPath();
    ctx.moveTo(fx, fy + cornerSize);
    ctx.lineTo(fx, fy);
    ctx.lineTo(fx + cornerSize, fy);
    ctx.stroke();

    // Top-Right
    ctx.beginPath();
    ctx.moveTo(fx + fw - cornerSize, fy);
    ctx.lineTo(fx + fw, fy);
    ctx.lineTo(fx + fw, fy + cornerSize);
    ctx.stroke();

    // Bottom-Left
    ctx.beginPath();
    ctx.moveTo(fx, fy + fh - cornerSize);
    ctx.lineTo(fx, fy + fh);
    ctx.lineTo(fx + cornerSize, fy + fh);
    ctx.stroke();

    // Bottom-Right
    ctx.beginPath();
    ctx.moveTo(fx + fw - cornerSize, fy + fh);
    ctx.lineTo(fx + fw, fy + fh);
    ctx.lineTo(fx + fw, fy + fh - cornerSize);
    ctx.stroke();

    ctx.shadowBlur = 0; // reset

    // 2. Draw Simulated Neural Mesh Points (Eyes, Nose, Mouth Landmarks)
    const centerX = fx + fw / 2;
    const centerY = fy + fh / 2;
    const landmarks = [
      { x: centerX - fw * 0.18, y: centerY - fh * 0.12 }, // Left Eye
      { x: centerX + fw * 0.18, y: centerY - fh * 0.12 }, // Right Eye
      { x: centerX, y: centerY + fh * 0.05 },             // Nose Tip
      { x: centerX - fw * 0.14, y: centerY + fh * 0.22 }, // Mouth Left
      { x: centerX, y: centerY + fh * 0.24 },             // Mouth Center
      { x: centerX + fw * 0.14, y: centerY + fh * 0.22 }, // Mouth Right
      { x: centerX - fw * 0.22, y: centerY - fh * 0.25 }, // Left Brow
      { x: centerX + fw * 0.22, y: centerY - fh * 0.25 }, // Right Brow
    ];

    ctx.fillStyle = emotionColor;
    landmarks.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  getEmotionColor(emotion) {
    const map = {
      happy: '#10b981',
      sad: '#3b82f6',
      angry: '#f43f5e',
      fear: '#a855f7',
      surprise: '#06b6d4',
      neutral: '#14b8a6'
    };
    return map[emotion] || '#818cf8';
  }

  // Capture Current Frame from Video to Base64 Image
  captureFrameBase64() {
    const captureCanvas = document.createElement('canvas');
    captureCanvas.width = 320;
    captureCanvas.height = 240;
    const cctx = captureCanvas.getContext('2d');
    
    if (this.isStreaming && this.videoElement.videoWidth > 0) {
      cctx.drawImage(this.videoElement, 0, 0, captureCanvas.width, captureCanvas.height);
    } else {
      // Draw a fallback canvas avatar frame if camera is off
      cctx.fillStyle = '#0f172a';
      cctx.fillRect(0, 0, captureCanvas.width, captureCanvas.height);
      cctx.fillStyle = '#6366f1';
      cctx.beginPath();
      cctx.arc(160, 100, 45, 0, Math.PI * 2);
      cctx.fill();
    }
    
    return captureCanvas.toDataURL('image/jpeg', 0.8);
  }

  // Analyze Expression: calls Flask Backend or falls back to intelligent simulation
  async analyzeExpression(forcedEmotion = null) {
    if (this.isAnalyzing) return;
    this.isAnalyzing = true;

    // Trigger visual scan beam
    if (this.scanBeam) {
      this.scanBeam.classList.add('active');
    }

    try {
      let result = null;
      const flaskUrl = (window.app && window.app.config.flaskUrl) || 'http://127.0.0.1:5000';
      const inferenceMode = (window.app && window.app.config.inferenceMode) || 'auto';

      if (!forcedEmotion && !this.isStreaming) {
        await this.initCamera();
      }

      if (forcedEmotion) {
        // Direct testing pill clicked
        result = this.generateSimulatedInference(forcedEmotion);
      } else if (this.isStreaming || inferenceMode === 'flask' || (window.app && window.app.isBackendOnline)) {
        // Send base64 frame to Flask Backend
        const base64Image = this.captureFrameBase64();
        result = await this.callFlaskApi(flaskUrl, base64Image);
      } else {
        // Fallback intelligent simulation
        await new Promise(r => setTimeout(r, 450));
        result = this.generateSimulatedInference();
      }

      if (!result) {
        return null;
      }

      this.lastDetectedEmotion = result.emotion;
      
      // Notify main app to update UI, meters, and music recommendations
      if (window.app) {
        window.app.handleDetectionResult(result);
      }
      return result;
    } catch (err) {
      console.warn("Flask inference error, falling back to simulated inference:", err);
      const fallbackResult = this.generateSimulatedInference();
      this.lastDetectedEmotion = fallbackResult.emotion;
      if (window.app) {
        window.app.handleDetectionResult(fallbackResult);
      }
      return fallbackResult;
    } finally {
      this.isAnalyzing = false;
      if (this.scanBeam) {
        setTimeout(() => this.scanBeam.classList.remove('active'), 500);
      }
    }
  }

  // Send request to Flask API
  async callFlaskApi(baseUrl, base64Image) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort(new DOMException("Inference request timed out after 25s", "AbortError"));
    }, 25000);

    let response;
    try {
      response = await fetch(`${baseUrl}/predict_emotion`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ image: base64Image }),
        credentials: 'include',
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (response.status === 401) {
      window.location.replace('login.html?reason=expired');
      throw new Error('Authentication session expired');
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      if (response.status === 422) {
        if (window.app) {
          window.app.showToast(data.error || "No face detected. Please position your face clearly in the camera.", "warning");
        }
        return null;
      }
      throw new Error(data.error || `HTTP ${response.status}`);
    }

    // Normalize format
    return {
      emotion: (data.emotion || 'neutral').toLowerCase(),
      confidence: data.confidence || 0.88,
      allEmotions: data.all_emotions || data.emotions || {
        happy: data.emotion === 'happy' ? 0.88 : 0.05,
        sad: data.emotion === 'sad' ? 0.88 : 0.05,
        angry: data.emotion === 'angry' ? 0.88 : 0.05,
        fear: data.emotion === 'fear' ? 0.88 : 0.05,
        surprise: data.emotion === 'surprise' ? 0.88 : 0.05,
        neutral: data.emotion === 'neutral' ? 0.88 : 0.05
      },
      source: 'flask_backend'
    };
  }

  // Generate realistic probability distribution for testing / offline demo
  generateSimulatedInference(primaryEmotion = null) {
    const emotions = ['happy', 'sad', 'angry', 'fear', 'surprise', 'neutral'];
    const dominant = primaryEmotion || emotions[Math.floor(Math.random() * emotions.length)];
    
    const confidence = parseFloat((0.82 + Math.random() * 0.15).toFixed(2));
    let remaining = 1.0 - confidence;
    
    const allEmotions = {};
    const otherKeys = emotions.filter(e => e !== dominant);
    
    otherKeys.forEach((key, index) => {
      if (index === otherKeys.length - 1) {
        allEmotions[key] = parseFloat(Math.max(0.01, remaining).toFixed(2));
      } else {
        const share = parseFloat((Math.random() * (remaining * 0.5)).toFixed(2));
        allEmotions[key] = share;
        remaining -= share;
      }
    });
    allEmotions[dominant] = confidence;

    return {
      emotion: dominant,
      confidence: confidence,
      allEmotions: allEmotions,
      source: primaryEmotion ? 'manual_selection' : 'simulated_neural'
    };
  }

  // Continuous auto-scan
  startAutoScan() {
    if (this.isAutoScanning) return;
    this.isAutoScanning = true;
    this.autoScanInterval = setInterval(() => {
      this.analyzeExpression();
    }, 4500);
  }

  stopAutoScan() {
    if (this.autoScanInterval) {
      clearInterval(this.autoScanInterval);
      this.autoScanInterval = null;
    }
    this.isAutoScanning = false;
  }

  toggleAutoScan() {
    if (this.isAutoScanning) {
      this.stopAutoScan();
      return false;
    } else {
      this.startAutoScan();
      return true;
    }
  }
}

// Global instance
window.cameraController = new CameraController();
