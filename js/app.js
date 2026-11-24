/**
 * MindPulse AI - Application Orchestrator
 * Connects user interface, camera feeds, music recommendation engine,
 * audio player, analytics dashboard, breathing sanctuary, and backend status.
 */

class MindPulseApp {
  constructor() {
    this.config = {
      flaskUrl: localStorage.getItem('mindpulse_flask_url') || 'http://127.0.0.1:5000',
      inferenceMode: localStorage.getItem('mindpulse_inference_mode') || 'auto',
      cameraResolution: localStorage.getItem('mindpulse_cam_res') || '640x480'
    };

    this.isBackendOnline = false;
    this.currentEmotion = 'neutral';
    this.selectedLanguage = localStorage.getItem('mindpulse_song_language') || 'Hindi';
    this.zenTimer = null;
    this.zenRunning = false;
    this.zenPhase = 0; // 0: inhale, 1: hold, 2: exhale, 3: hold
    this.activeFilter = 'all';

    this.init();
  }

  init() {
    this.bindLanguageSelector();
    this.bindNavigation();
    this.bindScannerEvents();
    this.bindMusicLibraryEvents();
    this.bindZenEvents();
    this.bindSettingsModal();
    this.checkBackendHealth();
    
    // Initial Render of Music Library
    this.renderMusicLibrary();
    this.renderQuickRecommendations('neutral');

    // Auto-attempt webcam startup after brief delay for smooth page entrance
    setTimeout(() => {
      if (window.cameraController) {
        window.cameraController.initCamera();
      }
    }, 400);
  }

  // --------------------------------------------------------------------------
  // Language Selector & Recommendation Refresh
  // --------------------------------------------------------------------------
  bindLanguageSelector() {
    const langSelect = document.getElementById('songLanguageSelect');
    if (langSelect) {
      langSelect.value = this.selectedLanguage;
      langSelect.addEventListener('change', async (e) => {
        const newLang = e.target.value;
        this.selectedLanguage = newLang;
        localStorage.setItem('mindpulse_song_language', newLang);
        await this.refreshRecommendations();
        this.showToast(`Switched song language to ${newLang}`, "info");
      });
    }

    const refreshBtn = document.getElementById('refreshRecommendationsBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', async () => {
        const icon = refreshBtn.querySelector('i');
        if (icon) icon.classList.add('fa-spin');
        await this.refreshRecommendations();
        if (icon) setTimeout(() => icon.classList.remove('fa-spin'), 600);
        this.showToast(`Refreshed ${this.selectedLanguage} recommendations for ${this.currentEmotion.toUpperCase()}`, "info");
      });
    }
  }

  async refreshRecommendations() {
    if (window.recommendationEngine && window.recommendationEngine.fetchYouTubeRecommendations) {
      await window.recommendationEngine.fetchYouTubeRecommendations(this.currentEmotion, this.selectedLanguage);
    }
    this.renderQuickRecommendations(this.currentEmotion);
    this.renderMusicLibrary();
  }

  // --------------------------------------------------------------------------
  // Navigation & Tab Switching
  // --------------------------------------------------------------------------
  bindNavigation() {
    const tabs = document.querySelectorAll('.nav-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.getAttribute('data-tab');
        this.switchTab(targetId);
      });
    });

    // Also handle quick link buttons from other sections
    const seeAllBtn = document.getElementById('seeAllSongsBtn');
    if (seeAllBtn) {
      seeAllBtn.addEventListener('click', () => this.switchTab('music-section'));
    }

    const viewFullPlaylistBtn = document.getElementById('viewFullPlaylistBtn');
    if (viewFullPlaylistBtn) {
      viewFullPlaylistBtn.addEventListener('click', () => this.switchTab('music-section'));
    }

    const openZenBtns = document.querySelectorAll('.open-zen-modal-btn');
    openZenBtns.forEach(btn => {
      btn.addEventListener('click', () => this.switchTab('zen-section'));
    });

    const dockMaximize = document.getElementById('dockMaximizePlayer');
    if (dockMaximize) {
      dockMaximize.addEventListener('click', () => {
        if (window.musicPlayer && window.musicPlayer.floatingYtPlayer) {
          window.musicPlayer.floatingYtPlayer.classList.add('active');
          window.musicPlayer.floatingYtPlayer.classList.remove('minimized');
        }
        this.switchTab('music-section');
      });
    }
  }

  switchTab(targetSectionId) {
    // Update nav button active state
    document.querySelectorAll('.nav-tab').forEach(tab => {
      if (tab.getAttribute('data-tab') === targetSectionId) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });

    // Switch section
    document.querySelectorAll('.tab-content').forEach(section => {
      if (section.id === targetSectionId) {
        section.classList.add('active');
      } else {
        section.classList.remove('active');
      }
    });

    // Re-render visualizer or chart if needed
    if (targetSectionId === 'music-section' && window.musicPlayer) {
      window.musicPlayer.startVisualizer();
    }
    if (targetSectionId === 'analytics-section' && window.moodAnalytics) {
      window.moodAnalytics.render();
    }
  }

  // --------------------------------------------------------------------------
  // Scanner Controls & Emotion Meter Updates
  // --------------------------------------------------------------------------
  bindScannerEvents() {
    const captureBtn = document.getElementById('captureAndDetectBtn');
    if (captureBtn) {
      captureBtn.addEventListener('click', () => {
        if (window.cameraController) {
          window.cameraController.analyzeExpression();
        }
      });
    }

    const autoScanBtn = document.getElementById('autoScanToggleBtn');
    const autoScanText = document.getElementById('autoScanText');
    if (autoScanBtn) {
      autoScanBtn.addEventListener('click', () => {
        if (window.cameraController) {
          const isScanning = window.cameraController.toggleAutoScan();
          autoScanText.textContent = isScanning ? "Pause Continuous Scan" : "Enable Continuous Scan";
          autoScanBtn.classList.toggle('primary', isScanning);
          this.showToast(isScanning ? "Continuous Emotion Scan Active" : "Continuous Scan Paused", "info");
        }
      });
    }

    const toggleCamBtn = document.getElementById('toggleCameraBtn');
    if (toggleCamBtn) {
      toggleCamBtn.addEventListener('click', () => {
        if (window.cameraController) {
          const active = window.cameraController.toggleCamera();
          toggleCamBtn.innerHTML = active ? 
            '<i class="fa-solid fa-video"></i> <span>Stop Cam</span>' : 
            '<i class="fa-solid fa-video-slash"></i> <span>Start Cam</span>';
        }
      });
    }

    const switchCamBtn = document.getElementById('switchCameraBtn');
    if (switchCamBtn) {
      switchCamBtn.addEventListener('click', () => {
        if (window.cameraController) window.cameraController.switchCamera();
      });
    }

    const startCamPromptBtn = document.getElementById('startCamPromptBtn');
    if (startCamPromptBtn) {
      startCamPromptBtn.addEventListener('click', () => {
        if (window.cameraController) window.cameraController.initCamera();
      });
    }

    // Manual Emotion Pills (for instant testing)
    const emotionPills = document.querySelectorAll('.emotion-pill');
    emotionPills.forEach(pill => {
      pill.addEventListener('click', () => {
        emotionPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const emotion = pill.getAttribute('data-emotion');
        if (window.cameraController) {
          window.cameraController.analyzeExpression(emotion);
        }
      });
    });

    // Play Prescribed Track Button
    const playPrescribedBtn = document.getElementById('playPrescribedTrackBtn');
    if (playPrescribedBtn) {
      playPrescribedBtn.addEventListener('click', () => {
        if (window.recommendationEngine && window.musicPlayer) {
          const meta = window.recommendationEngine.getClinicalMeta(this.currentEmotion);
          window.musicPlayer.playTrackById(meta.primaryTrackId);
          this.showToast(`Now playing sound therapy for ${this.currentEmotion.toUpperCase()}`, "success");
        }
      });
    }
  }

  // Handle Detection Result payload from CameraController
  async handleDetectionResult(result) {
    const { emotion, confidence, allEmotions, source } = result;
    this.currentEmotion = emotion;

    // 1. Update Floating Live Emotion Badge on camera viewport
    const badgeLabel = document.getElementById('badgeLabel');
    const badgeConfidence = document.getElementById('badgeConfidence');
    const badgeEmoji = document.getElementById('badgeEmoji');

    const meta = window.recommendationEngine ? window.recommendationEngine.getClinicalMeta(emotion) : { emoji: '🧠', rxHeadline: '', rxExplanation: '', primaryTrackId: '' };
    if (badgeLabel) badgeLabel.textContent = emotion;
    if (badgeConfidence) badgeConfidence.textContent = `${Math.round(confidence * 100)}%`;
    if (badgeEmoji) badgeEmoji.textContent = meta.emoji;

    // 2. Update Emotion Probability Meters
    const emotionsList = ['happy', 'sad', 'angry', 'fear', 'surprise', 'neutral'];
    emotionsList.forEach(key => {
      const prob = allEmotions[key] !== undefined ? allEmotions[key] : (key === emotion ? confidence : 0.04);
      const pct = Math.round(prob * 100);
      
      const bar = document.getElementById(`bar-${key}`);
      const text = document.getElementById(`pct-${key}`);
      
      if (bar) bar.style.width = `${pct}%`;
      if (text) text.textContent = `${pct}%`;
    });

    // 3. Update Emotional Wellness Prescription Box
    const rxHeadline = document.getElementById('rxHeadline');
    const rxExplanation = document.getElementById('rxExplanation');
    const rxStatusTag = document.getElementById('rxStatusTag');
    const rxCtaRow = document.getElementById('rxCtaRow');
    const rxBtnText = document.getElementById('rxBtnText');

    if (rxHeadline) rxHeadline.textContent = meta.rxHeadline;
    if (rxExplanation) rxExplanation.textContent = meta.rxExplanation;
    if (rxStatusTag) {
      rxStatusTag.textContent = source === 'flask_backend' ? 'Flask CNN + YouTube Live' : 'AI YouTube Analysis Ready';
      rxStatusTag.style.background = 'rgba(16, 185, 129, 0.2)';
      rxStatusTag.style.color = '#34d399';
    }
    if (rxCtaRow) rxCtaRow.style.display = 'flex';
    if (rxBtnText) rxBtnText.textContent = `Play ${meta.emoji} ${emotion.toUpperCase()} YouTube Track`;

    // 4. Query YouTube API & Update Recommendations Grid (only when emotion changes or initial fetch)
    const emotionChanged = this.lastFetchedEmotion !== emotion || this.lastFetchedLanguage !== this.selectedLanguage;
    if (emotionChanged) {
      this.lastFetchedEmotion = emotion;
      this.lastFetchedLanguage = this.selectedLanguage;
      if (window.recommendationEngine && window.recommendationEngine.fetchYouTubeRecommendations) {
        await window.recommendationEngine.fetchYouTubeRecommendations(emotion, this.selectedLanguage);
      }
      this.renderQuickRecommendations(emotion);
      this.renderMusicLibrary();
    }

    // 5. DO NOT cut off or interrupt music if user is already playing a song!
    // Only auto-start on very first idle scan if music player is completely idle.
    if (window.musicPlayer && meta.primaryTrackId && !window.musicPlayer.isPlaying && !this.initialAutoplayDone) {
      this.initialAutoplayDone = true;
      window.musicPlayer.playTrackById(meta.primaryTrackId);
    }

    // 6. Log to Analytics
    const recTrack = window.recommendationEngine ? window.recommendationEngine.getSongById(meta.primaryTrackId) : null;
    if (window.moodAnalytics) {
      window.moodAnalytics.logScan(emotion, confidence, recTrack ? recTrack.title : null);
    }

    // 7. Highlight corresponding pill in manual selection
    document.querySelectorAll('.emotion-pill').forEach(pill => {
      if (pill.getAttribute('data-emotion') === emotion) {
        pill.classList.add('active');
      } else {
        pill.classList.remove('active');
      }
    });

    this.showToast(`Expression Detected: ${meta.emoji} ${emotion.toUpperCase()} (${Math.round(confidence * 100)}%)`, "info");
  }

  // Render quick recommendation cards on Scanner Tab
  renderQuickRecommendations(emotion) {
    const container = document.getElementById('quickTracksGrid');
    if (!container || !window.recommendationEngine) return;

    const tracks = window.recommendationEngine.getSongsByEmotion(emotion, this.selectedLanguage);
    const subtitle = document.getElementById('recommendedSubtitle');
    if (subtitle) {
      const langText = this.selectedLanguage ? ` (${this.selectedLanguage})` : '';
      subtitle.textContent = `Showing ${tracks.length} YouTube therapeutic tracks for ${emotion.toUpperCase()} state${langText}.`;
    }

    container.innerHTML = tracks.map(track => {
      const cover = track.coverUrl || `https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg`;
      return `
      <div class="track-card" onclick="window.musicPlayer.playTrackById('${track.id}')">
        <div class="track-card-art" style="background-image: url('${cover}'); background-size: cover; background-position: center;">
          <span class="track-mood-badge">${track.frequency || '432 Hz'}</span>
          <div class="art-overlay-play">
            <i class="fa-solid fa-play"></i>
          </div>
        </div>
        <div class="track-card-body">
          <h4 class="track-title">${track.title}</h4>
          <span class="track-artist">${track.artist} • ${track.tag || track.mood}</span>
          <p class="track-reason">${track.clinicalReason || ''}</p>
        </div>
      </div>
    `}).join('');
  }

  // --------------------------------------------------------------------------
  // Music Library Filtering & List
  // --------------------------------------------------------------------------
  bindMusicLibraryEvents() {
    // Category Filter Pills
    const filterPills = document.querySelectorAll('.filter-pill');
    filterPills.forEach(pill => {
      pill.addEventListener('click', () => {
        filterPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        this.activeFilter = pill.getAttribute('data-filter');
        this.renderMusicLibrary();
      });
    });

    // Search Input
    const searchInput = document.getElementById('songSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.renderMusicLibrary(e.target.value);
      });
    }
  }

  renderMusicLibrary(searchQuery = '') {
    const container = document.getElementById('fullSongsList');
    const counter = document.getElementById('trackCounter');
    if (!container || !window.recommendationEngine) return;

    let tracks = [];
    if (searchQuery) {
      tracks = window.recommendationEngine.searchTracks(searchQuery);
    } else {
      tracks = window.recommendationEngine.getSongsByEmotion(this.activeFilter, this.selectedLanguage);
    }

    if (counter) {
      counter.textContent = `Showing ${tracks.length} Tracks`;
    }

    if (tracks.length === 0) {
      container.innerHTML = `
        <div class="empty-history-state">
          <i class="fa-solid fa-music"></i>
          <p>No tracks matching your search criteria.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = tracks.map((track, idx) => `
      <div class="song-row-item ${window.musicPlayer && window.musicPlayer.currentTrack && window.musicPlayer.currentTrack.id === track.id ? 'playing' : ''}" 
           data-id="${track.id}" 
           onclick="window.musicPlayer.playTrackById('${track.id}')">
        <span class="song-item-idx">${idx + 1}</span>
        <div class="song-item-cover" style="background-image: url('${track.coverUrl || `https://i.ytimg.com/vi/${track.youtubeId}/hqdefault.jpg`}'); background-size: cover; background-position: center;">
          <i class="fa-solid fa-play" style="opacity: 0.8; color: #fff;"></i>
        </div>
        <div class="song-item-meta">
          <h5 class="song-item-title">${track.title}</h5>
          <span class="song-item-artist">${track.artist}</span>
        </div>
        <span class="song-item-tag">${track.frequency}</span>
        <span class="song-item-duration">${track.duration}</span>
      </div>
    `).join('');
  }

  // --------------------------------------------------------------------------
  // Calm Sanctuary / Zen Box Breathing Space
  // --------------------------------------------------------------------------
  bindZenEvents() {
    const zenStartBtn = document.getElementById('zenStartBtn');
    if (zenStartBtn) {
      zenStartBtn.addEventListener('click', () => this.toggleZenBreathing());
    }

    const soundChips = document.querySelectorAll('.sound-chip');
    soundChips.forEach(chip => {
      chip.addEventListener('click', () => {
        soundChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const soundType = chip.getAttribute('data-sound');
        if (window.synthEngine) {
          window.synthEngine.playAmbient(soundType);
        }
      });
    });

    const zenSoundBtn = document.getElementById('zenSoundBtn');
    let soundActive = true;
    if (zenSoundBtn) {
      zenSoundBtn.addEventListener('click', () => {
        soundActive = !soundActive;
        if (soundActive) {
          zenSoundBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i> Rain & White Noise: On';
          if (window.synthEngine) window.synthEngine.playAmbient('rain');
        } else {
          zenSoundBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i> Soundscape: Off';
          if (window.synthEngine) window.synthEngine.stopAmbient();
        }
      });
    }
  }

  toggleZenBreathing() {
    const btn = document.getElementById('zenStartBtn');
    if (this.zenRunning) {
      // Stop
      clearInterval(this.zenTimer);
      this.zenRunning = false;
      if (btn) btn.innerHTML = '<i class="fa-solid fa-play"></i> Start 2-Minute Breathing';
      const instruction = document.getElementById('breathInstruction');
      const orb = document.getElementById('breathingOrb');
      if (instruction) instruction.textContent = 'Paused';
      if (orb) orb.style.transform = 'scale(1)';
    } else {
      // Start 4-4-4-4 Box Breathing
      this.zenRunning = true;
      if (btn) btn.innerHTML = '<i class="fa-solid fa-pause"></i> Pause Breathing';
      this.runBreathingCycle();
    }
  }

  runBreathingCycle() {
    const phases = [
      { text: "Inhale", scale: "1.45", duration: 4 },
      { text: "Hold", scale: "1.45", duration: 4 },
      { text: "Exhale", scale: "0.85", duration: 4 },
      { text: "Hold", scale: "0.85", duration: 4 }
    ];

    let phaseIndex = 0;
    let secondsLeft = phases[0].duration;

    const instruction = document.getElementById('breathInstruction');
    const countdown = document.getElementById('breathCountdown');
    const orb = document.getElementById('breathingOrb');

    const updateDisplay = () => {
      const p = phases[phaseIndex];
      if (instruction) instruction.textContent = p.text;
      if (countdown) countdown.textContent = secondsLeft;
      if (orb) orb.style.transform = `scale(${p.scale})`;
    };

    updateDisplay();

    this.zenTimer = setInterval(() => {
      secondsLeft--;
      if (secondsLeft <= 0) {
        phaseIndex = (phaseIndex + 1) % phases.length;
        secondsLeft = phases[phaseIndex].duration;
      }
      updateDisplay();
    }, 1000);
  }

  // --------------------------------------------------------------------------
  // Settings Modal & Flask Backend Connectivity
  // --------------------------------------------------------------------------
  bindSettingsModal() {
    const settingsBtn = document.getElementById('settingsBtn');
    const modal = document.getElementById('settingsModal');
    const closeBtn = document.getElementById('closeSettingsBtn');
    const saveBtn = document.getElementById('saveSettingsBtn');
    const resetBtn = document.getElementById('resetDefaultsBtn');
    const testApiBtn = document.getElementById('testApiConnectionBtn');
    const statusPill = document.getElementById('backendStatusPill');

    if (settingsBtn && modal) {
      settingsBtn.addEventListener('click', () => modal.classList.add('open'));
    }
    if (statusPill && modal) {
      statusPill.addEventListener('click', () => modal.classList.add('open'));
    }
    if (closeBtn && modal) {
      closeBtn.addEventListener('click', () => modal.classList.remove('open'));
    }

    if (modal) {
      modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('open');
      });
    }

    // Save Settings
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const urlInput = document.getElementById('flaskApiUrlInput');
        if (urlInput) {
          this.config.flaskUrl = urlInput.value.trim() || 'http://127.0.0.1:5000';
          localStorage.setItem('mindpulse_flask_url', this.config.flaskUrl);
        }

        const modeRadio = document.querySelector('input[name="inferenceMode"]:checked');
        if (modeRadio) {
          this.config.inferenceMode = modeRadio.value;
          localStorage.setItem('mindpulse_inference_mode', this.config.inferenceMode);
        }

        modal.classList.remove('open');
        this.showToast("Settings saved. Testing backend link...", "info");
        this.checkBackendHealth();
      });
    }

    // Reset Defaults
    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.config.flaskUrl = 'http://127.0.0.1:5000';
        this.config.inferenceMode = 'auto';
        localStorage.removeItem('mindpulse_flask_url');
        localStorage.removeItem('mindpulse_inference_mode');
        const urlInput = document.getElementById('flaskApiUrlInput');
        if (urlInput) urlInput.value = this.config.flaskUrl;
        this.showToast("Reset to default settings.", "info");
      });
    }

    // Test API Connection Button
    if (testApiBtn) {
      testApiBtn.addEventListener('click', async () => {
        testApiBtn.textContent = "Testing...";
        const ok = await this.pingBackend(this.config.flaskUrl);
        testApiBtn.textContent = "Test Ping";
        if (ok) {
          this.showToast("Flask Backend is ONLINE & ready!", "success");
        } else {
          this.showToast("Cannot reach Flask at " + this.config.flaskUrl + ". Simulated mode active.", "error");
        }
      });
    }
  }

  // Ping backend to check if Flask is up
  async pingBackend(baseUrl) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      const res = await fetch(`${baseUrl}/health`, {
        credentials: 'include',
        signal: controller.signal
      }).catch(() => null);
      clearTimeout(timeoutId);
      return res && res.ok;
    } catch (e) {
      return false;
    }
  }

  async checkBackendHealth() {
    const pill = document.getElementById('backendStatusPill');
    const label = document.getElementById('backendStatusText');

    const isUp = await this.pingBackend(this.config.flaskUrl);
    this.isBackendOnline = isUp;

    if (!pill || !label) return;

    pill.className = 'backend-status-pill';
    if (isUp) {
      pill.classList.add('online');
      label.textContent = "Flask CNN: Connected";
    } else {
      pill.classList.add('offline');
      label.textContent = "Smart Simulation Mode";
    }
  }

  // Toast Notification System
  showToast(message, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    const iconMap = {
      success: 'fa-solid fa-circle-check',
      error: 'fa-solid fa-triangle-exclamation',
      info: 'fa-solid fa-circle-info'
    };

    toast.innerHTML = `
      <i class="${iconMap[type] || iconMap.info}"></i>
      <span>${message}</span>
    `;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }
}

// Initialize on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
  window.authReady.then((authenticated) => {
    if (authenticated) window.app = new MindPulseApp();
  });
});
