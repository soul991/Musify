import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Users, Copy, Check, Radio, Play, Sparkles, LogOut, User, Music2 } from 'lucide-react';
import { usePlayer } from '../context/PlayerContext';
import { useTheme } from '../context/ThemeContext';

interface ListenTogetherViewProps {
  onBack: () => void;
}

interface Participant {
  id: string;
  name: string;
  isHost: boolean;
  lastSeen: number;
}

export const ListenTogetherView: React.FC<ListenTogetherViewProps> = ({ onBack }) => {
  const { currentTrack, isPlaying, currentTime, playTrack } = usePlayer();
  const { colors } = useTheme();

  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('musify_display_name') || `User_${Math.floor(1000 + Math.random() * 9000)}`;
  });
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);

  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [joinInput, setJoinInput] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [copied, setCopied] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const channelRef = useRef<BroadcastChannel | null>(null);
  const myIdRef = useRef<string>(`peer_${Math.random().toString(36).substring(2, 9)}`);
  const currentTrackRef = useRef(currentTrack);
  currentTrackRef.current = currentTrack;
  const playTrackRef = useRef(playTrack);
  playTrackRef.current = playTrack;

  // Save display name
  const handleSaveName = () => {
    const trimmed = nameInput.trim() || 'Music Fan';
    setUserName(trimmed);
    localStorage.setItem('musify_display_name', trimmed);
    setIsEditingName(false);
  };

  // BroadcastChannel room synchronization
  useEffect(() => {
    if (!roomCode) {
      if (channelRef.current) {
        channelRef.current.close();
        channelRef.current = null;
      }
      return;
    }

    const myId = myIdRef.current;
    try {
      const channel = new BroadcastChannel(`musify_room_${roomCode}`);
      channelRef.current = channel;

      // Announce presence
      channel.postMessage({
        type: 'PEER_JOIN',
        id: myId,
        name: userName,
        isHost
      });

      channel.onmessage = (event) => {
        const data = event.data;
        if (!data || !data.type) return;

        if (data.type === 'PEER_JOIN' || data.type === 'PEER_PING') {
          setParticipants((prev) => {
            const existing = prev.filter((p) => p.id !== data.id);
            return [
              ...existing,
              {
                id: data.id,
                name: data.name,
                isHost: data.isHost,
                lastSeen: Date.now()
              }
            ];
          });

          // Reply with own presence if receiving a join
          if (data.type === 'PEER_JOIN') {
            channel.postMessage({
              type: 'PEER_PING',
              id: myId,
              name: userName,
              isHost
            });
          }
        } else if (data.type === 'PEER_LEAVE') {
          setParticipants((prev) => prev.filter((p) => p.id !== data.id));
        } else if (data.type === 'SYNC_TRACK' && !isHost) {
          // Non-host listeners receive track updates from host
          const cur = currentTrackRef.current;
          if (data.track && (!cur || cur.id !== data.track.id)) {
            playTrackRef.current(data.track);
          }
        }
      };

      // Periodic heartbeat ping to keep peer list fresh
      const interval = setInterval(() => {
        channel.postMessage({
          type: 'PEER_PING',
          id: myId,
          name: userName,
          isHost
        });
        // Prune peers silent for > 15 seconds
        setParticipants((prev) =>
          prev.filter((p) => p.id === myId || Date.now() - p.lastSeen < 15000)
        );
      }, 5000);

      return () => {
        clearInterval(interval);
        channel.postMessage({
          type: 'PEER_LEAVE',
          id: myId
        });
        channel.close();
      };
    } catch {
      // BroadcastChannel unavailable fallback
    }
  }, [roomCode, userName, isHost]);

  // Host broadcasts playing track changes
  useEffect(() => {
    if (isHost && roomCode && channelRef.current && currentTrack) {
      channelRef.current.postMessage({
        type: 'SYNC_TRACK',
        track: currentTrack,
        isPlaying,
        time: currentTime
      });
    }
  }, [isHost, roomCode, currentTrack, isPlaying, currentTime]);

  const handleCreateRoom = () => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    setIsHost(true);
    setRoomCode(code);
    setParticipants([
      {
        id: myIdRef.current,
        name: userName,
        isHost: true,
        lastSeen: Date.now()
      }
    ]);
  };

  const handleJoinRoom = () => {
    if (joinInput.trim().length >= 4) {
      const code = joinInput.trim().toUpperCase();
      setIsHost(false);
      setRoomCode(code);
      setParticipants([
        {
          id: myIdRef.current,
          name: userName,
          isHost: false,
          lastSeen: Date.now()
        }
      ]);
    }
  };

  const handleLeaveRoom = () => {
    if (channelRef.current) {
      channelRef.current.postMessage({
        type: 'PEER_LEAVE',
        id: myIdRef.current
      });
      channelRef.current.close();
      channelRef.current = null;
    }
    setRoomCode(null);
    setIsHost(false);
    setParticipants([]);
  };

  const handleCopyLink = () => {
    if (roomCode && navigator.clipboard) {
      navigator.clipboard.writeText(`https://musify-live.netlify.app/?room=${roomCode}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-4 pt-safe pb-48 text-white no-scrollbar select-none">
      {/* Top Header */}
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
              Same-device sync (beta)
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2 flex-wrap">
              <span>Listen Together</span>
              <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Same-device sync (beta)
              </span>
            </h1>
          </div>
        </div>

        {roomCode && (
          <button
            onClick={handleLeaveRoom}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-red-500/20 hover:bg-red-500/30 text-red-400 font-bold text-xs border border-red-500/30 transition-all active:scale-95"
          >
            <LogOut size={14} /> Leave Room
          </button>
        )}
      </div>

      {/* User Profile Bar */}
      <div className="max-w-md mx-auto mb-6 p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-black text-xs text-white"
            style={{ backgroundColor: `${colors.primary}50` }}
          >
            {userName.charAt(0).toUpperCase()}
          </div>
          {isEditingName ? (
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                maxLength={20}
                className="bg-white/10 border border-white/20 rounded-lg px-2.5 py-1 text-xs font-bold text-white outline-none focus:border-white/40"
              />
              <button
                onClick={handleSaveName}
                className="px-2.5 py-1 rounded-lg bg-white text-black font-bold text-xs hover:bg-white/90"
              >
                Save
              </button>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold text-white">{userName}</p>
              <p className="text-[10px] text-white/40">Your display nickname</p>
            </div>
          )}
        </div>
        {!isEditingName && (
          <button
            onClick={() => {
              setNameInput(userName);
              setIsEditingName(true);
            }}
            className="text-xs font-semibold text-white/50 hover:text-white"
          >
            Change
          </button>
        )}
      </div>

      {!roomCode ? (
        /* Create or Join Room Card */
        <div className="max-w-md mx-auto flex flex-col gap-6">
          <div className="p-8 rounded-[32px] bg-white/[0.04] backdrop-blur-3xl border border-white/15 shadow-2xl text-center flex flex-col items-center">
            <div
              className="w-16 h-16 rounded-3xl flex items-center justify-center mb-4 shadow-inner"
              style={{ backgroundColor: `${colors.primary}30` }}
            >
              <Users size={32} style={{ color: colors.primary }} />
            </div>

            <h2 className="text-2xl font-black text-white">Start a Party Room</h2>
            <p className="text-sm text-white/60 font-medium mt-1 mb-6 max-w-xs">
              Same-device sync (beta): Stream music in real-time sync between tabs and windows in this browser.
            </p>

            <button
              onClick={handleCreateRoom}
              className="w-full py-3.5 rounded-full font-extrabold text-sm text-white shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 border border-white/20"
              style={{
                backgroundColor: colors.primary,
                boxShadow: `0 8px 30px ${colors.primary}70`
              }}
            >
              Create New Room
            </button>
          </div>

          <div className="p-6 rounded-[28px] bg-white/[0.03] backdrop-blur-2xl border border-white/10 flex flex-col gap-3">
            <h3 className="text-sm font-bold text-white/80">Have an invite code?</h3>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Enter 6-char code..."
                value={joinInput}
                onChange={(e) => setJoinInput(e.target.value.toUpperCase())}
                maxLength={8}
                className="flex-1 bg-white/[0.06] border border-white/15 rounded-full px-4 py-2.5 text-sm font-bold text-white uppercase placeholder:text-white/40 outline-none focus:border-white/40 transition-colors"
              />
              <button
                onClick={handleJoinRoom}
                disabled={joinInput.trim().length < 4}
                className="px-5 py-2.5 rounded-full bg-white text-black font-extrabold text-sm disabled:opacity-40 disabled:pointer-events-none hover:scale-105 active:scale-95 transition-all shadow-md"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Active Connected Room */
        <div className="max-w-lg mx-auto flex flex-col gap-6">
          {/* Room Info Banner */}
          <div className="p-6 rounded-[28px] bg-white/[0.05] backdrop-blur-3xl border border-white/20 shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                ROOM ACTIVE {isHost ? '(HOST)' : '(LISTENER)'}
              </span>
              <p className="text-2xl font-black text-white tracking-widest mt-1">
                {roomCode}
              </p>
            </div>

            <button
              onClick={handleCopyLink}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 font-bold text-xs text-white transition-all active:scale-95"
            >
              {copied ? (
                <>
                  <Check size={16} className="text-emerald-400" /> Copied Link!
                </>
              ) : (
                <>
                  <Copy size={16} /> Copy Invite Link
                </>
              )}
            </button>
          </div>

          {/* Synchronized Now Playing Card */}
          {currentTrack ? (
            <div className="p-5 rounded-[28px] bg-white/[0.04] backdrop-blur-2xl border border-white/15 flex items-center gap-4">
              <img
                src={currentTrack.thumbnail}
                alt=""
                className="w-16 h-16 rounded-2xl object-cover shadow-md"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                  NOW PLAYING IN ROOM
                </span>
                <p className="text-base font-extrabold text-white truncate leading-tight mt-0.5">
                  {currentTrack.title}
                </p>
                <p className="text-xs text-white/60 font-medium truncate mt-0.5">
                  {currentTrack.artists?.map((a) => a.name).join(', ')}
                </p>
              </div>
            </div>
          ) : (
            <div className="p-6 rounded-[24px] bg-white/[0.03] text-center text-white/50 text-sm font-semibold">
              No track currently playing. {isHost ? 'Pick any song to broadcast to the room!' : 'Waiting for host to play...'}
            </div>
          )}

          {/* Active Participants List */}
          <div className="p-6 rounded-[28px] bg-white/[0.04] backdrop-blur-2xl border border-white/15">
            <h3 className="text-sm font-extrabold text-white mb-3 flex items-center gap-2">
              <Users size={16} className="text-violet-400" />
              <span>Active Listeners ({participants.length})</span>
            </h3>

            <div className="flex flex-col gap-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.03] border border-white/5"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs text-white"
                      style={{ backgroundColor: `${colors.primary}50` }}
                    >
                      {participant.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <span className="text-sm font-semibold text-white/90">{participant.name}</span>
                      {participant.isHost && (
                        <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Host
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Online
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
