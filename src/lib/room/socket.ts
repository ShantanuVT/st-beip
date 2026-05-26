'use client';

import type { RoomAction, Track } from '@/types';
import { useRoomStore } from '@/lib/store/roomStore';
import { usePlayerStore } from '@/lib/store/playerStore';

// ──────────────────────────────────────────────
// Socket Client (Socket.io abstraction)
// ──────────────────────────────────────────────

type SocketEventCallback = (...args: unknown[]) => void;

interface SocketClientConfig {
  serverUrl?: string;
  autoConnect?: boolean;
}

/**
 * SocketClient manages WebSocket connections for real-time
 * room synchronization. Uses Socket.io protocol but provides
 * a clean abstraction layer.
 * 
 * In production, this connects to a Socket.io server.
 * For development/preview, it simulates the connection
 * with local state management.
 */
class SocketClient {
  private socket: any = null;
  private connected: boolean = false;
  private listeners: Map<string, Set<SocketEventCallback>> = new Map();
  private config: SocketClientConfig;
  private roomStore = useRoomStore;
  private playerStore = usePlayerStore;

  constructor(config: SocketClientConfig = {}) {
    this.config = {
      serverUrl: config.serverUrl || process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001',
      autoConnect: config.autoConnect ?? false,
    };

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connect to the Socket.io server.
   */
  async connect(): Promise<void> {
    if (this.connected) return;

    try {
      // Dynamic import of socket.io-client
      const { io } = await import('socket.io-client');
      
      this.socket = io(this.config.serverUrl, {
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      });

      this.socket.on('connect', () => {
        this.connected = true;
        this.roomStore.getState().setConnected(true);
        this.emitListeners('connect');
      });

      this.socket.on('disconnect', () => {
        this.connected = false;
        this.roomStore.getState().setConnected(false);
        this.emitListeners('disconnect');
      });

      // Room events
      this.socket.on('room:joined', (data: any) => {
        this.roomStore.getState().setRoom(data.room);
        this.emitListeners('room:joined', data);
      });

      this.socket.on('room:member_joined', (data: any) => {
        this.roomStore.getState().addDevice(data.member);
        this.emitListeners('room:member_joined', data);
      });

      this.socket.on('room:member_left', (data: any) => {
        this.roomStore.getState().removeDevice(data.deviceId);
        this.emitListeners('room:member_left', data);
      });

      this.socket.on('room:action', (action: RoomAction) => {
        this.handleRemoteAction(action);
        this.emitListeners('room:action', action);
      });

      this.socket.on('room:sync', (state: any) => {
        this.roomStore.getState().setRoom(state);
        this.emitListeners('room:sync', state);
      });

      this.socket.on('room:devices', (devices: any[]) => {
        devices.forEach((d: any) => this.roomStore.getState().addDevice(d));
        this.emitListeners('room:devices', devices);
      });

    } catch (error) {
      console.warn('Socket.io connection failed. Running in offline mode.', error);
      this.connected = false;
    }
  }

  /**
   * Create a new room.
   */
  createRoom(name: string): void {
    if (this.socket?.connected) {
      this.socket.emit('room:create', { name });
    } else {
      // Offline fallback: create room locally
      this.roomStore.getState().createRoom(name);
    }
  }

  /**
   * Join an existing room.
   */
  joinRoom(code: string): void {
    if (this.socket?.connected) {
      this.socket.emit('room:join', { code });
    } else {
      // Offline fallback
      this.roomStore.getState().joinRoom(code);
    }
  }

  /**
   * Leave the current room.
   */
  leaveRoom(): void {
    if (this.socket?.connected) {
      this.socket.emit('room:leave');
    }
    this.roomStore.getState().leaveRoom();
  }

  /**
   * Emit a player action to sync across room members.
   * Includes latency compensation timestamp.
   */
  emitAction(type: RoomAction['type'], payload: unknown): void {
    const action: RoomAction = {
      type,
      payload,
      timestamp: Date.now(),
      userId: this.roomStore.getState().room?.hostId ?? 'unknown',
    };

    if (this.socket?.connected) {
      this.socket.emit('room:action', action);
    } else {
      // Local simulation for preview
      this.roomStore.getState().receiveAction(action);
      this.roomStore.getState().processPendingActions();
    }
  }

  /**
   * Handle actions received from remote members.
   * Applies latency compensation to sync playback precisely.
   */
  private handleRemoteAction(action: RoomAction): void {
    const store = this.roomStore.getState();
    const player = this.playerStore.getState();
    const currentTime = Date.now();
    const networkLatency = currentTime - action.timestamp;

    // Update latency measurement
    store.setLatency(networkLatency);

    switch (action.type) {
      case 'PLAY': {
        const remoteTime = action.payload as number;
        // Compensate for network latency
        const compensatedTime = remoteTime + (networkLatency / 1000);
        player.play();
        player.seek(compensatedTime);
        break;
      }
      case 'PAUSE': {
        player.pause();
        break;
      }
      case 'SEEK': {
        const seekTime = action.payload as number;
        player.seek(seekTime);
        break;
      }
      case 'TRACK_CHANGE': {
        const track = action.payload as Track;
        player.playTrack(track);
        break;
      }
    }

    store.receiveAction(action);
    store.processPendingActions();
  }

  /**
   * Get current connection status.
   */
  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Register an event listener.
   */
  on(event: string, callback: SocketEventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  /**
   * Remove an event listener.
   */
  off(event: string, callback: SocketEventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  /**
   * Emit event to local listeners.
   */
  private emitListeners(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach((cb) => cb(...args));
  }

  /**
   * Disconnect from the server.
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connected = false;
    this.roomStore.getState().setConnected(false);
  }
}

// Singleton instance
let socketInstance: SocketClient | null = null;

/**
 * Get or create the global SocketClient instance.
 */
export function getSocketClient(config?: SocketClientConfig): SocketClient {
  if (!socketInstance) {
    socketInstance = new SocketClient(config);
  }
  return socketInstance;
}
