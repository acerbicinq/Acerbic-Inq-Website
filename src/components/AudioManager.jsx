import { useEffect, useState, useRef } from 'preact/hooks';
import * as Tone from 'tone';

export default function AudioManager({ children }) {
  const [audioContext, setAudioContext] = useState(null);
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const audioManagerRef = useRef(null);

  useEffect(() => {
    // Initialize audio context and settings
    const initAudio = async () => {
      try {
        // Get saved settings from localStorage
        const savedAutoplay = localStorage.getItem('audioAutoplayEnabled');
        if (savedAutoplay !== null) {
          setAutoplayEnabled(JSON.parse(savedAutoplay));
        }

        // Create audio context through Tone.js
        if (Tone.context.state === 'suspended') {
          console.log('Audio context is suspended, waiting for user interaction');
        }
        setAudioContext(Tone.context);
      } catch (error) {
        console.error('Failed to initialize audio:', error);
      }
    };

    initAudio();

    // Listen for first user interaction
    const handleUserInteraction = async () => {
      if (!userHasInteracted) {
        setUserHasInteracted(true);
        try {
          await Tone.start();
          console.log('Audio context started after user interaction');
        } catch (error) {
          console.error('Failed to start audio context:', error);
        }
      }
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [userHasInteracted]);

  const toggleAutoplay = () => {
    const newValue = !autoplayEnabled;
    setAutoplayEnabled(newValue);
    localStorage.setItem('audioAutoplayEnabled', JSON.stringify(newValue));
  };

  // Provide audio context to child components
  audioManagerRef.current = {
    audioContext,
    autoplayEnabled,
    userHasInteracted,
    toggleAutoplay,
    playAudio: async (url, options = {}) => {
      if (!userHasInteracted && !autoplayEnabled) {
        console.log('Cannot play audio: user has not interacted yet');
        return null;
      }

      try {
        await Tone.start();
        const player = new Tone.Player(url).toDestination();
        
        if (options.volume !== undefined) {
          player.volume.value = options.volume;
        }
        
        await Tone.loaded();
        
        if (autoplayEnabled || userHasInteracted) {
          player.start();
        }
        
        return player;
      } catch (error) {
        console.error('Failed to play audio:', error);
        return null;
      }
    }
  };

  return (
    <div data-audio-manager>
      {children}
    </div>
  );
}

// Export a hook to access the audio manager
export function useAudioManager() {
  const audioManager = document.querySelector('[data-audio-manager]');
  return audioManager?._audioManagerRef?.current || null;
}