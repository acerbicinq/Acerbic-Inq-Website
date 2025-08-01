import { useEffect, useRef, useState } from 'preact/hooks';
import WaveSurfer from 'wavesurfer.js';
import { 
  SpotifyIcon, 
  AppleMusicIcon, 
  YouTubeMusicIcon, 
  BandcampIcon, 
  SoundCloudIcon,
  SyncedLyricsIcon,
  StaticLyricsIcon,
  PlayIcon,
  PauseIcon,
  SkipBackIcon,
  SkipForwardIcon
} from './StreamingIcons.jsx';

export default function WaveSurferPlayer({ 
  tracks = [], // Array of track objects
  albumTitle,
  artist, 
  coverArt,
  streamingLinks = []
}) {
  const waveformRef = useRef(null);
  const wavesurfer = useRef(null);
  const preloadedTracks = useRef(new Map()); // Store preloaded WaveSurfer instances
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.7);
  const [lyricsMode, setLyricsMode] = useState('hidden'); // 'hidden', 'synced', 'static'
  const [currentLyricIndex, setCurrentLyricIndex] = useState(-1);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [preloadProgress, setPreloadProgress] = useState(new Map()); // Track preload progress
  const [allTracksLoaded, setAllTracksLoaded] = useState(false);
  const [globalLoading, setGlobalLoading] = useState(true);

  // Get current track data
  const currentTrack = tracks[currentTrackIndex] || {};
  const { 
    audioUrl, 
    title, 
    trackNumber, 
    lyrics, 
    syncedLyrics,
    trackStreamingLinks = []
  } = currentTrack;

  // Preload all tracks on mount
  useEffect(() => {
    if (!tracks || tracks.length === 0) return;

    const preloadTrack = async (track, index) => {
      if (!track.audioUrl || preloadedTracks.current.has(index)) return;

      try {
        // Create a hidden container for preloading
        const hiddenContainer = document.createElement('div');
        hiddenContainer.style.display = 'none';
        document.body.appendChild(hiddenContainer);

        const preloadInstance = WaveSurfer.create({
          container: hiddenContainer,
          waveColor: 'transparent',
          progressColor: 'transparent',
          height: 1,
          backend: 'WebAudio',
          mediaControls: false
        });

        preloadInstance.on('ready', () => {
          setPreloadProgress(prev => new Map(prev).set(index, 100));
          preloadedTracks.current.set(index, preloadInstance);
          console.log(`Track ${index + 1} preloaded - ${preloadedTracks.current.size}/${tracks.length} tracks ready`);
          
          // Check if all tracks are preloaded
          if (preloadedTracks.current.size === tracks.length) {
            console.log('🚀 All tracks preloaded! Revealing player interface.');
            setAllTracksLoaded(true);
            setGlobalLoading(false);
          }
        });

        preloadInstance.on('error', (error) => {
          console.warn(`Failed to preload track ${index + 1}:`, error);
          document.body.removeChild(hiddenContainer);
        });

        preloadInstance.load(track.audioUrl);
        setPreloadProgress(prev => new Map(prev).set(index, 0));

      } catch (error) {
        console.warn(`Error preloading track ${index + 1}:`, error);
      }
    };

    // Start preloading ALL tracks for instant switching
    tracks.forEach((track, index) => {
      // Add a small delay between preloads to avoid overwhelming the network
      setTimeout(() => preloadTrack(track, index), index * 300);
    });

    return () => {
      // Clean up all preloaded instances
      preloadedTracks.current.forEach(async (instance, index) => {
        try {
          if (instance) {
            // Stop playback if active
            if (instance.isPlaying && instance.isPlaying()) {
              instance.pause();
            }
            
            // Wait briefly for operations to complete
            await new Promise(resolve => setTimeout(resolve, 20));
            
            // Remove event listeners
            instance.un('ready');
            instance.un('error');
            
            // Destroy instance
            if (instance.destroy) {
              instance.destroy();
            }
          }
        } catch (error) {
          console.warn(`Preload cleanup warning for track ${index} (non-critical):`, error.message);
        }
      });
      preloadedTracks.current.clear();
    };
  }, [tracks]);

  useEffect(() => {
    if (!waveformRef.current || !audioUrl) return;

    // Cleanup function to safely destroy WaveSurfer
    const cleanup = async () => {
      if (wavesurfer.current) {
        try {
          // Stop playback first
          if (wavesurfer.current.isPlaying && wavesurfer.current.isPlaying()) {
            wavesurfer.current.pause();
          }
          
          // Wait a small amount to let any pending operations complete
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Remove all event listeners before destroying
          wavesurfer.current.un('ready');
          wavesurfer.current.un('play');
          wavesurfer.current.un('pause');
          wavesurfer.current.un('audioprocess');
          wavesurfer.current.un('error');
          
          // Then destroy
          wavesurfer.current.destroy();
          wavesurfer.current = null;
        } catch (error) {
          // Silently handle cleanup errors - they're not critical
          console.warn('WaveSurfer cleanup warning (non-critical):', error.message);
          wavesurfer.current = null;
        }
      }
    };

    // Destroy existing instance if changing tracks
    const initializePlayer = async () => {
      await cleanup();

      // Always create the visible player
      wavesurfer.current = WaveSurfer.create({
        container: waveformRef.current,
        waveColor: 'var(--waveform-bg)',
        progressColor: 'var(--waveform-progress)',
        cursorColor: 'var(--player-accent)',
        barWidth: 2,
        barRadius: 1,
        responsive: true,
        height: 80,
        normalize: true,
        backend: 'WebAudio',
        mediaControls: false
      });

      // Check if we have a preloaded instance for this track
      const preloadedInstance = preloadedTracks.current.get(currentTrackIndex);
      
      if (preloadedInstance) {
        // Use preloaded instance - should load very quickly from cache
        console.log(`Using preloaded instance for track ${currentTrackIndex + 1} - instant loading`);
        setIsLoading(true);
        setIsPlaying(false);
        setCurrentTime(0);
        wavesurfer.current.load(audioUrl);
      } else {
        // Fallback: still loading this track in background
        console.log(`Track ${currentTrackIndex + 1} still preloading - normal load`);
        setIsLoading(true);
        setIsPlaying(false);
        setCurrentTime(0);
        wavesurfer.current.load(audioUrl);
      }

      // Event listeners
      wavesurfer.current.on('ready', () => {
        setIsLoading(false);
        setDuration(wavesurfer.current.getDuration());
        wavesurfer.current.setVolume(volume);
      });

      wavesurfer.current.on('play', () => setIsPlaying(true));
      wavesurfer.current.on('pause', () => setIsPlaying(false));
      
      wavesurfer.current.on('audioprocess', () => {
        const time = wavesurfer.current.getCurrentTime();
        setCurrentTime(time);
        
        // Update synced lyrics
        if (syncedLyrics && lyricsMode === 'synced') {
          const currentIndex = syncedLyrics.findIndex((lyric, index) => {
            const nextLyric = syncedLyrics[index + 1];
            return time >= lyric.start && (!nextLyric || time < nextLyric.start);
          });
          setCurrentLyricIndex(currentIndex);
        }
      });

      wavesurfer.current.on('error', (error) => {
        console.error('WaveSurfer error:', error);
        setIsLoading(false);
      });
    };

    // Initialize the player
    initializePlayer();

    return () => {
      cleanup().catch(err => console.warn('Cleanup error:', err.message));
    };
  }, [audioUrl, volume, syncedLyrics, lyricsMode, currentTrackIndex]);

  const switchTrack = (trackIndex) => {
    if (trackIndex >= 0 && trackIndex < tracks.length && trackIndex !== currentTrackIndex) {
      // Stop current track
      if (wavesurfer.current && wavesurfer.current.isPlaying && wavesurfer.current.isPlaying()) {
        wavesurfer.current.pause();
      }

      // Check if track is preloaded
      const preloadedInstance = preloadedTracks.current.get(trackIndex);
      
      if (preloadedInstance) {
        // Instant switch for preloaded tracks
        console.log(`Switching to preloaded track ${trackIndex + 1}`);
        setIsLoading(false);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(preloadedInstance.getDuration());
        setCurrentLyricIndex(-1);
        setCurrentTrackIndex(trackIndex);
      } else {
        // Normal loading for non-preloaded tracks
        setIsLoading(true);
        setIsPlaying(false);
        setCurrentTime(0);
        setDuration(0);
        setCurrentLyricIndex(-1);
        setCurrentTrackIndex(trackIndex);
      }
    }
  };

  const togglePlayPause = () => {
    if (wavesurfer.current) {
      wavesurfer.current.playPause();
    }
  };

  const skipBackward = () => {
    if (wavesurfer.current) {
      const currentTime = wavesurfer.current.getCurrentTime();
      wavesurfer.current.seekTo(Math.max(0, currentTime - 10) / duration);
    }
  };

  const skipForward = () => {
    if (wavesurfer.current) {
      const currentTime = wavesurfer.current.getCurrentTime();
      wavesurfer.current.seekTo(Math.min(duration, currentTime + 10) / duration);
    }
  };

  const handleVolumeChange = (e) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (wavesurfer.current) {
      wavesurfer.current.setVolume(newVolume);
    }
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const toggleLyricsMode = () => {
    const modes = ['hidden', 'synced', 'static'];
    const currentIndex = modes.indexOf(lyricsMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    
    // Skip synced if no synced lyrics available
    if (nextMode === 'synced' && !syncedLyrics) {
      setLyricsMode('static');
    } else if (nextMode === 'static' && !lyrics) {
      setLyricsMode('hidden');
    } else {
      setLyricsMode(nextMode);
    }
  };

  // Show loading screen until all tracks are preloaded
  if (globalLoading) {
    return (
      <div class="wavesurfer-player">
        <div class="global-loading">
          <div class="loading-content">
            <div class="loading-spinner"></div>
            <h3>Loading Music Player</h3>
            <p>Preloading all tracks for smooth playback...</p>
            <div class="loading-progress">
              <div class="progress-text">
                {preloadedTracks.current.size} of {tracks.length} tracks loaded
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill"
                  style={{ width: `${(preloadedTracks.current.size / tracks.length) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div class="wavesurfer-player">
      <div class="player-container">
        {/* Album Art & Info */}
        <div class="player-left">
          {coverArt && (
            <img 
              src={coverArt} 
              alt={`Cover art for ${title}`}
              class="album-cover"
            />
          )}
          <div class="streaming-platforms">
            {streamingLinks.map((link, index) => (
              <a 
                key={index}
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer"
                class="streaming-icon"
                title={`Listen on ${link.platform}`}
              >
                {getStreamingIcon(link.platform)}
              </a>
            ))}
          </div>
        </div>

        {/* Main Player */}
        <div class="player-main">
          <div class="track-info">
            <h3 class="track-title">{title || 'No track selected'}</h3>
            <p class="track-artist">{albumTitle} by {artist}</p>
            <span class="track-number">Track {trackNumber || currentTrackIndex + 1}/{tracks.length}</span>
          </div>

          {/* Waveform */}
          <div class="waveform-container">
            <div ref={waveformRef} class="waveform"></div>
          </div>

          {/* Controls */}
          <div class="player-controls">
            <div class="time-display">
              {formatTime(currentTime)}
            </div>
            
            <div class="control-buttons">
              <button onClick={skipBackward} class="control-btn">
                <SkipBackIcon size={20} />
              </button>
              
              <button 
                onClick={togglePlayPause} 
                class="play-pause-btn"
                disabled={isLoading}
              >
                {isLoading ? '...' : isPlaying ? <PauseIcon size={24} /> : <PlayIcon size={24} />}
              </button>
              
              <button onClick={skipForward} class="control-btn">
                <SkipForwardIcon size={20} />
              </button>
              
              <button 
                onClick={toggleLyricsMode} 
                class={`lyrics-btn ${lyricsMode !== 'hidden' ? 'active' : ''}`}
                title="Toggle lyrics"
              >
                {lyricsMode === 'synced' ? (
                  <SyncedLyricsIcon size={20} />
                ) : lyricsMode === 'static' ? (
                  <StaticLyricsIcon size={20} />
                ) : (
                  <StaticLyricsIcon size={20} />
                )}
              </button>
            </div>

            <div class="time-display">
              {formatTime(duration)}
            </div>
          </div>
        </div>
      </div>

      {/* Album Tracks */}
      {tracks && tracks.length > 1 && (
        <div class="album-tracks">
          <h4>On This Album:</h4>
          <div class="track-list">
            {tracks.map((track, index) => {
              const progress = preloadProgress.get(index);
              const isPreloaded = preloadedTracks.current.has(index);
              
              return (
                <button 
                  key={index}
                  class={`track-btn ${index === currentTrackIndex ? 'active' : ''}`}
                  onClick={() => switchTrack(index)}
                  title={`${track.title} - Ready for instant playback`}
                >
                  <span class="track-num">{track.trackNumber || index + 1}</span>
                  <span class="track-name">
                    {track.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lyrics Display */}
      {lyricsMode !== 'hidden' && (
        <div class="lyrics-container">
          {lyricsMode === 'synced' && syncedLyrics ? (
            <div class="synced-lyrics">
              {syncedLyrics.map((lyric, index) => (
                <p 
                  key={index}
                  class={`lyric-line ${index === currentLyricIndex ? 'active' : ''}`}
                >
                  {lyric.text}
                </p>
              ))}
            </div>
          ) : lyricsMode === 'static' && lyrics ? (
            <div class="static-lyrics">
              <pre>{lyrics}</pre>
            </div>
          ) : (
            <p class="no-lyrics">No lyrics available</p>
          )}
        </div>
      )}

      <style jsx>{`
        .wavesurfer-player {
          background: var(--player-bg);
          color: var(--player-text);
          border-radius: 12px;
          padding: 20px;
          margin: 20px 0;
          font-family: inherit;
          min-height: 400px;
        }

        .global-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 350px;
          text-align: center;
        }

        .loading-content h3 {
          margin: 10px 0;
          color: var(--player-text);
          font-size: 1.5rem;
        }

        .loading-content p {
          margin: 10px 0 20px 0;
          color: var(--player-secondary);
        }

        .loading-spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-left: 4px solid var(--player-accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px auto;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-progress {
          width: 300px;
          margin: 20px auto 0 auto;
        }

        .progress-text {
          font-size: 0.9rem;
          color: var(--player-secondary);
          margin-bottom: 8px;
        }

        .progress-bar {
          width: 100%;
          height: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 4px;
          overflow: hidden;
        }

        .progress-fill {
          height: 100%;
          background: var(--player-accent);
          transition: width 0.3s ease;
          border-radius: 4px;
        }

        .player-container {
          display: grid;
          grid-template-columns: 250px 1fr;
          gap: 30px;
          align-items: center;
        }

        .player-left {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
        }

        .album-cover {
          width: 200px;
          height: 200px;
          border-radius: 8px;
          object-fit: cover;
        }

        .streaming-platforms {
          display: flex;
          gap: 8px;
        }

        .streaming-icon {
          width: 32px;
          height: 32px;
          background: var(--player-secondary);
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          color: var(--player-text);
          transition: background 0.2s ease;
        }

        .streaming-icon:hover {
          background: var(--player-accent);
        }

        .player-main {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .track-info {
          text-align: center;
        }

        .track-title {
          margin: 0;
          font-size: 1.5rem;
          color: var(--player-text);
          word-wrap: break-word;
          hyphens: auto;
        }

        .track-artist {
          margin: 5px 0;
          color: var(--player-secondary);
          word-wrap: break-word;
        }

        .track-number {
          font-size: 0.9rem;
          color: var(--player-accent);
        }

        .waveform-container {
          position: relative;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          padding: 10px;
          margin: 10px 0;
        }

        .waveform {
          width: 100%;
        }

        .loading-overlay {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: var(--player-accent);
        }

        .player-controls {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 10px;
          gap: 20px;
        }

        .control-buttons {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .control-btn, .play-pause-btn, .lyrics-btn {
          background: none;
          border: none;
          color: var(--player-text);
          font-size: 1.2rem;
          cursor: pointer;
          padding: 8px;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .control-btn:hover, .lyrics-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .play-pause-btn {
          font-size: 2rem;
          background: var(--player-accent);
          width: 50px;
          height: 50px;
        }

        .play-pause-btn:hover {
          background: var(--waveform-progress);
        }

        .play-pause-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .lyrics-btn.active {
          background: var(--player-accent);
        }

        .time-display {
          font-size: 0.9rem;
          color: var(--player-secondary);
          min-width: 50px;
          text-align: center;
        }

        .album-tracks {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        .tracks-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 10px;
        }

        .album-tracks h4 {
          margin: 0;
          color: var(--player-accent);
        }

        .all-loaded-indicator {
          font-size: 0.8em;
          color: #4CAF50;
          background: rgba(76, 175, 80, 0.1);
          padding: 4px 8px;
          border-radius: 12px;
          border: 1px solid #4CAF50;
        }

        .track-list {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .track-btn {
          background: #9A829A;
          border: none;
          color: #303030;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.9rem;
          font-weight: 500;
          transition: all 0.2s ease;
        }

        .track-btn:hover {
          background: #807080;
        }

        .track-btn.active {
          background: #303030;
          color: #F1D4A1;
        }

        .track-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .track-btn.loading {
          background: #666;
          color: #ccc;
        }

        .track-btn.preloaded {
          border: 2px solid #4CAF50;
        }

        .preload-indicator {
          margin-left: 4px;
          color: #4CAF50;
          font-size: 0.8em;
        }

        .track-num {
          font-weight: bold;
        }

        .track-name {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          flex: 1;
        }

        .lyrics-container {
          margin-top: 20px;
          padding: 20px;
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          max-height: 300px;
          overflow-y: auto;
        }

        .synced-lyrics .lyric-line {
          margin: 8px 0;
          padding: 4px 8px;
          border-radius: 4px;
          transition: all 0.3s ease;
          opacity: 0.6;
        }

        .synced-lyrics .lyric-line.active {
          background: var(--player-accent);
          opacity: 1;
          transform: scale(1.02);
        }

        .static-lyrics pre {
          white-space: pre-wrap;
          font-family: inherit;
          margin: 0;
          line-height: 1.6;
        }

        .no-lyrics {
          text-align: center;
          color: var(--player-secondary);
          fontStyle: italic;
        }

        @media (max-width: 1024px) {
          .player-container {
            grid-template-columns: 200px 1fr;
            gap: 20px;
          }

          .album-cover {
            width: 160px;
            height: 160px;
          }
        }

        @media (max-width: 768px) {
          .player-container {
            grid-template-columns: 1fr;
            text-align: center;
          }

          .album-cover {
            width: 200px;
            height: 200px;
            margin: 0 auto;
          }

          .control-buttons {
            gap: 10px;
          }

          .track-list {
            justify-content: center;
          }

          .player-controls {
            flex-wrap: wrap;
            gap: 10px;
          }

          .time-display {
            min-width: 45px;
          }
        }
      `}</style>
    </div>
  );
}

// Helper functions
function getStreamingIcon(platform) {
  const platformLower = platform.toLowerCase();
  
  switch (platformLower) {
    case 'spotify':
      return <SpotifyIcon size={20} />;
    case 'apple-music':
    case 'apple music':
      return <AppleMusicIcon size={20} />;
    case 'youtube-music':
    case 'youtube music':
      return <YouTubeMusicIcon size={20} />;
    case 'bandcamp':
      return <BandcampIcon size={20} />;
    case 'soundcloud':
      return <SoundCloudIcon size={20} />;
    default:
      return <PlayIcon size={20} />;
  }
}