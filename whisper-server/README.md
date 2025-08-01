# Whisper Audio Sync Server

This is a local server that uses OpenAI's Whisper to automatically sync lyrics with audio files.

## Setup

1. **Install Python dependencies:**
   ```bash
   cd whisper-server
   pip install -r requirements.txt
   ```

2. **Start the server:**
   ```bash
   python server.py
   ```

3. **Server will run on:**
   ```
   http://localhost:5000
   ```

## How it works

1. **Upload Audio + Lyrics**: In Sanity Studio, upload an audio file and paste your raw lyrics
2. **Click "Process with Whisper"**: The plugin sends both to this server
3. **Whisper Transcription**: Server transcribes the audio with timestamps
4. **Lyric Alignment**: Matches your provided lyrics with the Whisper transcript
5. **Return Synced Data**: Sends back timestamped lyrics in JSON format

## API Endpoints

- `POST /sync-lyrics` - Main endpoint for processing
- `GET /health` - Health check

## Requirements

- Python 3.8+
- ~1GB disk space for Whisper model
- FFmpeg (usually installed with Whisper)

## Model Options

You can change the Whisper model in `server.py`:
- `tiny` - Fastest, least accurate
- `base` - Default, good balance
- `small` - Better accuracy
- `medium` - Even better accuracy  
- `large` - Best accuracy, slower

## Troubleshooting

- Make sure port 5000 is available
- Check that audio files are accessible via URL
- Ensure CORS is working for Sanity Studio domain