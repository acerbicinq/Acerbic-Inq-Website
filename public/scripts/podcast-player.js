function formatTimestamp(seconds) {
  seconds = Math.floor(seconds);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h > 0) {
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  } else if (m >= 10) {
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  } else {
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}

  document.addEventListener('DOMContentLoaded', function() {
    console.log('Phase 1 Podcast player initializing...');
    
    
    // Get episode data
    const episodeDataScript = document.getElementById('episode-data');
    const episodeData = episodeDataScript ? JSON.parse(episodeDataScript.textContent) : { chapters: [] };
    
    console.log('Episode data loaded:', episodeData);
    
    // Transcript parsing function
    function parseTranscriptText() {
      const transcriptText = episodeData.transcriptText;
      if (!transcriptText) return [];
      
      const entries = [];
      const lines = transcriptText.split('\n');
      
      for (const line of lines) {
        if (line.trim() === '') continue;
        
        // Support multiple formats:
        // [MM:SS] Speaker: Text
        // [MM:SS] Text (no speaker)
        // MM:SS - Speaker: Text  
        // MM:SS - Text (no speaker)
        // MM:SS Speaker: Text
        // MM:SS Text (no speaker)
        
        const patterns = [
          /^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*([^:]+):\s*(.+)$/,     // [MM:SS] Speaker: Text
          /^\[(\d{1,2}:\d{2}(?::\d{2})?)\]\s*(.+)$/,               // [MM:SS] Text (no speaker)
          /^(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*([^:]+):\s*(.+)$/,    // MM:SS - Speaker: Text
          /^(\d{1,2}:\d{2}(?::\d{2})?)\s*-\s*(.+)$/,               // MM:SS - Text (no speaker)
          /^(\d{1,2}:\d{2}(?::\d{2})?)\s+([^:]+):\s*(.+)$/,        // MM:SS Speaker: Text
          /^(\d{1,2}:\d{2}(?::\d{2})?)\s+(.+)$/,                   // MM:SS Text (no speaker)
        ];
        
        let match = null;
        let patternIndex = -1;
        for (let i = 0; i < patterns.length; i++) {
          match = line.match(patterns[i]);
          if (match) {
            patternIndex = i;
            break;
          }
        }
        
        if (match) {
          let timestamp, speaker, text;
          
          // Handle different pattern matches based on capture groups
          if (patternIndex === 1 || patternIndex === 3 || patternIndex === 5) {
            // No speaker patterns: timestamp, text
            [, timestamp, text] = match;
            speaker = '';
          } else {
            // Speaker patterns: timestamp, speaker, text
            [, timestamp, speaker, text] = match;
          }
          
          entries.push({
            timestamp: timestamp.trim(),
            speaker: speaker ? speaker.trim() : '',
            text: text.trim()
          });
          
          console.log(`Parsed: ${timestamp.trim()} | "${speaker ? speaker.trim() : 'No speaker'}" | ${text.trim().substring(0, 50)}...`);
        } else {
          // If no timestamp pattern, treat as continuation of previous entry
          if (entries.length > 0) {
            entries[entries.length - 1].text += ' ' + line.trim();
          }
        }
      }
      
      console.log('Parsed transcript entries:', entries.length);
      return entries;
    }
    
    // Parse transcript from text if needed
    if (!episodeData.transcript || episodeData.transcript.length === 0) {
      episodeData.transcript = parseTranscriptText();
    }
    


    // Basic Player Controller
    let currentMediaPlayer = null;
    // Make media player globally accessible for transcript sync
    window.currentMediaPlayer = null;
    let currentChapterIndex = 0;
    let lastSyncTime = 0;
    
    // Get media elements
    const mediaBtns = document.querySelectorAll('.media-btn');
    const audioContainer = document.querySelector('.audio-player-container');
    const videoContainer = document.querySelector('.video-player-container');
    const audio = document.getElementById('mainAudio');
    const video = document.getElementById('mainVideo');
    
    console.log('Media elements found:', {
      audio: !!audio,
      video: !!video,
      audioContainer: !!audioContainer,
      videoContainer: !!videoContainer,
      mediaBtns: mediaBtns.length
    });
    
    // Set initial media player (prefer audio if available)
    if (audio) {
      currentMediaPlayer = audio;
      window.currentMediaPlayer = audio;
      console.log('Set audio as initial player');
      
      // Set initial audio-only view since audio is default
      const episodeContainer = document.querySelector('.episode-container');
      if (episodeContainer) {
        episodeContainer.classList.add('audio-only-view');
        console.log('Initial audio-only view enabled - YouTube iframes hidden');
        console.log('Initial episode container classes:', episodeContainer.className);
        console.log('Initial YouTube containers found:', document.querySelectorAll('.youtube-embed-container').length);
      }
    } else if (video) {
      currentMediaPlayer = video;
      window.currentMediaPlayer = video;
      console.log('Set video as initial player');
    }
    
    // Media type switching with time sync
    mediaBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const type = this.dataset.type;
        console.log('Switching to media type:', type);
        
        // Store current time and playback state
        let wasPlaying = false;
        let currentTime = 0;
        
        if (currentMediaPlayer) {
          wasPlaying = !currentMediaPlayer.paused;
          currentTime = currentMediaPlayer.currentTime;
          if (wasPlaying) {
            currentMediaPlayer.pause();
          }
        }
        
        // Update button states
        mediaBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        
        // Toggle audio-only view class on episode container
        const episodeContainer = document.querySelector('.episode-container');
        if (type === 'audio') {
          episodeContainer.classList.add('audio-only-view');
          console.log('Enabled audio-only view - hiding YouTube iframes');
          console.log('Episode container classes:', episodeContainer.className);
          console.log('YouTube containers found:', document.querySelectorAll('.youtube-embed-container').length);
        } else {
          episodeContainer.classList.remove('audio-only-view');
          console.log('Disabled audio-only view - showing YouTube iframes');
          console.log('Episode container classes:', episodeContainer.className);
        }
        
        // Notify transcript system of mode change
        if (window.transcriptSync) {
          console.log('Notifying transcript system of mode change to:', type);
          window.transcriptSync.checkDisplayMode();
          // Reconnect to the new media player after a short delay to ensure media switch is complete
          setTimeout(() => {
            window.transcriptSync.reconnectMediaPlayer();
          }, 100);
        }
        
        
        // Switch media containers and players
        if (type === 'audio' && audio && audioContainer) {
          audioContainer.classList.add('active');
          if (videoContainer) videoContainer.classList.remove('active');
          currentMediaPlayer = audio;
      window.currentMediaPlayer = audio;
          
          // Sync time and resume playback if needed
          audio.currentTime = currentTime;
          if (wasPlaying) {
            audio.play().catch(e => console.log('Audio play failed:', e));
          }
          console.log('Switched to audio player at time:', currentTime);
          
        } else if (type === 'video' && video && videoContainer) {
          if (audioContainer) audioContainer.classList.remove('active');
          videoContainer.classList.add('active');
          currentMediaPlayer = video;
      window.currentMediaPlayer = video;
          
          // Sync time and resume playback if needed
          video.currentTime = currentTime;
          if (wasPlaying) {
            video.play().catch(e => console.log('Video play failed:', e));
          }
          console.log('Switched to video player at time:', currentTime);
        }
      });
    });
    
    // Chapter Management
    function parseTimeToSeconds(timeString) {
      if (!timeString) return 0;
      const parts = timeString.split(':').map(Number);
      if (parts.length === 2) {
        return parts[0] * 60 + parts[1]; // MM:SS
      } else if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2]; // HH:MM:SS
      }
      return 0;
    }
    
    // Seamless Audio Playback System
    const ENABLE_SEAMLESS_INTERLUDES = true; // Set to true to enable seamless interludes
    let isPlayingInterlude = false;
    let interludeQueue = [];
    let currentInterludeIndex = 0;
    let pendingChapterStart = null;
    let userPaused = false;
    
    let lastTriggeredChapter = -1; // Prevent multiple triggers
    
    function checkForChapterEnd() {
      if (!ENABLE_SEAMLESS_INTERLUDES || !currentMediaPlayer || episodeData.chapters.length === 0 || isPlayingInterlude || userPaused) {
        return;
      }
      
      const currentTime = currentMediaPlayer.currentTime;
      
      // Find which chapter we're currently in
      let currentChapterData = null;
      let currentChapterIdx = -1;
      
      for (let i = 0; i < episodeData.chapters.length; i++) {
        const chapter = episodeData.chapters[i];
        const startTime = parseTimeToSeconds(chapter.startTime);
        const endTime = parseTimeToSeconds(chapter.endTime);
        
        if (currentTime >= startTime && currentTime <= endTime) {
          currentChapterData = chapter;
          currentChapterIdx = i;
          break;
        }
      }
      
      // If we're in a chapter that has interludes and we're near the end
      if (currentChapterData && 
          currentChapterData.interludeTracks && 
          currentChapterData.interludeTracks.length > 0 &&
          lastTriggeredChapter !== currentChapterIdx) {
        
        const startTime = parseTimeToSeconds(currentChapterData.startTime);
        const endTime = parseTimeToSeconds(currentChapterData.endTime);
        const chapterDuration = endTime - startTime;
        const timeIntoChapter = currentTime - startTime;
        
        // Trigger when we're 95% through the chapter or within 0.5 seconds of the end
        if (timeIntoChapter >= (chapterDuration * 0.95) || currentTime >= (endTime - 0.5)) {
          console.log(`🎵 TRIGGER: Chapter ${currentChapterIdx + 1} ending at ${currentTime.toFixed(1)}s (${timeIntoChapter.toFixed(1)}s into chapter)`);
          console.log(`Chapter data:`, currentChapterData);
          console.log(`Has interludeTracks:`, !!(currentChapterData.interludeTracks && currentChapterData.interludeTracks.length));
          if (currentChapterData.interludeTracks) {
            console.log(`Number of interlude tracks:`, currentChapterData.interludeTracks.length);
          }
          lastTriggeredChapter = currentChapterIdx;
          startInterludeSequence(currentChapterIdx);
        }
      }
    }
    
    function startInterludeSequence(chapterIndex) {
      const chapter = episodeData.chapters[chapterIndex];
      if (!chapter.interludeTracks || chapter.interludeTracks.length === 0) {
        console.log('No interludes found for chapter', chapterIndex + 1);
        return;
      }
      
      console.log(`Starting interlude sequence for chapter ${chapterIndex + 1}`);
      
      // Pause the main podcast
      if (currentMediaPlayer && !currentMediaPlayer.paused) {
        currentMediaPlayer.pause();
      }
      
      isPlayingInterlude = true;
      currentInterludeIndex = 0;
      
      // Set up the next chapter start time
      const nextChapter = episodeData.chapters[chapterIndex + 1];
      if (nextChapter) {
        pendingChapterStart = parseTimeToSeconds(nextChapter.startTime);
        console.log(`Will resume podcast at chapter ${chapterIndex + 2}: ${nextChapter.title} (${pendingChapterStart}s)`);
      } else {
        console.log('This is the last chapter, no resume point set');
        pendingChapterStart = null;
      }
      
      // Build interlude queue - prioritize YouTube, fallback to audio
      interludeQueue = [];
      const interludeContainer = document.getElementById(`interlude-tracks-${chapterIndex}`);
      console.log(`Looking for interlude container: interlude-tracks-${chapterIndex}`);
      console.log(`Interlude container found:`, !!interludeContainer);
      
      if (interludeContainer) {
        // Try to build YouTube queue first - simplified check
        if (window.youtubeInterludeSystem) {
          console.log('📺 Building YouTube interlude queue');
          
          const youtubeTracks = [];
          
          // Extract YouTube URLs from the chapter's interlude tracks
          chapter.interludeTracks.forEach((track, index) => {
            console.log(`Processing track ${index}:`, track);
            console.log(`Track title: "${track.title}"`);
            console.log(`Track songTitle: "${track.songTitle}"`);
            console.log(`Track artist: "${track.artist}"`);
            console.log(`All track keys:`, Object.keys(track));
            console.log(`Track streamingLinks:`, track.streamingLinks);
            
            const youtubeLink = track.streamingLinks?.find(link => 
              link.platform === 'youtube-music' || link.platform === 'youtube'
            );
            
            console.log(`Found YouTube link:`, youtubeLink);
            
            if (youtubeLink && youtubeLink.url) {
              const trackData = {
                type: 'youtube',
                url: youtubeLink.url,
                title: track.title || track.songTitle, // Use title first, fallback to songTitle
                artist: track.artist,
                streamingLinks: track.streamingLinks
              };
              
              youtubeTracks.push(trackData);
              console.log(`✅ Added YouTube track ${index}:`, trackData);
            } else {
              console.log(`❌ No valid YouTube link for track ${index}`);
            }
          });
          
          if (youtubeTracks.length > 0) {
            interludeQueue = youtubeTracks;
            console.log(`✅ Using ${interludeQueue.length} YouTube tracks for interludes`);
          }
        }
        
        // Fallback to audio elements if no YouTube tracks
        if (interludeQueue.length === 0) {
          console.log('🎧 Building fallback audio queue');
          const fallbackAudios = interludeContainer.querySelectorAll('.fallback-audio-section audio');
          interludeQueue = Array.from(fallbackAudios).map(audio => ({
            type: 'audio',
            element: audio,
            title: 'Fallback Audio'
          }));
          console.log(`Found ${interludeQueue.length} fallback audio tracks`);
        }
      } else {
        console.log(`❌ Could not find interlude container with ID: interlude-tracks-${chapterIndex}`);
      }
      
      if (interludeQueue.length === 0) {
        console.log('❌ No interlude tracks found, ending interlude sequence immediately');
        endInterludeSequence();
        return;
      }
      
      // Visual feedback
      showInterludeStatus(`🎵 Playing interlude music (Track 1 of ${interludeQueue.length})`);
      
      // Start first interlude track
      playNextInterlude();
    }
    
    function playNextInterlude() {
      if (userPaused) {
        console.log('User paused, stopping interlude sequence');
        return;
      }
      
      if (currentInterludeIndex >= interludeQueue.length) {
        // All interludes finished, resume podcast
        endInterludeSequence();
        return;
      }
      
      const track = interludeQueue[currentInterludeIndex];
      if (!track) {
        currentInterludeIndex++;
        playNextInterlude();
        return;
      }
      
      console.log(`Playing interlude ${currentInterludeIndex + 1} of ${interludeQueue.length} (${track.type}): ${track.title || 'Unknown'}`);
      
      // Update status
      const statusMessage = track.type === 'youtube' 
        ? `📺 Playing from YouTube (Track ${currentInterludeIndex + 1} of ${interludeQueue.length}): ${track.title} by ${track.artist}`
        : `🎧 Playing fallback audio (Track ${currentInterludeIndex + 1} of ${interludeQueue.length})`;
      showInterludeStatus(statusMessage);
      
      if (track.type === 'youtube') {
        // Play YouTube track with detailed logging
        console.log('About to play YouTube track:', {
          title: track.title,
          artist: track.artist,
          url: track.url,
          streamingLinks: track.streamingLinks
        });
        
        window.playYouTubeInterlude(track).then(() => {
          console.log('YouTube track ended successfully, moving to next interlude');
          currentInterludeIndex++;
          setTimeout(() => {
            playNextInterlude();
          }, 500);
        }).catch((error) => {
          console.error(`Failed to play YouTube track: ${track.title || 'Unknown'}`, error);
          console.error('Track data:', track);
          // Fall back to next track
          currentInterludeIndex++;
          setTimeout(() => playNextInterlude(), 500);
        });
      } else {
        // Play fallback audio
        playFallbackInterlude(track);
      }
    }
    
    // YouTube interlude function is now handled in the YouTube script section
    
    function playFallbackInterlude(track) {
      const audio = track.element;
      
      // Set up event listener for when this track ends
      const handleEnded = () => {
        audio.removeEventListener('ended', handleEnded);
        currentInterludeIndex++;
        
        // Small delay before next track
        setTimeout(() => {
          playNextInterlude();
        }, 500);
      };
      
      audio.addEventListener('ended', handleEnded);
      audio.volume = 0.4; // Set reasonable volume
      
      // Play the interlude
      audio.play().catch((error) => {
        console.log(`Could not play fallback interlude ${currentInterludeIndex + 1}:`, error.message);
        // Skip to next track if this one fails
        currentInterludeIndex++;
        setTimeout(() => playNextInterlude(), 500);
      });
    }
    
    function endInterludeSequence() {
      console.log('Interlude sequence complete, resuming podcast...');
      
      isPlayingInterlude = false;
      interludeQueue = [];
      currentInterludeIndex = 0;
      
      // Resume podcast at next chapter
      if (pendingChapterStart !== null && currentMediaPlayer && !userPaused) {
        currentMediaPlayer.currentTime = pendingChapterStart;
        currentMediaPlayer.play().then(() => {
          console.log(`Resumed podcast at ${pendingChapterStart}s`);
          hideInterludeStatus();
        }).catch((error) => {
          console.log('Could not resume podcast:', error.message);
          hideInterludeStatus();
        });
      } else {
        hideInterludeStatus();
      }
      
      pendingChapterStart = null;
    }
    
    function showInterludeStatus(message) {
      let statusElement = document.getElementById('interlude-status');
      if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.id = 'interlude-status';
        statusElement.style.cssText = `
          position: fixed;
          top: 20px;
          right: 20px;
          background: #007acc;
          color: white;
          padding: 1rem;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 1000;
          font-weight: 500;
          max-width: 300px;
        `;
        document.body.appendChild(statusElement);
      }
      statusElement.textContent = message;
      statusElement.style.display = 'block';
    }
    
    function hideInterludeStatus() {
      const statusElement = document.getElementById('interlude-status');
      if (statusElement) {
        statusElement.style.display = 'none';
      }
    }
    
    function stopAllPlayback() {
      console.log('stopAllPlayback called');
      userPaused = true;
      
      // Stop any playing interlude first
      if (isPlayingInterlude && interludeQueue[currentInterludeIndex]) {
        const currentTrack = interludeQueue[currentInterludeIndex];
        
        if (currentTrack.type === 'youtube') {
          // Stop YouTube playback
          window.stopYouTubeInterlude();
        } else if (currentTrack.element && !currentTrack.element.paused) {
          // Stop fallback audio
          currentTrack.element.pause();
        }
      }
      
      hideInterludeStatus();
      console.log('All playback stopped by user');
    }
    
    function resumePlayback() {
      console.log('resumePlayback called, isPlayingInterlude:', isPlayingInterlude);
      userPaused = false;
      
      if (isPlayingInterlude) {
        // Resume interlude sequence
        console.log('Resuming interlude playback');
        showInterludeStatus(`🎵 Playing interlude music (Track ${currentInterludeIndex + 1} of ${interludeQueue.length})`);
        playNextInterlude();
      }
      // Don't manually play the main podcast here - let the browser's native controls handle it
    }
    
    function updateCurrentChapter() {
      if (!currentMediaPlayer || episodeData.chapters.length === 0 || isPlayingInterlude) {
        return;
      }
      
      const currentTime = currentMediaPlayer.currentTime;
      
      // Don't update too frequently
      if (Math.abs(currentTime - lastSyncTime) < 0.5) {
        return;
      }
      lastSyncTime = currentTime;
      
      // Find current chapter for highlighting
      let newChapterIndex = -1;
      for (let i = 0; i < episodeData.chapters.length; i++) {
        const chapter = episodeData.chapters[i];
        const startTime = parseTimeToSeconds(chapter.startTime);
        const endTime = parseTimeToSeconds(chapter.endTime);
        
        if (currentTime >= startTime && currentTime <= endTime) {
          newChapterIndex = i;
          break;
        }
      }
      
      // Update chapter highlighting and reset trigger when switching chapters
      if (newChapterIndex !== currentChapterIndex) {
        const chapterItems = document.querySelectorAll('.chapter-item');
        
        // Remove previous highlighting
        chapterItems.forEach(item => item.classList.remove('active'));
        
        // Add new highlighting
        if (newChapterIndex >= 0 && chapterItems[newChapterIndex]) {
          chapterItems[newChapterIndex].classList.add('active');
          console.log('Now in chapter:', episodeData.chapters[newChapterIndex].title);
        }
        
        // Reset trigger when moving to a new chapter
        lastTriggeredChapter = -1;
        currentChapterIndex = newChapterIndex;
      }
      
      // Only check for chapter end after chapter highlighting is updated (if enabled)
      if (ENABLE_SEAMLESS_INTERLUDES) {
        try {
          checkForChapterEnd();
        } catch (error) {
          console.error('Error in checkForChapterEnd:', error);
          // Disable interlude system if there's an error
          isPlayingInterlude = false;
        }
      }
    }
    
    // Chapter navigation buttons
    const jumpButtons = document.querySelectorAll('.jump-to-chapter');
    jumpButtons.forEach((button, index) => {
      button.addEventListener('click', function() {
        const startTime = parseTimeToSeconds(this.dataset.startTime);
        if (currentMediaPlayer) {
          currentMediaPlayer.currentTime = startTime;
          console.log(`Jumped to chapter ${index + 1} at ${startTime}s`);
          
          // Highlight the chapter immediately
          const chapterItems = document.querySelectorAll('.chapter-item');
          chapterItems.forEach(item => item.classList.remove('active'));
          if (chapterItems[index]) {
            chapterItems[index].classList.add('active');
          }
        }
      });
    });
    
    // Chapter item click navigation
    const chapterItems = document.querySelectorAll('.chapter-item');
    chapterItems.forEach((item, index) => {
      item.addEventListener('click', function() {
        const chapter = episodeData.chapters[index];
        if (chapter && currentMediaPlayer) {
          const startTime = parseTimeToSeconds(chapter.startTime);
          currentMediaPlayer.currentTime = startTime;
          console.log(`Clicked to chapter ${index + 1}: ${chapter.title}`);
        }
      });
    });
    
    // Add time update listeners for chapter and transcript tracking
    if (audio) {
      audio.addEventListener('timeupdate', handleTimeUpdate);
      audio.addEventListener('loadedmetadata', () => {
        console.log('Audio loaded, duration:', audio.duration);
      });
      
      // Hook into play/pause for seamless control (only if enabled)
      if (ENABLE_SEAMLESS_INTERLUDES) {
        audio.addEventListener('play', () => {
          console.log('Main audio play triggered');
          if (!isPlayingInterlude) { // Only resume if we're not in the middle of interludes
            resumePlayback();
          }
        });
        
        audio.addEventListener('pause', () => {
          console.log('Main audio pause triggered, isPlayingInterlude:', isPlayingInterlude);
          if (!isPlayingInterlude) { // Only stop if we're not transitioning to interludes
            stopAllPlayback();
          } else {
            console.log('Ignoring pause event - transitioning to interlude playback');
          }
        });
      }
    }
    if (video) {
      video.addEventListener('timeupdate', handleTimeUpdate);
      video.addEventListener('loadedmetadata', () => {
        console.log('Video loaded, duration:', video.duration);
      });
      
      // Hook into play/pause for seamless control (only if enabled)
      if (ENABLE_SEAMLESS_INTERLUDES) {
        video.addEventListener('play', () => {
          console.log('Main video play triggered');
          if (!isPlayingInterlude) { // Only resume if we're not in the middle of interludes
            resumePlayback();
          }
        });
        
        video.addEventListener('pause', () => {
          console.log('Main video pause triggered, isPlayingInterlude:', isPlayingInterlude);
          if (!isPlayingInterlude) { // Only stop if we're not transitioning to interludes
            stopAllPlayback();
          } else {
            console.log('Ignoring pause event - transitioning to interlude playback');
          }
        });
      }
    }
    
    // Transcript toggle
    const transcriptToggle = document.getElementById('showTranscript');
    const transcriptSection = document.querySelector('.transcript-section');
    
    if (transcriptToggle && transcriptSection) {
      transcriptToggle.addEventListener('change', function() {
        if (this.checked) {
          transcriptSection.style.display = 'block';
          console.log('Transcript shown');
        } else {
          transcriptSection.style.display = 'none';
          console.log('Transcript hidden');
        }
      });
    }
    
    // Interactive transcript functionality
    function updateTranscriptSync() {
      if (!currentMediaPlayer) return;
      
      const currentTime = currentMediaPlayer.currentTime;
      const transcriptEntries = document.querySelectorAll('.transcript-entry');
      
      if (transcriptEntries.length === 0) return;
      
      console.log(`Syncing transcript at ${currentTime.toFixed(1)}s`);
      
      // Find the current transcript entry
      let currentEntry = null;
      let bestMatch = null;
      let closestTime = -1;
      
      for (let i = 0; i < transcriptEntries.length; i++) {
        const entry = transcriptEntries[i];
        const timestamp = entry.dataset.timestamp;
        const entryTime = parseTimeToSeconds(timestamp);
        
        console.log(`Entry ${i}: ${timestamp} (${entryTime}s)`);
        
        // Find the entry that starts at or before current time
        if (entryTime <= currentTime) {
          if (entryTime > closestTime) {
            closestTime = entryTime;
            bestMatch = entry;
          }
        }
      }
      
      // If we're at the very beginning (less than first timestamp), show first entry
      if (!bestMatch && currentTime < 5) {
        bestMatch = transcriptEntries[0];
        console.log('Using first entry for beginning of episode');
      }
      
      currentEntry = bestMatch;
      
      // Update highlighting
      transcriptEntries.forEach(entry => entry.classList.remove('current'));
      if (currentEntry) {
        currentEntry.classList.add('current');
        console.log(`Highlighting: ${currentEntry.dataset.timestamp}`);
        
        // Auto-scroll to current entry if transcript is visible
        const transcriptSection = document.querySelector('.transcript-section');
        const transcriptContent = document.querySelector('.transcript-content');
        if (transcriptSection && transcriptSection.style.display !== 'none' && transcriptContent) {
          // Calculate position within the transcript container
          const entryTop = currentEntry.offsetTop;
          const containerHeight = transcriptContent.clientHeight;
          const scrollPosition = entryTop - (containerHeight / 4); // Position entry at top quarter of container
          
          transcriptContent.scrollTo({
            top: Math.max(0, scrollPosition),
            behavior: 'smooth'
          });
        }
      } else {
        console.log('No transcript entry found for current time');
      }
    }
    
    // Transcript timestamp navigation
    const timestampElements = document.querySelectorAll('.timestamp');
    timestampElements.forEach(timestamp => {
      timestamp.addEventListener('click', function() {
        const timeString = this.textContent;
        const seconds = parseTimeToSeconds(timeString);
        if (currentMediaPlayer) {
          currentMediaPlayer.currentTime = seconds;
          console.log(`Jumped to transcript time: ${timeString} (${seconds}s)`);
        }
      });
    });
    
    // Add transcript sync to time update listeners with throttling
    let lastTranscriptUpdate = 0;
    function handleTimeUpdate() {
      updateCurrentChapter();
      
      // Throttle transcript updates to every 0.5 seconds
      const now = Date.now();
      if (now - lastTranscriptUpdate > 500) {
        updateTranscriptSync();
        lastTranscriptUpdate = now;
      }
    }
    
    console.log('Phase 1 podcast player initialized - Basic playback with chapter navigation');
  });

  // YouTube Interlude System - Simple and effective
  let youtubeInterludeSystem = {
    currentYouTubePlayer: null,
    youtubeAPIReady: false,
    interludeQueue: [],
    currentInterludeIndex: 0,
    isPlayingInterlude: false,
    pendingChapterStart: null,
    userPaused: false
  };

  // Load YouTube IFrame API - simple approach
  function loadYouTubeAPI() {
    if (window.YT && window.YT.Player) {
      youtubeInterludeSystem.youtubeAPIReady = true;
      console.log('YouTube API already loaded');
      return;
    }

    window.onYouTubeIframeAPIReady = function() {
      youtubeInterludeSystem.youtubeAPIReady = true;
      console.log('YouTube IFrame API ready');
    };

    const script = document.createElement('script');
    script.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(script);
  }

  // Extract YouTube video ID from URL
  function getYouTubeVideoId(url) {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  }


  // Check if currently in video mode
  function isCurrentlyVideoMode() {
    const episodeContainer = document.querySelector('.episode-container');
    return episodeContainer && !episodeContainer.classList.contains('audio-only-view');
  }

  // Play YouTube interlude
  async function playYouTubeInterlude(track) {
    return new Promise((resolve, reject) => {
      console.log('=== YouTube Interlude Debug ===');
      console.log('Received track data:', track);
      console.log('Track title:', track.title);
      console.log('Track songTitle:', track.songTitle);
      console.log('Track artist:', track.artist);
      console.log('Track URL:', track.url);
      console.log('Track streamingLinks:', track.streamingLinks);
      
      if (!youtubeInterludeSystem.youtubeAPIReady) {
        console.error('YouTube API not ready');
        reject(new Error('YouTube API not ready'));
        return;
      }

      // Try multiple ways to find the YouTube URL
      let youtubeUrl = null;
      let videoId = null;
      
      // Method 1: Direct URL property
      if (track.url) {
        videoId = getYouTubeVideoId(track.url);
        if (videoId) {
          youtubeUrl = track.url;
          console.log('Found YouTube URL via direct URL property:', youtubeUrl);
        }
      }
      
      // Method 2: Find in streaming links
      if (!youtubeUrl && track.streamingLinks) {
        const youtubeLink = track.streamingLinks.find(link => 
          link.platform === 'youtube-music' || link.platform === 'youtube'
        );
        
        if (youtubeLink) {
          videoId = getYouTubeVideoId(youtubeLink.url);
          if (videoId) {
            youtubeUrl = youtubeLink.url;
            console.log('Found YouTube URL via streaming links:', youtubeUrl);
          }
        }
      }

      if (!youtubeUrl || !videoId) {
        console.error('No valid YouTube URL found for track');
        console.error('Track data:', track);
        reject(new Error('No YouTube link'));
        return;
      }

      const trackTitle = track.title || track.songTitle || 'Unknown Track';
      const trackArtist = track.artist || 'Unknown Artist';
      console.log(`Playing YouTube track: ${trackTitle} by ${trackArtist} (${videoId})`);

      // Determine if we should use visible or hidden player
      const isVideoMode = isCurrentlyVideoMode();
      console.log('Current mode:', isVideoMode ? 'video' : 'audio');

      let playerContainer;
      let playerConfig;

      if (isVideoMode) {
        // Find the corresponding YouTube embed container for this track
        const embedContainers = document.querySelectorAll('.youtube-embed-container');
        let targetContainer = null;
        
        for (const container of embedContainers) {
          const containerUrl = container.dataset.youtubeUrl;
          console.log('Checking container URL:', containerUrl, 'against track URL:', youtubeUrl);
          if (containerUrl && containerUrl === youtubeUrl) {
            targetContainer = container;
            console.log('Found matching container!', targetContainer);
            break;
          }
        }
        
        console.log('Total embed containers found:', embedContainers.length);
        console.log('Target container found:', !!targetContainer);

        if (targetContainer) {
          console.log('Using visible YouTube player in embed container');
          playerContainer = targetContainer;
          
          // Clear placeholder content
          targetContainer.innerHTML = '';
          
          playerConfig = {
            height: '100%',
            width: '100%',
            videoId: videoId,
            playerVars: {
              autoplay: 1,
              controls: 1,
              modestbranding: 1,
              rel: 0
            }
          };
        } else {
          console.log('No matching embed container found, falling back to hidden player');
          playerContainer = createHiddenPlayerContainer(trackTitle);
          playerConfig = getHiddenPlayerConfig(videoId);
        }
      } else {
        console.log('Using hidden YouTube player for audio mode');
        playerContainer = createHiddenPlayerContainer(trackTitle);
        playerConfig = getHiddenPlayerConfig(videoId);
      }

      // Destroy existing player properly
      if (youtubeInterludeSystem.currentYouTubePlayer) {
        try {
          console.log('Destroying previous YouTube player');
          youtubeInterludeSystem.currentYouTubePlayer.stopVideo();
          youtubeInterludeSystem.currentYouTubePlayer.destroy();
          youtubeInterludeSystem.currentYouTubePlayer = null;
        } catch (error) {
          console.warn('Error destroying previous player:', error);
          youtubeInterludeSystem.currentYouTubePlayer = null;
        }
        
        // Wait a moment for cleanup
        setTimeout(() => {}, 100);
      }

      // Create new YouTube player
      youtubeInterludeSystem.currentYouTubePlayer = new YT.Player(playerContainer, {
        ...playerConfig,
        events: {
          onReady: function(event) {
            console.log('YouTube player ready for:', trackTitle, '- starting playback');
            try {
              event.target.playVideo();
              console.log('playVideo() called successfully for:', trackTitle);
            } catch (error) {
              console.error('Error calling playVideo() for:', trackTitle, error);
              reject(error);
            }
          },
          onStateChange: function(event) {
            console.log('YouTube player state changed:', event.data, 'for track:', trackTitle);
            
            if (event.data === YT.PlayerState.ENDED) {
              console.log('YouTube track ended:', trackTitle);
              
              // If using visible player, restore placeholder
              if (isVideoMode && playerContainer.classList && playerContainer.classList.contains('youtube-embed-container')) {
                playerContainer.innerHTML = `
                  <div class="youtube-placeholder">
                    <div class="youtube-placeholder-content">
                      <span class="youtube-icon">▶</span>
                      <p>YouTube video will play here during interludes in video mode</p>
                    </div>
                  </div>
                `;
              }
              
              resolve();
            } else if (event.data === YT.PlayerState.PLAYING) {
              console.log('YouTube track playing:', trackTitle);
            } else if (event.data === YT.PlayerState.PAUSED && !youtubeInterludeSystem.userPaused) {
              console.log('YouTube track paused unexpectedly:', trackTitle);
            }
          },
          onError: function(event) {
            console.error('YouTube player error:', event.data);
            
            // If using visible player, restore placeholder
            if (isVideoMode && playerContainer.classList && playerContainer.classList.contains('youtube-embed-container')) {
              playerContainer.innerHTML = `
                <div class="youtube-placeholder">
                  <div class="youtube-placeholder-content">
                    <span class="youtube-icon">▶</span>
                    <p>YouTube video will play here during interludes in video mode</p>
                  </div>
                </div>
              `;
            }
            
            reject(new Error(`YouTube player error: ${event.data}`));
          }
        }
      });
    });
  }

  // Helper function to create hidden player container
  function createHiddenPlayerContainer(trackTitle) {
    const existingContainer = document.getElementById('youtube-interlude-player');
    if (existingContainer) {
      existingContainer.remove();
    }
    
    const playerContainer = document.createElement('div');
    playerContainer.id = 'youtube-interlude-player';
    playerContainer.style.cssText = 'position: fixed; top: -1000px; left: -1000px; width: 1px; height: 1px;';
    document.body.appendChild(playerContainer);
    console.log('Created fresh hidden player container for:', trackTitle);
    return playerContainer;
  }

  // Helper function to get hidden player config
  function getHiddenPlayerConfig(videoId) {
    return {
      height: '1',
      width: '1',
      videoId: videoId,
      playerVars: {
        autoplay: 1,
        controls: 0,
        disablekb: 1,
        fs: 0,
        modestbranding: 1,
        rel: 0,
        showinfo: 0
      }
    };
  }

  // Stop YouTube interlude
  function stopYouTubeInterlude() {
    if (youtubeInterludeSystem.currentYouTubePlayer) {
      try {
        youtubeInterludeSystem.currentYouTubePlayer.stopVideo();
        youtubeInterludeSystem.currentYouTubePlayer.destroy();
        youtubeInterludeSystem.currentYouTubePlayer = null;
      } catch (error) {
        console.warn('Error stopping YouTube player:', error);
      }
    }
  }

  // Update UI to show YouTube interlude status
  function updateInterludeUI() {
    const interludeSections = document.querySelectorAll('.interlude-section');
    console.log('Found interlude sections for YouTube:', interludeSections.length);
    
    interludeSections.forEach(section => {
      let statusElement = section.querySelector('.youtube-status');
      if (!statusElement) {
        statusElement = document.createElement('div');
        statusElement.className = 'youtube-status';
        statusElement.style.cssText = `
          margin-bottom: 0.5rem;
          padding: 0.5rem;
          border-radius: 6px;
          font-size: 0.9rem;
          font-weight: 500;
          background: rgba(255, 0, 0, 0.1);
          color: #ff0000;
          border: 1px solid #ff0000;
        `;
        section.insertBefore(statusElement, section.firstChild);
      }

      statusElement.innerHTML = '📺 YouTube interludes will auto-play between chapters';
    });
  }

  // Make functions globally available
  window.playYouTubeInterlude = playYouTubeInterlude;
  window.stopYouTubeInterlude = stopYouTubeInterlude;
  window.youtubeInterludeSystem = youtubeInterludeSystem;

  // Initialize YouTube system
  document.addEventListener('DOMContentLoaded', () => {
    console.log('YouTube interlude system initializing...');
    loadYouTubeAPI();
    updateInterludeUI();
  });

  // Multi-Format Transcript Parser and Sync System
  class MultiFormatTranscriptSync {
    constructor() {
      this.transcriptData = [];
      this.currentSegmentIndex = -1;
      this.isTranscriptVisible = false;
      this.mediaPlayer = null;
      this.transcriptContainer = null;
      this.subtitleOverlay = null;
      this.transcriptStatus = null;
      this.formatDetected = null;
      this.isVideoMode = false;
      this.rawTranscriptData = null;
      
      this.init();
    }

    init() {
      console.log('Transcript: Initializing Multi-Format Transcript Sync System...');
      
      // Get DOM elements
      const transcriptToggle = document.getElementById('transcript-toggle');
      this.transcriptContainer = document.getElementById('transcript-container');
      this.subtitleOverlay = document.getElementById('subtitle-overlay');
      this.transcriptStatus = document.querySelector('.transcript-status');
      this.formatDetected = document.getElementById('format-detected');
      
      console.log('Transcript: DOM elements found:', {
        transcriptToggle: !!transcriptToggle,
        transcriptContainer: !!this.transcriptContainer,
        subtitleOverlay: !!this.subtitleOverlay,
        transcriptStatus: !!this.transcriptStatus,
        formatDetected: !!this.formatDetected
      });
      
      // Load and parse transcript data FIRST
      console.log('Transcript: Starting data loading...');
      this.loadRawTranscriptData();
      
      // Set up event listeners
      if (transcriptToggle) {
        transcriptToggle.addEventListener('click', () => this.toggleTranscript());
        console.log('Transcript: Toggle event listener added');
      }
      
      console.log('Transcript: Data loading complete. Parsed', this.transcriptData.length, 'segments');
      
      // Also check if transcript data is empty and show helpful message
      if (this.transcriptData.length === 0) {
        console.log('Transcript: No segments found. Check transcript format and data.');
        this.updateFormatDetected('No segments found', false);
      } else {
        console.log('Transcript: Successfully parsed segments, rendering transcript immediately...');
        // Render transcript immediately for users to read
        this.renderTranscriptHTML();
        // Show transcript by default when data is available
        this.showTranscriptByDefault();
        // Set up media sync for when playback starts (non-blocking)
        this.setupMediaPlayerSync();
      }
    }

    loadRawTranscriptData() {
      const rawDataElement = document.getElementById('transcript-raw-data');
      if (!rawDataElement) {
        console.log('Transcript: No transcript data element found on page');
        return;
      }

      try {
        this.rawTranscriptData = JSON.parse(rawDataElement.textContent);
        console.log('Transcript: Raw data loaded:', this.rawTranscriptData);
        
        if (this.rawTranscriptData.transcriptData && this.rawTranscriptData.transcriptData.trim()) {
          console.log('Transcript: Found transcript data, parsing...');
          this.parseTranscriptData(this.rawTranscriptData.transcriptData, this.rawTranscriptData.formatHint);
        } else {
          console.log('Transcript: No transcript content found in data');
          this.updateFormatDetected('No content', false);
        }
      } catch (error) {
        console.error('Transcript: Error loading data:', error);
        this.updateFormatDetected('Error loading data', false);
      }
    }

    parseTranscriptData(data, formatHint = 'auto') {
      console.log('Parsing transcript data with format hint:', formatHint);
      
      // Auto-detect format if not specified
      const detectedFormat = formatHint === 'auto' ? this.detectFormat(data) : formatHint;
      console.log('Detected format:', detectedFormat);
      
      this.updateFormatDetected(detectedFormat.toUpperCase(), true);
      
      try {
        switch (detectedFormat) {
          case 'webvtt':
            this.transcriptData = this.parseWEBVTT(data);
            break;
          case 'srt':
            this.transcriptData = this.parseSRT(data);
            break;
          case 'json':
            this.transcriptData = this.parseJSON(data);
            break;
          case 'simple':
            this.transcriptData = this.parseSimpleTimestamps(data);
            break;
          case 'csv':
            this.transcriptData = this.parseCSV(data);
            break;
          default:
            throw new Error(`Unsupported format: ${detectedFormat}`);
        }
        
        console.log('Parsed transcript data:', this.transcriptData);
        this.renderTranscriptHTML();
        
      } catch (error) {
        console.error('Error parsing transcript:', error);
        this.updateFormatDetected('Parse Error', false);
      }
    }

    detectFormat(data) {
      if (data.trim().startsWith('WEBVTT')) return 'webvtt';
      if (data.match(/^\d+\s*\n\d{2}:\d{2}:\d{2},\d{3} --> \d{2}:\d{2}:\d{2},\d{3}/m)) return 'srt';
      if (data.trim().startsWith('[') && data.trim().endsWith(']')) return 'json';
      if (data.includes(',') && (data.includes('"') || data.split('\n')[0].split(',').length > 2)) return 'csv';
      if (data.match(/\[\d{2}:\d{2}:\d{2}[\.\,]\d{3}\]/) || data.match(/\d{2}:\d{2}:\d{2}[\.\,]\d{3}:/)) return 'simple';
      return 'simple'; // fallback
    }

    parseWEBVTT(data) {
      console.log('Transcript: Parsing WEBVTT data...');
      console.log('Transcript: Data length:', data.length, 'characters');
      console.log('Transcript: First 200 characters:', data.substring(0, 200));
      
      const segments = [];
      const lines = data.split('\n');
      let currentSegment = null;
      let lineNumber = 0;
      
      console.log('Transcript: Total lines to process:', lines.length);
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        lineNumber++;
        
        // Skip WEBVTT header and empty lines
        if (line === 'WEBVTT' || line === '') continue;
        
        // Check for timestamp line - more flexible pattern for WEBVTT
        const timestampMatch = line.match(/^(\d{2}:\d{2}:\d{2}\.?\d{1,3}) --> (\d{2}:\d{2}:\d{2}\.?\d{1,3})/);
        if (timestampMatch) {
          // Save previous segment if exists
          if (currentSegment && currentSegment.text.length > 0) {
            segments.push({
              timestamp: currentSegment.startTime,
              endTimestamp: currentSegment.endTime,
              text: currentSegment.text.join(' '),
              speaker: currentSegment.speaker,
              type: 'speech',
              timeInSeconds: this.convertTimestampToSeconds(currentSegment.startTime),
              endTimeInSeconds: this.convertTimestampToSeconds(currentSegment.endTime)
            });
          }
          
          // Start new segment
          currentSegment = {
            startTime: timestampMatch[1],
            endTime: timestampMatch[2],
            text: [],
            speaker: this.rawTranscriptData?.defaultSpeaker || 'Host'
          };
          
        } else if (currentSegment && line) {
          // Add text line to current segment
          currentSegment.text.push(line);
        }
      }
      
      // Don't forget the last segment
      if (currentSegment && currentSegment.text.length > 0) {
        segments.push({
          timestamp: currentSegment.startTime,
          endTimestamp: currentSegment.endTime,
          text: currentSegment.text.join(' '),
          speaker: currentSegment.speaker,
          type: 'speech',
          timeInSeconds: this.convertTimestampToSeconds(currentSegment.startTime),
          endTimeInSeconds: this.convertTimestampToSeconds(currentSegment.endTime)
        });
      }
      
      console.log(`Transcript: WEBVTT parsing complete. Found ${segments.length} segments.`);
      return segments;
    }

    parseSRT(data) {
      const segments = [];
      const blocks = data.trim().split(/\n\s*\n/);
      
      blocks.forEach(block => {
        const lines = block.trim().split('\n');
        if (lines.length >= 3) {
          const timestampLine = lines[1];
          const timestampMatch = timestampLine.match(/^(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
          
          if (timestampMatch) {
            const startTime = timestampMatch[1].replace(',', '.');
            const endTime = timestampMatch[2].replace(',', '.');
            const text = lines.slice(2).join(' ');
            
            segments.push({
              timestamp: startTime,
              endTimestamp: endTime,
              text: text,
              speaker: this.rawTranscriptData?.defaultSpeaker || 'Host',
              type: 'speech',
              timeInSeconds: this.convertTimestampToSeconds(startTime),
              endTimeInSeconds: this.convertTimestampToSeconds(endTime)
            });
          }
        }
      });
      
      return segments;
    }

    parseJSON(data) {
      const segments = [];
      const jsonData = JSON.parse(data);
      
      jsonData.forEach(item => {
        segments.push({
          timestamp: item.start || item.timestamp || item.time,
          endTimestamp: item.end || item.endTime,
          text: item.text || item.content,
          speaker: item.speaker || this.rawTranscriptData?.defaultSpeaker || 'Host',
          type: item.type || 'speech',
          timeInSeconds: this.convertTimestampToSeconds(item.start || item.timestamp || item.time),
          endTimeInSeconds: item.end ? this.convertTimestampToSeconds(item.end) : undefined
        });
      });
      
      return segments;
    }

    parseSimpleTimestamps(data) {
      const segments = [];
      const lines = data.split('\n');
      
      lines.forEach(line => {
        const line_trimmed = line.trim();
        if (!line_trimmed) return;
        
        // Match [00:01:23.456] format or 00:01:23.456: format
        const match = line_trimmed.match(/^(?:\[)?(\d{1,2}:\d{2}:\d{2}(?:[\.\,]\d{3})?)\]?\s*:?\s*(.+)$/);
        if (match) {
          const timestamp = match[1];
          const text = match[2];
          
          segments.push({
            timestamp: timestamp,
            text: text,
            speaker: this.rawTranscriptData?.defaultSpeaker || 'Host',
            type: 'speech',
            timeInSeconds: this.convertTimestampToSeconds(timestamp)
          });
        }
      });
      
      return segments;
    }

    parseCSV(data) {
      const segments = [];
      const lines = data.split('\n');
      
      // Skip header row if it exists
      const startRow = lines[0].includes('timestamp') || lines[0].includes('time') ? 1 : 0;
      
      for (let i = startRow; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        const columns = line.split(',').map(col => col.replace(/^"/, '').replace(/"$/, ''));
        if (columns.length >= 2) {
          segments.push({
            timestamp: columns[0],
            text: columns[1],
            speaker: columns[2] || this.rawTranscriptData?.defaultSpeaker || 'Host',
            type: columns[3] || 'speech',
            timeInSeconds: this.convertTimestampToSeconds(columns[0])
          });
        }
      }
      
      return segments;
    }

    convertTimestampToSeconds(timestamp) {
      if (!timestamp) return 0;
      
      // Handle different timestamp formats
      const cleanTimestamp = timestamp.replace(',', '.');
      const parts = cleanTimestamp.split(':');
      let totalSeconds = 0;
      
      if (parts.length === 2) {
        // MM:SS.mmm format
        const [minutes, secondsMs] = parts;
        const [seconds, milliseconds = 0] = secondsMs.split('.');
        totalSeconds = parseInt(minutes) * 60 + parseInt(seconds) + (parseInt(milliseconds) / 1000);
      } else if (parts.length === 3) {
        // HH:MM:SS.mmm format
        const [hours, minutes, secondsMs] = parts;
        const [seconds, milliseconds = 0] = secondsMs.split('.');
        totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds) + (parseInt(milliseconds) / 1000);
      }
      
      return totalSeconds;
    }


    // How Transcript Displays on Site
    
    renderTranscriptHTML() {
      const contentContainer = document.getElementById('transcript-content');
      if (!contentContainer) return;
      
      contentContainer.innerHTML = '';
      

let lastSpeaker = null;

      this.transcriptData.forEach((segment, index) => {
        const segmentDiv = document.createElement('div');
        const showSpeaker = segment.speaker && segment.speaker !== "Host" || (segment.speaker === "Host" && lastSpeaker !== "Host");
  lastSpeaker = segment.speaker;
        segmentDiv.className = 'transcript-segment';
        segmentDiv.dataset.timestamp = segment.timestamp;
        segmentDiv.dataset.segmentIndex = index;
        segmentDiv.dataset.speaker = segment.speaker || '';
        segmentDiv.dataset.type = segment.type || 'speech';
        
        segmentDiv.innerHTML = `
          <span class="timestamp">${formatTimestamp(segment.timeInSeconds)}</span>
          ${showSpeaker ? `<span class="speaker">${segment.speaker}:</span>` : ''}
          <span class="text">${segment.text}</span>
        `;
        
        // Store element reference for sync
        segment.element = segmentDiv;
        
        contentContainer.appendChild(segmentDiv);
      });
      
      console.log('Transcript HTML rendered with', this.transcriptData.length, 'segments');
    }

    updateFormatDetected(format, success) {
      if (this.formatDetected) {
        this.formatDetected.textContent = success ? format : `Error: ${format}`;
        this.formatDetected.classList.toggle('detected', success);
      }
    }

    setupMediaPlayerSync() {
      let attempts = 0;
      const maxAttempts = 20; // Max 20 attempts over ~30 seconds
      
      const trySetupPlayer = () => {
        attempts++;
        this.mediaPlayer = window.currentMediaPlayer;
        
        console.log(`Transcript: Sync attempt ${attempts}/${maxAttempts}, media player:`, !!this.mediaPlayer);
        
        if (this.mediaPlayer) {
          this.connectToMediaPlayer();
          return;
        }
        
        if (attempts >= maxAttempts) {
          console.log('Transcript: Media player not found after', maxAttempts, 'attempts. Transcript will work in manual mode.');
          this.updateStatus('Transcript ready - sync will activate when media plays');
          return;
        }
        
        // Try more frequently initially, then less frequently
        const delay = attempts < 5 ? 500 : (attempts < 10 ? 1000 : 2000);
        console.log(`Transcript: Waiting for media player (attempt ${attempts}/${maxAttempts}), next try in ${delay}ms`);
        setTimeout(trySetupPlayer, delay);
      };
      
      // Start trying immediately
      trySetupPlayer();
    }

    connectToMediaPlayer() {
      if (!this.mediaPlayer) return;
      
      console.log('Transcript: Media player found, setting up sync');
      console.log('Transcript: Media player type:', this.mediaPlayer.tagName);
      console.log('Transcript: Media player source:', this.mediaPlayer.src || this.mediaPlayer.currentSrc);
      
      // Remove old event listeners if they exist
      if (this.mediaPlayer.transcriptTimeUpdateListener) {
        this.mediaPlayer.removeEventListener('timeupdate', this.mediaPlayer.transcriptTimeUpdateListener);
      }
      if (this.mediaPlayer.transcriptPlayListener) {
        this.mediaPlayer.removeEventListener('play', this.mediaPlayer.transcriptPlayListener);
      }
      if (this.mediaPlayer.transcriptPauseListener) {
        this.mediaPlayer.removeEventListener('pause', this.mediaPlayer.transcriptPauseListener);
      }
      
      // Create new event listeners
      this.mediaPlayer.transcriptTimeUpdateListener = () => {
        console.log('Transcript: TimeUpdate event - currentTime:', this.mediaPlayer.currentTime);
        this.syncTranscript(this.mediaPlayer.currentTime);
      };
      
      this.mediaPlayer.transcriptPlayListener = () => {
        console.log('Transcript: Media player started playing');
      };
      
      this.mediaPlayer.transcriptPauseListener = () => {
        console.log('Transcript: Media player paused');
      };
      
      // Add new event listeners
      this.mediaPlayer.addEventListener('timeupdate', this.mediaPlayer.transcriptTimeUpdateListener);
      this.mediaPlayer.addEventListener('play', this.mediaPlayer.transcriptPlayListener);
      this.mediaPlayer.addEventListener('pause', this.mediaPlayer.transcriptPauseListener);
      
      this.updateStatus('Ready - transcript will sync during playback');
    }

    reconnectMediaPlayer() {
      console.log('Transcript: Reconnecting to new media player...');
      console.log('Transcript: Current connected player:', this.mediaPlayer?.tagName, this.mediaPlayer?.src || this.mediaPlayer?.currentSrc);
      console.log('Transcript: Window.currentMediaPlayer:', window.currentMediaPlayer?.tagName, window.currentMediaPlayer?.src || window.currentMediaPlayer?.currentSrc);
      
      const newMediaPlayer = window.currentMediaPlayer;
      
      if (newMediaPlayer !== this.mediaPlayer) {
        console.log('Transcript: New media player detected, switching connection');
        console.log('Transcript: Switching from', this.mediaPlayer?.tagName, 'to', newMediaPlayer?.tagName);
        this.mediaPlayer = newMediaPlayer;
        this.connectToMediaPlayer();
      } else {
        console.log('Transcript: Same media player, no reconnection needed');
      }
    }

    toggleTranscript() {
      this.isTranscriptVisible = !this.isTranscriptVisible;
      const toggleBtn = document.getElementById('transcript-toggle');
      const toggleText = toggleBtn.querySelector('.toggle-text');
      
      if (this.isTranscriptVisible) {
        this.transcriptContainer.style.display = 'block';
        toggleText.textContent = 'Hide Transcript';
        this.updateStatus('Transcript visible - sync active');
        
        this.checkDisplayMode();
      } else {
        this.transcriptContainer.style.display = 'none';
        toggleText.textContent = 'Show Transcript';
        this.updateStatus('Transcript hidden');
      }
    }

    showTranscriptByDefault() {
      // Automatically show transcript when data is available
      this.isTranscriptVisible = true;
      const toggleBtn = document.getElementById('transcript-toggle');
      const toggleText = toggleBtn ? toggleBtn.querySelector('.toggle-text') : null;
      
      if (this.transcriptContainer) {
        this.transcriptContainer.style.display = 'block';
        console.log('Transcript: Showing transcript by default since data is available');
      }
      
      if (toggleText) {
        toggleText.textContent = 'Hide Transcript';
      }
      
      this.updateStatus('Transcript loaded and ready');
      this.checkDisplayMode();
    }

    checkDisplayMode() {
      const episodeContainer = document.querySelector('.episode-container');
      this.isVideoMode = episodeContainer && !episodeContainer.classList.contains('audio-only-view');
      
      console.log('Transcript: Current display mode:', this.isVideoMode ? 'video' : 'audio');
      console.log('Transcript: isTranscriptVisible:', this.isTranscriptVisible);
      console.log('Transcript: subtitleOverlay element:', !!this.subtitleOverlay);
      console.log('Transcript: transcriptContainer element:', !!this.transcriptContainer);
      
      if (this.isVideoMode && this.isTranscriptVisible) {
        // In video mode, show subtitles instead of scrolling transcript
        console.log('Transcript: Switching to video mode - showing subtitles');
        if (this.subtitleOverlay) {
          this.subtitleOverlay.style.display = 'block';
        }
        if (this.transcriptContainer) {
          this.transcriptContainer.style.display = 'none';
        }
      } else if (this.isTranscriptVisible) {
        // In audio mode, show scrolling transcript
        console.log('Transcript: Switching to audio mode - showing transcript container');
        if (this.subtitleOverlay) {
          this.subtitleOverlay.style.display = 'none';
        }
        if (this.transcriptContainer) {
          this.transcriptContainer.style.display = 'block';
        }
      }
    }

    syncTranscript(currentTime) {
      if (!this.isTranscriptVisible || this.transcriptData.length === 0) {
        return;
      }

      // Find the current segment based on timestamp
      let activeSegmentIndex = -1;
      
      for (let i = 0; i < this.transcriptData.length; i++) {
        const segment = this.transcriptData[i];
        const nextSegment = this.transcriptData[i + 1];
        
        if (currentTime >= segment.timeInSeconds) {
          if (!nextSegment || currentTime < nextSegment.timeInSeconds) {
            activeSegmentIndex = i;
            break;
          }
        }
      }

      // Update active segment if changed
      if (activeSegmentIndex !== this.currentSegmentIndex) {
        this.updateActiveSegment(activeSegmentIndex);
      }
    }

    updateActiveSegment(newIndex) {
      // Remove active class from previous segment
      if (this.currentSegmentIndex >= 0 && this.transcriptData[this.currentSegmentIndex]) {
        this.transcriptData[this.currentSegmentIndex].element.classList.remove('active');
      }

      this.currentSegmentIndex = newIndex;

      if (newIndex >= 0 && this.transcriptData[newIndex]) {
        const activeSegment = this.transcriptData[newIndex];
        
        console.log('Transcript: Active segment changed to:', activeSegment.text.substring(0, 50) + '...');
        
        // Add active class to current segment
        activeSegment.element.classList.add('active');
        
        // Update display based on current mode
        this.checkDisplayMode();
        
        if (this.isVideoMode) {
          // Show as subtitle overlay
          console.log('Transcript: In video mode, displaying subtitle');
          this.displaySubtitle(activeSegment);
        } else {
          // Scroll to active segment in transcript container
          console.log('Transcript: In audio mode, scrolling to segment');
          this.scrollToActiveSegment(activeSegment);
        }
        
        this.updateStatus(`Speaking: ${activeSegment.speaker || 'Unknown'} at ${activeSegment.timestamp}`);
      }
    }

    displaySubtitle(segment) {
      console.log('Transcript: displaySubtitle called with segment:', segment.text.substring(0, 50) + '...');
      
      if (!this.subtitleOverlay) {
        console.log('Transcript: No subtitle overlay element found');
        return;
      }
      
      console.log('Transcript: Subtitle overlay element found:', this.subtitleOverlay);
      console.log('Transcript: Subtitle overlay current display:', this.subtitleOverlay.style.display);
      
      const subtitleText = this.subtitleOverlay.querySelector('.subtitle-text');
      if (subtitleText) {
        console.log('Transcript: Setting subtitle text:', segment.text);
        subtitleText.textContent = segment.text;
        this.subtitleOverlay.style.display = 'block';
        
        console.log('Transcript: Subtitle overlay after setting display block:', this.subtitleOverlay.style.display);
        console.log('Transcript: Subtitle overlay computed style:', getComputedStyle(this.subtitleOverlay).display);
        console.log('Transcript: Subtitle overlay position:', getComputedStyle(this.subtitleOverlay).position);
        
        // Ensure subtitle overlay is positioned correctly
        // First try to find an active video container
        let videoContainer = document.querySelector('.media-container.active');
        if (!videoContainer) {
          // Fallback to any media container that's visible
          videoContainer = document.querySelector('.media-container:not([style*="display: none"])');
        }
        if (!videoContainer) {
          // Final fallback - just use the episode container
          videoContainer = document.querySelector('.episode-container');
        }
        
        console.log('Transcript: Found video container:', videoContainer?.tagName, videoContainer?.className);
        
        if (videoContainer && !videoContainer.contains(this.subtitleOverlay)) {
          console.log('Transcript: Moving subtitle overlay to video container');
          videoContainer.style.position = 'relative'; // Ensure container is positioned
          videoContainer.appendChild(this.subtitleOverlay);
          console.log('Transcript: Subtitle overlay moved to:', videoContainer.tagName);
        } else if (videoContainer) {
          console.log('Transcript: Subtitle overlay already in video container');
        }
        
        // Force styles to ensure visibility
        this.subtitleOverlay.style.zIndex = '9999';
        this.subtitleOverlay.style.pointerEvents = 'none';
        
        
        console.log('Transcript: Final subtitle overlay styles:', {
          display: this.subtitleOverlay.style.display,
          position: getComputedStyle(this.subtitleOverlay).position,
          zIndex: this.subtitleOverlay.style.zIndex,
          bottom: getComputedStyle(this.subtitleOverlay).bottom
        });
      } else {
        console.log('Transcript: No .subtitle-text element found inside overlay');
      }
    }

    scrollToActiveSegment(segment) {
      if (!this.transcriptContainer) return;
      
      // Scroll the active segment into view
      segment.element.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
        inline: 'nearest'
      });
    }

    updateStatus(message) {
      if (this.transcriptStatus) {
        this.transcriptStatus.textContent = message;
        this.transcriptStatus.classList.add('active');
        
        setTimeout(() => {
          this.transcriptStatus.classList.remove('active');
        }, 2000);
      }
    }
  }

  // Initialize transcript system when DOM is ready
  document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if transcript data exists
    if (document.getElementById('transcript-raw-data')) {
      console.log('Transcript data found, initializing multi-format sync system...');
      window.transcriptSync = new MultiFormatTranscriptSync();
    } else {
      console.log('No transcript data found for this episode');
    }
  });

  // Hook into existing media toggle system to update transcript display mode
  const originalMediaToggle = document.querySelectorAll('[data-type]');
  originalMediaToggle.forEach(btn => {
    btn.addEventListener('click', () => {
      setTimeout(() => {
        if (window.transcriptSync) {
          window.transcriptSync.checkDisplayMode();
        }
      }, 100);
    });
  });