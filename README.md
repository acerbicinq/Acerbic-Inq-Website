# Acerbic Inq Website

A modern podcast website featuring seamless interlude integration, built with Astro and Sanity CMS.

## 🎧 Features

### 🎵 Music Features
- **Interactive Music Player** - Custom WaveSurfer-based audio player with waveform visualization
- **Multi-Format Lyrics System** - Real-time synchronized lyrics supporting LRC, SRT, JSON, and simple text formats
- **Karaoke-Style Highlighting** - Current lyrics highlight with progressive coloring as songs play
- **Smart Auto-Scroll** - Lyrics automatically scroll to keep current line centered in view
- **Three Display Modes** - Toggle between hidden, synchronized, and static lyrics display
- **File Upload Support** - Upload lyrics files directly through Sanity CMS (.lrc, .srt, .json, .txt)
- **Format Auto-Detection** - Automatically detects and parses different lyrics formats
- **Track Preloading** - Instant switching between album tracks with smart preloading

### 🎧 Podcast Features  
- **Interactive Podcast Player** - Custom audio/video player with seamless mode switching
- **Multi-Format Transcript System** - Real-time synchronized transcripts supporting WEBVTT, SRT, JSON, CSV formats
- **Advanced Interlude System** - Automatic music playback with dual audio/video modes
- **Dual-Mode Transcript Display** - Audio mode shows scrolling transcript, video mode displays subtitles
- **YouTube Integration** - Dynamic video players that appear in-page during interludes
- **Audio/Video Mode Toggle** - Switch between clean audio-only and full video experience
- **Chapter-Based Navigation** - Jump to specific podcast sections with timestamps
- **Smart Container System** - YouTube videos play directly in embedded page containers

### 🌐 General Features
- **Responsive Design** - Optimized for desktop and mobile devices with adaptive layouts
- **Content Management** - Powered by Sanity CMS for easy episode and interlude content updates

## 🏗️ Architecture

### Frontend
- **Framework**: [Astro](https://astro.build/) - Static site generator with component islands
- **Styling**: CSS with CSS custom properties
- **JavaScript**: Vanilla JS for media controls and interlude system
- **Components**: Preact components for interactive elements

### Content Management
- **CMS**: [Sanity](https://www.sanity.io/) - Headless CMS for podcast episodes and content
- **Media**: Sanity asset pipeline for audio files and images

### Integrations
- **YouTube API**: IFrame API for seamless music interludes
- **Audio Processing**: Native HTML5 audio with custom controls

## 🎵 Interlude System

The website features a sophisticated interlude system that seamlessly bridges podcast chapters with curated music tracks, providing both audio-only and video viewing experiences.

### Core Functionality

1. **Automatic Chapter Detection** - Detects when chapters are 95% complete or within 0.5s of ending
2. **Seamless Podcast Pausing** - Gracefully pauses the main podcast at chapter boundaries
3. **YouTube Music Integration** - Plays curated music tracks with full video support
4. **Smart Resume Logic** - Automatically resumes the podcast at the next chapter when music ends
5. **Dual-Mode Experience** - Supports both audio-only and video viewing modes

### 🎬 Audio/Video Mode Switching

The interlude system adapts to user preferences with two distinct viewing modes:

#### Audio Mode (Default)
- **Clean Interface**: Shows only chapter titles and navigation elements
- **Hidden YouTube Players**: Music plays invisibly in background for distraction-free listening
- **Minimal Visual Clutter**: Perfect for focused podcast consumption
- **Placeholder Containers**: Shows where videos would appear if switched to video mode

#### Video Mode
- **Visual YouTube Players**: Full YouTube videos play directly in embedded containers on the page
- **Complete Media Experience**: Both podcast video and interlude music videos visible
- **Interactive Controls**: Full YouTube player controls available during interludes
- **Seamless Integration**: Videos appear naturally within the existing page layout

#### Real-Time Mode Switching
```javascript
// Seamless switching between modes during playback
mediaBtns.forEach(btn => {
  btn.addEventListener('click', function() {
    const type = this.dataset.type;
    const episodeContainer = document.querySelector('.episode-container');
    
    if (type === 'audio') {
      episodeContainer.classList.add('audio-only-view');
      // YouTube videos hidden, audio continues
    } else {
      episodeContainer.classList.remove('audio-only-view');
      // YouTube videos become visible in containers
    }
  });
});
```

### 🔧 Technical Implementation

#### Smart Container System
```javascript
// Dynamic player creation based on current mode
const isVideoMode = !document.querySelector('.episode-container')
  .classList.contains('audio-only-view');

if (isVideoMode) {
  // Find matching embed container for this track
  const targetContainer = document.querySelector(
    `[data-youtube-url="${youtubeUrl}"]`
  );
  
  if (targetContainer) {
    // Create visible YouTube player in container
    new YT.Player(targetContainer, {
      height: '100%',
      width: '100%',
      videoId: videoId,
      playerVars: { autoplay: 1, controls: 1 }
    });
  }
} else {
  // Create hidden player for audio-only mode
  new YT.Player(hiddenContainer, {
    height: '1',
    width: '1',
    videoId: videoId,
    playerVars: { autoplay: 1, controls: 0 }
  });
}
```

#### Chapter End Detection
```javascript
// Precise chapter boundary detection
if (timeIntoChapter >= (chapterDuration * 0.95)) {
  console.log('Chapter ending detected, starting interlude...');
  startInterludeSequence(chapterIndex);
}
```

#### YouTube API Integration
```javascript
// Robust YouTube player management
function loadYouTubeAPI() {
  if (window.YT && window.YT.Player) {
    youtubeInterludeSystem.youtubeAPIReady = true;
    return;
  }
  
  const script = document.createElement('script');
  script.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(script);
}
```

### 🎯 User Experience Features

- **Visual Feedback**: Clear indicators show when interludes are playing
- **Mode Persistence**: User's audio/video preference is maintained throughout the session
- **Responsive Design**: YouTube containers adapt to screen size and device type
- **Error Handling**: Graceful fallbacks if YouTube content is unavailable
- **Performance Optimized**: Hidden players use minimal resources in audio mode

### 🎼 Content Structure Integration

The interlude system works seamlessly with the Sanity CMS content structure:

```typescript
// Each chapter can have multiple interlude tracks
chapters: [{
  title: string,
  startTime: string,
  endTime: string,
  interludeTracks: [{
    songTitle: string,
    artist: string,
    streamingLinks: [{
      platform: 'youtube-music',
      url: string,
      embedCode?: string  // Fallback for legacy content
    }],
    fallbackAudio?: file  // Backup audio file
  }]
}]
```

### 🔄 Interlude Flow

1. **Chapter Completion** → System detects chapter is ending
2. **Podcast Pause** → Main audio/video pauses at chapter boundary  
3. **Interlude Start** → YouTube track begins playing (visible or hidden based on mode)
4. **User Interaction** → Users can switch between audio/video modes mid-interlude
5. **Track Completion** → YouTube track ends, system cleans up player
6. **Podcast Resume** → Next chapter begins automatically

This creates a seamless, radio-like experience where music bridges podcast content naturally while giving users complete control over their viewing preference.

## 🎵 Multi-Format Lyrics Reader System

The website features a comprehensive lyrics system that provides real-time synchronization with music playback, supporting multiple lyrics formats and karaoke-style highlighting for an enhanced listening experience.

### ✨ Core Features

1. **Multi-Format Support** - Automatically detects and parses LRC, SRT, JSON, and simple text formats
2. **Real-Time Synchronization** - Lyrics highlight in perfect sync with audio playback
3. **Progressive Highlighting** - Current line highlighted with #303030 background, sung lines stay colored
4. **Smart Auto-Scroll** - Automatically centers the current lyric line in the display area
5. **Three Display Modes** - Toggle between hidden, synchronized, and static lyrics views
6. **Flexible Input Methods** - Support both text input and file upload through Sanity CMS
7. **Format Auto-Detection** - Intelligent parsing with manual format hints as fallback

### 🎯 Supported Lyrics Formats

The system automatically detects and parses multiple lyrics formats:

```javascript
// LRC (Synchronized) Format
[00:12.34] Here we are now, entertain us
[00:15.67] I feel stupid and contagious

// SRT Format  
1
00:00:12,340 --> 00:00:15,670
Here we are now, entertain us

// JSON Format
[{"time": "00:12.34", "text": "Here we are now, entertain us"}]

// Simple Text Format
[Verse 1]
Here we are now, entertain us
I feel stupid and contagious
```

### 🎨 Visual Experience

#### Synchronized Mode
- **Real-time highlighting** - Current lyric line gets #303030 background with #F1D4A1 text
- **Progressive coloring** - Previously sung lines turn #303030 color permanently
- **Smooth transitions** - Lines scale slightly when active for visual emphasis
- **Auto-scroll** - Display smoothly centers the active line

#### Static Mode
- **Full lyrics display** - Complete lyrics shown in scrollable container
- **Click navigation** - Click any line to jump to that timestamp
- **Clean typography** - Professional formatting with proper line spacing

#### Hidden Mode
- **Clean interface** - Focus purely on the music without visual distractions
- **Toggle availability** - Easy access to lyrics when needed

### 🔧 Technical Implementation

#### Smart Format Detection
```javascript
// Auto-detection with fallback to manual hints
function parseLyricsData(rawData, formatHint = 'auto') {
  let format = formatHint || 'auto';
  if (format === 'auto') {
    if (/^\d+\s*[\r\n]+\d{2}:\d{2}:\d{2},\d{3}/.test(rawData)) {
      format = 'srt';
    } else if (/\[\d{2}:\d{2}\.\d{2}\]/.test(rawData)) {
      format = 'lrc';
    } // ... additional format checks
  }
}
```

#### Real-Time Synchronization
```javascript
// Continuous sync with audio playback
wavesurfer.on('audioprocess', () => {
  const time = wavesurfer.getCurrentTime();
  const currentIndex = parsedLyrics.synced.findIndex((lyric, index) => {
    const nextLyric = parsedLyrics.synced[index + 1];
    return time >= lyric.time && (!nextLyric || time < nextLyric.time);
  });
  setCurrentLyricIndex(currentIndex);
});
```

#### Auto-Scroll Implementation
```javascript
// Smooth scrolling to keep current line centered
const targetScrollTop = relativeTop - (containerHeight / 2) + (lineRect.height / 2);
lyricsContainer.scrollTo({
  top: Math.max(0, targetScrollTop),
  behavior: 'smooth'
});
```

### 📊 Content Management Integration

Lyrics data is managed through Sanity CMS with flexible input options:

```typescript
// Sanity schema supports multiple input methods
lyrics: {
  lyricsData: text,          // Paste lyrics in any supported format
  lyricsFile: file,          // Upload .lrc, .srt, .json, or .txt files
  enableSync: boolean,       // Enable real-time synchronization
  formatHint: string         // Optional format specification
}
```

### 🎭 User Experience Features

- **Instant Loading** - Lyrics parse and display immediately when available
- **Seamless Mode Switching** - Toggle between modes without interrupting playback
- **Mobile Optimized** - Responsive design works perfectly on all screen sizes
- **Performance Efficient** - Minimal impact on audio playback performance
- **Error Resilient** - Graceful fallbacks when lyrics can't be parsed or synchronized

### 🔄 Workflow Integration

The lyrics system integrates seamlessly with the existing music player:

1. **Content Upload** → Admin uploads lyrics via Sanity CMS (text or file)
2. **Format Detection** → System automatically detects and parses lyrics format
3. **Player Integration** → Lyrics become available in music player interface
4. **Real-Time Sync** → Lyrics highlight synchronously during audio playback
5. **Progressive Display** → Sung lyrics remain colored, creating visual progress

This creates a complete karaoke-like experience that enhances music listening while maintaining focus on the audio content.

## 📝 Multi-Format Transcript System

The website features a comprehensive transcript system that provides real-time synchronization with podcast content, supporting multiple transcript formats and seamless mode switching between audio and video experiences.

### ✨ Core Features

1. **Multi-Format Support** - Automatically detects and parses WEBVTT, SRT, JSON, CSV, and simple timestamp formats
2. **Immediate Loading** - Transcripts display instantly on page load, no waiting for media player initialization  
3. **Dual-Mode Display** - Audio mode shows scrolling transcript, video mode displays synchronized subtitles
4. **Real-Time Sync** - Continuous timestamp tracking with automatic segment highlighting
5. **Smart Reconnection** - Seamlessly switches between audio and video players when modes change
6. **Auto-Visibility** - Automatically shows transcript when content is available

### 🎯 Format Detection & Parsing

The system automatically detects transcript formats:

```javascript
// WEBVTT Format
WEBVTT

00:00:01.419 --> 00:00:10.320
I don't know who I am...

// SRT Format  
1
00:00:01,419 --> 00:00:10,320
I don't know who I am...

// JSON Format
[{"start": "00:01.419", "end": "00:10.320", "text": "I don't know who I am..."}]

// Simple Timestamp Format
[00:01.419] I don't know who I am...
00:01.419: I don't know who I am...
```

### 🔄 Mode Switching Behavior

#### Audio Mode
- **Scrolling Transcript**: Full transcript displayed in scrollable container
- **Active Highlighting**: Current segment highlighted as audio progresses
- **Click Navigation**: Click any segment to jump to that timestamp
- **Auto-Scroll**: Automatically scrolls to keep active segment visible

#### Video Mode  
- **Subtitle Overlay**: Transcript appears as subtitles over video content
- **Professional Styling**: High-contrast text with shadows and background
- **Real-Time Updates**: Subtitles change continuously as video progresses
- **Non-Intrusive**: Positioned to not interfere with video controls

### 🔧 Technical Implementation

#### Smart Media Player Integration
```javascript
// Automatic reconnection when switching modes
reconnectMediaPlayer() {
  const newMediaPlayer = window.currentMediaPlayer;
  if (newMediaPlayer !== this.mediaPlayer) {
    this.mediaPlayer = newMediaPlayer;
    this.connectToMediaPlayer();
  }
}
```

#### Format-Agnostic Parsing
```javascript
// Unified parsing system for all formats
parseMultipleFormats(rawData) {
  if (this.isWEBVTT(rawData)) return this.parseWEBVTT(rawData);
  if (this.isSRT(rawData)) return this.parseSRT(rawData);
  if (this.isJSON(rawData)) return this.parseJSON(rawData);
  // ... additional format handlers
}
```

#### Real-Time Synchronization
```javascript
// Continuous sync with media playback
syncTranscript(currentTime) {
  const activeSegment = this.findActiveSegment(currentTime);
  if (this.isVideoMode) {
    this.displaySubtitle(activeSegment);
  } else {
    this.scrollToActiveSegment(activeSegment);
  }
}
```

### 📊 Content Management Integration

Transcript data is managed through Sanity CMS with flexible input options:

```typescript
// Sanity schema supports multiple input methods
transcript: {
  transcriptData: string,      // Paste transcript in any supported format
  transcriptFile: file,        // Upload .vtt, .srt, .json, .txt, or .csv files
  defaultSpeaker: string,      // Default speaker name (e.g., "Host")
  enableSync: boolean,         // Auto-enabled when transcript data exists
  formatHint: string          // Optional format specification for edge cases
}
```

### 🎨 User Experience Features

- **Instant Availability**: Transcript loads immediately, before media player is ready
- **Seamless Transitions**: Smooth switching between audio transcript and video subtitles
- **Professional Styling**: Clean, readable design with proper contrast and typography
- **Accessibility**: High contrast subtitles with text shadows for visibility over any video content
- **Performance Optimized**: Efficient parsing and rendering with minimal impact on page load

### 🔄 Workflow Integration

The transcript system integrates seamlessly with the existing interlude system:

1. **Page Load** → Transcript parses and displays immediately
2. **Media Play** → Real-time sync begins automatically  
3. **Mode Switch** → Transcript adapts between scrolling/subtitle modes
4. **Interlude Play** → Transcript pauses during music, resumes after
5. **Chapter Navigation** → Transcript jumps to corresponding segments

This creates a unified content experience where transcripts enhance both audio-focused listening and video viewing modes.

## 📁 Project Structure

```
/
├── public/
│   ├── _headers              # CSP and security headers
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── SpotifyEmbed.jsx  # Spotify embed component (legacy)
│   │   └── WaveSurferPlayer.jsx
│   ├── layouts/
│   │   └── BaseLayout.astro  # Main layout template
│   ├── pages/
│   │   ├── index.astro       # Homepage
│   │   ├── podcast.astro     # Podcast listing page
│   │   └── podcast/
│   │       └── [slug].astro  # Individual episode pages
│   ├── lib/
│   │   └── sanity.js         # Sanity client configuration
│   └── styles/
│       └── global.css        # Global styles
├── schemas/
│   └── podcastEpisode.ts     # Sanity schema definitions
└── package.json
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Sanity account and project

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd acerbic-inq-website
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Sanity**
   - Update `src/lib/sanity.js` with your project details
   - Set up your Sanity project with the podcast episode schema

4. **Development server**
   ```bash
   npm run dev
   ```

5. **Build for production**
   ```bash
   npm run build
   ```

## 🎼 Content Schema

### Music Post Structure
```typescript
{
  title: string,
  slug: slug,
  publishedAt: datetime,
  excerpt?: string,
  coverArt?: image,
  releaseType?: 'single' | 'ep' | 'album' | 'demo',
  tracks: [{
    trackNumber: number,
    trackTitle: string,
    audioFile: file,
    duration?: string,
    lyrics?: {
      lyricsData?: string,         // Multi-format lyrics content (LRC, SRT, JSON, text)
      lyricsFile?: file,           // Alternative: upload lyrics file (.lrc, .srt, .json, .txt)
      enableSync?: boolean,        // Enable real-time sync (default: true)
      formatHint?: string         // Optional format hint ('auto', 'lrc', 'srt', 'json', 'text')
    },
    trackStreamingLinks?: [{
      platform: 'spotify' | 'apple-music' | 'youtube-music' | 'soundcloud' | 'bandcamp',
      url: string
    }]
  }],
  streamingLinks?: [{
    platform: string,
    url: string
  }],
  credits?: string,
  body?: PortableText              // Article content about the release
}
```

### Podcast Episode Structure
```typescript
{
  title: string,
  slug: slug,
  episodeNumber: number,
  audioFile: file,
  videoFile?: file,
  chapters: [{
    title: string,
    startTime: string,
    endTime: string,
    interludeTracks: [{
      songTitle: string,
      artist: string,
      streamingLinks: [{
        platform: 'youtube-music' | 'spotify' | 'apple-music',
        url: string
      }],
      fallbackAudio?: file
    }]
  }],
  transcript?: {
    transcriptData: string,      // Multi-format transcript content (WEBVTT, SRT, JSON, etc.)
    transcriptFile?: file,       // Alternative: upload transcript file (.vtt, .srt, .json, .txt, .csv)
    defaultSpeaker?: string,     // Default speaker name (e.g., "Host", "Guest")
    enableSync?: boolean,        // Enable real-time sync (auto-enabled when data exists)
    formatHint?: string         // Optional format hint for edge cases
  }
}
```

## 🔧 Configuration

### Content Security Policy
The website includes CSP headers in `public/_headers` for security:
```
Content-Security-Policy: 
  script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.scdn.co;
  frame-src 'self' https://www.youtube.com https://youtube.com;
```

### YouTube Integration
The interlude system uses the YouTube IFrame API:
- Automatic API loading
- Hidden player for audio-only playback
- Error handling and fallback support

## 📱 Browser Support

- **Modern browsers** with ES6+ support
- **YouTube IFrame API** compatibility
- **HTML5 audio/video** support required

## 🚨 Important Notes

### Spotify SDK Limitations
**As of 2024, Spotify no longer allows individual developers to access the Spotify Web Playback SDK.** The SDK is now restricted to businesses that meet specific criteria and go through an approval process. 

For this reason, the interlude system has been migrated to use YouTube's IFrame API, which provides:
- ✅ No authentication required
- ✅ Better reliability for public websites  
- ✅ Wider content availability
- ✅ Simpler implementation

Any remaining Spotify-related code in this project is legacy and non-functional due to these policy changes.

## 🛠️ Commands

| Command | Action |
|---------|--------|
| `npm install` | Install dependencies |
| `npm run dev` | Start dev server at `localhost:4321` |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run astro ...` | Run Astro CLI commands |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- **Live Site**: [acerbicinq.com](https://acerbicinq.com)
- **Astro Documentation**: [docs.astro.build](https://docs.astro.build)
- **Sanity Documentation**: [sanity.io/docs](https://sanity.io/docs)
- **YouTube IFrame API**: [developers.google.com/youtube/iframe_api_reference](https://developers.google.com/youtube/iframe_api_reference)

---

Built with ❤️ using Astro and modern web technologies.