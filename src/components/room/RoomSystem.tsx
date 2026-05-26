'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRoomStore } from '@/lib/store/roomStore';
import { getSocketClient } from '@/lib/room/socket';
import { DeviceMatrix } from '@/components/room/DeviceMatrix';

interface RoomSystemProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * RoomSystem provides the UI for creating and joining
 * synchronized listening rooms (Feature 2).
 * 
 * Features:
 * - Room creation with unique code generation
 * - Room joining via code or link
 * - Member list with host indicator
 * - Connection status indicator
 * - Links to DeviceMatrix for multi-device routing
 */
export function RoomSystem({ isOpen, onClose }: RoomSystemProps) {
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [activeView, setActiveView] = useState<'create' | 'join'>('create');
  const [showDeviceMatrix, setShowDeviceMatrix] = useState(false);

  const {
    room,
    isConnected,
    isHost,
    otherDevices,
    showDeviceMatrix: showMatrix,
  } = useRoomStore();

  const socket = getSocketClient();

  const handleCreateRoom = useCallback(() => {
    if (!username.trim()) return;
    socket.createRoom(username.trim());
  }, [username, socket]);

  const handleJoinRoom = useCallback(() => {
    if (!username.trim() || !roomCode.trim()) return;
    socket.joinRoom(roomCode.trim().toUpperCase());
  }, [username, roomCode, socket]);

  const handleLeaveRoom = useCallback(() => {
    socket.leaveRoom();
  }, [socket]);

  const copyRoomCode = useCallback(() => {
    if (room?.code) {
      navigator.clipboard.writeText(room.code);
    }
  }, [room]);

  return (
    <>
      <AnimatePresence>
        {isOpen && !showDeviceMatrix && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
            />

            {/* Panel */}
            <motion.div
              className="fixed right-0 top-0 h-full w-full max-w-md bg-surface border-l border-border z-50 overflow-y-auto"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              <div className="sticky top-0 bg-surface border-b border-border z-10 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-primary">Listen Together</h2>
                <button
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-alt transition-colors text-text-secondary hover:text-text-primary"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                {!room ? (
                  <>
                    {/* Connection Status */}
                    <div className="flex items-center gap-2 mb-6">
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-yellow-500'} animate-pulse`} />
                      <span className="text-xs text-text-muted">
                        {isConnected ? 'Connected to server' : 'Connecting...'}
                      </span>
                    </div>

                    {/* Username */}
                    <div className="mb-6">
                      <label className="block text-sm text-text-secondary mb-2">Display Name</label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Enter your name"
                        className="w-full px-4 py-3 bg-surface-alt border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors"
                        maxLength={24}
                      />
                    </div>

                    {/* Tab Switcher */}
                    <div className="flex bg-surface-alt rounded-xl p-1 mb-6">
                      <button
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                          activeView === 'create'
                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                        onClick={() => setActiveView('create')}
                      >
                        Create Room
                      </button>
                      <button
                        className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
                          activeView === 'join'
                            ? 'bg-primary text-white shadow-lg shadow-primary/30'
                            : 'text-text-secondary hover:text-text-primary'
                        }`}
                        onClick={() => setActiveView('join')}
                      >
                        Join Room
                      </button>
                    </div>

                    {/* Create View */}
                    {activeView === 'create' && (
                      <div className="space-y-4">
                        <div className="p-4 rounded-xl bg-surface-alt border border-border">
                          <p className="text-sm text-text-secondary">
                            Create a room and share the code with friends to listen together in perfect sync.
                          </p>
                        </div>
                        <button
                          onClick={handleCreateRoom}
                          disabled={!username.trim()}
                          className="w-full py-3 px-6 rounded-xl bg-primary text-white font-medium transition-all hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                          Create Room
                        </button>
                      </div>
                    )}

                    {/* Join View */}
                    {activeView === 'join' && (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm text-text-secondary mb-2">Room Code</label>
                          <input
                            type="text"
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                            placeholder="e.g. ABC123"
                            className="w-full px-4 py-3 bg-surface-alt border border-border rounded-xl text-text-primary placeholder:text-text-muted focus:outline-none focus:border-primary transition-colors text-center text-2xl font-mono tracking-[0.3em] uppercase"
                            maxLength={6}
                          />
                        </div>
                        <button
                          onClick={handleJoinRoom}
                          disabled={!username.trim() || roomCode.trim().length < 4}
                          className="w-full py-3 px-6 rounded-xl bg-primary text-white font-medium transition-all hover:shadow-glow disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                        >
                          Join Room
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  /* Active Room View */
                  <div className="space-y-6">
                    {/* Room Header */}
                    <div className="text-center">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-500 text-xs mb-4">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        Connected
                      </div>
                      <h3 className="text-lg font-semibold text-text-primary">Room Active</h3>
                      <p className="text-sm text-text-secondary mt-1">
                        {isHost ? 'You are the host' : 'Joined as guest'}
                      </p>
                    </div>

                    {/* Room Code */}
                    <div
                      onClick={copyRoomCode}
                      className="flex items-center justify-center gap-3 p-4 rounded-xl bg-surface-alt border border-border cursor-pointer hover:border-primary transition-colors group"
                    >
                      <span className="text-3xl font-mono tracking-[0.4em] text-primary">{room.code}</span>
                      <svg
                        className="w-5 h-5 text-text-muted group-hover:text-primary transition-colors"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                    </div>

                    {/* Members */}
                    <div>
                      <h4 className="text-sm font-medium text-text-secondary mb-3">
                        Members ({room.members.length})
                      </h4>
                      <div className="space-y-2">
                        {room.members.map((member) => (
                          <div
                            key={member.deviceId}
                            className="flex items-center gap-3 p-3 rounded-xl bg-surface-alt border border-border"
                          >
                            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                              <span className="text-sm font-medium text-primary">
                                {member.name[0].toUpperCase()}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text-primary truncate">
                                {member.name}
                                {member.isHost && (
                                  <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-primary/20 text-primary">
                                    HOST
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-text-muted capitalize">{member.deviceType}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Multi-Device Warning */}
                    {otherDevices.length > 0 && (
                      <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                        <div className="flex items-start gap-3">
                          <svg className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                          </svg>
                          <div>
                            <p className="text-sm font-medium text-yellow-500">Multiple Devices Detected</p>
                            <p className="text-xs text-text-secondary mt-1">
                              You have {otherDevices.length + 1} device(s) connected. Configure audio routing.
                            </p>
                            <button
                              onClick={() => setShowDeviceMatrix(true)}
                              className="mt-2 text-xs text-primary hover:underline"
                            >
                              Configure Audio Output
                            </button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Leave Room */}
                    <button
                      onClick={handleLeaveRoom}
                      className="w-full py-3 px-6 rounded-xl border border-red-500/30 text-red-500 font-medium transition-all hover:bg-red-500/10 active:scale-[0.98]"
                    >
                      Leave Room
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Device Matrix Modal */}
      {showDeviceMatrix && (
        <DeviceMatrix
          isOpen={true}
          onClose={() => setShowDeviceMatrix(false)}
        />
      )}

      {/* Auto-show device matrix */}
      {showMatrix && !isOpen && (
        <DeviceMatrix
          isOpen={true}
          onClose={() => useRoomStore.getState().setShowDeviceMatrix(false)}
        />
      )}
    </>
  );
}
