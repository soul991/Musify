/**
 * Web Audio API Equalizer Engine for Musify
 * Matching AxionEqScreen.kt in Echo Music:
 * 5 Bands: 60Hz (Sub-Bass), 230Hz (Bass), 910Hz (Mid), 3.6kHz (Upper Mid), 14kHz (Treble)
 * Gain range: -12dB to +12dB
 */

export interface EqualizerPreset {
  name: string;
  gains: number[]; // 5 band gains in dB
}

export const EQ_FREQUENCIES = [60, 230, 910, 3600, 14000];

export const EQ_PRESETS: EqualizerPreset[] = [
  { name: 'Flat', gains: [0, 0, 0, 0, 0] },
  { name: 'Bass Boost', gains: [8, 6, 2, 0, 0] },
  { name: 'Rock', gains: [5, 3, -1, 3, 5] },
  { name: 'Pop', gains: [-1, 2, 4, 2, -1] },
  { name: 'Jazz', gains: [3, 2, 0, 2, 3] },
  { name: 'Electronic', gains: [6, 4, 1, 3, 5] },
  { name: 'Classical', gains: [4, 3, -1, 3, 4] },
  { name: 'Acoustic', gains: [3, 2, 1, 2, 3] },
  { name: 'Vocal Boost', gains: [-2, 0, 5, 4, 1] }
];

class AudioEqualizerEngine {
  private audioCtx: AudioContext | null = null;
  private sourceNode: MediaElementAudioSourceNode | null = null;
  private filters: BiquadFilterNode[] = [];
  private compressor: DynamicsCompressorNode | null = null;
  private isEnabled: boolean = typeof window !== 'undefined' ? localStorage.getItem('musify_eq_enabled') === 'true' : false;
  private isNormalized: boolean = typeof window !== 'undefined' ? localStorage.getItem('musify_normalization') !== 'false' : true;
  private currentGains: number[] = [0, 0, 0, 0, 0];
  private currentBassBoost: number = 0; // 0 to 100%
  private attachedElement: HTMLAudioElement | null = null;

  private analyser: AnalyserNode | null = null;

  async setSinkId(deviceId: string) {
    if (this.audioCtx && typeof (this.audioCtx as any).setSinkId === 'function') {
      try {
        await (this.audioCtx as any).setSinkId(deviceId);
      } catch (e) {
        console.warn('[AudioEqualizer] setSinkId error:', e);
      }
    }
  }

  attachElement(audioElement: HTMLAudioElement) {
    this.attachedElement = audioElement;
    // On iOS Safari & mobile devices, createMediaElementSource kills background audio on lock screen.
    // Strictly bypass Web Audio graph when EQ is off.
    if (this.isEnabled) {
      this.init(audioElement);
    }
  }

  init(audioElement: HTMLAudioElement) {
    this.attachedElement = audioElement;
    if (this.audioCtx) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.audioCtx = new AudioCtx();
      this.sourceNode = this.audioCtx.createMediaElementSource(audioElement);

      // Create 5 biquad filter nodes
      this.filters = EQ_FREQUENCIES.map((freq, index) => {
        const filter = this.audioCtx!.createBiquadFilter();
        if (index === 0) {
          filter.type = 'lowshelf';
        } else if (index === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.4;
        }
        filter.frequency.value = freq;
        filter.gain.value = this.isEnabled ? this.currentGains[index] : 0;
        return filter;
      });

      // Compressor for loudness normalization (EBU R128 dynamics)
      this.compressor = this.audioCtx.createDynamicsCompressor();
      this.compressor.threshold.value = this.isNormalized ? -24 : 0;
      this.compressor.knee.value = 30;
      this.compressor.ratio.value = this.isNormalized ? 12 : 1;
      this.compressor.attack.value = 0.003;
      this.compressor.release.value = 0.25;

      // Realtime Analyser for skip-silence detection
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 512;

      // Chain filters together
      let prevNode: AudioNode = this.sourceNode;
      this.filters.forEach((filter) => {
        prevNode.connect(filter);
        prevNode = filter;
      });

      // Connect filters through compressor and analyser to destination
      prevNode.connect(this.compressor);
      this.compressor.connect(this.analyser);
      this.analyser.connect(this.audioCtx.destination);
    } catch {
      // AudioContext could not be initialized or already attached
    }
  }

  getInstantRms(): number {
    if (!this.analyser) return -1;
    try {
      const buffer = new Float32Array(this.analyser.fftSize);
      this.analyser.getFloatTimeDomainData(buffer);
      let sum = 0;
      for (let i = 0; i < buffer.length; i++) {
        sum += buffer[i] * buffer[i];
      }
      return Math.sqrt(sum / buffer.length);
    } catch {
      return -1;
    }
  }

  ensureContextRunning() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
  }

  setGain(bandIndex: number, gainDb: number) {
    if (bandIndex >= 0 && bandIndex < this.filters.length) {
      this.currentGains[bandIndex] = gainDb;
      if (this.isEnabled && this.filters[bandIndex]) {
        this.filters[bandIndex].gain.setTargetAtTime(
          gainDb,
          this.audioCtx ? this.audioCtx.currentTime : 0,
          0.05
        );
      }
    }
  }

  applyPreset(preset: EqualizerPreset) {
    preset.gains.forEach((gain, index) => {
      this.setGain(index, gain);
    });
  }

  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('musify_eq_enabled', String(enabled));
    }
    if (enabled && !this.audioCtx && this.attachedElement) {
      this.init(this.attachedElement);
    }
    this.ensureContextRunning();
    this.filters.forEach((filter, index) => {
      const targetGain = enabled ? this.currentGains[index] : 0;
      if (this.audioCtx) {
        filter.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.05);
      }
    });
  }

  setNormalization(enabled: boolean) {
    this.isNormalized = enabled;
    if (typeof window !== 'undefined') {
      localStorage.setItem('musify_normalization', String(enabled));
    }
    if (enabled && !this.audioCtx && this.attachedElement) {
      this.init(this.attachedElement);
    }
    this.ensureContextRunning();
    if (this.compressor && this.audioCtx) {
      this.compressor.ratio.setTargetAtTime(enabled ? 12 : 1, this.audioCtx.currentTime, 0.05);
      this.compressor.threshold.setTargetAtTime(enabled ? -24 : 0, this.audioCtx.currentTime, 0.05);
    }
  }

  getGains() {
    return [...this.currentGains];
  }

  getEnabled() {
    return this.isEnabled;
  }

  getNormalization() {
    return this.isNormalized;
  }
}

export const audioEqualizer = new AudioEqualizerEngine();
