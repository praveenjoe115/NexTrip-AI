/**
 * voice.js — NexTrip AI Voice Assistant
 * Handles speech recognition, voice commands, and text-to-speech.
 * Uses global helpers: showToast (from main.js)
 */

(function() {
    'use strict';

    // --- Browser Support Checks ---
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const speechSupported = !!SpeechRecognition;
    const synthesisSupported = !!window.speechSynthesis;

    // --- DOM Elements ---
    let voiceBtn = document.getElementById('voice-btn');
    let voiceModal = null;

    // --- State ---
    let recognition = null;
    let isListening = false;
    let isModalOpen = false;

    // --- Constants ---
    const STORAGE_KEY = 'nextrip_voice_logs';

    // --- Helper: Log voice activity ---
    function logVoiceActivity(command, status = 'success') {
        const logs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        logs.push({
            timestamp: new Date().toISOString(),
            command: command,
            status: status
        });
        if (logs.length > 50) logs.splice(0, logs.length - 50);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    }

    // --- Text-to-Speech ---
    function speakText(text, callback) {
        if (!synthesisSupported) {
            console.warn('Speech synthesis not supported');
            if (callback) callback();
            return;
        }

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;

        // Select a voice (optional)
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(voice => voice.lang.startsWith('en')) || voices[0];
        if (preferredVoice) utterance.voice = preferredVoice;

        utterance.onend = () => {
            if (callback) callback();
        };

        utterance.onerror = (e) => {
            console.warn('Speech synthesis error:', e);
            if (callback) callback();
        };

        window.speechSynthesis.speak(utterance);
    }

    // --- Parse Voice Commands ---
    function parseCommand(transcript) {
        const lower = transcript.toLowerCase().trim();

        // Navigation commands
        if (lower.includes('open planner') || lower.includes('go to planner')) {
            return { action: 'navigate', url: '/planner', message: 'Opening Trip Planner' };
        }
        if (lower.includes('open maps') || lower.includes('go to maps')) {
            return { action: 'navigate', url: '/maps', message: 'Opening Maps' };
        }
        if (lower.includes('open weather') || lower.includes('go to weather') || lower.includes('weather')) {
            // If "weather in X" then we can navigate to weather page with city param
            const match = lower.match(/weather in (.+)/);
            if (match && match[1]) {
                const city = match[1].trim();
                return { action: 'weather', city: city, message: `Getting weather for ${city}` };
            }
            return { action: 'navigate', url: '/weather', message: 'Opening Weather' };
        }
        if (lower.includes('open budget') || lower.includes('go to budget') || lower.includes('budget')) {
            return { action: 'navigate', url: '/budget', message: 'Opening Budget Planner' };
        }
        if (lower.includes('open favorites') || lower.includes('go to favorites') || lower.includes('favorites')) {
            return { action: 'navigate', url: '/favorites', message: 'Opening Favorites' };
        }
        if (lower.includes('open journal') || lower.includes('go to journal') || lower.includes('journal')) {
            return { action: 'navigate', url: '/journal', message: 'Opening Journal' };
        }
        if (lower.includes('open analytics') || lower.includes('go to analytics') || lower.includes('analytics')) {
            return { action: 'navigate', url: '/analytics', message: 'Opening Analytics' };
        }
        if (lower.includes('open emergency') || lower.includes('go to emergency') || lower.includes('sos')) {
            return { action: 'navigate', url: '/emergency', message: 'Opening Emergency Hub' };
        }

        // Search commands: "search Paris" etc.
        const searchMatch = lower.match(/search (.+)/);
        if (searchMatch && searchMatch[1]) {
            const query = searchMatch[1].trim();
            return { action: 'search', query: query, message: `Searching for ${query}` };
        }

        // Trip commands: "plan trip to Bali"
        const tripMatch = lower.match(/plan trip to (.+)/);
        if (tripMatch && tripMatch[1]) {
            const destination = tripMatch[1].trim();
            return { action: 'plan', destination: destination, message: `Planning trip to ${destination}` };
        }

        // Help command
        if (lower.includes('help') || lower.includes('what can you do')) {
            return { action: 'help', message: 'I can open pages, search, plan trips, and get weather. Try saying "open planner", "search Paris", or "plan trip to Bali".' };
        }

        // Fallback: unknown command
        return { action: 'unknown', message: 'Sorry, I didn\'t understand that. Say "help" for commands.' };
    }

    // --- Execute Command ---
    function executeCommand(commandResult) {
        const { action, message, url, query, city, destination } = commandResult;

        // Speak the message
        speakText(message);

        // Show toast
        window.showToast(message, 'info');

        // Log
        logVoiceActivity(message);

        // Perform action
        switch (action) {
            case 'navigate':
                setTimeout(() => {
                    window.location.href = url;
                }, 800);
                break;

            case 'search':
                // Navigate to nearby or places? We'll go to maps page with query
                setTimeout(() => {
                    window.location.href = `/maps?q=${encodeURIComponent(query)}`;
                }, 800);
                break;

            case 'plan':
                // Navigate to planner page with destination pre-filled (via URL param)
                setTimeout(() => {
                    window.location.href = `/planner?destination=${encodeURIComponent(destination)}`;
                }, 800);
                break;

            case 'weather':
                // Navigate to weather page with city param
                setTimeout(() => {
                    window.location.href = `/weather?city=${encodeURIComponent(city)}`;
                }, 800);
                break;

            case 'help':
                // Already spoken, just show a longer toast
                window.showToast('Try: "open planner", "search Paris", "plan trip to Bali", "weather in London"', 'info', 6000);
                break;

            case 'unknown':
            default:
                // Already spoken
                break;
        }
    }

    // --- Initialize Speech Recognition ---
    function initSpeechRecognition() {
        if (!speechSupported) {
            console.warn('Speech recognition not supported in this browser.');
            return;
        }

        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = function() {
            isListening = true;
            updateButtonState(true);
            if (voiceModal) {
                voiceModal.querySelector('.voice-status').textContent = 'Listening...';
                voiceModal.querySelector('.voice-status').style.color = '#00f0ff';
            }
            window.showToast('Listening...', 'info');
        };

        recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            const confidence = event.results[0][0].confidence;
            console.log('Voice input:', transcript, 'confidence:', confidence);

            if (voiceModal) {
                voiceModal.querySelector('.voice-text').textContent = `"${transcript}"`;
            }

            // Parse and execute
            const commandResult = parseCommand(transcript);
            executeCommand(commandResult);

            // Stop listening after command
            recognition.stop();
        };

        recognition.onerror = function(event) {
            console.warn('Speech recognition error:', event.error);
            isListening = false;
            updateButtonState(false);
            if (voiceModal) {
                voiceModal.querySelector('.voice-status').textContent = 'Error';
                voiceModal.querySelector('.voice-status').style.color = '#ff3d8a';
            }
            let msg = 'Voice error: ';
            switch (event.error) {
                case 'not-allowed': msg += 'Microphone permission denied.'; break;
                case 'no-speech': msg += 'No speech detected.'; break;
                case 'audio-capture': msg += 'No microphone found.'; break;
                default: msg += event.error;
            }
            window.showToast(msg, 'error');
            logVoiceActivity('error: ' + event.error, 'error');
        };

        recognition.onend = function() {
            isListening = false;
            updateButtonState(false);
            if (voiceModal) {
                voiceModal.querySelector('.voice-status').textContent = 'Idle';
                voiceModal.querySelector('.voice-status').style.color = '#b0b0d0';
            }
        };
    }

    // --- Update Floating Button State ---
    function updateButtonState(listening) {
        if (voiceBtn) {
            if (listening) {
                voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
                voiceBtn.classList.add('listening');
                voiceBtn.style.background = 'linear-gradient(135deg, #ff3d8a, #ff6b6b)';
                voiceBtn.style.boxShadow = '0 0 30px rgba(255,61,138,0.5)';
            } else {
                voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
                voiceBtn.classList.remove('listening');
                voiceBtn.style.background = 'linear-gradient(135deg, #00f0ff, #b44aff)';
                voiceBtn.style.boxShadow = '0 0 30px rgba(0,240,255,0.4)';
            }
        }
    }

    // --- Toggle Voice Assistant ---
    function toggleVoiceAssistant() {
        if (!speechSupported) {
            window.showToast('Speech recognition not supported in this browser.', 'error');
            return;
        }

        if (isListening) {
            // Stop listening
            recognition.stop();
        } else {
            // Start listening
            recognition.start();
        }
    }

    // --- Create Voice Modal ---
    function createVoiceModal() {
        if (document.getElementById('voice-modal')) return;

        const modal = document.createElement('div');
        modal.id = 'voice-modal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(11,11,26,0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 2rem;
            padding: 2rem 2.5rem;
            max-width: 400px;
            width: 90%;
            z-index: 10002;
            text-align: center;
            box-shadow: 0 20px 60px rgba(0,0,0,0.8);
            display: none;
            color: #fff;
        `;

        modal.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 0.5rem;">
                <i class="fas fa-microphone" style="color: #00f0ff;"></i>
            </div>
            <div class="voice-status" style="font-size: 1.2rem; font-weight: 600; color: #b0b0d0; margin-bottom: 0.5rem;">Idle</div>
            <div class="voice-text" style="font-size: 1.1rem; color: rgba(255,255,255,0.7); min-height: 2rem; margin-bottom: 1rem;">Say a command</div>
            <div style="display: flex; gap: 0.75rem; justify-content: center;">
                <button id="voice-modal-toggle" style="background: linear-gradient(135deg, #00f0ff, #b44aff); border: none; padding: 0.6rem 1.8rem; border-radius: 9999px; color: #fff; font-weight: 600; cursor: pointer; transition: all 0.3s;">
                    <i class="fas fa-microphone"></i> Start
                </button>
                <button id="voice-modal-close" style="background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); padding: 0.6rem 1.8rem; border-radius: 9999px; color: rgba(255,255,255,0.6); cursor: pointer; transition: all 0.3s;">
                    Close
                </button>
            </div>
            <div style="margin-top: 1rem; font-size: 0.75rem; color: rgba(255,255,255,0.3);">
                Try: "open planner", "search Paris", "plan trip to Bali"
            </div>
        `;

        document.body.appendChild(modal);
        voiceModal = modal;

        // Modal toggle button
        document.getElementById('voice-modal-toggle').addEventListener('click', function() {
            toggleVoiceAssistant();
            // Update button text based on listening state
            setTimeout(() => {
                if (isListening) {
                    this.innerHTML = '<i class="fas fa-microphone-slash"></i> Stop';
                } else {
                    this.innerHTML = '<i class="fas fa-microphone"></i> Start';
                }
            }, 100);
        });

        document.getElementById('voice-modal-close').addEventListener('click', function() {
            if (isListening) recognition.stop();
            voiceModal.style.display = 'none';
            isModalOpen = false;
        });
    }

    // --- Show Voice Modal ---
    function showVoiceModal() {
        if (!voiceModal) createVoiceModal();
        if (voiceModal) {
            voiceModal.style.display = 'block';
            isModalOpen = true;
            // Update toggle button text
            const toggleBtn = document.getElementById('voice-modal-toggle');
            if (toggleBtn) {
                toggleBtn.innerHTML = isListening ? '<i class="fas fa-microphone-slash"></i> Stop' : '<i class="fas fa-microphone"></i> Start';
            }
            // Set status
            const status = voiceModal.querySelector('.voice-status');
            if (status) {
                status.textContent = isListening ? 'Listening...' : 'Idle';
                status.style.color = isListening ? '#00f0ff' : '#b0b0d0';
            }
        }
    }

    // --- Create Floating Voice Button (if not exists) ---
    function createFloatingButton() {
        if (document.getElementById('voice-btn')) return;

        const btn = document.createElement('button');
        btn.id = 'voice-btn';
        btn.innerHTML = '<i class="fas fa-microphone"></i>';
        btn.style.cssText = `
            position: fixed;
            bottom: 6rem;
            right: 2rem;
            z-index: 999;
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #00f0ff, #b44aff);
            box-shadow: 0 0 30px rgba(0,240,255,0.4);
            border: none;
            color: #fff;
            font-size: 1.8rem;
            cursor: pointer;
            transition: all 0.3s;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        btn.addEventListener('mouseenter', () => {
            btn.style.transform = 'scale(1.08)';
            btn.style.boxShadow = '0 0 50px rgba(0,240,255,0.6)';
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = 'scale(1)';
            btn.style.boxShadow = '0 0 30px rgba(0,240,255,0.4)';
        });

        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            if (speechSupported) {
                // Toggle modal or direct listening?
                // We'll toggle the modal open/close
                if (voiceModal && voiceModal.style.display === 'block') {
                    // If modal open, close it
                    if (isListening) recognition.stop();
                    voiceModal.style.display = 'none';
                    isModalOpen = false;
                } else {
                    showVoiceModal();
                }
            } else {
                window.showToast('Voice not supported', 'error');
            }
        });

        document.body.appendChild(btn);
        voiceBtn = btn;
    }

    // --- Initialize ---
    function init() {
        // Create floating button if not present
        createFloatingButton();

        // Create modal
        createVoiceModal();

        // Init speech recognition if supported
        if (speechSupported) {
            initSpeechRecognition();
            console.log('Voice assistant initialized.');
        } else {
            console.warn('Speech recognition not supported.');
            window.showToast('Voice assistant not supported in this browser.', 'warning');
        }
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // --- Expose public API ---
    window.VoiceAssistant = {
        startListening: function() {
            if (speechSupported && recognition && !isListening) {
                recognition.start();
            }
        },
        stopListening: function() {
            if (speechSupported && recognition && isListening) {
                recognition.stop();
            }
        },
        speak: speakText,
        toggle: toggleVoiceAssistant,
        isSupported: speechSupported
    };

})();