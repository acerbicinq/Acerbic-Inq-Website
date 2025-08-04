# Acerbic Inq Website

A modern podcast website featuring seamless interlude integration, built with Astro and Sanity CMS.

## 🎧 Features

- **Interactive Podcast Player** - Custom audio/video player with seamless mode switching
- **Advanced Interlude System** - Automatic music playback with dual audio/video modes
- **YouTube Integration** - Dynamic video players that appear in-page during interludes
- **Audio/Video Mode Toggle** - Switch between clean audio-only and full video experience
- **Chapter-Based Navigation** - Jump to specific podcast sections with timestamps
- **Smart Container System** - YouTube videos play directly in embedded page containers
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
  transcript?: text
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