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
  private bassBoostGain: GainNode | null = null;
  private isEnabled: boolean = true;
  private currentGains: number[] = [0, 0, 0, 0, 0];
  private currentBassBoost: number = 0; // 0 to 100%

  init(audioElement: HTMLAudioElement) {
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
        filter.gain.value = this.currentGains[index];
        return filter;
      });

      // Chain filters together
      let prevNode: AudioNode = this.sourceNode;
      this.filters.forEach((filter) => {
        prevNode.connect(filter);
        prevNode = filter;
      });

      // Connect to destination
      prevNode.connect(this.audioCtx.destination);
    } catch {
      // AudioContext could not be initialized or already attached
    }
  }

  ensureContextRunning() {
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
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
    this.filters.forEach((filter, index) => {
      const targetGain = enabled ? this.currentGains[index] : 0;
      if (this.audioCtx) {
        filter.gain.setTargetAtTime(targetGain, this.audioCtx.currentTime, 0.05);
      }
    });
  }

  getGains() {
    return [...this.currentGains];
  }

  getEnabled() {
    return this.isEnabled;
  }
}

export const audioEqualizer = new AudioEqualizerEngine();
