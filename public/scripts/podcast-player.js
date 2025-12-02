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

// Format for transcript timestamps per user rules:
// - before 10 minutes: 0:00 (M:SS)
// - 10 minutes until 59:59: 00:00 (MM:SS)
// - 1:00:00 and above: 0:00:00 (H:MM:SS)
function formatTranscriptTimestamp(seconds) {
  seconds = Math.floor(Number(seconds) || 0);
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;

  if (h >= 1) {
    // H:MM:SS (no leading zeros for hours)
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  if (m >= 10) {
    // MM:SS with leading zero for minutes
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }

  // M:SS (no leading zero for minutes under 10)
  return `${m}:${s.toString().padStart(2, '0')}`;
}


  document.addEventListener('DOMContentLoaded', function() {
    console.log('Phase 1 Podcast player initializing...');
    
    
    // Get episode data (try JSON injection first, otherwise build from DOM)
    const episodeDataScript = document.getElementById('episode-data');
    let episodeData = episodeDataScript ? JSON.parse(episodeDataScript.textContent) : null;

    if (!episodeData) {
      // Fallback: assemble chapters from rendered chapter buttons in the DOM
      const chapterBtns = document.querySelectorAll('.chapter-button');
      const chaptersFromDom = Array.from(chapterBtns).map((btn) => ({
        title: (btn.textContent || '').trim().split('\n')[0].trim(),
        startTime: btn.dataset.startTime || btn.getAttribute('data-start-time') || '0:00',
        endTime: btn.dataset.endTime || btn.getAttribute('data-end-time') || '',
        description: (btn.querySelector && btn.querySelector('.chapter-description')) ? btn.querySelector('.chapter-description').textContent.trim() : ''
      }));

      episodeData = { chapters: chaptersFromDom };
    }

    console.log('Episode data loaded:', episodeData);
    episodeData.chapters.forEach((c, i) => {
      console.log(`CHAPTER ${i+1}:`, { title: c.title });
    });


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

 //TimeStamp Parser for Audio & Video
  function parseTimestamp(ts) {
  const parts = ts.split(':').map(Number);
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  return 0;
}   



// Audio Player Controller
    var audio = document.getElementById('mainAudio');
    var playPauseButton = document.getElementById('play-pause');
    var seekBar = document.getElementById('audio-seek-bar');
    var currentTime = document.getElementById('current-time');
    var duration = document.getElementById('duration');
    var audioSkipBtns = document.querySelectorAll('.audio-skip-back-button, .audio-skip-forward-button');

    //Identify Current Chapter Based on Playback Position
    const chapterButtons = document.querySelectorAll('.chapter-button');
    const chapters = episodeData.chapters.map((chapter) => ({
      title: chapter.title || '',
      start: parseTimestamp(chapter.startTime || '0:00') || 0,
      end: parseTimestamp(chapter.endTime || '') || NaN
    }));

    // Normalize end times: if end is missing or <= start, use next chapter start or Infinity for the last chapter.
    for (let i = 0; i < chapters.length; i++) {
      const ch = chapters[i];
      if (!Number.isFinite(ch.end) || ch.end <= ch.start) {
        const next = chapters[i + 1];
        ch.end = next ? next.start : Number.POSITIVE_INFINITY;
      }
    }

    // Interlude buttons intentionally removed — interlude functionality disabled.
    
   

      
  
// Audio Player Controls
function updateAudioPlayPauseUI() {
  if (audio.paused) {
    playPauseButton.textContent = '►';
  } else {
    playPauseButton.textContent = '❚❚';
  }
}
    if (audio) {
      
      if (duration) {
        audio.addEventListener('loadedmetadata', function() {
          duration.textContent = formatTime(audio.duration);
        });
      }

      if (playPauseButton) {
  playPauseButton.addEventListener('click', function () {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
    updateAudioPlayPauseUI();
  });
}











//Timeupdate Function
      let lastChapterIndex = -1;
      audio.addEventListener('timeupdate', function() {
        // One-time debug dump to inspect chapter boundaries vs playback time
        if (!window._chapterDebugLogged) {
          try {
            console.log('Chapter debug: parsed chapters count =', chapters.length);
          } catch (e) {
            console.warn('Chapter debug dump failed', e);
          }
          window._chapterDebugLogged = true;
        }
        if (audio.duration && seekBar) {
          var value = (audio.currentTime / audio.duration) * 100;
          seekBar.value = value;
        }
        if (currentTime) currentTime.textContent = formatTime(audio.currentTime);
        if (duration) duration.textContent = formatTime(audio.duration);

    //Chapter Detection
      const current = Math.floor(audio.currentTime || 0);
      const currentChapterIndex = chapters.findIndex(ch => current >= ch.start && current < ch.end);

      if (currentChapterIndex !== lastChapterIndex) {
        if (currentChapterIndex !== -1) {
          console.log("You're in chapter:", currentChapterIndex + 1);
        } else {
          console.log("Out of Chapter");
        }

        if (lastChapterIndex !== -1) {
          const endedChapter = chapters[lastChapterIndex];
          const endedAt = Number.isFinite(endedChapter.end) ? formatTime(endedChapter.end) : 'end';
          console.log(`Chapter ${lastChapterIndex + 1} ended at ${endedAt}`);
        }

        lastChapterIndex = currentChapterIndex;
      }
    });


  // Confirm that the timeupdate listener registration code ran
  console.log('Debug: timeupdate handler registered for mainAudio');

      // Seekbar for Audio Playback
      if (seekBar) {
        seekBar.addEventListener('input', function() {
          if (!audio.duration) return;
          var time = (seekBar.value / 100) * audio.duration;
          audio.currentTime = time;
        });
      }

      //Volume Control
      var volumeControl = document.getElementById('audio-volume-control');
      if (volumeControl) {
        volumeControl.addEventListener('input', function() {
          audio.volume = volumeControl.value;
        });
      }

// Transcript toggle button (Show Transcript / Hide Transcript)
      try {
        const transcriptToggleBtn = document.getElementById('transcript-toggle');
        const transcriptContainer = document.getElementById('transcript-container');

        if (transcriptToggleBtn && transcriptContainer) {
          const transcriptContentEl = document.getElementById('transcript-content') || transcriptContainer;
          console.log('Transcript toggle wired:', { transcriptToggleBtn: !!transcriptToggleBtn, transcriptContainer: !!transcriptContainer, transcriptContentEl: !!transcriptContentEl });
          // Render transcript defensively and emit separate timestamp elements for styling/click-to-seek
          function renderTranscript() {
            try {
              if (!episodeData) return;

              // Clear existing content (prefer inner content element when present)
              transcriptContentEl.textContent = '';

              // Helper to append a single structured line: <div.transcript-line>
              //   <time.transcript-timestamp data-seconds="...">0:03</time>
              //   <span.transcript-text>text...</span>
              // If seconds is null, we omit the <time> element and render only the text.
              function addLine(seconds, text) {
                try {
                  const wrap = document.createElement('div');
                  wrap.className = 'transcript-line';

                  const safeText = (text || '').toString();

                  if (Number.isFinite(seconds)) {
                    const ts = document.createElement('time');
                    ts.className = 'transcript-timestamp';
                    ts.dataset.seconds = String(Math.floor(seconds));
                    ts.setAttribute('datetime', `PT${Math.floor(seconds)}S`);
                    ts.textContent = formatTranscriptTimestamp(seconds);
                    // Click to seek
                    ts.addEventListener('click', () => {
                      try {
                        if (audio) {
                          audio.currentTime = Number(ts.dataset.seconds);
                          audio.play();
                        }
                      } catch (e) {
                        console.warn('Failed to seek audio from transcript timestamp', e);
                      }
                    });
                    // Keyboard accessibility (Enter / Space)
                    ts.tabIndex = 0;
                    ts.addEventListener('keydown', (ev) => {
                      if (ev.key === 'Enter' || ev.key === ' ') {
                        ev.preventDefault();
                        ts.click();
                      }
                    });
                    wrap.appendChild(ts);
                  }

                  const txt = document.createElement('span');
                  txt.className = 'transcript-text';
                  txt.textContent = safeText;
                  wrap.appendChild(txt);

                  transcriptContentEl.appendChild(wrap);
                } catch (err) {
                  console.warn('Failed to append transcript line', err);
                }
              }

              // Try to extract seconds from different entry shapes
              function secondsFor(entry) {
                try {
                  // If entry already has numeric seconds
                  if (entry && typeof entry.timeInSeconds === 'number' && Number.isFinite(entry.timeInSeconds)) {
                    return Math.floor(entry.timeInSeconds);
                  }

                  // If entry has a timestamp string e.g. "MM:SS" or "HH:MM:SS"
                  if (entry && typeof entry.timestamp === 'string' && entry.timestamp.trim()) {
                    return parseTimestamp(entry.timestamp.trim());
                  }

                  // If entry is a string line, look for leading timestamp
                  const lineText = (typeof entry === 'string') ? entry : (entry && (entry.text || entry.transcript) ? (entry.text || entry.transcript) : null);
                  if (typeof lineText === 'string') {
                    const m = lineText.trim().match(/^\[?(\d{1,2}:\d{2}(?::\d{2})?)\]?/);
                    if (m && m[1]) return parseTimestamp(m[1]);
                  }
                } catch (err) {
                  // ignore and return null below
                }
                return null;
              }

              // Case A: transcript is an array of entries
              if (Array.isArray(episodeData.transcript) && episodeData.transcript.length > 0) {
                episodeData.transcript.forEach((entry) => {
                  if (!entry) return;
                  if (typeof entry === 'string') {
                    const sec = secondsFor(entry);
                    const textOnly = entry.replace(/^\[?\d{1,2}:\d{2}(?::\d{2})?\]?\s*-?\s*/, '');
                    if (sec !== null) {
                      addLine(sec, textOnly);
                    } else {
                      addLine(null, entry);
                    }
                    return;
                  }

                  const speaker = entry.speaker || '';
                  const text = entry.text || entry.transcript || '';
                  const sec = secondsFor(entry);
                  const body = speaker ? `${speaker}: ${text}` : text;
                  if (sec !== null) addLine(sec, body);
                  else addLine(null, body);
                });
                return;
              }

              // Case B: transcript may be an object with transcriptData (string)
              if (episodeData.transcript && typeof episodeData.transcript === 'object' && typeof episodeData.transcript.transcriptData === 'string' && episodeData.transcript.transcriptData.trim()) {
                const raw = episodeData.transcript.transcriptData.trim();

                // If the data looks like WEBVTT/SRT with cue timestamps 'start --> end', parse cues
                if (/-->/.test(raw) || raw.startsWith('WEBVTT')) {
                  const lines = raw.split(/\r?\n/);
                  let i = 0;
                  while (i < lines.length) {
                    const line = lines[i].trim();
                    // skip numeric index lines
                    if (/^\d+$/.test(line)) { i++; continue; }

                    // match timestamp lines like '00:00:01.419 --> 00:00:10.320'
                    const tsMatch = line.match(/^(\d{1,2}:\d{2}(?::\d{2}(?:[\.,]\d{1,3})?)?)\s*-->\s*(\d{1,2}:\d{2}(?::\d{2}(?:[\.,]\d{1,3})?)?)/);
                    if (tsMatch) {
                      const startTs = tsMatch[1];
                      // collect following text lines until blank or next timestamp
                      i++;
                      const textLines = [];
                      while (i < lines.length && lines[i].trim() !== '') {
                        // stop if next line looks like a timestamp
                        if (/-->/.test(lines[i])) break;
                        textLines.push(lines[i].trim());
                        i++;
                      }
                      const text = textLines.join(' ').replace(/\s+/g, ' ').trim();
                      const sec = parseTimestamp(startTs.replace(',', '.'));
                      addLine(sec, text);
                      continue;
                    }

                    // otherwise, if non-empty, add as plain line
                    if (line) addLine(null, line);
                    i++;
                  }
                  return;
                }

                // Fallback: simple line-by-line
                const lines = raw.split('\n');
                lines.forEach(line => addLine(null, line.trim()));
                return;
              }

              // Case C: fallback to transcriptText (raw string)
              if (typeof episodeData.transcriptText === 'string' && episodeData.transcriptText.trim()) {
                const lines = episodeData.transcriptText.split('\n');
                lines.forEach(line => addLine(null, line.trim()));
                return;
              }

              // Nothing to render
              console.log('No transcript data found to render');
            } catch (err) {
              console.error('renderTranscript unexpected error', err && err.stack || err);
            }
          }

          // Initially hidden
          transcriptContainer.style.display = 'none';

          transcriptToggleBtn.addEventListener('click', function() {
            try {
              const toggleTextEl = transcriptToggleBtn.querySelector('.toggle-text');
              const isHidden = transcriptContainer.style.display === 'none' || getComputedStyle(transcriptContainer).display === 'none';

              if (isHidden) {
                // Populate transcript before showing
                renderTranscript();
                transcriptContainer.style.display = 'block';
                if (toggleTextEl) toggleTextEl.textContent = 'Hide Transcript';
              } else {
                transcriptContainer.style.display = 'none';
                if (toggleTextEl) toggleTextEl.textContent = 'Show Transcript';
              }
            } catch (err) {
              console.warn('Transcript toggle click handler error', err);
            }
          });
        }
      } catch (e) {
        console.warn('Transcript toggle wiring failed', e);
      }


      //Audio Skip Functionality (namespaced)
      function handleAudioSkip() {
        audio.currentTime += parseFloat(this.dataset.skip);
      }
      if (audioSkipBtns && audioSkipBtns.length) {
        audioSkipBtns.forEach((btn) => btn.addEventListener('click', handleAudioSkip));
      }

      // Playback Speed Selector
      var playbackSpeed = document.getElementById('playback-speed');
      if (playbackSpeed) {
        playbackSpeed.addEventListener('change', function() {
          audio.playbackRate = playbackSpeed.value;
        });
      }
    }

    function formatTime(seconds) {
        var minutes = Math.floor(seconds / 60);
        var seconds = Math.floor(seconds % 60);
        if (seconds < 10) {
            seconds = '0' + seconds;
        }
        return minutes + ':' + seconds;
    }

    




// Video Player Controls
// Video Player Controls (guarded)
const video = document.querySelector('.video');
const toggleButton = document.querySelector('.play_button');
const progress = document.getElementById('video-progress');
const volumeSlider = document.querySelector('.volume__slider');
const skipBtns = document.querySelectorAll('.video-player .skip-back-button, .video-player .skip-forward-button');
const videoSpeed = document.querySelector('.video-speed');
const videoTime = document.getElementById('video-time');
const videoDuration = document.getElementById('video-duration');
const fullscreenBtn = document.querySelector('.fullscreen-button');

if (video) {
  //Play/Pause Toggle Button
  function togglePlay() {
    if (video.paused || video.ended) {
      video.play();
    } else {
      video.pause();
    }
  }

  function updateToggleButton() {
    if (toggleButton) toggleButton.innerHTML = video.paused ? "►" : "❚❚";
  }

  //Progress Bar & Video Duration
  if (progress) {
    video.addEventListener("timeupdate", () => {
      // Update the thumb position (0–100)
      const percent = (video.currentTime / video.duration) * 100;
      progress.value = percent;
    });

    // Scrubbing Functionality
    progress.addEventListener("input", (e) => {
      const newTime = (e.target.value / 100) * video.duration;
      video.currentTime = newTime;
    });
  }

  //Play/Pause Toggle Functionality
  if (toggleButton) toggleButton.addEventListener("click", togglePlay);
  video.addEventListener("click", togglePlay);
  video.addEventListener("play", updateToggleButton);
  video.addEventListener("pause", updateToggleButton);

  //Video Duration Display
  video.addEventListener("timeupdate", () => {
    const percent = (video.currentTime / video.duration) * 100;
    if (progress) progress.value = percent;
    if (videoTime) videoTime.textContent = formatTimestamp(video.currentTime);
    if (videoDuration) videoDuration.textContent = formatTimestamp(video.duration);
  });

  //Duration Displays as soon as metadata loads
  video.addEventListener("loadedmetadata", () => {
    if (videoDuration) videoDuration.textContent = formatTime(video.duration);
  });

  //Skip Forward/Backward Functionality
  function handleVideoSkip() {
    if (!video) return;
    video.currentTime += parseFloat(this.dataset.skip);
  }
  if (skipBtns && skipBtns.length) {
    skipBtns.forEach((btn) => btn.addEventListener('click', handleVideoSkip));
  }

  //Volume Functionality
  if (volumeSlider) {
    // "input" updates continuously while dragging
    volumeSlider.addEventListener("input", (e) => {
      video.volume = e.target.value; // value is 0 → 1
    });
  }

  //Playback Speed Functionality
  if (videoSpeed) videoSpeed.addEventListener('change', function() {
    video.playbackRate = parseFloat(videoSpeed.value);
  });

  //Keyboard Spacebar Play/Pause
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space") togglePlay();
  });

  //Fullscreen Toggle
  if (fullscreenBtn) fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
      video.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
  });
}





// AUDIO/VIDEO MODE TOGGLE
const mediaButtons = document.querySelectorAll(".media-btn");
const audioContainer = document.getElementById("audio-player-container");
const videoContainer = document.getElementById("video-player-container");
// Episode cover wrapper — hide during video mode
const coverSection = document.querySelector('.episode-cover-section');

  // Diagnostic: log presence of key elements
  console.log('Media elements:', {
    mediaButtons: mediaButtons.length,
    audioContainer: !!audioContainer,
    videoContainer: !!videoContainer,
    coverSection: !!coverSection
  });

// Pull saved preference OR default to "audio"
let savedMode = localStorage.getItem("preferredMediaMode") || "audio";

// Apply a mode (audio or video)
function applyMode(type) {
  // Update active button styling
  mediaButtons.forEach(b => b.classList.remove("active"));
  const btn = document.querySelector(`[data-type="${type}"]`);
  if (btn && btn.classList) btn.classList.add("active");

  if (type === "audio") {
    if (video && typeof video.pause === 'function') try { video.pause(); } catch (e) {}
    if (audioContainer && audioContainer.classList) audioContainer.classList.remove("hidden");
    if (videoContainer && videoContainer.classList) videoContainer.classList.add("hidden");
    // Fallback: force inline styles to ensure correct visibility even if CSS missed
    try { if (audioContainer) audioContainer.style.display = ''; } catch(e){}
    try { if (videoContainer) videoContainer.style.display = 'none'; } catch(e){}
    if (coverSection) coverSection.classList.remove('hidden');
    console.log('applyMode: audio selected — audio shown, video hidden');
  } else if (type === "video") {
    if (audio && typeof audio.pause === 'function') try { audio.pause(); } catch (e) {}
    if (videoContainer && videoContainer.classList) videoContainer.classList.remove("hidden");
    if (audioContainer && audioContainer.classList) audioContainer.classList.add("hidden");
    // Fallback: force inline styles to ensure correct visibility even if CSS missed
    try { if (videoContainer) videoContainer.style.display = ''; } catch(e){}
    try { if (audioContainer) audioContainer.style.display = 'none'; } catch(e){}
    if (coverSection) coverSection.classList.add('hidden');
    console.log('applyMode: video selected — video shown, audio hidden');
  }
}

// Apply saved default mode on page load
applyMode(savedMode);

// When user clicks a media toggle button
mediaButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.type;

    // Save preference for future visits
    localStorage.setItem("preferredMediaMode", type);

    // Apply mode immediately
    applyMode(type);
  });
});




// Chapters Scroller

//Step 1. Chapter Jump Buttons Jump to Timestamps
  chapterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const ts = button.dataset.startTime;            // timestamp string
      const seconds = parseTimestamp(ts);             // convert → seconds

    // Jump media depending on which one is visible
    if (!videoContainer.classList.contains('hidden')) {
      video.currentTime = seconds;
      video.play();
    } else {
      audio.currentTime = seconds;
      audio.play();
      updateAudioPlayPauseUI();
    }
  });
});

 

//Step 2. Add Interlude buttons between chapters
//Step 3. Have Interlude buttons play corresponding audio/video from YT.
//Step 4. Sync chapter highlighting with playback position.
//Step 5. Add controls for Interludes (Skip, Play/Pause)....





  //DOM Bracket - Keep at end of file
   });