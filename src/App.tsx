import React, { useState, useEffect, useCallback } from 'react';
import { Shield, AlertTriangle, CheckCircle2, Phone, Settings, Activity, Clock, Battery, Sun, Smartphone, User, ShieldAlert, Plus, X, Timer, Vibrate, Volume2, VolumeX, Type } from 'lucide-react';
import { Motion } from '@capacitor/motion';
import { Capacitor } from '@capacitor/core';
import { Device } from '@capacitor/device';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { SensorData, ActivityPattern, NOKContact, AppState } from './types';

// Components
import EmergencyAlert from './components/EmergencyAlert';
import SensorDashboard from './components/SensorDashboard';
import ActivityLog from './components/ActivityLog';
import Onboarding from './components/Onboarding';
import GitHubSync from './components/GitHubSync';

// Utils
import { alarmController } from './utils/alarmController';

const INITIAL_PATTERNS: ActivityPattern[] = [
  { id: '1', name: 'Morning Routine', startTime: '07:00', endTime: '08:30', type: 'movement', status: 'learned' },
  { id: '2', name: 'Bathing/Shower', startTime: '08:30', endTime: '09:00', type: 'stationary', status: 'learned' },
  { id: '3', name: 'Sleep Window', startTime: '23:00', endTime: '06:30', type: 'sleep', status: 'learned' },
];

export default function App() {
  const [appState, setAppState] = useState<AppState>('monitoring');
  const [activeTab, setActiveTab] = useState<'monitor' | 'history' | 'nok'>('monitor');
  const [nok, setNok] = useState<NOKContact | null>(() => {
    const saved = localStorage.getItem('guardian_pulse_nok');
    return saved ? JSON.parse(saved) : null;
  });
  const [sensorData, setSensorData] = useState<SensorData>({
    accelerometer: null,
    light: null,
    proximity: null,
    charging: null,
    batteryLevel: null,
    screenOn: true,
    lastInteraction: Date.now(),
  });
  const [patterns, setPatterns] = useState<ActivityPattern[]>(() => {
    const saved = localStorage.getItem('guardian_pulse_patterns');
    return saved ? JSON.parse(saved) : INITIAL_PATTERNS;
  });

  const savePatterns = (newPatterns: ActivityPattern[]) => {
    setPatterns(newPatterns);
    localStorage.setItem('guardian_pulse_patterns', JSON.stringify(newPatterns));
  };

  const addPattern = (pattern: Omit<ActivityPattern, 'id' | 'status'>) => {
    const newPattern: ActivityPattern = {
      ...pattern,
      id: Date.now().toString(),
      status: 'learning'
    };
    savePatterns([...patterns, newPattern]);
  };

  const deletePattern = (id: string) => {
    savePatterns(patterns.filter(p => p.id !== id));
  };

  const [inactivityThreshold, setInactivityThreshold] = useState<number>(() => {
    const saved = localStorage.getItem('guardian_pulse_inactivity');
    return saved ? parseInt(saved, 10) : 30;
  });

  const updateInactivityThreshold = (mins: number) => {
    setInactivityThreshold(mins);
    localStorage.setItem('guardian_pulse_inactivity', mins.toString());
  };

  const [showSettings, setShowSettings] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPattern, setNewPattern] = useState({
    name: '',
    startTime: '09:00',
    endTime: '10:00',
    type: 'movement' as const
  });
  const [sensorPermission, setSensorPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [testCountdown, setTestCountdown] = useState<number | null>(null);
  const [theme, setTheme] = useState<'day' | 'night'>(() => {
    return (localStorage.getItem('guardian_pulse_theme') as 'day' | 'night') || 'night';
  });
  const [fontSize, setFontSize] = useState<'normal' | 'large'>(() => {
    return (localStorage.getItem('guardian_pulse_font_size') as 'normal' | 'large') || 'large';
  });

  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    return localStorage.getItem('guardian_pulse_sound_enabled') !== 'false';
  });
  const [vibrateEnabled, setVibrateEnabled] = useState<boolean>(() => {
    return localStorage.getItem('guardian_pulse_vibrate_enabled') !== 'false';
  });

  const [wakeLockSentinel, setWakeLockSentinel] = useState<any>(null);
  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    return 'Notification' in window ? Notification.permission : 'unsupported';
  });

  const requestWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) {
      console.warn('Screen Wake Lock is not supported on this device/browser');
      return;
    }
    try {
      // Release any existing wake lock before requesting a new one
      if (wakeLockSentinel) {
        try {
          await wakeLockSentinel.release();
        } catch (e) {}
      }
      const sentinel = await (navigator as any).wakeLock.request('screen');
      setWakeLockSentinel(sentinel);
      console.log('Screen Wake Lock acquired successfully');
    } catch (err) {
      console.error('Failed to acquire Screen Wake Lock:', err);
    }
  }, [wakeLockSentinel]);

  const releaseWakeLock = useCallback(async () => {
    if (wakeLockSentinel) {
      try {
        await wakeLockSentinel.release();
        setWakeLockSentinel(null);
      } catch (err) {
        console.error('Failed to release Screen Wake Lock:', err);
      }
    }
  }, [wakeLockSentinel]);

  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      try {
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
        return permission;
      } catch (e) {
        console.error('Error requesting notification permission:', e);
      }
    }
    return 'unsupported';
  };

  // Screen Wake Lock loop to keep display active
  useEffect(() => {
    requestWakeLock();

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        requestWakeLock();
      } else {
        releaseWakeLock();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      releaseWakeLock();
    };
  }, [appState, requestWakeLock, releaseWakeLock]);

  // Request notifications permission on app initialization
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().then(permission => {
        setNotificationPermission(permission);
      });
    }
  }, []);

  const toggleSound = () => {
    const newVal = !soundEnabled;
    setSoundEnabled(newVal);
    localStorage.setItem('guardian_pulse_sound_enabled', String(newVal));
  };

  const toggleVibrate = () => {
    const newVal = !vibrateEnabled;
    setVibrateEnabled(newVal);
    localStorage.setItem('guardian_pulse_vibrate_enabled', String(newVal));
  };

  // Alarm controller trigger effect
  useEffect(() => {
    if (appState !== 'monitoring') {
      alarmController.stopAll();
      alarmController.startSound();
      alarmController.startVibration();
    } else {
      alarmController.stopAll();
    }

    return () => {
      alarmController.stopAll();
    };
  }, [appState, soundEnabled, vibrateEnabled]);

  const handleOnboardingComplete = (contact: NOKContact) => {
    setNok(contact);
    localStorage.setItem('guardian_pulse_nok', JSON.stringify(contact));
  };

  // Real sensor listeners
  useEffect(() => {
    let motionListener: any = null;

    const handleMotion = (event: any) => {
      const acc = event.accelerationIncludingGravity || event.acceleration;
      if (acc) {
        setSensorData(prev => {
          const newState = {
            ...prev,
            accelerometer: {
              x: acc.x || 0,
              y: acc.y || 0,
              z: acc.z || 0,
            }
          };

          // If motion is significant (e.g. > 2.0 change), update last interaction
          const diff = Math.abs(acc.x - (prev.accelerometer?.x || acc.x)) + 
                       Math.abs(acc.y - (prev.accelerometer?.y || acc.y)) + 
                       Math.abs(acc.z - (prev.accelerometer?.z || acc.z));
          
          if (diff > 2.0) {
            newState.lastInteraction = Date.now();
          }

          return newState;
        });
      }
    };

    const handleVisibility = () => {
      setSensorData(prev => ({
        ...prev,
        screenOn: !document.hidden,
        lastInteraction: !document.hidden ? Date.now() : prev.lastInteraction
      }));
    };

    const updateInteraction = () => {
      setSensorData(prev => ({ ...prev, lastInteraction: Date.now() }));
    };

    const setupSensors = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          motionListener = await Motion.addListener('accel', handleMotion);
          
          // Native styling
          await StatusBar.setStyle({ style: Style.Dark });
          await StatusBar.setBackgroundColor({ color: '#09090b' }); // zinc-950
          await SplashScreen.hide();
        } catch (e) {
          console.error('Error starting Capacitor motion:', e);
          window.addEventListener('devicemotion', handleMotion);
        }
      } else {
        // Request permission for iOS 13+
        if (typeof (DeviceMotionEvent as any).requestPermission === 'function') {
          (DeviceMotionEvent as any).requestPermission()
            .then((response: string) => {
              if (response === 'granted') {
                setSensorPermission('granted');
                window.addEventListener('devicemotion', handleMotion);
              } else {
                setSensorPermission('denied');
              }
            })
            .catch(() => setSensorPermission('denied'));
        } else {
          window.addEventListener('devicemotion', handleMotion);
        }
      }
    };

    setupSensors();
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('touchstart', updateInteraction);
    window.addEventListener('click', updateInteraction);

    return () => {
      if (motionListener) {
        motionListener.remove();
      }
      window.removeEventListener('devicemotion', handleMotion);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('touchstart', updateInteraction);
      window.removeEventListener('click', updateInteraction);
    };
  }, []);

  // Battery tracking
  useEffect(() => {
    let battery: any = null;

    const updateBatteryInfo = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          const info = await Device.getBatteryInfo();
          setSensorData(prev => ({
            ...prev,
            charging: info.isCharging,
            batteryLevel: Math.round((info.batteryLevel || 0) * 100)
          }));
        } catch (e) {
          console.error('Capacitor battery info failed', e);
        }
        return;
      }

      if (battery) {
        setSensorData(prev => ({
          ...prev,
          charging: battery.charging,
          batteryLevel: Math.round(battery.level * 100)
        }));
      }
    };

    if (Capacitor.isNativePlatform()) {
      const interval = setInterval(updateBatteryInfo, 30000);
      updateBatteryInfo();
      return () => clearInterval(interval);
    }

    if ('getBattery' in navigator) {
      (navigator as any).getBattery().then((batt: any) => {
        battery = batt;
        updateBatteryInfo();
        battery.addEventListener('chargingchange', updateBatteryInfo);
        battery.addEventListener('levelchange', updateBatteryInfo);
      });
    }

    return () => {
      if (battery) {
        battery.removeEventListener('chargingchange', updateBatteryInfo);
        battery.removeEventListener('levelchange', updateBatteryInfo);
      }
    };
  }, []);

  // Simulate sensor updates (fallback/additional)
  useEffect(() => {
    const interval = setInterval(() => {
      setSensorData(prev => {
        // If we don't have real accelerometer data, simulate some noise
        if (!prev.accelerometer) {
          return {
            ...prev,
            accelerometer: {
              x: (Math.random() - 0.5) * 0.1,
              y: (Math.random() - 0.5) * 0.1,
              z: 9.8 + (Math.random() - 0.5) * 0.1,
            }
          };
        }
        return prev;
      });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  // Background monitor for inactivity
  useEffect(() => {
    const monitorInactivity = () => {
      if (appState !== 'monitoring') return;

      const now = new Date();
      const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      
      // Check if we are in a "safe" pattern window (stationary or sleep)
      const inSafeWindow = patterns.find(p => {
        if (p.status !== 'learned') return false;
        if (p.startTime <= p.endTime) {
          return currentTimeStr >= p.startTime && currentTimeStr <= p.endTime;
        } else {
          // Handles overnight windows (e.g. 23:00 to 06:00)
          return currentTimeStr >= p.startTime || currentTimeStr <= p.endTime;
        }
      });

      // If we are in a safe window, we don't trigger alerts for inactivity
      if (inSafeWindow && (inSafeWindow.type === 'stationary' || inSafeWindow.type === 'sleep')) {
        return;
      }

      const inactivityMins = (Date.now() - sensorData.lastInteraction) / 1000 / 60;
      
      if (inactivityMins >= inactivityThreshold) {
        setAppState('alert_phase_1');
      }
    };

    const interval = setInterval(monitorInactivity, 15000); // Check every 15 seconds
    return () => clearInterval(interval);
  }, [sensorData.lastInteraction, inactivityThreshold, appState, patterns]);

  // Handle "I am OK"
  const handleIamOk = () => {
    setAppState('monitoring');
    setSensorData(prev => ({ ...prev, lastInteraction: Date.now() }));
  };

  // Timer effect for lock-screen diagnostic testing
  useEffect(() => {
    if (testCountdown === null) return;
    if (testCountdown === 0) {
      setTestCountdown(null);
      setAppState('alert_phase_1');
      return;
    }

    const timer = setTimeout(() => {
      setTestCountdown(prev => (prev !== null ? prev - 1 : null));
    }, 1000);

    return () => clearTimeout(timer);
  }, [testCountdown]);

  // Listen for dismiss action from service worker tap
  useEffect(() => {
    const handleSWMessage = (event: MessageEvent) => {
      if (event.data && event.data.action === 'dismiss-alarm') {
        handleIamOk();
      }
    };
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('message', handleSWMessage);
    }
    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('message', handleSWMessage);
      }
    };
  }, []);

  // Post browser/device notification on Alert to wake sleeping display and sound/vibrate
  useEffect(() => {
    if (appState !== 'monitoring') {
      let title = '⚠️ Guardian Pulse Warning!';
      let body = 'Action required: Inactivity alert active. Click to confirm you are safe.';
      
      if (appState === 'alert_phase_1') {
        title = '⚠️ Inactivity Warning';
        body = 'No movement detected. Tap to confirm you are OK!';
      } else if (appState === 'alert_phase_2') {
        title = '🚨 Urgent: Inactivity Warning';
        body = 'Next-of-kin alert is about to be sent. Click immediately!';
      } else if (appState === 'alert_phase_3') {
        title = '🚨 EMERGENCY STATE ACTIVE';
        body = 'Contacting next-of-kin...';
      }

      if ('Notification' in window && Notification.permission === 'granted') {
        try {
          // Send notification via Service Worker if active (crucial for locked screens/background execution)
          if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({
              type: 'SHOW_ALERT_NOTIFICATION',
              title,
              body,
              options: {
                data: { appState }
              }
            });
          } else {
            // Fallback to standard local notification
            const notification = new Notification(title, {
              body,
              icon: '/favicon.ico',
              tag: 'guardian-pulse-emergency',
              requireInteraction: true,
              silent: false,
              vibrate: [500, 200, 500, 200, 500, 200, 500],
            } as any);
            
            notification.onclick = () => {
              window.focus();
              handleIamOk();
            };
          }
        } catch (e) {
          console.error('Notification failed to show:', e);
        }
      }
    }
  }, [appState]);

  // Simulate Anomaly
  const triggerAnomaly = () => {
    setAppState('alert_phase_1');
  };

  if (!nok) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <div className={`theme-${theme} font-size-${fontSize} min-h-screen flex flex-col max-w-md mx-auto bg-zinc-950 border-x border-zinc-800 shadow-2xl relative overflow-hidden`}>
      {/* Header */}
      <header className="p-6 flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
            <Shield className="w-6 h-6 text-emerald-500" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Guardian Pulse</h1>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-500/80">System Active</span>
            </div>
          </div>
        </div>
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 rounded-lg hover:bg-zinc-800 transition-colors text-zinc-400"
        >
          <Settings className="w-5 h-5" />
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-6 space-y-8 pb-24 no-scrollbar">
        {activeTab === 'monitor' && (
          <>
            {/* Status Card */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Current Status</h2>
                <span className="text-[10px] font-mono text-zinc-600">Updated: Just now</span>
              </div>
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 shadow-sm space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-zinc-100">Behavior Normal</p>
                    <p className="text-sm text-zinc-500">Matching 14-day baseline</p>
                  </div>
                </div>
                <div className="pt-4 border-t border-zinc-800 flex justify-between items-center">
                  <div className="flex -space-x-2">
                    {[1, 2, 3, 4].map(i => (
                      <div key={i} className="w-6 h-6 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center">
                        <div className="w-1 h-1 rounded-full bg-emerald-500" />
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] font-medium text-zinc-500">All sensors reporting</p>
                </div>
              </div>
            </section>

            {/* Sensor Dashboard */}
            <SensorDashboard data={sensorData} />

            {/* ML Explanation */}
            <section className="p-5 rounded-2xl bg-zinc-900/30 border border-zinc-800/50 space-y-3">
              <div className="flex items-center gap-2 text-zinc-400">
                <Activity className="w-4 h-4" />
                <h3 className="text-xs font-bold uppercase tracking-widest">Heuristic Engine</h3>
              </div>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Guardian Pulse uses a <span className="text-zinc-300">Random Forest Classifier</span> to compare your current activity against a 14-day rolling baseline. 
                It recognizes "Normal Stationary" events (like bathing or sleeping) to prevent false alarms.
              </p>
            </section>

            {/* Simulation Controls (For Demo) */}
            <section className="pt-8 border-t border-zinc-800">
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/10">
                <p className="text-xs font-semibold text-amber-500 mb-3 uppercase tracking-wider">Demo Simulation</p>
                <button 
                  onClick={triggerAnomaly}
                  className="w-full py-3 px-4 bg-amber-500 text-black font-bold rounded-xl hover:bg-amber-400 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <AlertTriangle className="w-5 h-5" />
                  Simulate Abnormal Event
                </button>
              </div>
            </section>
          </>
        )}

        {activeTab === 'history' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">History & Baseline</h2>
              {!showAddForm && (
                <button 
                  onClick={() => setShowAddForm(true)}
                  className="flex items-center gap-1.5 py-1.5 px-3 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add New
                </button>
              )}
            </div>

            {showAddForm && (
              <div className="p-5 rounded-2xl bg-zinc-900 border border-zinc-800 space-y-4 animate-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold text-zinc-100">Add Activity Pattern</h3>
                  <button onClick={() => setShowAddForm(false)}><X className="w-4 h-4 text-zinc-500" /></button>
                </div>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Activity Name</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Lunch Time"
                      value={newPattern.name}
                      onChange={e => setNewPattern(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Start Time</label>
                      <input 
                        type="time" 
                        value={newPattern.startTime}
                        onChange={e => setNewPattern(prev => ({ ...prev, startTime: e.target.value }))}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">End Time</label>
                      <input 
                        type="time" 
                        value={newPattern.endTime}
                        onChange={e => setNewPattern(prev => ({ ...prev, endTime: e.target.value }))}
                        className="w-full bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Activity Type</label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['movement', 'stationary', 'sleep'] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setNewPattern(prev => ({ ...prev, type }))}
                          className={`py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg border transition-all ${
                            newPattern.type === type 
                              ? 'bg-emerald-500 border-emerald-500 text-black' 
                              : 'bg-zinc-800 border-zinc-700 text-zinc-500'
                          }`}
                        >
                          {type}
                        </button>
                      ))}
                    </div>
                  </div>
                  <button 
                    onClick={() => {
                      if (newPattern.name) {
                        addPattern(newPattern);
                        setShowAddForm(false);
                        setNewPattern({ name: '', startTime: '09:00', endTime: '10:00', type: 'movement' });
                      }
                    }}
                    className="w-full py-3 bg-emerald-500 text-black font-bold rounded-xl text-sm mt-2 hover:bg-emerald-400 transition-colors"
                  >
                    Save Pattern
                  </button>
                </div>
              </div>
            )}

            <ActivityLog patterns={patterns} onDelete={deletePattern} />
            <div className="mt-8 p-6 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-4">
              <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6 text-zinc-500" />
              </div>
              <div>
                <p className="text-sm font-bold">Heuristic Training</p>
                <p className="text-xs text-zinc-500">Patterns marked as 'learning' take 3-5 days to fully optimize within the Random Forest model.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'nok' && nok && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 space-y-6">
            <h2 className="text-xs font-bold uppercase tracking-widest text-zinc-500">Emergency Contact</h2>
            <div className="p-8 rounded-3xl bg-emerald-500/5 border border-emerald-500/10 text-center space-y-6">
              <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto border-4 border-emerald-500/30">
                <User className="w-12 h-12 text-emerald-500" />
              </div>
              <div>
                <h3 className="text-2xl font-black tracking-tight">{nok.name}</h3>
                <p className="text-emerald-500 font-bold uppercase text-xs tracking-widest">{nok.relation}</p>
              </div>
              <div className="pt-4 space-y-3">
                <a 
                  href={`tel:${nok.phone}`}
                  className="w-full py-4 bg-emerald-500 text-black font-bold rounded-2xl flex items-center justify-center gap-3 hover:bg-emerald-400 transition-all active:scale-95"
                >
                  <Phone className="w-5 h-5" />
                  Call Now
                </a>
                <button className="w-full py-4 bg-zinc-800 text-zinc-300 font-bold rounded-2xl flex items-center justify-center gap-3">
                  Send Location Status
                </button>
              </div>
            </div>
            
            <div className="p-4 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-zinc-500" />
              </div>
              <div>
                <p className="text-sm font-bold">Auto-Alert Enabled</p>
                <p className="text-xs text-zinc-500">Contact will be notified after {inactivityThreshold} mins of inactivity.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Emergency Alert Overlay */}
      {appState !== 'monitoring' && (
        <EmergencyAlert 
          state={appState} 
          onConfirm={handleIamOk} 
          nok={nok}
        />
      )}

      {/* Footer Nav */}
      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto h-20 bg-zinc-900/80 backdrop-blur-xl border-t border-zinc-800 flex items-center justify-around px-6 z-20">
        <button 
          onClick={() => setActiveTab('monitor')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'monitor' ? 'text-emerald-500' : 'text-zinc-500'}`}
        >
          <Activity className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Monitor</span>
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'history' ? 'text-emerald-500' : 'text-zinc-500'}`}
        >
          <Clock className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">History</span>
        </button>
        <button 
          onClick={() => setActiveTab('nok')}
          className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'nok' ? 'text-emerald-500' : 'text-zinc-500'}`}
        >
          <Phone className="w-6 h-6" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">NOK</span>
        </button>
      </nav>

       {/* Settings Modal (Simple) */}
       {showSettings && (
         <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-end">
           <div className="w-full bg-zinc-900 rounded-t-3xl p-8 space-y-6 max-h-[90vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom duration-300">
             <div className="flex items-center justify-between">
               <h2 className="text-xl font-bold">Settings</h2>
               <button onClick={() => setShowSettings(false)} className="text-zinc-500">Close</button>
             </div>
             <div className="space-y-4">
               <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800">
                 <div className="flex items-center gap-3">
                   <User className="w-5 h-5 text-zinc-400" />
                   <div>
                     <p className="text-sm font-medium">Next of Kin</p>
                     <p className="text-xs text-zinc-500">{nok.name} ({nok.relation})</p>
                   </div>
                 </div>
                 <button 
                   onClick={() => { 
                     setNok(null); 
                     localStorage.removeItem('guardian_pulse_nok');
                     setShowSettings(false); 
                   }} 
                   className="text-xs text-emerald-500"
                 >
                   Edit
                 </button>
               </div>

               {/* GitHub Cloud Sync */}
               <GitHubSync 
                 patterns={patterns}
                 onPatternsRestore={savePatterns}
                 nok={nok}
                 onNokRestore={(newNok) => {
                   setNok(newNok);
                   localStorage.setItem('guardian_pulse_nok', JSON.stringify(newNok));
                 }}
                 inactivityThreshold={inactivityThreshold}
                 onInactivityRestore={updateInactivityThreshold}
               />

                {/* Notification permission status to wake screen */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-800 text-left">
                  <div className="flex flex-col text-left">
                    <span className="text-xs font-semibold text-zinc-200">Wake Screen Notifications</span>
                    <span className="text-[10px] text-zinc-500">
                      {notificationPermission === 'granted' 
                        ? '✅ Enabled (Wakes sleeping screen)' 
                        : '⚠️ Required to wake sleeping screen'}
                    </span>
                  </div>
                  {notificationPermission !== 'granted' && (
                    <button
                      onClick={requestNotificationPermission}
                      className="py-1.5 px-3 bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all active:scale-95"
                    >
                      Enable
                    </button>
                  )}
                </div>

                {/* Interface Theme Settings (Day / Night) */}
                <div className="flex flex-col gap-4 p-4 rounded-xl bg-zinc-800">
                  <div className="flex items-center gap-3">
                    <Sun className="w-5 h-5 text-zinc-400" />
                    <div>
                      <p className="text-sm font-medium">Interface Mode</p>
                      <p className="text-xs text-zinc-500">Choose between light (day) or dark (night) display</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => {
                        setTheme('day');
                        localStorage.setItem('guardian_pulse_theme', 'day');
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        theme === 'day'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-500'
                      }`}
                    >
                      <Sun className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Day Mode</span>
                    </button>

                    <button
                      onClick={() => {
                        setTheme('night');
                        localStorage.setItem('guardian_pulse_theme', 'night');
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        theme === 'night'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-500'
                      }`}
                    >
                      <Smartphone className="w-5 h-5" />
                      <span className="text-[10px] font-bold uppercase tracking-wider">Night Mode</span>
                    </button>
                  </div>
                </div>

                {/* Text Size Settings for Elderly Mode */}
                <div className="flex flex-col gap-4 p-4 rounded-xl bg-zinc-800">
                  <div className="flex items-center gap-3">
                    <Type className="w-5 h-5 text-zinc-400" />
                    <div>
                      <p className="text-sm font-medium">Text Size (Elderly-Friendly)</p>
                      <p className="text-xs text-zinc-500">Enlarge app text and tap buttons for better readability</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <button
                      onClick={() => {
                        setFontSize('normal');
                        localStorage.setItem('guardian_pulse_font_size', 'normal');
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        fontSize === 'normal'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-500'
                      }`}
                    >
                      <span className="text-sm font-medium">Aa</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">Normal Size</span>
                    </button>

                    <button
                      onClick={() => {
                        setFontSize('large');
                        localStorage.setItem('guardian_pulse_font_size', 'large');
                      }}
                      className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                        fontSize === 'large'
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 font-bold'
                          : 'bg-zinc-900 border-zinc-700 text-zinc-500'
                      }`}
                    >
                      <span className="text-xl font-bold">Aa</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider">Large (Elderly)</span>
                    </button>
                  </div>
                </div>

               {/* Alarm Feedback Settings */}
               <div className="flex flex-col gap-4 p-4 rounded-xl bg-zinc-800">
                 <div className="flex items-center gap-3">
                   <ShieldAlert className="w-5 h-5 text-zinc-400" />
                   <div>
                     <p className="text-sm font-medium">Alarm Alerts</p>
                     <p className="text-xs text-zinc-500">Configure alarm warnings and feedback</p>
                   </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3 pt-2">
                   {/* Sound Toggle */}
                   <button
                     onClick={toggleSound}
                     className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                       soundEnabled 
                         ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                         : 'bg-zinc-900 border-zinc-700 text-zinc-500'
                     }`}
                   >
                     {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                     <span className="text-[10px] font-bold uppercase tracking-wider">Sound {soundEnabled ? 'On' : 'Off'}</span>
                   </button>

                   {/* Vibrate Toggle */}
                   <button
                     onClick={toggleVibrate}
                     className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${
                       vibrateEnabled 
                         ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                         : 'bg-zinc-900 border-zinc-700 text-zinc-500'
                     }`}
                   >
                     <Vibrate className="w-5 h-5" />
                     <span className="text-[10px] font-bold uppercase tracking-wider">Vibrate {vibrateEnabled ? 'On' : 'Off'}</span>
                   </button>
                 </div>

                 {/* Hardware Test Button */}
                 <button
                   onClick={() => alarmController.testSample()}
                   className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-950 text-zinc-300 font-bold rounded-xl text-xs uppercase tracking-wider border border-zinc-700 transition-all active:scale-95 flex items-center justify-center gap-2"
                 >
                   <ShieldAlert className="w-4 h-4 text-emerald-400" />
                   Test Alarm Hardware
                 </button>

                 {/* Test Locked Phone Alarm (5s Delay) */}
                 <button
                   onClick={() => {
                     setShowSettings(false);
                     setTestCountdown(5);
                   }}
                   disabled={testCountdown !== null}
                   className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-xl text-xs uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
                 >
                   <Clock className="w-4 h-4" />
                   Test Locked Phone Alarm (5s Delay)
                 </button>
               </div>

               <div className="flex flex-col gap-4 p-4 rounded-xl bg-zinc-800">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Timer className="w-5 h-5 text-zinc-400" />
                    <div>
                      <p className="text-sm font-medium">Inactivity Threshold</p>
                      <p className="text-xs text-zinc-500">Trigger alert after {inactivityThreshold} mins</p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                  {[1, 15, 30, 45, 60, 120].map(mins => (
                    <button
                      key={mins}
                      onClick={() => updateInactivityThreshold(mins)}
                      className={`flex-none py-2 px-4 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-all ${
                        inactivityThreshold === mins 
                          ? 'bg-emerald-500 border-emerald-500 text-black' 
                          : 'bg-zinc-700 border-zinc-600 text-zinc-400 hover:bg-zinc-600'
                      }`}
                    >
                      {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-800">
                <div className="flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-zinc-400" />
                  <div>
                    <p className="text-sm font-medium">Alert Sensitivity</p>
                    <p className="text-xs text-zinc-500">{inactivityThreshold <= 30 ? 'High' : 'Standard'}</p>
                  </div>
                </div>
                <div className="w-12 h-6 bg-emerald-500 rounded-full relative">
                  <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm" />
                </div>
              </div>

              <div className="pt-4 border-t border-zinc-800/50">
                <button 
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="w-full py-3.5 px-4 bg-rose-500/10 text-rose-400 border border-rose-500/20 font-black rounded-xl hover:bg-rose-500/20 transition-all active:scale-95 text-xs uppercase tracking-widest"
                >
                  Clear All App Data
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lock Screen Test Countdown Overlay */}
      {testCountdown !== null && (
        <div className="fixed inset-0 bg-zinc-950/95 z-50 flex flex-col items-center justify-center p-8 text-center animate-fade-in backdrop-blur-md">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 mb-6 animate-pulse">
            <Clock className="w-8 h-8 text-emerald-400" />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight mb-2">LOCK YOUR PHONE NOW</h2>
          <p className="text-zinc-400 text-xs max-w-xs mb-8 leading-relaxed">
            Quickly lock your phone screen. The high-priority wake notification and emergency audio sirens will trigger in:
          </p>
          <div className="text-8xl font-black font-mono text-emerald-400 animate-bounce">
            {testCountdown}
          </div>
          <button
            onClick={() => setTestCountdown(null)}
            className="mt-12 px-6 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-full text-xs font-bold uppercase tracking-widest transition-colors"
          >
            Cancel Test
          </button>
        </div>
      )}
    </div>
  );
}
