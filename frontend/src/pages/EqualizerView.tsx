import React, { useState } from 'react';
import { ArrowLeft, Sliders, RotateCcw, Volume2, Sparkles, Check } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import {
  audioEqualizer,
  EQ_FREQUENCIES,
  EQ_PRESETS,
  EqualizerPreset
} from '../services/audioEqualizer';

interface EqualizerViewProps {
  onBack: () => void;
}

export const EqualizerView: React.FC<EqualizerViewProps> = ({ onBack }) => {
  const { colors } = useTheme();
  const [isEnabled, setIsEnabled] = useState(audioEqualizer.getEnabled());
  const [gains, setGains] = useState<number[]>(audioEqualizer.getGains());
  const [activePreset, setActivePreset] = useState<string>('Flat');
  const [bassBoost, setBassBoost] = useState<number>(0);
  const [virtualizer, setVirtualizer] = useState<number>(0);

  const handleToggle = () => {
    const next = !isEnabled;
    setIsEnabled(next);
    audioEqualizer.setEnabled(next);
  };

  const handleGainChange = (bandIndex: number, value: number) => {
    const nextGains = [...gains];
    nextGains[bandIndex] = value;
    setGains(nextGains);
    audioEqualizer.setGain(bandIndex, value);
    setActivePreset('Custom');
  };

  const handleSelectPreset = (preset: EqualizerPreset) => {
    setActivePreset(preset.name);
    setGains([...preset.gains]);
    audioEqualizer.applyPreset(preset);
  };

  const handleReset = () => {
    const flat = EQ_PRESETS[0];
    handleSelectPreset(flat);
    setBassBoost(0);
    setVirtualizer(0);
  };

  const formatFreq = (freq: number) => {
    if (freq >= 1000) return `${(freq / 1000).toFixed(1)}k`;
    return `${freq}Hz`;
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 pt-safe pb-48 text-white no-scrollbar select-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            aria-label="Go back"
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white border border-white/10"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <span className="text-xs font-bold text-white/50 tracking-wider uppercase">
              AUDIO PROCESSING
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
              <span>Axion Equalizer</span>
            </h1>
          </div>
        </div>

        {/* Master Power Toggle Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            aria-label="Reset equalizer to flat"
            className="w-9 h-9 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 active:scale-95 text-white/70 hover:text-white transition-all border border-white/10"
            title="Reset to Flat"
          >
            <RotateCcw size={16} />
          </button>

          <button
            onClick={handleToggle}
            className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border shadow-md flex items-center gap-1.5 ${
              isEnabled
                ? 'bg-[#E5303D] text-white border-white/30'
                : 'bg-white/10 text-white/60 border-white/10'
            }`}
          >
            <span>{isEnabled ? 'ON' : 'OFF'}</span>
          </button>
        </div>
      </div>

      {/* Presets Horizontal Row */}
      <section className="mb-8">
        <h2 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2.5">
          PRESETS
        </h2>
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-4 px-4 py-1">
          {EQ_PRESETS.map((preset) => {
            const isSelected = activePreset === preset.name;
            return (
              <button
                key={preset.name}
                onClick={() => handleSelectPreset(preset)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                  isSelected
                    ? 'text-white border-white/40 shadow-lg'
                    : 'bg-white/[0.05] hover:bg-white/[0.1] text-white/70 border-white/10'
                }`}
                style={{
                  backgroundColor: isSelected ? colors.primary : undefined,
                  boxShadow: isSelected ? `0 4px 16px ${colors.primary}60` : undefined
                }}
              >
                {preset.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* 5-Band Equalizer Sliders Container */}
      <section className="mb-10 p-6 rounded-[28px] bg-white/[0.04] backdrop-blur-3xl border border-white/15 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-sm font-extrabold text-white tracking-wide flex items-center gap-2">
            <Sliders size={16} className="text-[#E5303D]" />
            <span>5-Band Frequency Response</span>
          </h2>
          <span className="text-xs font-semibold text-white/50">±12 dB range</span>
        </div>

        {/* 5 Vertical Sliders Grid */}
        <div className="grid grid-cols-5 gap-2 sm:gap-6 items-end h-[240px] pt-4 pb-2">
          {EQ_FREQUENCIES.map((freq, idx) => {
            const gain = gains[idx] || 0;
            return (
              <div key={freq} className="flex flex-col items-center h-full justify-between">
                {/* dB display */}
                <span className="text-[11px] font-bold text-white/80">
                  {gain > 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1)}
                </span>

                {/* Vertical Range Slider */}
                <div className="relative flex-1 flex items-center justify-center my-2">
                  <input
                    type="range"
                    min={-12}
                    max={12}
                    step={0.5}
                    value={gain}
                    disabled={!isEnabled}
                    onChange={(e) => handleGainChange(idx, parseFloat(e.target.value))}
                    className="h-32 w-1.5 accent-[#E5303D] appearance-none bg-white/20 rounded-full outline-none cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
                  />
                </div>

                {/* Frequency Label */}
                <span className="text-xs font-bold text-white/60 tracking-tight mt-1">
                  {formatFreq(freq)}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Bass Boost & Stereo Virtualizer Knobs/Sliders */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Bass Boost */}
        <div className="p-5 rounded-[24px] bg-white/[0.04] backdrop-blur-2xl border border-white/15 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Volume2 size={18} className="text-[#E5303D]" />
              <span className="text-sm font-bold text-white">Bass Boost</span>
            </div>
            <span className="text-xs font-bold text-white/70">{bassBoost}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={bassBoost}
            disabled={!isEnabled}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setBassBoost(val);
              // boost the 60Hz and 230Hz bands dynamically
              const boostDb = (val / 100) * 8;
              audioEqualizer.setGain(0, (gains[0] || 0) + boostDb);
            }}
            className="w-full accent-[#E5303D] h-1.5 bg-white/20 rounded-full outline-none cursor-pointer"
          />
        </div>

        {/* Surround Virtualizer */}
        <div className="p-5 rounded-[24px] bg-white/[0.04] backdrop-blur-2xl border border-white/15 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sparkles size={18} className="text-violet-400" />
              <span className="text-sm font-bold text-white">Spatial Virtualizer</span>
            </div>
            <span className="text-xs font-bold text-white/70">{virtualizer}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={virtualizer}
            disabled={!isEnabled}
            onChange={(e) => setVirtualizer(parseInt(e.target.value))}
            className="w-full accent-violet-400 h-1.5 bg-white/20 rounded-full outline-none cursor-pointer"
          />
        </div>
      </section>
    </div>
  );
};
