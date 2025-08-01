import { useState, useEffect, useRef } from 'preact/hooks';
import * as Tone from 'tone';

export default function ToneAudioPlayer({ 
  src, 
  className = '', 
  preview = false,
  autoplay = false,
  children 
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);
  const playerRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Load settings
    const savedAutoplay = localStorage.getItem('audioAutoplayEnabled');
    if (savedAutoplay !== null) {
      setAutoplayEnabled(JSON.parse(savedAutoplay));
    }

    // Listen for settings changes
    const handleStorageChange = (e) => {
      if (e.key === 'audioAutoplayEnabled') {
        setAutoplayEnabled(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Check for user interaction
    const handleUserInteraction = () => {
      setUserHasInteracted(true);
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      
      if (playerRef.current) {
        playerRef.current.dispose();
      }
    };
  }, []);

  const createPlayer = async () => {
    if (playerRef.current) {
      playerRef.current.dispose();
    }

    try {
      setIsLoading(true);
      await Tone.start();
      
      // Create a simple HTML5 audio element first to test CORS
      const testAudio = new Audio();
      testAudio.crossOrigin = "anonymous";
      
      const player = new Tone.Player({
        url: src,
        onload: () => {
          console.log('Audio loaded successfully');
          setIsLoading(false);
        },
        onerror: (error) => {
          console.error('Error loading audio:', error);
          setIsLoading(false);
          // Fallback to basic HTML5 audio if Tone.js fails
          createFallbackPlayer();
        }
      }).toDestination();

      // Add some effects for better sound
      const reverb = new Tone.Reverb(0.3).toDestination();
      const eq = new Tone.EQ3().connect(reverb);
      player.connect(eq);

      playerRef.current = player;
      return player;
    } catch (error) {
      console.error('Failed to create player:', error);
      setIsLoading(false);
      return createFallbackPlayer();
    }
  };

  const createFallbackPlayer = () => {
    const audio = new Audio(src);
    audio.crossOrigin = "anonymous";
    audio.preload = "metadata";
    
    const fallbackPlayer = {
      start: () => {
        audio.currentTime = 0;
        return audio.play();
      },
      stop: () => {
        audio.pause();
        audio.currentTime = 0;
      },
      dispose: () => {
        audio.pause();
        audio.src = '';
      },
      loaded: true
    };
    
    playerRef.current = fallbackPlayer;
    setIsLoading(false);
    return fallbackPlayer;
  };

  const playAudio = async () => {
    if (!userHasInteracted && !autoplayEnabled) {
      console.log('Cannot play audio: user interaction required');
      return;
    }

    try {
      if (!playerRef.current) {
        await createPlayer();
      }

      if (playerRef.current && playerRef.current.loaded) {
        if (isPlaying) {
          playerRef.current.stop();
          setIsPlaying(false);
        } else {
          playerRef.current.start();
          setIsPlaying(true);
          
          // Auto-stop for previews after 30 seconds
          if (preview) {
            setTimeout(() => {
              if (playerRef.current && isPlaying) {
                playerRef.current.stop();
                setIsPlaying(false);
              }
            }, 30000);
          }
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const stopAudio = () => {
    if (playerRef.current && isPlaying) {
      playerRef.current.stop();
      setIsPlaying(false);
    }
  };

  const handleMouseEnter = async () => {
    if (preview) {
      if (autoplayEnabled && userHasInteracted) {
        await playAudio();
      } else {
        // Visual feedback that interaction is needed
        if (containerRef.current) {
          const playIcon = containerRef.current.querySelector('.play-icon');
          if (playIcon) {
            playIcon.style.transform = 'scale(1.3)';
            playIcon.style.color = '#ff6b6b';
          }
        }
      }
    }
  };

  const handleMouseLeave = () => {
    if (preview) {
      stopAudio();
      // Reset visual feedback
      if (containerRef.current) {
        const playIcon = containerRef.current.querySelector('.play-icon');
        if (playIcon) {
          playIcon.style.transform = 'scale(1)';
          playIcon.style.color = '#007acc';
        }
      }
    }
  };

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    playAudio();
  };

  return (
    <div 
      ref={containerRef}
      className={`tone-audio-player ${className} ${isPlaying ? 'playing' : ''} ${isLoading ? 'loading' : ''}`}
      onMouseEnter={preview ? handleMouseEnter : undefined}
      onMouseLeave={preview ? handleMouseLeave : undefined}
      onClick={handleClick}
    >
      {children || (
        <div class="default-player">
          <button class="play-button" disabled={isLoading}>
            {isLoading ? '...' : isPlaying ? '⏸' : '▶'}
          </button>
          <span class="player-status">
            {isLoading ? 'Loading...' : isPlaying ? 'Playing' : 'Play'}
          </span>
        </div>
      )}

      <style>{`
        .tone-audio-player {
          cursor: pointer;
          transition: all 0.3s ease;
          user-select: none;
        }

        .tone-audio-player:hover {
          transform: scale(1.02);
        }

        .tone-audio-player.loading {
          opacity: 0.7;
          cursor: wait;
        }

        .tone-audio-player.playing {
          color: #007acc;
        }

        .default-player {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: #f0f0f0;
          border-radius: 8px;
          border: 2px solid transparent;
          transition: all 0.3s ease;
        }

        .tone-audio-player:hover .default-player {
          background: #e0e0e0;
          border-color: #007acc;
        }

        .tone-audio-player.playing .default-player {
          background: #007acc;
          color: white;
        }

        .play-button {
          background: none;
          border: none;
          font-size: 24px;
          cursor: pointer;
          color: inherit;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .play-button:hover {
          background: rgba(0, 0, 0, 0.1);
        }

        .play-button:disabled {
          cursor: not-allowed;
          opacity: 0.5;
        }

        .player-status {
          font-size: 14px;
          font-weight: 500;
        }

        @media (max-width: 768px) {
          .tone-audio-player:hover {
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}