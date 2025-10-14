// Simple SFX Manager for Leverage Ladder
export class SFXManager {
  private audioContext: AudioContext | null = null;
  private sounds: Map<string, AudioBuffer> = new Map();
  private isMuted: boolean = false;
  private volume: number = 0.3;

  constructor() {
    // Don't auto-initialize to avoid browser restrictions
    // Will initialize on first user interaction
  }

  private async initializeAudioContext() {
    try {
      this.audioContext = new AudioContext();
      await this.loadDefaultSounds();
    } catch (error) {
      console.warn('Audio context initialization failed:', error);
    }
  }

  private async loadDefaultSounds() {
    if (!this.audioContext) return;

    // Generate simple sound effects using Web Audio API
    const sounds = {
      climb_success: this.generateTone([440, 554, 659], 0.3), // C major chord
      liquidation_thunder: this.generateNoise(0.5, 0.1), // White noise burst
      cashout_chime: this.generateTone([523, 659, 784], 0.4), // C major arpeggio
      milestone_reached: this.generateTone([880, 1108, 1318], 0.2) // Higher C major
    };

    for (const [name, buffer] of Object.entries(sounds)) {
      this.sounds.set(name, buffer);
    }
  }

  private generateTone(frequencies: number[], duration: number): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      let sample = 0;
      const time = i / sampleRate;
      
      frequencies.forEach(freq => {
        sample += Math.sin(2 * Math.PI * freq * time) * (1 / frequencies.length);
      });
      
      // Apply envelope (fade out)
      const envelope = Math.max(0, 1 - (time / duration));
      data[i] = sample * envelope * 0.3;
    }

    return buffer;
  }

  private generateNoise(duration: number, cutoff: number): AudioBuffer {
    if (!this.audioContext) throw new Error('Audio context not initialized');

    const sampleRate = this.audioContext.sampleRate;
    const buffer = this.audioContext.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
      const time = i / sampleRate;
      const noise = (Math.random() * 2 - 1) * 0.3;
      
      // Apply envelope and low-pass filter effect
      const envelope = Math.max(0, 1 - (time / duration));
      const filter = Math.exp(-time * cutoff * 10);
      
      data[i] = noise * envelope * filter;
    }

    return buffer;
  }

  async play(soundName: string, volume: number = 1): Promise<void> {
    // Initialize on first play if not already done
    if (!this.audioContext) {
      await this.initializeAudioContext();
    }

    if (this.isMuted || !this.audioContext || this.audioContext.state === 'suspended') {
      return;
    }

    try {
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const buffer = this.sounds.get(soundName);
      if (!buffer) {
        console.warn(`Sound not found: ${soundName}`);
        return;
      }

      const source = this.audioContext.createBufferSource();
      const gainNode = this.audioContext.createGain();
      
      source.buffer = buffer;
      gainNode.gain.value = this.volume * volume;
      
      source.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      
      source.start();
    } catch (error) {
      console.warn('Failed to play sound:', error);
    }
  }

  setMuted(muted: boolean): void {
    this.isMuted = muted;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  isAudioEnabled(): boolean {
    return !this.isMuted && this.audioContext !== null;
  }

  // Initialize audio on user interaction
  async initializeOnUserInteraction(): Promise<void> {
    if (!this.audioContext) {
      await this.initializeAudioContext();
    }
  }
}

// Global SFX manager instance
export const sfxManager = new SFXManager();
