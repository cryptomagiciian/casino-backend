// Lightweight SFX system for Pump or Dump
class SFXSystem {
  private audioContext: AudioContext | null = null;
  private isEnabled = true;
  private volume = 0.3;

  constructor() {
    // Initialize audio context on first user interaction
    if (typeof window !== 'undefined') {
      document.addEventListener('click', this.initAudioContext.bind(this), { once: true });
    }
  }

  private initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Audio not supported');
    }
  }

  private createTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
    if (!this.audioContext || !this.isEnabled) return;

    const oscillator = this.audioContext.createOscillator();
    const gainNode = this.audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
    oscillator.type = type;

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    oscillator.start(this.audioContext.currentTime);
    oscillator.stop(this.audioContext.currentTime + duration);
  }

  private createNoise(duration: number, filterFreq: number = 1000): void {
    if (!this.audioContext || !this.isEnabled) return;

    const bufferSize = this.audioContext.sampleRate * duration;
    const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    const filter = this.audioContext.createBiquadFilter();

    source.buffer = buffer;
    source.connect(filter);
    filter.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(filterFreq, this.audioContext.currentTime);

    gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(this.volume * 0.5, this.audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

    source.start(this.audioContext.currentTime);
  }

  // Sound effects
  tick(): void {
    this.createTone(800, 0.05, 'square');
  }

  pump(): void {
    // Rising whoosh sound
    this.createTone(200, 0.3, 'sawtooth');
    setTimeout(() => this.createTone(400, 0.2, 'sine'), 100);
  }

  dump(): void {
    // Falling sound
    this.createTone(400, 0.2, 'sine');
    setTimeout(() => this.createTone(200, 0.3, 'sawtooth'), 100);
  }

  final(): void {
    // Gavel ding
    this.createTone(1000, 0.1, 'sine');
    setTimeout(() => this.createTone(800, 0.1, 'sine'), 50);
    setTimeout(() => this.createTone(600, 0.2, 'sine'), 100);
  }

  win(): void {
    // Victory chime
    this.createTone(523, 0.2, 'sine'); // C5
    setTimeout(() => this.createTone(659, 0.2, 'sine'), 100); // E5
    setTimeout(() => this.createTone(784, 0.3, 'sine'), 200); // G5
  }

  lose(): void {
    // Sad trombone
    this.createTone(400, 0.1, 'sine');
    setTimeout(() => this.createTone(350, 0.1, 'sine'), 100);
    setTimeout(() => this.createTone(300, 0.2, 'sine'), 200);
  }

  explosion(): void {
    // Rug pull explosion
    this.createNoise(0.5, 2000);
    setTimeout(() => this.createTone(100, 0.3, 'sawtooth'), 200);
  }

  // Settings
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  setVolume(vol: number): void {
    this.volume = Math.max(0, Math.min(1, vol));
  }
}

export const sfx = new SFXSystem();
