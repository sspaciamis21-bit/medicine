// High-Volume Web Audio Synthesizer & Alarm Engine for Mobile & Desktop

class AudioAlarmEngine {
  private audioCtx: AudioContext | null = null;
  private isAlarmPlaying: boolean = false;
  private intervalId: any = null;

  // Initialize and unlock audio context on user gesture
  public init() {
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

  // Play a loud multi-tone medical alarm sound
  public playLoudChime(frequency: number = 880, duration: number = 0.4, gainBoost: number = 1.8) {
    try {
      this.init();
      if (!this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Dual harmonic waveform for high piercing audibility on mobile speakers
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, this.audioCtx.currentTime + duration * 0.5);
      osc.frequency.exponentialRampToValueAtTime(frequency, this.audioCtx.currentTime + duration);

      // Volume Gain Boost
      gain.gain.setValueAtTime(gainBoost, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio chime error:', e);
    }
  }

  // Start continuous looping loud alarm with vibration
  public startAlarmLoop() {
    if (this.isAlarmPlaying) return;
    this.isAlarmPlaying = true;
    this.init();

    // Trigger mobile vibration
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([400, 200, 400, 200, 800, 300]);
      } catch (e) {}
    }

    // Play initial chime sequence
    this.playChimeSequence();

    // Loop chime sequence every 2.4 seconds until stopped
    this.intervalId = setInterval(() => {
      if (!this.isAlarmPlaying) {
        clearInterval(this.intervalId);
        return;
      }
      this.playChimeSequence();
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([400, 200, 400, 200, 800, 300]);
        } catch (e) {}
      }
    }, 2400);
  }

  private playChimeSequence() {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    // High 4-note ascending bell chime sequence for medicine alerts
    const notes = [659.25, 783.99, 987.77, 1318.51]; // E5, G5, B5, E6
    notes.forEach((freq, idx) => {
      setTimeout(() => {
        if (this.isAlarmPlaying) {
          this.playLoudChime(freq, 0.35, 2.0);
        }
      }, idx * 180);
    });
  }

  // Stop looping alarm
  public stopAlarmLoop() {
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

export const alarmEngine = typeof window !== 'undefined' ? new AudioAlarmEngine() : null;
