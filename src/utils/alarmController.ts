import { Haptics } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';

class AlarmController {
  private audioContext: AudioContext | null = null;
  private oscillator1: OscillatorNode | null = null;
  private oscillator2: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private pulseInterval: any = null;
  private vibrationInterval: any = null;
  private isPlaying = false;

  private initAudio() {
    if (!this.audioContext) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.audioContext = new AudioCtx();
      }
    }
    // Resume context if suspended (browser security)
    if (this.audioContext && this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
  }

  /**
   * Starts the pulsing dual-tone emergency alarm sound.
   */
  public startSound() {
    const isSoundEnabled = localStorage.getItem('guardian_pulse_sound_enabled') !== 'false';
    if (!isSoundEnabled) return;

    try {
      this.initAudio();
      if (!this.audioContext) return;

      if (this.isPlaying) return;
      this.isPlaying = true;

      // Pulse interval (e.g. 500ms beep, 500ms silence)
      let beepState = false;

      const triggerBeep = () => {
        if (!this.audioContext || !this.isPlaying) return;

        if (beepState) {
          // Stop current beep
          this.stopOscillators();
        } else {
          // Start a pulsing dual-tone beep
          try {
            this.gainNode = this.audioContext.createGain();
            this.gainNode.gain.setValueAtTime(0.0, this.audioContext.currentTime);
            // Ramp up quickly to prevent clicks
            this.gainNode.gain.linearRampToValueAtTime(0.15, this.audioContext.currentTime + 0.05);

            // Create two slightly detuned oscillators to make an attention-grabbing warning sound (like a siren/horn)
            this.oscillator1 = this.audioContext.createOscillator();
            this.oscillator1.type = 'triangle'; // triangle is smoother than square but sharper than sine
            this.oscillator1.frequency.setValueAtTime(880, this.audioContext.currentTime); // High A

            this.oscillator2 = this.audioContext.createOscillator();
            this.oscillator2.type = 'sawtooth';
            this.oscillator2.frequency.setValueAtTime(883, this.audioContext.currentTime); // Detuned slight chorus effect

            // Low-pass filter to make it pleasant but highly audible
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(1500, this.audioContext.currentTime);

            // Connect nodes
            this.oscillator1.connect(this.gainNode);
            this.oscillator2.connect(this.gainNode);
            this.gainNode.connect(filter);
            filter.connect(this.audioContext.destination);

            this.oscillator1.start();
            this.oscillator2.start();
          } catch (e) {
            console.error('Failed to play beep oscillators:', e);
          }
        }
        beepState = !beepState;
      };

      // Trigger first beep immediately
      triggerBeep();
      this.pulseInterval = setInterval(triggerBeep, 600);
    } catch (e) {
      console.error('Failed to start alarm audio context:', e);
    }
  }

  private stopOscillators() {
    try {
      if (this.oscillator1) {
        this.oscillator1.stop();
        this.oscillator1.disconnect();
        this.oscillator1 = null;
      }
      if (this.oscillator2) {
        this.oscillator2.stop();
        this.oscillator2.disconnect();
        this.oscillator2 = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
    } catch (e) {
      // Ignore errors if already stopped
    }
  }

  /**
   * Starts the physical vibration loop.
   */
  public startVibration() {
    const isVibrateEnabled = localStorage.getItem('guardian_pulse_vibrate_enabled') !== 'false';
    if (!isVibrateEnabled) return;

    if (this.vibrationInterval) return;

    const performVibration = async () => {
      try {
        if (Capacitor.isNativePlatform()) {
          // Native vibration
          await Haptics.vibrate({ duration: 500 });
        } else if ('vibrate' in navigator) {
          // Web fallback
          navigator.vibrate(500);
        }
      } catch (e) {
        console.warn('Vibration API not supported or blocked:', e);
      }
    };

    // Vibrate immediately, then every 1200ms
    performVibration();
    this.vibrationInterval = setInterval(performVibration, 1200);
  }

  /**
   * Stops both sound and vibration.
   */
  public stopAll() {
    this.isPlaying = false;
    
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }

    if (this.vibrationInterval) {
      clearInterval(this.vibrationInterval);
      this.vibrationInterval = null;
    }

    this.stopOscillators();

    // Stop vibration
    try {
      if ('vibrate' in navigator) {
        navigator.vibrate(0);
      }
    } catch (e) {
      // Ignore
    }
  }

  /**
   * Sample 1-second test run for hardware testing in the settings panel.
   */
  public testSample() {
    this.stopAll();

    const isSoundEnabled = localStorage.getItem('guardian_pulse_sound_enabled') !== 'false';
    const isVibrateEnabled = localStorage.getItem('guardian_pulse_vibrate_enabled') !== 'false';

    try {
      this.initAudio();
      
      if (isSoundEnabled && this.audioContext) {
        const testGain = this.audioContext.createGain();
        testGain.gain.setValueAtTime(0.0, this.audioContext.currentTime);
        testGain.gain.linearRampToValueAtTime(0.12, this.audioContext.currentTime + 0.05);
        testGain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.9);

        const testOsc = this.audioContext.createOscillator();
        testOsc.type = 'triangle';
        testOsc.frequency.setValueAtTime(880, this.audioContext.currentTime);
        testOsc.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.8);

        testOsc.connect(testGain);
        testGain.connect(this.audioContext.destination);

        testOsc.start();
        testOsc.stop(this.audioContext.currentTime + 1.0);
      }

      if (isVibrateEnabled) {
        if (Capacitor.isNativePlatform()) {
          Haptics.vibrate({ duration: 300 });
        } else if ('vibrate' in navigator) {
          navigator.vibrate(300);
        }
      }
    } catch (e) {
      console.error('Failed to trigger sample:', e);
    }
  }
}

export const alarmController = new AlarmController();
