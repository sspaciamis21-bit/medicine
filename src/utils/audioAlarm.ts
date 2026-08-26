// Professional Acoustic Medical Chime & Notification Engine
// Generates warm, crystal-clear, hospital-grade acoustic bell sounds using Web Audio API

class AudioAlarmEngine {
  private audioCtx: AudioContext | null = null;
  private isAlarmPlaying: boolean = false;
  private intervalId: any = null;

  // Initialize and unlock audio context on user gesture
  public init() {
    if (typeof window === 'undefined') return;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  // Play a single professional acoustic bell tone with harmonic overtones & smooth natural decay
  public playAcousticBell(freq: number = 659.25, duration: number = 0.8, volume: number = 0.6) {
    if (typeof window === 'undefined') return;
    try {
      this.init();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;

      // Master Gain for this tone
      const masterGain = this.audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      // Soft 15ms attack to eliminate any harsh clicking
      masterGain.gain.linearRampToValueAtTime(volume, now + 0.015);
      // Natural exponential acoustic decay
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      // 1. Fundamental Frequency (Pure Sine for warm round body)
      const osc1 = this.audioCtx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      // 2. Second Harmonic (Adds crystal acoustic bell warmth)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.005, now); // Slight detune for rich resonance
      gain2.gain.setValueAtTime(volume * 0.35, now);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.7);

      // 3. Third Harmonic (Subtle shimmer)
      const osc3 = this.audioCtx.createOscillator();
      const gain3 = this.audioCtx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(freq * 3.01, now);
      gain3.gain.setValueAtTime(volume * 0.12, now);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.4);

      // Routing
      osc1.connect(masterGain);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc3.connect(gain3);
      gain3.connect(masterGain);

      masterGain.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);

      osc1.stop(now + duration);
      osc2.stop(now + duration);
      osc3.stop(now + duration);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  // Backwards-compatible chime trigger
  public playLoudChime(frequency: number = 880, duration: number = 0.8, volume: number = 0.6) {
    this.playAcousticBell(frequency, duration, volume);
  }

  // Play a pleasant, modern 3-note medical notification chime (Major Chord: C5 -> E5 -> G5)
  public playMedicalChimeSequence() {
    if (typeof window === 'undefined') return;
    this.init();

    // Notes: C5 (523.25 Hz), E5 (659.25 Hz), G5 (783.99 Hz), High C6 (1046.50 Hz)
    const notes = [
      { freq: 523.25, delay: 0, dur: 0.9, vol: 0.5 },
      { freq: 659.25, delay: 180, dur: 0.9, vol: 0.55 },
      { freq: 783.99, delay: 360, dur: 1.1, vol: 0.6 },
      { freq: 1046.50, delay: 540, dur: 1.4, vol: 0.65 },
    ];

    notes.forEach((n) => {
      setTimeout(() => {
        this.playAcousticBell(n.freq, n.dur, n.vol);
      }, n.delay);
    });
  }

  // Start continuous, pleasant repeating reminder alert with mobile vibration
  public startAlarmLoop() {
    if (typeof window === 'undefined') return;
    if (this.isAlarmPlaying) return;
    this.isAlarmPlaying = true;
    this.init();

    // Soft mobile vibration (gentle pulse pattern)
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 150, 200, 150, 400]);
      } catch (e) {}
    }

    // Play initial pleasant chime sequence
    this.playMedicalChimeSequence();

    // Repeat every 3 seconds gently until the user Marks Taken, Snoozes, or Dismisses
    this.intervalId = setInterval(() => {
      if (!this.isAlarmPlaying) {
        clearInterval(this.intervalId);
        return;
      }
      this.playMedicalChimeSequence();
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([200, 150, 200, 150, 400]);
        } catch (e) {}
      }
    }, 3200);
  }

  // Stop looping alarm
  public stopAlarmLoop() {
    if (typeof window === 'undefined') return;
    this.isAlarmPlaying = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(0);
      } catch (e) {}
    }
  }

  public isPlaying(): boolean {
    return this.isAlarmPlaying;
  }
}

export const alarmEngine = new AudioAlarmEngine();
