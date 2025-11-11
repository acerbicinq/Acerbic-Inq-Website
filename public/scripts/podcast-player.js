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
    var audio = document.getElementById('mainAudio');
    var playPauseButton = document.getElementById('play-pause');
    var seekBar = document.getElementById('seek-bar');
    var currentTime = document.getElementById('current-time');
    var duration = document.getElementById('duration');

    audio.addEventListener('loadedmetadata', function() {
  duration.textContent = formatTime(audio.duration);
});

    playPauseButton.addEventListener('click', function() {
        if (audio.paused) {
            audio.play();
            playPauseButton.textContent = '❚❚';
        } else {
            audio.pause();
            playPauseButton.textContent = '►';
        }
    });

    audio.addEventListener('timeupdate', function() {
        var value = (audio.currentTime / audio.duration) * 100;
        seekBar.value = value;
        currentTime.textContent = formatTime(audio.currentTime);
        duration.textContent = formatTime(audio.duration);
    });
// Seekbar for Audio Playback
    seekBar.addEventListener('input', function() {
        var time = (seekBar.value / 100) * audio.duration;
        audio.currentTime = time;
    });

    //Volume Control
    var volumeControl = document.getElementById('volume-control');
volumeControl.addEventListener('input', function() {
    audio.volume = volumeControl.value;
});

    // Playback Speed Selector
    var playbackSpeed = document.getElementById('playback-speed');
playbackSpeed.addEventListener('change', function() {
  audio.playbackRate = playbackSpeed.value;
});

    function formatTime(seconds) {
        var minutes = Math.floor(seconds / 60);
        var seconds = Math.floor(seconds % 60);
        if (seconds < 10) {
            seconds = '0' + seconds;
        }
        return minutes + ':' + seconds;
    }




// Video Player Controls
const video = document.querySelector(".video");
const toggleButton = document.querySelector(".play_button");
const progress = document.getElementById("video-progress");
const volumeSlider = document.querySelector(".volume__slider");
const skipBtns = document.querySelectorAll("[data-skip]");


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
    //Progress Bar & Video Duration -- Add timestamp display later
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

//Skip Forward/Backward Functionality
function handleSkip() {
  video.currentTime += parseFloat(this.dataset.skip);
}
skipBtns.forEach((btn) => btn.addEventListener("click", handleSkip));


//Volume Functionality
if (volumeSlider) {
  // "input" updates continuously while dragging
  volumeSlider.addEventListener("input", (e) => {
    video.volume = e.target.value; // value is 0 → 1
  });
}

  //Keyboard Spacebar Play/Pause
document.addEventListener("keydown", (e) => {
  if (e.code === "Space") togglePlay();
});

  //Fullscreen Toggle

   });