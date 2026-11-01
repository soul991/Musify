import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Volume2,
  Headphones,
  Bluetooth,
  Speaker,
  Tv,
  Cast,
  Check,
  Radio,
  Sparkles,
  Info,
  RefreshCw
} from 'lucide-react';
import { usePlayer } from '../../context/PlayerContext';
import { useTheme } from '../../context/ThemeContext';

interface OutputDevice {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
  groupId: string;
}

interface AudioOutputModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AudioOutputModal: React.FC<AudioOutputModalProps> = ({ isOpen, onClose }) => {
  const {
    audioOutputDeviceId,
    setAudioOutputDeviceId,
    audioQuality,
    castAudio,
    currentTrack
  } = usePlayer();
  const { colors } = useTheme();

  const [devices, setDevices] = useState<OutputDevice[]>([]);
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [isChangingSink, setIsChangingSink] = useState<string | null>(null);
  const [castActive, setCastActive] = useState<boolean>(false);

  const fetchDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      return;
    }
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = allDevices
        .filter((d) => d.kind === 'audiooutput')
        .map((d, index) => ({
          deviceId: d.deviceId,
          label: d.label || (d.deviceId === 'default' ? 'Default Output Speaker' : `Audio Device ${index + 1}`),
          kind: d.kind,
          groupId: d.groupId
        }));

      // Check if we have actual labels (permission granted)
      const hasLabels = audioOutputs.some((d) => d.label && !d.label.startsWith('Audio Device'));
      setHasPermission(hasLabels);

      // If no audio output devices returned (some browsers hide audiooutput without user interaction), provide default
      if (audioOutputs.length === 0) {
        setDevices([
          {
            deviceId: 'default',
            label: 'System Default Output',
            kind: 'audiooutput',
            groupId: 'default'
          }
        ]);
      } else {
        setDevices(audioOutputs);
      }
    } catch (err) {
      console.warn('[AudioOutputModal] Error enumerating devices:', err);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchDevices();
    }

    const handleDeviceChange = () => {
      fetchDevices();
    };

    if (navigator.mediaDevices && 'addEventListener' in navigator.mediaDevices) {
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
  }, [isOpen, fetchDevices]);

  const requestDeviceLabels = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setHasPermission(true);
      await fetchDevices();
    } catch {
      // User dismissed or denied microphone permission
    }
  };

  const handleSelectDevice = async (deviceId: string) => {
    setIsChangingSink(deviceId);
    await setAudioOutputDeviceId(deviceId);
    setTimeout(() => {
      setIsChangingSink(null);
    }, 300);
  };

  const handleCastClick = () => {
    setCastActive(true);
    castAudio();
    setTimeout(() => setCastActive(false), 2000);
  };

  // Helper to choose the best icon based on device label
  const getDeviceIcon = (label: string) => {
    const l = label.toLowerCase();
    if (l.includes('airpod') || l.includes('earbud') || l.includes('buds') || l.includes('galaxy buds')) {
      return <Headphones size={20} className="text-[var(--accent-ink)]" />;
    }
    if (l.includes('headphone') || l.includes('headset') || l.includes('wh-') || l.includes('wf-')) {
      return <Headphones size={20} className="text-white/80" />;
    }
    if (l.includes('bluetooth') || l.includes('bt ') || l.includes('wireless')) {
      return <Bluetooth size={20} className="text-sky-400" />;
    }
    if (l.includes('tv') || l.includes('display') || l.includes('hdmi') || l.includes('monitor')) {
      return <Tv size={20} className="text-[var(--text-2)]" />;
    }
    return <Speaker size={20} className="text-white/80" />;
  };

  const currentDevice = devices.find((d) => d.deviceId === audioOutputDeviceId) || devices[0];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/70 backdrop-blur-xl"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-md rounded-[32px] glass-panel border border-white/15 p-6 text-white shadow-[0_25px_60px_rgba(0,0,0,0.85),inset_0_1px_1px_rgba(255,255,255,0.2)] overflow-hidden z-10"
            style={{
              background: 'rgba(20, 20, 24, 0.88)'
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10 shadow-inner">
                  <Volume2 size={20} className="text-[var(--accent-ink)]" />
                </div>
                <div>
                  <h3 className="text-lg font-black tracking-tight leading-none">Audio Output</h3>
                  <span className="text-[11px] font-semibold text-white/50 block mt-1">
                    AirPlay, Speakers & Bluetooth
                  </span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/15 active:scale-95 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                aria-label="Close output menu"
              >
                <X size={18} />
              </button>
            </div>

            {/* Current Playing Track Banner */}
            {currentTrack && (
              <div className="flex items-center gap-3 p-3 my-4 rounded-2xl bg-white/[0.04] border border-white/5">
                <img
                  src={currentTrack.thumbnail || '/icons/musify-icon.svg'}
                  alt={currentTrack.title}
                  className="w-10 h-10 rounded-xl object-cover border border-white/10"
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = '/icons/musify-icon.svg';
                  }}
                />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-white truncate">{currentTrack.title}</p>
                  <p className="text-[11px] text-white/50 truncate">
                    {currentTrack.artists?.map((a) => a.name).join(', ') || 'Unknown Artist'}
                  </p>
                </div>
                {/* Audio Quality Badge */}
                <div className="px-2.5 py-1 rounded-full bg-[var(--accent-ink)]/15 border border-[var(--accent-ink)]/30 text-[10px] font-black tracking-normal text-[var(--accent-ink)] shrink-0">
                  {audioQuality === 'lossless' ? 'Lossless 24-bit' : audioQuality === 'high' ? '256k AAC' : 'Standard'}
                </div>
              </div>
            )}

            {/* Output Device List */}
            <div className="space-y-2 max-h-56 overflow-y-auto no-scrollbar py-1">
              <div className="flex items-center justify-between px-1 mb-1">
                <span className="text-[11px] font-bold tracking-normal text-white/40">
                  Select Output Device
                </span>
                {!hasPermission && (
                  <button
                    onClick={requestDeviceLabels}
                    className="text-[11px] font-semibold text-[var(--accent-ink)] hover:underline flex items-center gap-1"
                  >
                    <RefreshCw size={11} />
                    <span>Detect Names</span>
                  </button>
                )}
              </div>

              {devices.map((device) => {
                const isSelected = (audioOutputDeviceId === device.deviceId) ||
                  (audioOutputDeviceId === 'default' && device.deviceId === 'default');

                return (
                  <motion.button
                    key={device.deviceId}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectDevice(device.deviceId)}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-colors duration-200 border ${
                      isSelected
                        ? 'bg-white/[0.12] border-white/20 text-white shadow-lg'
                        : 'bg-white/[0.04] border-white/5 text-white/70 hover:bg-white/[0.08] hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                          isSelected ? 'bg-[var(--accent-ink)]/20 border-[var(--accent-ink)]/40' : 'bg-white/5 border-white/10'
                        }`}
                      >
                        {getDeviceIcon(device.label)}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm truncate ${isSelected ? 'font-bold text-white' : 'font-medium'}`}>
                          {device.label}
                        </p>
                        <p className="text-[11px] text-white/40 truncate">
                          {isSelected ? 'Active Audio Device' : 'Tap to route audio'}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-[var(--accent-ink)] flex items-center justify-center shrink-0 shadow-md">
                        <Check size={14} className="text-white stroke-[3]" />
                      </div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Casting & External Audio Actions */}
            <div className="pt-4 mt-3 border-t border-white/10 flex items-center gap-3">
              <button
                onClick={handleCastClick}
                className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white/[0.08] hover:bg-white/[0.14] active:scale-98 border border-white/10 text-white text-xs font-bold transition-colors shadow-md group"
              >
                <Cast size={16} className={`transition-colors ${castActive ? 'text-[var(--accent-ink)]' : 'text-white/80 group-hover:text-white'}`} />
                <span>{castActive ? 'Connecting Cast...' : 'AirPlay & Chromecast'}</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
