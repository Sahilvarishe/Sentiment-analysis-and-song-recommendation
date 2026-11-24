/**
 * MindPulse AI - Therapeutic Audio Player & Audio Visualizer
 * Coordinates playback, progress seeking, volume, playlist queuing,
 * and real-time canvas frequency visualization.
 */

class MusicPlayer {
  constructor() {
    this.coreAudio = document.getElementById('coreAudioElement');
    this.currentTrack = null;
    this.isPlaying = false;
    this.playlist = [];
    this.currentIndex = 0;
    this.isShuffle = false;
    this.isRepeat = false;
    this.volume = 0.75;
    
    // Playback Progress Timer
    this.progressInterval = null;
    this.currentSeconds = 0;
    this.totalSeconds = 210; // Default ~3:30

    // Canvas Visualizer
    this.visCanvas = document.getElementById('visualizerCanvas');
    this.visCtx = this.visCanvas ? this.visCanvas.getContext('2d') : null;
    this.visAnimId = null;

    this.initElements();
    this.bindEvents();
    this.loadInitialPlaylist();
  }

  initElements() {
    // Dock Elements
    this.dockPlayBtn = document.getElementById('dockPlayBtn');
    this.dockPlayIcon = document.getElementById('dockPlayIcon');
    this.dockPrevBtn = document.getElementById('dockPrevBtn');
    this.dockNextBtn = document.getElementById('dockNextBtn');
    this.dockShuffleBtn = document.getElementById('dockShuffleBtn');
    this.dockRepeatBtn = document.getElementById('dockRepeatBtn');
    this.dockTitle = document.getElementById('dockTitle');
    this.dockArtist = document.getElementById('dockArtist');
    this.dockMoodPill = document.getElementById('dockMoodPill');
    this.dockScrubberTrack = document.getElementById('dockScrubberTrack');
    this.dockScrubberFill = document.getElementById('dockScrubberFill');
    this.dockCurrentTime = document.getElementById('dockCurrentTime');
    this.dockTotalTime = document.getElementById('dockTotalTime');
    this.dockVolumeSlider = document.getElementById('dockVolumeSlider');
    this.dockMuteBtn = document.getElementById('dockMuteBtn');

    // Featured Panel Elements
    this.npTitle = document.getElementById('npTitle');
    this.npArtist = document.getElementById('npArtist');
    this.npEmotionLabel = document.getElementById('npEmotionLabel');
    this.npTherapyNote = document.getElementById('npTherapyNote');
    this.npArtGlow = document.getElementById('npArtGlow');

    // Floating YouTube Player Widget Elements
    this.floatingYtPlayer = document.getElementById('floatingYtPlayer');
    this.floatingYtTitle = document.getElementById('floatingYtTitle');
    this.floatingYtExpandBtn = document.getElementById('floatingYtExpandBtn');
    this.floatingYtExpandIcon = document.getElementById('floatingYtExpandIcon');
    this.floatingYtMinimizeBtn = document.getElementById('floatingYtMinimizeBtn');
    this.floatingYtMinimizeIcon = document.getElementById('floatingYtMinimizeIcon');
    this.floatingYtCloseBtn = document.getElementById('floatingYtCloseBtn');
    this.youtubeIframe = document.getElementById('youtubeIframe');
  }

  bindEvents() {
    if (this.dockPlayBtn) {
      this.dockPlayBtn.addEventListener('click', () => this.togglePlay());
    }
    if (this.dockPrevBtn) {
      this.dockPrevBtn.addEventListener('click', () => this.prevTrack());
    }
    if (this.dockNextBtn) {
      this.dockNextBtn.addEventListener('click', () => this.nextTrack());
    }
    if (this.dockShuffleBtn) {
      this.dockShuffleBtn.addEventListener('click', () => this.toggleShuffle());
    }
    if (this.dockRepeatBtn) {
      this.dockRepeatBtn.addEventListener('click', () => this.toggleRepeat());
    }

    // Floating Player Controls
    if (this.floatingYtMinimizeBtn) {
      this.floatingYtMinimizeBtn.addEventListener('click', () => this.toggleFloatingMinimize());
    }
    if (this.floatingYtExpandBtn) {
      this.floatingYtExpandBtn.addEventListener('click', () => this.toggleFloatingExpand());
    }
    if (this.floatingYtCloseBtn) {
      this.floatingYtCloseBtn.addEventListener('click', () => this.closeFloatingPlayer());
    }

    // Scrubber click/drag
    if (this.dockScrubberTrack) {
      this.dockScrubberTrack.addEventListener('click', (e) => this.handleSeek(e));
    }

    // Volume Slider
    if (this.dockVolumeSlider) {
      this.dockVolumeSlider.addEventListener('input', (e) => {
        this.setVolume(parseFloat(e.target.value));
      });
    }

    if (this.dockMuteBtn) {
      this.dockMuteBtn.addEventListener('click', () => this.toggleMute());
    }
  }

  loadInitialPlaylist() {
    if (window.recommendationEngine) {
      this.playlist = window.recommendationEngine.getAllSongs();
      if (this.playlist.length > 0) {
        this.setTrack(this.playlist[0], false);
      }
    }
  }

  setTrack(track, autoPlay = true) {
    if (!track) return;
    this.currentTrack = track;
    this.currentIndex = this.playlist.findIndex(t => t.id === track.id);
    
    // Parse duration string like "3:45" to seconds
    const parts = (track.duration || "3:30").split(':');
    this.totalSeconds = parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    this.currentSeconds = 0;

    this.updateUI();

    if (autoPlay) {
      this.play();
    }
  }

  playTrackById(trackId) {
    if (!window.recommendationEngine) return;
    const track = window.recommendationEngine.getSongById(trackId);
    if (track) {
      // If this track is already playing, do not reload or interrupt it
      if (this.currentTrack && (this.currentTrack.id === track.id || this.currentTrack.youtubeId === track.youtubeId) && this.isPlaying) {
        return;
      }
      this.setTrack(track, true);
    }
  }

  play() {
    if (!this.currentTrack && this.playlist.length > 0) {
      this.currentTrack = this.playlist[0];
    }
    if (!this.currentTrack) return;

    this.isPlaying = true;
    this.updatePlayBtnIcon();

    // YouTube IFrame video playback
    const ytId = this.currentTrack.youtubeId || this.currentTrack.video_id;
    const ytIframe = this.youtubeIframe || document.getElementById('youtubeIframe');
    const audioBadge = document.getElementById('audioTypeBadge');

    if (ytId) {
      // 1. Immediately STOP the synthetic melody so real YouTube song plays clearly!
      if (window.synthEngine) {
        window.synthEngine.stopTheme();
      }

      if (ytIframe) {
        // Standard official YouTube embed URL with autoplay enabled
        const embedUrl = `https://www.youtube.com/embed/${ytId}?autoplay=1&enablejsapi=1&rel=0&playsinline=1`;
        if (this.loadedYtId !== ytId) {
          this.loadedYtId = ytId;
          ytIframe.src = embedUrl;
        } else if (ytIframe.contentWindow) {
          try {
            ytIframe.contentWindow.postMessage(JSON.stringify({
              event: 'command',
              func: 'playVideo',
              args: ''
            }), '*');
          } catch (e) {}
        }

        // Show floating video widget so user can watch while browsing any tab
        if (this.floatingYtPlayer) {
          this.floatingYtPlayer.classList.add('active');
        }
        if (this.floatingYtTitle) {
          this.floatingYtTitle.textContent = this.currentTrack.title || 'YouTube Music Video';
        }

        // Sync volume with iframe
        try {
          ytIframe.contentWindow.postMessage(JSON.stringify({
            event: 'command',
            func: 'setVolume',
            args: [Math.round(this.volume * 100)]
          }), '*');
        } catch (e) {}
      }

      if (audioBadge) {
        audioBadge.textContent = "YouTube Music Video";
        audioBadge.style.background = "rgba(239, 68, 68, 0.2)";
        audioBadge.style.color = "#f87171";
      }
    } else {
      // Fallback only if track has NO YouTube ID
      if (window.synthEngine) {
        window.synthEngine.playTheme(this.currentTrack.emotion);
        window.synthEngine.setVolume(this.volume);
      }
      if (audioBadge) {
        audioBadge.textContent = "Ambient Synthesizer";
        audioBadge.style.background = "rgba(99, 102, 241, 0.2)";
        audioBadge.style.color = "#818cf8";
      }
    }

    this.startProgressTimer();
    this.startVisualizer();

    // Highlight row in UI list
    this.highlightPlayingRow();
  }

  pause() {
    this.isPlaying = false;
    this.updatePlayBtnIcon();

    const ytIframe = this.youtubeIframe || document.getElementById('youtubeIframe');
    if (ytIframe && ytIframe.contentWindow) {
      try {
        ytIframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'pauseVideo',
          args: ''
        }), '*');
      } catch (e) {}
    }

    if (window.synthEngine) {
      window.synthEngine.stopTheme();
    }

    this.stopProgressTimer();
    this.stopVisualizer();
  }

  toggleFloatingMinimize() {
    if (!this.floatingYtPlayer) return;
    const isMin = this.floatingYtPlayer.classList.toggle('minimized');
    if (this.floatingYtMinimizeIcon) {
      this.floatingYtMinimizeIcon.className = isMin ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down';
    }
  }

  toggleFloatingExpand() {
    if (!this.floatingYtPlayer) return;
    const isExp = this.floatingYtPlayer.classList.toggle('expanded');
    if (this.floatingYtExpandIcon) {
      this.floatingYtExpandIcon.className = isExp ? 'fa-solid fa-compress' : 'fa-solid fa-expand';
    }
  }

  closeFloatingPlayer() {
    if (this.floatingYtPlayer) {
      this.floatingYtPlayer.classList.remove('active');
    }
    this.pause();
  }

  togglePlay() {
    if (this.isPlaying) {
      this.pause();
    } else {
      this.play();
    }
  }

  nextTrack() {
    if (this.playlist.length === 0) return;
    
    if (this.isShuffle) {
      this.currentIndex = Math.floor(Math.random() * this.playlist.length);
    } else {
      this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
    }

    this.setTrack(this.playlist[this.currentIndex], true);
  }

  prevTrack() {
    if (this.playlist.length === 0) return;

    if (this.currentSeconds > 3) {
      // Restart current song
      this.currentSeconds = 0;
      this.updateScrubber();
      return;
    }

    this.currentIndex = (this.currentIndex - 1 + this.playlist.length) % this.playlist.length;
    this.setTrack(this.playlist[this.currentIndex], true);
  }

  toggleShuffle() {
    this.isShuffle = !this.isShuffle;
    if (this.dockShuffleBtn) {
      this.dockShuffleBtn.classList.toggle('active', this.isShuffle);
    }
    if (window.app) {
      window.app.showToast(this.isShuffle ? "Shuffle Mode On" : "Shuffle Mode Off", "info");
    }
  }

  toggleRepeat() {
    this.isRepeat = !this.isRepeat;
    if (this.dockRepeatBtn) {
      this.dockRepeatBtn.classList.toggle('active', this.isRepeat);
    }
    if (window.app) {
      window.app.showToast(this.isRepeat ? "Repeat Mode On" : "Repeat Mode Off", "info");
    }
  }

  setVolume(val) {
    this.volume = Math.max(0, Math.min(1, val));
    if (window.synthEngine) {
      window.synthEngine.setVolume(this.volume);
    }
    if (this.coreAudio) {
      this.coreAudio.volume = this.volume;
    }
    const ytIframe = this.youtubeIframe || document.getElementById('youtubeIframe');
    if (ytIframe && ytIframe.contentWindow) {
      try {
        ytIframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: 'setVolume',
          args: [Math.round(this.volume * 100)]
        }), '*');
      } catch (e) {}
    }
    this.updateVolumeIcon();
  }

  toggleMute() {
    if (this.volume > 0) {
      this.preMuteVolume = this.volume;
      this.setVolume(0);
      if (this.dockVolumeSlider) this.dockVolumeSlider.value = 0;
    } else {
      const restore = this.preMuteVolume || 0.75;
      this.setVolume(restore);
      if (this.dockVolumeSlider) this.dockVolumeSlider.value = restore;
    }
    const ytIframe = this.youtubeIframe || document.getElementById('youtubeIframe');
    if (ytIframe && ytIframe.contentWindow) {
      try {
        ytIframe.contentWindow.postMessage(JSON.stringify({
          event: 'command',
          func: this.volume === 0 ? 'mute' : 'unMute',
          args: ''
        }), '*');
      } catch (e) {}
    }
  }

  updateVolumeIcon() {
    const icon = document.getElementById('dockVolumeIcon');
    if (!icon) return;
    if (this.volume === 0) {
      icon.className = "fa-solid fa-volume-xmark";
    } else if (this.volume < 0.5) {
      icon.className = "fa-solid fa-volume-low";
    } else {
      icon.className = "fa-solid fa-volume-high";
    }
  }

  startProgressTimer() {
    this.stopProgressTimer();
    this.progressInterval = setInterval(() => {
      this.currentSeconds++;
      if (this.currentSeconds >= this.totalSeconds) {
        if (this.isRepeat) {
          this.currentSeconds = 0;
          this.updateScrubber();
        } else {
          this.nextTrack();
        }
      } else {
        this.updateScrubber();
      }
    }, 1000);
  }

  stopProgressTimer() {
    if (this.progressInterval) {
      clearInterval(this.progressInterval);
      this.progressInterval = null;
    }
  }

  handleSeek(e) {
    if (!this.dockScrubberTrack) return;
    const rect = this.dockScrubberTrack.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    this.currentSeconds = Math.floor(ratio * this.totalSeconds);
    this.updateScrubber();
  }

  updateScrubber() {
    const pct = (this.currentSeconds / this.totalSeconds) * 100;
    if (this.dockScrubberFill) {
      this.dockScrubberFill.style.width = `${pct}%`;
    }
    if (this.dockCurrentTime) {
      this.dockCurrentTime.textContent = this.formatTime(this.currentSeconds);
    }
  }

  formatTime(totalSec) {
    const mins = Math.floor(totalSec / 60);
    const secs = Math.floor(totalSec % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  updatePlayBtnIcon() {
    if (this.dockPlayIcon) {
      this.dockPlayIcon.className = this.isPlaying ? "fa-solid fa-pause" : "fa-solid fa-play";
    }
  }

  updateUI() {
    if (!this.currentTrack) return;
    const t = this.currentTrack;
    const emotion = (t.emotion || t.mood || t.category || 'calm').toLowerCase();
    const frequency = t.frequency || t.freq || '432 Hz';
    const tag = t.tag || t.mood || 'Relaxation';
    const bpm = t.bpm || 60;
    const clinicalReason = t.clinicalReason || 'Acoustic sound wave frequencies targeted for emotional wellness and relaxation.';

    // Dock
    if (this.dockTitle) this.dockTitle.textContent = t.title;
    if (this.dockArtist) this.dockArtist.textContent = t.artist;
    if (this.dockMoodPill) {
      this.dockMoodPill.textContent = `${tag} (${frequency})`;
    }
    if (this.dockTotalTime) {
      this.dockTotalTime.textContent = t.duration || "3:30";
    }

    const dockCoverThumb = document.getElementById('dockCoverThumb');
    if (dockCoverThumb) {
      if (t.coverUrl) {
        dockCoverThumb.innerHTML = `<img src="${t.coverUrl}" alt="Cover" style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">`;
      } else {
        dockCoverThumb.innerHTML = `<i class="fa-solid fa-music"></i>`;
      }
    }

    // Featured Panel
    if (this.npTitle) this.npTitle.textContent = t.title;
    if (this.npArtist) this.npArtist.textContent = `${t.artist} • ${bpm} BPM`;
    if (this.npEmotionLabel) {
      this.npEmotionLabel.textContent = `${emotion.toUpperCase()} RESONANCE (${frequency})`;
    }
    if (this.npTherapyNote) {
      this.npTherapyNote.innerHTML = `<strong>Therapeutic Action:</strong> ${clinicalReason}`;
    }
    if (this.npArtGlow) {
      this.npArtGlow.style.background = this.getEmotionGlow(emotion);
    }

    const npCoverArt = document.getElementById('npCoverArt');
    const npFallbackArt = document.getElementById('npFallbackArt');
    if (npCoverArt && t.coverUrl) {
      npCoverArt.src = t.coverUrl;
      npCoverArt.style.display = 'block';
      if (npFallbackArt) npFallbackArt.style.display = 'none';
    }

    this.updateScrubber();
  }

  getEmotionGlow(emotion) {
    const colors = {
      happy: 'rgba(16, 185, 129, 0.65)',
      sad: 'rgba(59, 130, 246, 0.65)',
      angry: 'rgba(244, 63, 94, 0.65)',
      fear: 'rgba(168, 85, 247, 0.65)',
      surprise: 'rgba(6, 182, 212, 0.65)',
      neutral: 'rgba(20, 184, 166, 0.65)'
    };
    return colors[emotion] || 'rgba(99, 102, 241, 0.65)';
  }

  highlightPlayingRow() {
    const rows = document.querySelectorAll('.song-row-item');
    rows.forEach(r => {
      const id = r.getAttribute('data-id');
      if (this.currentTrack && id === this.currentTrack.id) {
        r.classList.add('playing');
      } else {
        r.classList.remove('playing');
      }
    });
  }

  // Real-time Canvas Sound Visualizer Bars
  startVisualizer() {
    if (!this.visCanvas || !this.visCtx) return;
    this.stopVisualizer();

    const canvas = this.visCanvas;
    const ctx = this.visCtx;
    canvas.width = canvas.parentElement.clientWidth || 300;
    canvas.height = canvas.parentElement.clientHeight || 240;

    const renderBars = () => {
      if (!this.isPlaying) return;

      const data = window.synthEngine ? window.synthEngine.getVisualizerData() : [];
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const barCount = 28;
      const barWidth = (canvas.width / barCount) - 3;
      const centerY = canvas.height * 0.78;

      for (let i = 0; i < barCount; i++) {
        const val = data[i] || Math.sin(Date.now() * 0.005 + i) * 30 + 40;
        const barHeight = Math.max(4, (val / 255) * (canvas.height * 0.55));
        const x = i * (barWidth + 3);

        const gradient = ctx.createLinearGradient(0, centerY - barHeight, 0, centerY);
        gradient.addColorStop(0, '#818cf8');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0.15)');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, centerY - barHeight, barWidth, barHeight, [4, 4, 0, 0]);
        ctx.fill();
      }

      this.visAnimId = requestAnimationFrame(renderBars);
    };

    renderBars();
  }

  stopVisualizer() {
    if (this.visAnimId) {
      cancelAnimationFrame(this.visAnimId);
      this.visAnimId = null;
    }
    if (this.visCtx && this.visCanvas) {
      this.visCtx.clearRect(0, 0, this.visCanvas.width, this.visCanvas.height);
    }
  }
}

// Global instance
window.musicPlayer = new MusicPlayer();
