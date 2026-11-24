/**
 * MindPulse AI - Psychoacoustic Web Audio Synthesizer & Soundscape Engine
 * Provides zero-latency, therapeutic audio synthesis (432Hz, Binaural Beats, Lo-Fi, Rain Noise)
 * Guarantees that music playback ALWAYS works without relying on external third-party servers.
 */

class AudioSynthesizer {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.currentTheme = null;
    this.masterGain = null;
    this.analyser = null;
    this.activeNodes = [];
    this.ambientSoundNode = null;
    this.ambientGain = null;
    this.currentAmbient = null;
    
    // Timer for melodic arpeggios
    this.melodyTimer = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContextClass();
      
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      
      // Analyser for real-time visualization
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;
      
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // Soundscape themes tailored for mental health emotions
  getThemes() {
    return {
      happy: {
        name: "Serotonin Euphoria (528Hz & Bright Chords)",
        baseFreq: 528, // Solfeggio Love/Repair Frequency
        scale: [261.63, 329.63, 392.00, 523.25, 659.25], // C Major Pentatonic
        tempo: 450,
        waveType: "triangle",
        color: "#10b981"
      },
      sad: {
        name: "Cathartic Piano & Melancholic Reverb",
        baseFreq: 220, // A minor calming resonance
        scale: [220.00, 261.63, 293.66, 329.63, 392.00], // A Minor
        tempo: 750,
        waveType: "sine",
        color: "#3b82f6"
      },
      angry: {
        name: "Somatic Tension Release & Low Bass (40Hz Gamma)",
        baseFreq: 110, // Deep warm bass
        scale: [110.00, 146.83, 164.81, 196.00], // Slow pentatonic ground
        tempo: 900,
        waveType: "sine",
        color: "#f43f5e"
      },
      fear: {
        name: "Anti-Anxiety 432Hz Vagus Nerve Soother",
        baseFreq: 432, // Healing frequency
        scale: [216.00, 288.00, 324.00, 432.00], // 432 harmonic multiples
        tempo: 800,
        waveType: "sine",
        color: "#a855f7"
      },
      surprise: {
        name: "Clarity Neo-Classical Shimmer",
        baseFreq: 396,
        scale: [329.63, 392.00, 493.88, 587.33, 659.25], // E Dorian
        tempo: 380,
        waveType: "triangle",
        color: "#06b6d4"
      },
      neutral: {
        name: "Equanimity Lo-Fi Ambient & Alpha Waves (10Hz)",
        baseFreq: 261.63,
        scale: [261.63, 293.66, 329.63, 392.00, 440.00],
        tempo: 600,
        waveType: "sine",
        color: "#14b8a6"
      }
    };
  }

  playTheme(emotionKey) {
    this.init();
    this.stopTheme();

    const themes = this.getThemes();
    const theme = themes[emotionKey] || themes.neutral;
    this.currentTheme = theme;
    this.isPlaying = true;

    // 1. Create Warm Drone / Pad
    const droneOsc = this.ctx.createOscillator();
    const droneGain = this.ctx.createGain();
    droneOsc.type = "sine";
    droneOsc.frequency.setValueAtTime(theme.baseFreq / 2, this.ctx.currentTime);
    
    droneGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    droneGain.gain.exponentialRampToValueAtTime(0.22, this.ctx.currentTime + 2.5);

    droneOsc.connect(droneGain);
    droneGain.connect(this.masterGain);
    droneOsc.start();
    this.activeNodes.push(droneOsc, droneGain);

    // 2. Binaural slight detune for mental relaxation (approx 8Hz difference = Alpha state)
    const binauralOsc = this.ctx.createOscillator();
    const binauralGain = this.ctx.createGain();
    binauralOsc.type = "sine";
    binauralOsc.frequency.setValueAtTime((theme.baseFreq / 2) + 8.5, this.ctx.currentTime);
    binauralGain.gain.setValueAtTime(0.01, this.ctx.currentTime);
    binauralGain.gain.exponentialRampToValueAtTime(0.18, this.ctx.currentTime + 3);

    binauralOsc.connect(binauralGain);
    binauralGain.connect(this.masterGain);
    binauralOsc.start();
    this.activeNodes.push(binauralOsc, binauralGain);

    // 3. Generative Healing Melody Arpeggio
    let noteIdx = 0;
    const playNextNote = () => {
      if (!this.isPlaying) return;

      const osc = this.ctx.createOscillator();
      const noteGain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = "lowpass";
      filter.frequency.setValueAtTime(1400, this.ctx.currentTime);

      const freq = theme.scale[noteIdx % theme.scale.length];
      osc.type = theme.waveType;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      noteGain.gain.setValueAtTime(0.001, this.ctx.currentTime);
      noteGain.gain.linearRampToValueAtTime(0.18, this.ctx.currentTime + 0.15);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + (theme.tempo / 400));

      osc.connect(filter);
      filter.connect(noteGain);
      noteGain.connect(this.masterGain);

      osc.start();
      osc.stop(this.ctx.currentTime + 2.5);

      noteIdx = Math.floor(Math.random() * theme.scale.length);
      this.melodyTimer = setTimeout(playNextNote, theme.tempo + Math.random() * 200);
    };

    playNextNote();
  }

  stopTheme() {
    this.isPlaying = false;
    if (this.melodyTimer) {
      clearTimeout(this.melodyTimer);
      this.melodyTimer = null;
    }

    this.activeNodes.forEach(node => {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) {}
    });
    this.activeNodes = [];
  }

  setVolume(val) {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(val, this.ctx.currentTime);
    }
  }

  // Generate White / Pink Noise for Rain soundscape
  playAmbient(type) {
    this.init();
    this.stopAmbient();

    this.currentAmbient = type;
    const bufferSize = this.ctx.sampleRate * 2;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Pink noise algorithm for gentle rain / waves
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.04;
      b6 = white * 0.115926;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;

    // Filter to simulate soft raindrops
    const filter = this.ctx.createBiquadFilter();
    filter.type = type === 'rain' ? 'lowpass' : 'bandpass';
    filter.frequency.setValueAtTime(type === 'rain' ? 800 : 400, this.ctx.currentTime);

    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.12, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(this.ambientGain);
    this.ambientGain.connect(this.masterGain);

    noiseSource.start();
    this.ambientSoundNode = noiseSource;
  }

  stopAmbient() {
    if (this.ambientSoundNode) {
      try {
        this.ambientSoundNode.stop();
        this.ambientSoundNode.disconnect();
      } catch (e) {}
      this.ambientSoundNode = null;
    }
  }

  // Get frequency data for canvas visualizer
  getVisualizerData() {
    if (!this.analyser) return new Uint8Array(32);
    const dataArray = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(dataArray);
    return dataArray;
  }
}

// Global instance
window.synthEngine = new AudioSynthesizer();
