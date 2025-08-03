# Acerbic Inq Website

A modern podcast website featuring seamless interlude integration, built with Astro and Sanity CMS.

## 🎧 Features

- **Interactive Podcast Player** - Custom audio/video player with chapter navigation
- **Seamless Interlude System** - Automatic music playback between podcast chapters
- **YouTube Integration** - Auto-playing interludes using YouTube IFrame API
- **Chapter-Based Navigation** - Jump to specific podcast sections with timestamps
- **Responsive Design** - Optimized for desktop and mobile devices
- **Content Management** - Powered by Sanity CMS for easy content updates

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

The website features a unique interlude system that:

1. **Detects chapter endings** (95% through or within 0.5s of end)
2. **Pauses the main podcast** automatically
3. **Plays YouTube music tracks** seamlessly in the background
4. **Resumes the podcast** at the next chapter when music ends

### How It Works

```javascript
// Chapter end detection
if (timeIntoChapter >= (chapterDuration * 0.95)) {
  startInterludeSequence(chapterIndex);
}

// YouTube player creation
const player = new YT.Player(container, {
  videoId: videoId,
  playerVars: { autoplay: 1, controls: 0 }
});
```

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