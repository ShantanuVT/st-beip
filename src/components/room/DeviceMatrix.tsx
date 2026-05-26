'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useRoomStore } from '@/lib/store/roomStore';
import type { AudioOutputRoute } from '@/types';

interface DeviceMatrixProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * DeviceMatrix provides the Intra-User Multi-Device Output Matrix UI.
 * 
 * When a single user joins the same room from multiple devices,
 * this overlay lets them choose the audio routing:
 * 
 * - Option A: Output sound from Device 1 only
 * - Option B: Output sound from Device 2 only
 * - Option C: Output sound simultaneously from both devices in sync
 * 
 * Uses hardware-accelerated animations for smooth transitions.
 */
export function DeviceMatrix({ isOpen, onClose }: DeviceMatrixProps) {
  const { otherDevices, audioRoute, setAudioRoute } = useRoomStore();

  const routes: { value: AudioOutputRoute; label: string; description: string; icon: string }[] = [
    {
      value: 'device-1',
      label: 'Current Device Only',
      description: 'Audio plays from this device exclusively',
      icon: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    },
    {
      value: 'device-2',
      label: 'Other Device Only',
      description: 'Audio plays from your other device exclusively',
      icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
    },
    {
      value: 'both',
      label: 'Both Devices (Sync)',
      description: 'Perfectly synced audio on both devices simultaneously',
      icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/70 backdrop-blur-md z-[70]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed inset-0 z-[71] flex items-center justify-center p-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden"
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-4 border-b border-border">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-text-primary">Audio Output Matrix</h2>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-alt transition-colors text-text-secondary hover:text-text-primary"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-text-secondary">
                  Multiple devices detected in this room. Choose how audio is routed.
                </p>
              </div>

              {/* Device List */}
              <div className="px-6 py-4 space-y-3">
                {otherDevices.map((device, index) => (
                  <div
                    key={device.deviceId}
                    className="flex items-center gap-3 p-3 rounded-xl bg-surface-alt border border-border"
                  >
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <svg className="w-5 h-5 text-primary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        {device.deviceType === 'phone' ? (
                          <rect x="5" y="2" width="14" height="20" rx="2" ry="2" />
                        ) : (
                          <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                        )}
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-text-primary">
                        Device {index + 1}: {device.name}
                      </p>
                      <p className="text-xs text-text-muted capitalize">{device.deviceType}</p>
                    </div>
                    {audioRoute === (index === 0 ? 'device-1' : 'device-2') && (
                      <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <svg className="w-3.5 h-3.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M20 6L9 17l-5-5" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Routing Options */}
              <div className="px-6 pb-6 space-y-3">
                <p className="text-xs text-text-muted uppercase tracking-wider font-medium">
                  Route audio to:
                </p>

                {routes.map((route) => (
                  <button
                    key={route.value}
                    onClick={() => setAudioRoute(route.value)}
                    className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition-all ${
                      audioRoute === route.value
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-text-muted hover:bg-surface-alt/50'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 ${
                      audioRoute === route.value
                        ? 'border-primary'
                        : 'border-text-muted'
                    }`}>
                      {audioRoute === route.value && (
                        <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-medium ${
                        audioRoute === route.value ? 'text-primary' : 'text-text-primary'
                      }`}>
                        {route.label}
                      </p>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {route.description}
                      </p>
                    </div>
                  </button>
                ))}
              </div>

              {/* Done Button */}
              <div className="px-6 pb-6">
                <button
                  onClick={onClose}
                  className="w-full py-3 px-6 rounded-xl bg-primary text-white font-medium transition-all hover:shadow-glow active:scale-[0.98]"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
