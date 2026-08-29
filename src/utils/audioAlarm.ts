// Professional Medical Chime & Multi-Tone Alarm Engine
// Generates 4 warm, crystal-clear, hospital-grade acoustic reminder sounds using Web Audio API

export type ChimeToneId = 'hospital_bell' | 'zen_bowl' | 'medical_beep' | 'marimba';

export interface ChimeToneInfo {
  id: ChimeToneId;
  name: string;
  category: string;
  description: string;
  icon: string;
}

export const AVAILABLE_CHIME_TONES: ChimeToneInfo[] = [
  {
    id: 'hospital_bell',
    name: 'Calm Hospital Bell (Default)',
    category: 'Harmonic Acoustic',
    description: 'Soft harmonic crystal chord (C5 → E5 → G5 → C6) designed for medical clinics.',
    icon: '🔔',
  },
  {
    id: 'zen_bowl',
    name: 'Zen Singing Bowl',
    category: 'Relaxing Meditation',
    description: 'Warm 432 Hz resonant bowl with rich harmonic overtones and smooth decay.',
    icon: '🧘',
  },
  {
    id: 'medical_beep',
    name: 'Digital Monitor Alert',
    category: 'Professional Alert',
    description: 'Crisp rhythmic double-pip hospital alert for clear auditory recognition.',
    icon: '📟',
  },
  {
    id: 'marimba',
    name: 'Morning Marimba',
    category: 'Uplifting Melodic',
    description: 'Bright 4-note acoustic woodblock sequence that gently reminds without startling.',
    icon: '🪵',
  },
];

class AudioAlarmEngine {
  private audioCtx: AudioContext | null = null;
  private isAlarmPlaying: boolean = false;
  private intervalId: any = null;

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

  public getSelectedTone(): ChimeToneId {
    if (typeof window === 'undefined') return 'hospital_bell';
    return (localStorage.getItem('medifamily_reminder_tone') as ChimeToneId) || 'hospital_bell';
  }

  public setSelectedTone(tone: ChimeToneId) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('medifamily_reminder_tone', tone);
  }

  // 1. Calm Hospital Harmonic Bell (Default)
  public playHospitalBellSequence() {
    if (typeof window === 'undefined') return;
    this.init();
    const notes = [
      { freq: 523.25, delay: 0, dur: 0.9, vol: 0.5 },    // C5
      { freq: 659.25, delay: 160, dur: 0.9, vol: 0.55 }, // E5
      { freq: 783.99, delay: 320, dur: 1.1, vol: 0.6 },  // G5
      { freq: 1046.50, delay: 480, dur: 1.4, vol: 0.65 },// C6
    ];
    notes.forEach((n) => {
      setTimeout(() => this.playAcousticBell(n.freq, n.dur, n.vol), n.delay);
    });
  }

  // 2. Zen Singing Bowl (432Hz deep resonant tone)
  public playZenBowlTone() {
    if (typeof window === 'undefined') return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const now = this.audioCtx.currentTime;
      const baseFreq = 432; // Healing concert pitch

      const masterGain = this.audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.linearRampToValueAtTime(0.7, now + 0.08); // Gentle 80ms mallet strike
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);

      // Fundamental
      const osc1 = this.audioCtx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(baseFreq, now);

      // 2nd Harmonic (Octave with subtle beating)
      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(baseFreq * 2.01, now);
      gain2.gain.setValueAtTime(0.35, now);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 1.8);

      // 3rd Harmonic (Rim chime)
      const osc3 = this.audioCtx.createOscillator();
      const gain3 = this.audioCtx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(baseFreq * 3.015, now);
      gain3.gain.setValueAtTime(0.18, now);
      gain3.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);

      osc1.connect(masterGain);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      osc3.connect(gain3);
      gain3.connect(masterGain);
      masterGain.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc3.start(now);
      osc1.stop(now + 2.5);
      osc2.stop(now + 2.5);
      osc3.stop(now + 2.5);
    } catch (e) {
      console.warn(e);
    }
  }

  // 3. Digital Medical Alert Beep (Hospital monitor rhythm)
  public playMedicalBeepSequence() {
    if (typeof window === 'undefined') return;
    this.init();
    if (!this.audioCtx) return;

    try {
      const pips = [
        { time: 0, freq: 880, dur: 0.12 },
        { time: 0.16, freq: 1174.66, dur: 0.18 },
        { time: 0.5, freq: 880, dur: 0.12 },
        { time: 0.66, freq: 1174.66, dur: 0.25 },
      ];

      pips.forEach((p) => {
        setTimeout(() => {
          if (!this.audioCtx) return;
          const now = this.audioCtx.currentTime;
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();

          osc.type = 'triangle';
          osc.frequency.setValueAtTime(p.freq, now);

          gain.gain.setValueAtTime(0.0001, now);
          gain.gain.linearRampToValueAtTime(0.45, now + 0.01);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + p.dur);

          osc.connect(gain);
          gain.connect(this.audioCtx.destination);

          osc.start(now);
          osc.stop(now + p.dur);
        }, p.time * 1000);
      });
    } catch (e) {
      console.warn(e);
    }
  }

  // 4. Morning Marimba (Melodic acoustic woodblock chime)
  public playMarimbaSequence() {
    if (typeof window === 'undefined') return;
    this.init();
    if (!this.audioCtx) return;

    const notes = [
      { freq: 698.46, delay: 0, dur: 0.35 },   // F5
      { freq: 880.00, delay: 140, dur: 0.35 }, // A5
      { freq: 1046.50, delay: 280, dur: 0.4 }, // C6
      { freq: 1318.51, delay: 420, dur: 0.6 }, // E6
    ];

    notes.forEach((n) => {
      setTimeout(() => {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(n.freq, now);

        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.6, now + 0.008); // Sharp percussive wood strike
        gain.gain.exponentialRampToValueAtTime(0.0001, now + n.dur);

        osc.connect(gain);
        gain.connect(this.audioCtx.destination);

        osc.start(now);
        osc.stop(now + n.dur);
      }, n.delay);
    });
  }

  // Play a single bell tone
  public playAcousticBell(freq: number = 659.25, duration: number = 0.8, volume: number = 0.6) {
    if (typeof window === 'undefined') return;
    try {
      this.init();
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      const masterGain = this.audioCtx.createGain();
      masterGain.gain.setValueAtTime(0.0001, now);
      masterGain.gain.linearRampToValueAtTime(volume, now + 0.015);
      masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      const osc1 = this.audioCtx.createOscillator();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(freq, now);

      const osc2 = this.audioCtx.createOscillator();
      const gain2 = this.audioCtx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.005, now);
      gain2.gain.setValueAtTime(volume * 0.35, now);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + duration * 0.7);

      osc1.connect(masterGain);
      osc2.connect(gain2);
      gain2.connect(masterGain);
      masterGain.connect(this.audioCtx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + duration);
      osc2.stop(now + duration);
    } catch (e) {
      console.warn(e);
    }
  }

  // Play the chosen tone (or active user selection)
  public playTone(toneId?: ChimeToneId) {
    const tone = toneId || this.getSelectedTone();
    switch (tone) {
      case 'zen_bowl':
        this.playZenBowlTone();
        break;
      case 'medical_beep':
        this.playMedicalBeepSequence();
        break;
      case 'marimba':
        this.playMarimbaSequence();
        break;
      case 'hospital_bell':
      default:
        this.playHospitalBellSequence();
        break;
    }
  }

  public playMedicalChimeSequence() {
    this.playTone();
  }

  public playLoudChime(frequency: number = 880, duration: number = 0.8, volume: number = 0.6) {
    this.playAcousticBell(frequency, duration, volume);
  }

  // Start continuous repeating reminder alert with mobile vibration
  public startAlarmLoop() {
    if (typeof window === 'undefined') return;
    if (this.isAlarmPlaying) return;
    this.isAlarmPlaying = true;
    this.init();

    if ('vibrate' in navigator) {
      try {
        navigator.vibrate([200, 150, 200, 150, 400]);
      } catch (e) {}
    }

    this.playTone();

    this.intervalId = setInterval(() => {
      if (!this.isAlarmPlaying) {
        clearInterval(this.intervalId);
        return;
      }
      this.playTone();
      if ('vibrate' in navigator) {
        try {
          navigator.vibrate([200, 150, 200, 150, 400]);
        } catch (e) {}
      }
    }, 3200);
  }

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
