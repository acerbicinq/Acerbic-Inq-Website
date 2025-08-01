import { useState, useRef, useEffect } from 'preact/hooks';

export default function SpotifyEmbed({ 
  spotifyUrl, 
  fallbackAudioUrl, 
  title, 
  artist,
  album,
  duration,
  coverArt 
}) {
  const [useSpotify, setUseSpotify] = useState(true);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  // Extract Spotify track ID from URL
  const getSpotifyTrackId = (url) => {
    if (!url) return null;
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const spotifyTrackId = getSpotifyTrackId(spotifyUrl);
  const spotifyEmbedUrl = spotifyTrackId 
    ? `https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0`
    : null;

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (e) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const width = rect.width;
      const percentage = clickX / width;
      const newTime = percentage * audioRef.current.duration;
      audioRef.current.currentTime = newTime;
    }
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleLoadedData = () => setAudioLoaded(true);

      audio.addEventListener('play', handlePlay);
      audio.addEventListener('pause', handlePause);
      audio.addEventListener('loadeddata', handleLoadedData);
      audio.addEventListener('timeupdate', handleTimeUpdate);

      return () => {
        audio.removeEventListener('play', handlePlay);
        audio.removeEventListener('pause', handlePause);
        audio.removeEventListener('loadeddata', handleLoadedData);
        audio.removeEventListener('timeupdate', handleTimeUpdate);
      };
    }
  }, [useSpotify]);

  return (
    <div class="spotify-embed">
      <div class="embed-header">
        <div class="track-info">
          <h4 class="track-title">{title}</h4>
          <p class="track-artist">{artist} {album && `• ${album}`}</p>
          {duration && <span class="track-duration">{duration}</span>}
        </div>
        
        <div class="embed-toggle">
          <button 
            class={`toggle-btn ${useSpotify ? 'active' : ''}`}
            onClick={() => setUseSpotify(true)}
            disabled={!spotifyEmbedUrl}
            title="Use Spotify embed"
          >
            🎵 Spotify
          </button>
          <button 
            class={`toggle-btn ${!useSpotify ? 'active' : ''}`}
            onClick={() => setUseSpotify(false)}
            disabled={!fallbackAudioUrl}
            title="Use fallback audio player"
          >
            🎧 Audio
          </button>
        </div>
      </div>

      <div class="embed-content">
        {useSpotify && spotifyEmbedUrl ? (
          <div class="spotify-iframe-container">
            <iframe 
              src={spotifyEmbedUrl}
              width="100%" 
              height="152" 
              frameBorder="0" 
              allowtransparency="true" 
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
              loading="lazy"
              title={`Spotify player for ${title} by ${artist}`}
            ></iframe>
          </div>
        ) : fallbackAudioUrl ? (
          <div class="fallback-player">
            <div class="player-container">
              {coverArt && (
                <img 
                  src={coverArt} 
                  alt={`Cover art for ${title}`}
                  class="track-cover"
                />
              )}
              
              <div class="player-controls">
                <button 
                  class="play-pause-btn"
                  onClick={togglePlayPause}
                  disabled={!audioLoaded}
                >
                  {isPlaying ? '⏸️' : '▶️'}
                </button>
                
                <div class="progress-container">
                  <div class="progress-bar" onClick={handleSeek}>
                    <div 
                      class="progress-fill"
                      style={{ 
                        width: audioRef.current ? 
                          `${(currentTime / audioRef.current.duration) * 100}%` : '0%' 
                      }}
                    ></div>
                  </div>
                  
                  <div class="time-display">
                    <span>{formatTime(currentTime)}</span>
                    {audioRef.current && (
                      <span>/ {formatTime(audioRef.current.duration || 0)}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <audio 
              ref={audioRef}
              src={fallbackAudioUrl}
              preload="metadata"
              crossOrigin="anonymous"
            />
          </div>
        ) : (
          <div class="no-audio">
            <p>No audio source available</p>
          </div>
        )}
      </div>

      <style jsx>{`
        .spotify-embed {
          background: rgba(255, 255, 255, 0.95);
          border-radius: 12px;
          padding: 16px;
          margin: 12px 0;
          border: 1px solid rgba(0, 0, 0, 0.1);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .embed-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
          gap: 16px;
        }

        .track-info {
          flex: 1;
        }

        .track-title {
          margin: 0 0 4px 0;
          font-size: 1.1rem;
          font-weight: 600;
          color: #333;
        }

        .track-artist {
          margin: 0;
          font-size: 0.9rem;
          color: #666;
        }

        .track-duration {
          font-size: 0.8rem;
          color: #888;
          background: #f0f0f0;
          padding: 2px 6px;
          border-radius: 4px;
          display: inline-block;
          margin-top: 4px;
        }

        .embed-toggle {
          display: flex;
          gap: 4px;
          background: #f5f5f5;
          border-radius: 8px;
          padding: 2px;
        }

        .toggle-btn {
          background: transparent;
          border: none;
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.2s ease;
          color: #666;
        }

        .toggle-btn:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.8);
        }

        .toggle-btn.active {
          background: #007acc;
          color: white;
        }

        .toggle-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .embed-content {
          min-height: 152px;
        }

        .spotify-iframe-container {
          border-radius: 8px;
          overflow: hidden;
        }

        .fallback-player {
          background: #f8f9fa;
          border-radius: 8px;
          padding: 16px;
          min-height: 120px;
          display: flex;
          align-items: center;
        }

        .player-container {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
        }

        .track-cover {
          width: 80px;
          height: 80px;
          border-radius: 6px;
          object-fit: cover;
          flex-shrink: 0;
        }

        .player-controls {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
        }

        .play-pause-btn {
          background: #007acc;
          border: none;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 1.2rem;
          transition: background 0.2s ease;
          flex-shrink: 0;
        }

        .play-pause-btn:hover:not(:disabled) {
          background: #005a9e;
        }

        .play-pause-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .progress-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .progress-bar {
          width: 100%;
          height: 6px;
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
          cursor: pointer;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: #007acc;
          border-radius: 3px;
          transition: width 0.1s ease;
        }

        .time-display {
          font-size: 0.8rem;
          color: #666;
          display: flex;
          gap: 4px;
        }

        .no-audio {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 120px;
          color: #666;
          font-style: italic;
        }

        @media (max-width: 768px) {
          .embed-header {
            flex-direction: column;
            gap: 12px;
          }

          .embed-toggle {
            align-self: flex-start;
          }

          .player-container {
            flex-direction: column;
            text-align: center;
            gap: 12px;
          }

          .track-cover {
            width: 100px;
            height: 100px;
          }

          .player-controls {
            flex-direction: column;
            gap: 8px;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}