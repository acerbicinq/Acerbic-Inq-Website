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

// Multi-format lyrics parser
function parseLyricsData(rawData, formatHint = 'auto') {
  if (!rawData || typeof rawData !== 'string') {
    return { static: null, synced: null };
  }

  const trimmedData = rawData.trim();
  
  // Auto-detect format or use hint
  let format = formatHint || 'auto';  // Default to 'auto' if formatHint is null/undefined
  if (format === 'auto') {
    if (trimmedData.startsWith('[') && trimmedData.includes(']') && /\[\d{2}:\d{2}\.\d{2}\]/.test(trimmedData)) {
      format = 'lrc';
    } else if (trimmedData.startsWith('[{') && trimmedData.endsWith('}]')) {
      format = 'json';
    } else if (/^\d+\s*[\r\n]+\d{2}:\d{2}:\d{2},\d{3}\s*-->\s*\d{2}:\d{2}:\d{2},\d{3}/.test(trimmedData)) {
      format = 'srt';
    } else {
      format = 'text';
    }
  }

  console.log('Lyrics: Detected format:', format);

  try {
    switch (format) {
      case 'lrc':
        return parseLRCFormat(trimmedData);
      case 'json':
        return parseJSONFormat(trimmedData);
      case 'srt':
        return parseSRTFormat(trimmedData);
      case 'text':
      default:
        return { static: trimmedData, synced: null };
    }
  } catch (error) {
    console.warn('Lyrics: Parse error, falling back to static text:', error);
    return { static: trimmedData, synced: null };
  }
}

// Parse LRC format: [00:12.34] Line of lyrics
function parseLRCFormat(data) {
  const lines = data.split('\n');
  const syncedLyrics = [];
  const staticLines = [];

  lines.forEach(line => {
    const match = line.match(/^\[(\d{2}):(\d{2})\.(\d{2})\]\s*(.*)$/);
    if (match) {
      const [, minutes, seconds, centiseconds, text] = match;
      const timeInSeconds = parseInt(minutes) * 60 + parseInt(seconds) + parseInt(centiseconds) / 100;
      syncedLyrics.push({ time: timeInSeconds, text: text.trim() });
      staticLines.push(text.trim());
    }
  });

  return {
    static: staticLines.join('\n'),
    synced: syncedLyrics.length > 0 ? syncedLyrics : null
  };
}

// Parse JSON format: [{"time": "00:12.34", "text": "Line of lyrics"}]
function parseJSONFormat(data) {
  const parsed = JSON.parse(data);
  if (!Array.isArray(parsed)) {
    throw new Error('JSON must be an array');
  }

  const syncedLyrics = [];
  const staticLines = [];

  parsed.forEach(item => {
    if (item.time && item.text) {
      const timeInSeconds = parseTimeString(item.time);
      syncedLyrics.push({ time: timeInSeconds, text: item.text });
      staticLines.push(item.text);
    }
  });

  return {
    static: staticLines.join('\n'),
    synced: syncedLyrics.length > 0 ? syncedLyrics : null
  };
}

// Parse SRT format: 1\n00:00:12,340 --> 00:00:15,670\nLine of lyrics
function parseSRTFormat(data) {
  // Handle different line endings (Windows \r\n, Unix \n, old Mac \r)
  const normalizedData = data.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const blocks = normalizedData.split(/\n\s*\n/);
  
  const syncedLyrics = [];
  const staticLines = [];

  blocks.forEach((block, index) => {
    const lines = block.trim().split('\n');
    if (lines.length >= 3) {
      const timeLine = lines[1];
      const textLines = lines.slice(2);
      
      const match = timeLine.match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
      if (match) {
        const [, h1, m1, s1, ms1] = match;
        const timeInSeconds = parseInt(h1) * 3600 + parseInt(m1) * 60 + parseInt(s1) + parseInt(ms1) / 1000;
        const text = textLines.join(' ');
        syncedLyrics.push({ time: timeInSeconds, text });
        staticLines.push(text);
      }
    }
  });

  return {
    static: staticLines.join('\n'),
    synced: syncedLyrics.length > 0 ? syncedLyrics : null
  };
}

// Helper function to parse time strings like "00:12.34" or "00:00:12.340"
function parseTimeString(timeStr) {
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    // MM:SS.ss format
    const [minutes, secondsWithMs] = parts;
    const [seconds, ms = '0'] = secondsWithMs.split('.');
    return parseInt(minutes) * 60 + parseInt(seconds) + parseInt(ms.padEnd(3, '0')) / 1000;
  } else if (parts.length === 3) {
    // HH:MM:SS.sss format
    const [hours, minutes, secondsWithMs] = parts;
    const [seconds, ms = '0'] = secondsWithMs.split('.');
    return parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds) + parseInt(ms.padEnd(3, '0')) / 1000;
  }
  return 0;
}

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
  const lyricsContainerRef = useRef(null);
  
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
    lyricsData = {},
    trackStreamingLinks = []
  } = currentTrack;

  // Parse lyrics data from multiple formats
  const [parsedLyrics, setParsedLyrics] = useState({ static: null, synced: null });
  
  useEffect(() => {
    console.log('Lyrics: Track changed, checking lyrics data:', lyricsData);
    console.log('Lyrics: lyricsData.lyricsData:', lyricsData?.lyricsData);
    console.log('Lyrics: lyricsData.lyricsFile:', lyricsData?.lyricsFile);
    
    if (lyricsData?.lyricsData) {
      console.log('Lyrics: Found lyrics text data, parsing...');
      const parsed = parseLyricsData(lyricsData.lyricsData, lyricsData.formatHint);
      console.log('Lyrics: Parsed result:', parsed);
      setParsedLyrics(parsed);
    } else if (lyricsData?.lyricsFile?.asset?.url) {
      console.log('Lyrics: Found lyrics file, fetching...');
      fetch(lyricsData.lyricsFile.asset.url)
        .then(response => response.text())
        .then(fileContent => {
          console.log('Lyrics: File content loaded:', fileContent.substring(0, 200) + '...');
          const parsed = parseLyricsData(fileContent, lyricsData.formatHint);
          console.log('Lyrics: Parsed result from file:', parsed);
      if (parsed.synced) {
        console.log('Lyrics: First 3 synced entries:', parsed.synced.slice(0, 3));
      }
          console.log('Lyrics: Setting state with parsed lyrics, synced count:', parsed.synced ? parsed.synced.length : 'null');
          setParsedLyrics(parsed);
        })
        .catch(error => {
          console.error('Lyrics: Error loading lyrics file:', error);
          setParsedLyrics({ static: null, synced: null });
        });
    } else {
      console.log('Lyrics: No lyrics data or file found');
      setParsedLyrics({ static: null, synced: null });
    }
  }, [lyricsData, currentTrackIndex]);

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
          console.log(`Preload check: ${preloadedTracks.current.size}/${tracks.length} tracks ready`);
          if (preloadedTracks.current.size === tracks.length) {
            console.log('🚀 All tracks preloaded! Revealing player interface.');
            setAllTracksLoaded(true);
            setGlobalLoading(false);
          }
        });

        preloadInstance.on('error', (error) => {
          console.warn(`Failed to preload track ${index + 1}:`, error);
          document.body.removeChild(hiddenContainer);
          // Still count as "loaded" even if failed, so player can show
          setPreloadProgress(prev => new Map(prev).set(index, 100));
          if (preloadedTracks.current.size >= tracks.length - 1) {
            console.log('🚀 All tracks processed (some may have failed)! Revealing player interface.');
            setAllTracksLoaded(true);
            setGlobalLoading(false);
          }
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

    // Fallback timeout - show player after 10 seconds regardless
    const fallbackTimeout = setTimeout(() => {
      console.log('⚠️ Fallback timeout reached - showing player interface anyway');
      setAllTracksLoaded(true);
      setGlobalLoading(false);
    }, 10000);

    return () => {
      // Clear the fallback timeout
      clearTimeout(fallbackTimeout);
      
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
          if (wavesurfer.current.isPlaying && typeof wavesurfer.current.isPlaying === 'function' && wavesurfer.current.isPlaying()) {
            wavesurfer.current.pause();
          }
          
          // Wait a small amount to let any pending operations complete
          await new Promise(resolve => setTimeout(resolve, 50));
          
          // Remove all event listeners before destroying - check if methods exist
          if (typeof wavesurfer.current.un === 'function') {
            wavesurfer.current.un('ready');
            wavesurfer.current.un('play');
            wavesurfer.current.un('pause');
            wavesurfer.current.un('audioprocess');
            wavesurfer.current.un('error');
          }
          
          // Then destroy
          if (typeof wavesurfer.current.destroy === 'function') {
            wavesurfer.current.destroy();
          }
          wavesurfer.current = null;
        } catch (error) {
          // Silently handle cleanup errors - they're not critical
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
        if (parsedLyrics.synced && lyricsMode === 'synced') {
          const currentIndex = parsedLyrics.synced.findIndex((lyric, index) => {
            const nextLyric = parsedLyrics.synced[index + 1];
            return time >= lyric.time && (!nextLyric || time < nextLyric.time);
          });
          if (currentIndex !== currentLyricIndex) {
            console.log('Lyrics: Current line changed to index:', currentIndex, 'time:', time);
          }
          setCurrentLyricIndex(currentIndex);
          
          // Auto-scroll to current lyric
          if (currentIndex >= 0 && lyricsContainerRef.current) {
            const lyricsContainer = lyricsContainerRef.current;
            const activeLine = lyricsContainer.querySelector('.lyric-line.active');
            if (activeLine) {
              const containerRect = lyricsContainer.getBoundingClientRect();
              const lineRect = activeLine.getBoundingClientRect();
              const containerScrollTop = lyricsContainer.scrollTop;
              const relativeTop = lineRect.top - containerRect.top + containerScrollTop;
              const containerHeight = lyricsContainer.clientHeight;
              
              // Scroll to center the active line in the container
              const targetScrollTop = relativeTop - (containerHeight / 2) + (lineRect.height / 2);
              
              lyricsContainer.scrollTo({
                top: Math.max(0, targetScrollTop),
                behavior: 'smooth'
              });
            }
          }
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
  }, [audioUrl, volume, currentTrackIndex, lyricsMode, parsedLyrics]);

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
    if (nextMode === 'synced' && !parsedLyrics.synced) {
      setLyricsMode('static');
    } else if (nextMode === 'static' && !parsedLyrics.static) {
      setLyricsMode('hidden');
    } else {
      setLyricsMode(nextMode);
    }
  };

  // Disable preloading screen for now - show player immediately
  if (false && globalLoading) {
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
          {lyricsMode === 'synced' && parsedLyrics.synced ? (
            <div class="synced-lyrics" ref={lyricsContainerRef}>
              {parsedLyrics.synced.map((lyric, index) => (
                <p 
                  key={index}
                  class={`lyric-line ${
                    index === currentLyricIndex ? 'active' : 
                    index < currentLyricIndex ? 'played' : ''
                  }`}
                >
                  {lyric.text}
                </p>
              ))}
            </div>
          ) : lyricsMode === 'static' && parsedLyrics.static ? (
            <div class="static-lyrics">
              <pre>{parsedLyrics.static}</pre>
            </div>
          ) : (
            <p class="no-lyrics">No lyrics available for this track</p>
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
          color: inherit;
        }

        .synced-lyrics .lyric-line.active {
          background: #303030;
          color: #F1D4A1;
          opacity: 1;
          transform: scale(1.02);
        }

        .synced-lyrics .lyric-line.played {
          color: #303030;
          opacity: 1;
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