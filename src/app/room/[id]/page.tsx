'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Controls } from '@/components/player/Controls';
import { useRoomStore } from '@/lib/store/roomStore';
import { usePlayerStore } from '@/lib/store/playerStore';
import { getSocketClient } from '@/lib/room/socket';

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const roomCode = params?.id as string;

  const { room, isConnected, isHost, latency } = useRoomStore();
  const { currentTrack, isPlaying, currentTime, duration } = usePlayerStore();
  const [username, setUsername] = useState('');

  const socket = getSocketClient();

  useEffect(() => {
    if (roomCode && username) {
      socket.joinRoom(roomCode.toUpperCase());
    }
  }, [roomCode, username, socket]);

  const handleLeave = () => {
    socket.leaveRoom();
    router.push('/');
  };

  const handleJoin = () => {
    if (username.trim()) {
      socket.joinRoom(roomCode.toUpperCase());
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // If not yet in the room, show join prompt
  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                <circle cx="9" cy="7" r="4" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-text-primary">Join Room</h2>
            <p className="text-sm text-text-secondary mt-1">
              Room code: <span className="font-mono text-primary tracking-wider">{roomCode}</span>
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-2">Display Name</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-3 bg-surface-alt border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                maxLength={24}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
            </div>
            <button
              onClick={handleJoin}
              disabled={!username.trim()}
              className="w-full py-3 px-6 rounded-xl bg-primary text-white font-medium transition-all hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              Join Room
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto space-y-6">
      {/* Room Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-text-primary">Room</h1>
            <span className="font-mono text-lg tracking-wider text-primary">{room.code}</span>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
            <span className="text-xs text-text-muted">
              {isConnected ? `Connected · ${latency}ms latency` : 'Connecting...'}
            </span>
          </div>
        </div>
        <button
          onClick={handleLeave}
          className="px-4 py-2 rounded-xl border border-red-500/30 text-red-500 text-sm font-medium hover:bg-red-500/10 transition-all"
        >
          Leave
        </button>
      </motion.div>

      {/* Now Playing */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1 }}
        className="p-6 rounded-2xl bg-surface-alt/50 border border-border"
      >
        <p className="text-xs text-text-muted uppercase tracking-wider mb-3">Now Playing</p>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-xl bg-surface-alt flex items-center justify-center overflow-hidden flex-shrink-0">
            {currentTrack?.albumArt ? (
              <img src={currentTrack.albumArt} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <svg className="w-8 h-8 text-text-muted" viewBox="0 0 24 24" fill="currentColor" opacity="0.5">
                  <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55C7.79 13 6 14.79 6 17s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                </svg>
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-medium text-text-primary truncate">
              {currentTrack?.title || 'No track playing'}
            </p>
            <p className="text-sm text-text-secondary truncate">
              {currentTrack?.artist || 'Waiting for host to play...'}
            </p>
          </div>
          {isPlaying && (
            <div className="flex gap-1 items-end h-6">
              {[1, 2, 3, 4].map((i) => (
                <span
                  key={i}
                  className="w-1 bg-primary rounded-full animate-pulse"
                  style={{
                    height: `${Math.random() * 16 + 8}px`,
                    animationDelay: `${i * 0.15}s`,
                    opacity: 0.7 + Math.random() * 0.3,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Progress */}
        <div className="mt-4">
          <div className="relative h-1 bg-surface-alt rounded-full">
            <div
              className="absolute left-0 top-0 h-full bg-primary rounded-full transition-all duration-200"
              style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-xs text-text-muted">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="mt-4">
          <Controls size="sm" />
        </div>
      </motion.div>

      {/* Members */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-sm font-semibold text-text-primary mb-3">
          Members ({room.members.length})
        </h2>
        <div className="grid gap-2">
          {room.members.map((member, i) => (
            <motion.div
              key={member.deviceId}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * i }}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface-alt/50 border border-border"
            >
              <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <span className="text-sm font-semibold text-primary">
                  {member.name[0].toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">
                  {member.name}
                  {member.isHost && (
                    <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary font-medium">
                      HOST
                    </span>
                  )}
                </p>
                <p className="text-xs text-text-muted capitalize">{member.deviceType}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
