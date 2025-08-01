@app.route('/transcribe', methods=['POST'])
def transcribe_audio():
    try:
        if 'audio' not in request.files:
            return jsonify({'error': 'No audio file provided'}), 400
        audio_file = request.files['audio']
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            audio_file.save(temp_file)
            temp_audio_path = temp_file.name
        try:
            print("Transcribing audio with Whisper (no lyrics alignment)...")
            result = model.transcribe(temp_audio_path)
            transcript = result.get('text', '')
            print(f"Transcription complete. Length: {len(transcript)} characters")
            return jsonify({
                'success': True,
                'transcription': transcript
            })
        finally:
            os.unlink(temp_audio_path)
    except Exception as e:
        print(f"Error processing transcription: {str(e)}")
        return jsonify({'error': str(e)}), 500
#!/usr/bin/env python3
"""
Local Whisper Server for Audio-Lyrics Synchronization
Requires: pip install openai-whisper flask flask-cors requests
"""

import os
import tempfile
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS
import whisper
from difflib import SequenceMatcher
import re

app = Flask(__name__)
CORS(app)  # Enable CORS for Sanity Studio

# Load Whisper model (you can change to 'small', 'medium', 'large' for better accuracy)
print("Loading Whisper model...")
model = whisper.load_model("base")
print("Whisper model loaded!")

def clean_text(text):
    """Clean text for better matching"""
    # Remove extra whitespace and normalize
    text = re.sub(r'\s+', ' ', text.strip().lower())
    # Remove punctuation for better matching
    text = re.sub(r'[^\w\s]', '', text)
    return text

def align_lyrics_with_transcript(transcript_segments, provided_lyrics):
    """
    Align provided lyrics with Whisper transcript segments
    Returns timestamped lyrics based on the best matches
    """
    # Split provided lyrics into lines
    lyric_lines = [line.strip() for line in provided_lyrics.split('\n') if line.strip()]
    
    # Clean lyrics for matching
    clean_lyrics = [clean_text(line) for line in lyric_lines]
    
    # Get transcript text segments
    transcript_texts = []
    for segment in transcript_segments:
        transcript_texts.append({
            'text': clean_text(segment['text']),
            'start': segment['start'],
            'end': segment['end'],
            'original': segment['text']
        })
    
    aligned_lyrics = []
    used_segments = set()
    
    # Try to match each lyric line with transcript segments
    for i, lyric_line in enumerate(clean_lyrics):
        if not lyric_line:
            continue
            
        best_match = None
        best_ratio = 0
        best_segment_idx = -1
        
        # Find best matching transcript segment
        for j, transcript_item in enumerate(transcript_texts):
            if j in used_segments:
                continue
                
            ratio = SequenceMatcher(None, lyric_line, transcript_item['text']).ratio()
            
            if ratio > best_ratio and ratio > 0.3:  # Minimum similarity threshold
                best_ratio = ratio
                best_match = transcript_item
                best_segment_idx = j
        
        if best_match:
            aligned_lyrics.append({
                'start': best_match['start'],
                'end': best_match['end'],
                'text': lyric_lines[i]  # Use original lyric text, not cleaned
            })
            used_segments.add(best_segment_idx)
        else:
            # If no good match found, estimate timing
            if aligned_lyrics:
                # Place after last aligned segment
                last_end = aligned_lyrics[-1]['end']
                aligned_lyrics.append({
                    'start': last_end,
                    'end': last_end + 3.0,  # Default 3 second duration
                    'text': lyric_lines[i]
                })
            else:
                # Place at beginning if no previous segments
                aligned_lyrics.append({
                    'start': 0.0,
                    'end': 3.0,
                    'text': lyric_lines[i]
                })
    
    # Sort by start time
    aligned_lyrics.sort(key=lambda x: x['start'])
    
    return aligned_lyrics

@app.route('/sync-lyrics', methods=['POST'])
def sync_lyrics():
    try:
        data = request.get_json()
        audio_url = data.get('audioUrl')
        lyrics = data.get('lyrics')
        
        if not audio_url or not lyrics:
            return jsonify({'error': 'audioUrl and lyrics are required'}), 400
        
        print(f"Processing audio from: {audio_url}")
        print(f"Lyrics length: {len(lyrics)} characters")
        
        # Download audio file
        response = requests.get(audio_url)
        if response.status_code != 200:
            return jsonify({'error': 'Failed to download audio file'}), 400
        
        # Save to temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix='.wav') as temp_file:
            temp_file.write(response.content)
            temp_audio_path = temp_file.name
        
        try:
            # Transcribe with Whisper
            print("Transcribing audio with Whisper...")
            result = model.transcribe(temp_audio_path, word_timestamps=True)
            
            print(f"Whisper found {len(result['segments'])} segments")
            
            # Align provided lyrics with transcript
            print("Aligning lyrics with transcript...")
            synced_lyrics = align_lyrics_with_transcript(result['segments'], lyrics)
            
            print(f"Created {len(synced_lyrics)} synced segments")
            
            return jsonify({
                'success': True,
                'syncedLyrics': synced_lyrics,
                'whisperSegments': len(result['segments']),
                'alignedSegments': len(synced_lyrics)
            })
            
        finally:
            # Clean up temp file
            os.unlink(temp_audio_path)
            
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'model': 'whisper-base'})

if __name__ == '__main__':
    print("🎵 Whisper Audio Sync Server")
    print("📍 Running on http://localhost:5000")
    print("🔧 Ready to sync your lyrics!")
    app.run(host='0.0.0.0', port=5000, debug=True)