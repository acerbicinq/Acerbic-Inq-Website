import { useState, useEffect } from 'preact/hooks';
import * as Tone from 'tone';

export default function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [autoplayEnabled, setAutoplayEnabled] = useState(false);
  const [audioContext, setAudioContext] = useState(null);
  const [userHasInteracted, setUserHasInteracted] = useState(false);
  const [showInitialPrompt, setShowInitialPrompt] = useState(false);
  const [hasShownPrompt, setHasShownPrompt] = useState(false);

  useEffect(() => {
    // Load saved settings
    const savedAutoplay = localStorage.getItem('audioAutoplayEnabled');
    const savedHasShownPrompt = localStorage.getItem('audioPromptShown');
    
    if (savedAutoplay !== null) {
      setAutoplayEnabled(JSON.parse(savedAutoplay));
    }
    
    if (savedHasShownPrompt !== null) {
      setHasShownPrompt(JSON.parse(savedHasShownPrompt));
    }

    setAudioContext(Tone.context);

    // Show initial prompt if first visit
    if (!savedHasShownPrompt) {
      setTimeout(() => {
        setShowInitialPrompt(true);
        setIsOpen(true);
      }, 1500); // Show after 1.5 seconds

      // Auto-hide after 15 seconds if no interaction
      setTimeout(() => {
        if (showInitialPrompt && !userHasInteracted) {
          setShowInitialPrompt(false);
          setIsOpen(false);
          setHasShownPrompt(true);
          localStorage.setItem('audioPromptShown', 'true');
        }
      }, 16500); // 1.5s + 15s
    }

    // Check if user has interacted
    const handleUserInteraction = async () => {
      if (!userHasInteracted) {
        setUserHasInteracted(true);
        try {
          await Tone.start();
          console.log('Audio context started');
        } catch (error) {
          console.error('Failed to start audio context:', error);
        }
      }
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, [userHasInteracted, showInitialPrompt]);

  const toggleAutoplay = async () => {
    const newValue = !autoplayEnabled;
    setAutoplayEnabled(newValue);
    localStorage.setItem('audioAutoplayEnabled', JSON.stringify(newValue));
    
    // Mark that user has interacted with settings
    if (showInitialPrompt) {
      setShowInitialPrompt(false);
      setHasShownPrompt(true);
      localStorage.setItem('audioPromptShown', 'true');
    }
    
    // If enabling autoplay, ensure audio context is started
    if (newValue && !userHasInteracted) {
      try {
        await Tone.start();
        setUserHasInteracted(true);
        console.log('Audio context started for autoplay');
      } catch (error) {
        console.error('Failed to start audio context:', error);
      }
    }
  };

  const getAudioContextStatus = () => {
    if (!audioContext) return 'Not initialized';
    return audioContext.state === 'running' ? 'Ready' : 'Suspended';
  };

  return (
    <>
      {/* Settings Toggle Button */}
      <button 
        class={`settings-toggle ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle settings panel"
      >
        ⚙️
      </button>

      {/* Settings Panel */}
      <div class={`settings-panel ${isOpen ? 'open' : ''}`}>
        <div class="settings-header">
          <h3>Audio Settings</h3>
          <button 
            class="close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close settings"
          >
            ×
          </button>
        </div>

        <div class="settings-content">
          {showInitialPrompt ? (
            <div class="initial-prompt">
              <h4>🎵 Enable Audio Previews?</h4>
              <p>Would you like to enable automatic audio previews when you hover over tracks?</p>
              <div class="prompt-buttons">
                <button 
                  class="prompt-btn enable-btn"
                  onClick={async () => {
                    if (!autoplayEnabled) {
                      await toggleAutoplay();
                    }
                    setShowInitialPrompt(false);
                    setIsOpen(false);
                  }}
                >
                  Yes, Enable
                </button>
                <button 
                  class="prompt-btn disable-btn"
                  onClick={() => {
                    setShowInitialPrompt(false);
                    setIsOpen(false);
                    setHasShownPrompt(true);
                    localStorage.setItem('audioPromptShown', 'true');
                  }}
                >
                  No Thanks
                </button>
              </div>
            </div>
          ) : (
            <>
              <div class="setting-item">
                <label class="setting-label">
                  <input
                    type="checkbox"
                    checked={autoplayEnabled}
                    onChange={toggleAutoplay}
                  />
                  <span class="checkmark"></span>
                  Allow Autoplay
                </label>
                <p class="setting-description">
                  Enable automatic playback of audio previews when hovering
                </p>
              </div>

          <div class="setting-item">
            <div class="status-info">
              <strong>Audio Status:</strong> {getAudioContextStatus()}
            </div>
            {!userHasInteracted && (
              <p class="interaction-needed">
                Click anywhere to enable audio playback
              </p>
            )}
          </div>

          <div class="setting-item">
            <button 
              class="test-audio-btn"
              onClick={async () => {
                try {
                  await Tone.start();
                  const synth = new Tone.Synth().toDestination();
                  synth.triggerAttackRelease("C4", "8n");
                  setUserHasInteracted(true);
                } catch (error) {
                  console.error('Test audio failed:', error);
                }
              }}
            >
              Test Audio
            </button>
          </div>
            </>
          )}
        </div>
      </div>

      {/* Overlay */}
      {isOpen && <div class="settings-overlay" onClick={() => setIsOpen(false)}></div>}

      <style>{`
        .settings-toggle {
          position: fixed;
          top: 50%;
          right: 20px;
          transform: translateY(-50%);
          width: 50px;
          height: 50px;
          border-radius: 50%;
          background: #007acc;
          color: white;
          border: none;
          cursor: pointer;
          font-size: 20px;
          box-shadow: 0 4px 12px rgba(0, 122, 204, 0.3);
          transition: all 0.3s ease;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .settings-toggle:hover {
          background: #005a9e;
          transform: translateY(-50%) scale(1.1);
          box-shadow: 0 6px 16px rgba(0, 122, 204, 0.4);
        }

        .settings-toggle.open {
          background: #005a9e;
          transform: translateY(-50%) rotate(45deg);
        }

        .settings-panel {
          position: fixed;
          top: 50%;
          right: -320px;
          transform: translateY(-50%);
          width: 300px;
          background: white;
          border-radius: 12px 0 0 12px;
          box-shadow: -4px 0 24px rgba(0, 0, 0, 0.15);
          transition: right 0.3s ease;
          z-index: 1001;
          max-height: 80vh;
          overflow-y: auto;
        }

        .settings-panel.open {
          right: 0;
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: #f8f9fa;
          border-radius: 12px 0 0 0;
          border-bottom: 1px solid #e9ecef;
        }

        .settings-header h3 {
          margin: 0;
          color: #333;
          font-size: 18px;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 24px;
          color: #666;
          cursor: pointer;
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .close-btn:hover {
          background: #e9ecef;
          color: #333;
        }

        .settings-content {
          padding: 20px;
        }

        .setting-item {
          margin-bottom: 24px;
        }

        .setting-item:last-child {
          margin-bottom: 0;
        }

        .setting-label {
          display: flex;
          align-items: center;
          cursor: pointer;
          font-weight: 500;
          color: #333;
          font-size: 16px;
        }

        .setting-label input[type="checkbox"] {
          display: none;
        }

        .checkmark {
          width: 20px;
          height: 20px;
          border: 2px solid #007acc;
          border-radius: 4px;
          margin-right: 12px;
          position: relative;
          transition: all 0.2s ease;
        }

        .setting-label input[type="checkbox"]:checked + .checkmark {
          background: #007acc;
        }

        .setting-label input[type="checkbox"]:checked + .checkmark::after {
          content: '✓';
          position: absolute;
          color: white;
          font-size: 14px;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }

        .setting-description {
          margin: 8px 0 0 32px;
          color: #666;
          font-size: 14px;
          line-height: 1.4;
        }

        .status-info {
          font-size: 14px;
          color: #333;
          margin-bottom: 8px;
        }

        .interaction-needed {
          color: #e74c3c;
          font-size: 13px;
          font-style: italic;
          margin: 0;
        }

        .test-audio-btn {
          background: #28a745;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: background 0.2s ease;
        }

        .test-audio-btn:hover {
          background: #218838;
        }

        .initial-prompt {
          text-align: center;
          padding: 10px 0;
        }

        .initial-prompt h4 {
          margin: 0 0 15px 0;
          color: #333;
          font-size: 18px;
        }

        .initial-prompt p {
          margin: 0 0 20px 0;
          color: #666;
          line-height: 1.4;
          font-size: 14px;
        }

        .prompt-buttons {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .prompt-btn {
          padding: 12px 20px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          transition: all 0.2s ease;
          min-width: 100px;
        }

        .enable-btn {
          background: #007acc;
          color: white;
        }

        .enable-btn:hover {
          background: #005a9e;
        }

        .disable-btn {
          background: #f8f9fa;
          color: #666;
          border: 1px solid #dee2e6;
        }

        .disable-btn:hover {
          background: #e9ecef;
          color: #333;
        }

        .settings-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.2);
          z-index: 999;
        }

        @media (max-width: 768px) {
          .settings-toggle {
            right: 15px;
            width: 45px;
            height: 45px;
            font-size: 18px;
          }

          .settings-panel {
            width: 280px;
            right: -300px;
          }

          .settings-panel.open {
            right: 0;
          }
        }
      `}</style>
    </>
  );
}