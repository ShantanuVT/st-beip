'use client';

import { create } from 'zustand';
import type { RoomState, RoomMember, RoomAction, AudioOutputRoute } from '@/types';

interface RoomStore {
  // State
  room: RoomState | null;
  isConnected: boolean;
  isHost: boolean;
  myDeviceId: string | null;
  otherDevices: RoomMember[];
  showDeviceMatrix: boolean;
  audioRoute: AudioOutputRoute;
  pendingActions: RoomAction[];
  latency: number; // ms

  // Room actions
  createRoom: (name: string) => void;
  joinRoom: (code: string) => void;
  leaveRoom: () => void;
  setRoom: (room: RoomState | null) => void;
  setConnected: (connected: boolean) => void;

  // Sync actions
  sendAction: (action: Omit<RoomAction, 'timestamp' | 'userId'>) => void;
  receiveAction: (action: RoomAction) => void;
  processPendingActions: () => void;

  // Device matrix
  setShowDeviceMatrix: (show: boolean) => void;
  setAudioRoute: (route: AudioOutputRoute) => void;
  addDevice: (device: RoomMember) => void;
  removeDevice: (deviceId: string) => void;
  setMyDeviceId: (id: string) => void;

  // Latency
  setLatency: (ms: number) => void;
}

export const useRoomStore = create<RoomStore>((set, get) => ({
  room: null,
  isConnected: false,
  isHost: false,
  myDeviceId: null,
  otherDevices: [],
  showDeviceMatrix: false,
  audioRoute: 'device-1',
  pendingActions: [],
  latency: 0,

  createRoom: (name: string) => {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const deviceId = `device-${Date.now()}`;
    const member: RoomMember = {
      id: `user-${Date.now()}`,
      name,
      isHost: true,
      deviceId,
      deviceType: 'desktop',
      joinedAt: Date.now(),
    };
    set({
      room: {
        code,
        hostId: member.id,
        members: [member],
        currentTrack: null,
        isPlaying: false,
        currentTime: 0,
        lastUpdated: Date.now(),
      },
      isHost: true,
      isConnected: true,
      myDeviceId: deviceId,
    });
  },

  joinRoom: (code: string) => {
    const deviceId = `device-${Date.now()}`;
    set({
      isConnected: true,
      myDeviceId: deviceId,
      isHost: false,
    });
    // Socket connection will handle the rest
  },

  leaveRoom: () => {
    set({
      room: null,
      isConnected: false,
      isHost: false,
      otherDevices: [],
      showDeviceMatrix: false,
      audioRoute: 'device-1',
      pendingActions: [],
    });
  },

  setRoom: (room) => set({ room }),
  setConnected: (connected) => set({ isConnected: connected }),

  sendAction: (action) => {
    const fullAction: RoomAction = {
      ...action,
      timestamp: Date.now(),
      userId: get().room?.hostId ?? 'unknown',
    };
    // Socket emission would happen here
    set((s) => ({ pendingActions: [...s.pendingActions, fullAction] }));
  },

  receiveAction: (action) => {
    set((s) => ({ pendingActions: [...s.pendingActions, action] }));
  },

  processPendingActions: () => {
    const { pendingActions } = get();
    if (pendingActions.length === 0) return;

    // Sort by timestamp and process
    const sorted = [...pendingActions].sort((a, b) => a.timestamp - b.timestamp);
    set({ pendingActions: [] });

    for (const action of sorted) {
      const room = get().room;
      if (!room) continue;

      switch (action.type) {
        case 'PLAY':
          set({ room: { ...room, isPlaying: true, currentTime: action.payload as number, lastUpdated: Date.now() } });
          break;
        case 'PAUSE':
          set({ room: { ...room, isPlaying: false, currentTime: action.payload as number, lastUpdated: Date.now() } });
          break;
        case 'SEEK':
          set({ room: { ...room, currentTime: action.payload as number, lastUpdated: Date.now() } });
          break;
        case 'TRACK_CHANGE':
          set({ room: { ...room, currentTrack: action.payload as any, currentTime: 0, lastUpdated: Date.now() } });
          break;
      }
    }
  },

  setShowDeviceMatrix: (show) => set({ showDeviceMatrix: show }),
  setAudioRoute: (route) => set({ audioRoute: route }),

  addDevice: (device) => {
    set((s) => {
      const exists = s.otherDevices.find((d) => d.deviceId === device.deviceId);
      if (exists) return s;
      const updated = [...s.otherDevices, device];
      // Show device matrix only when the SAME user connects from multiple devices
      // (same userId with different deviceId)
      const sameUserDevices = updated.filter((d) => d.id === device.id);
      const showMatrix = sameUserDevices.length > 1;
      return { otherDevices: updated, showDeviceMatrix: showMatrix };
    });
  },

  removeDevice: (deviceId) => {
    set((s) => ({
      otherDevices: s.otherDevices.filter((d) => d.deviceId !== deviceId),
    }));
  },

  setMyDeviceId: (id) => set({ myDeviceId: id }),

  setLatency: (latency) => set({ latency }),
}));
