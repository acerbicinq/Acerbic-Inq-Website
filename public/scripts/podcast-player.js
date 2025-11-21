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
    const chapters = [...chapterButtons].map(btn => ({
      title: btn.textContent.trim(),
      start: parseTimestamp(btn.dataset.startTime),
      end: parseTimestamp(btn.dataset.endTime),
      })); 

  
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
      let lastChapterIndex = -1;
      audio.addEventListener('timeupdate', function() {
        if (audio.duration && seekBar) {
          var value = (audio.currentTime / audio.duration) * 100;
          seekBar.value = value;
        }
        if (currentTime) currentTime.textContent = formatTime(audio.currentTime);
        if (duration) duration.textContent = formatTime(audio.duration);

    //Chapter Detection
    const current = Math.floor(audio.currentTime);
      const currentChapterIndex = chapters.findIndex(ch =>
          current >= ch.start && current < ch.end
        );

        if (currentChapterIndex !== lastChapterIndex) {
        if (currentChapterIndex !== -1) {
          console.log("You're in chapter:", currentChapterIndex + 1);
        } else {
          console.log("Out of Chapter");
        }
        lastChapterIndex = currentChapterIndex; // <- update correctly
      }

      });

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
const video = document.querySelector('.video');
const toggleButton = document.querySelector('.play_button');
const progress = document.getElementById('video-progress');
const volumeSlider = document.querySelector('.volume__slider');
const skipBtns = document.querySelectorAll('.video-player .skip-back-button, .video-player .skip-forward-button');
const videoSpeed = document.querySelector('.video-speed');
const videoTime = document.getElementById('video-time');
const videoDuration = document.getElementById('video-duration');
const fullscreenBtn = document.querySelector('.fullscreen-button'); 


    //Play/Pause Toggle Button
function togglePlay() {
  if (video.paused || video.ended) {
    video.play();
  } else {
    video.pause();
  }
}

function updateToggleButton() {
  toggleButton.innerHTML = video.paused ? "►" : "❚❚";
}
    //Progress Bar & Video Duration
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



//Play/Pause Toggle Functionality
toggleButton.addEventListener("click", togglePlay);
video.addEventListener("click", togglePlay);
video.addEventListener("play", updateToggleButton);
video.addEventListener("pause", updateToggleButton);

//Video Duration Display
  video.addEventListener("timeupdate", () => {
    const percent = (video.currentTime / video.duration) * 100;
    progress.value = percent;
    videoTime.textContent = formatTimestamp(video.currentTime);
    videoDuration.textContent = formatTimestamp(video.duration);
  });
//Duration Displays as soon as metadata loads
video.addEventListener("loadedmetadata", () => {
  videoDuration.textContent = formatTime(video.duration);
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
videoSpeed.addEventListener('change', function() {
  video.playbackRate = parseFloat(videoSpeed.value);
});
  //Keyboard Spacebar Play/Pause
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") togglePlay();
});

  //Fullscreen Toggle
fullscreenBtn.addEventListener("click", () => {
  if (!document.fullscreenElement) {
    video.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
});





// AUDIO/VIDEO MODE TOGGLE
const mediaButtons = document.querySelectorAll(".media-btn");
const audioContainer = document.getElementById("audio-player-container");
const videoContainer = document.getElementById("video-player-container");
// Episode cover wrapper — hide during video mode
const coverSection = document.querySelector('.episode-cover-section');

// Pull saved preference OR default to "audio"
let savedMode = localStorage.getItem("preferredMediaMode") || "audio";

// Apply a mode (audio or video)
function applyMode(type) {
  // Update active button styling
  mediaButtons.forEach(b => b.classList.remove("active"));
  document.querySelector(`[data-type="${type}"]`).classList.add("active");

  if (type === "audio") {
    video.pause();
    audioContainer.classList.remove("hidden");
    videoContainer.classList.add("hidden");
    if (coverSection) coverSection.classList.remove('hidden');
  } else if (type === "video") {
    audio.pause();
    videoContainer.classList.remove("hidden");
    audioContainer.classList.add("hidden");
    if (coverSection) coverSection.classList.add('hidden');
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