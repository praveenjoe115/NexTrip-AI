/**
 * emergency.js — NexTrip AI Emergency Hub
 * Handles location, SOS, emergency contacts, and travel alerts.
 * Uses global helpers: showToast (from main.js)
 */

(function() {
    'use strict';

    // --- DOM References ---
    const emergencyNumberEl = document.getElementById('emergency-number');
    const currentLocationEl = document.getElementById('current-location');
    const getLocationBtn = document.getElementById('get-location-btn');
    const nearbyServicesEl = document.getElementById('nearby-services');
    const sosBtn = document.getElementById('sos-btn');
    const travelAlertsEl = document.getElementById('travel-alerts');
    const loadingOverlay = document.getElementById('emergency-loading');

    // --- State ---
    let userLocation = null; // { lat, lng }
    let userCity = 'Unknown';

    // --- Constants ---
    const DEFAULT_LAT = 40.7128;
    const DEFAULT_LNG = -74.0060;
    const DEFAULT_CITY = 'New York';

    // --- Storage Key ---
    const STORAGE_KEY = 'nextrip_emergency_logs';

    // --- Helper: Show/Hide Loading ---
    function showLoading() {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
    }

    function hideLoading() {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
    }

    // --- Helper: Save Log Entry ---
    function saveLogEntry(action, details = '') {
        const logs = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        logs.push({
            timestamp: new Date().toISOString(),
            action: action,
            details: details,
            location: userCity || 'Unknown'
        });
        // Keep only last 50 entries
        if (logs.length > 50) logs.splice(0, logs.length - 50);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    }

    // --- Helper: Play Alert Sound (Web Audio) ---
    function playAlertSound() {
        try {
            const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioCtx.createOscillator();
            const gainNode = audioCtx.createGain();

            oscillator.type = 'sawtooth';
            oscillator.frequency.value = 440;
            gainNode.gain.value = 0.3;

            oscillator.connect(gainNode);
            gainNode.connect(audioCtx.destination);

            oscillator.start();
            setTimeout(() => {
                oscillator.stop();
            }, 500);
        } catch (e) {
            // Silently fail if Web Audio not supported
        }
    }

    // --- Get User Location ---
    function getLocation() {
        if (!navigator.geolocation) {
            window.showToast('Geolocation is not supported by your browser.', 'warning');
            return;
        }

        showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                userLocation = { lat: latitude, lng: longitude };
                updateLocationDisplay();
                // Reverse geocode to get city (simulate with a mock)
                // For demo, we'll use a hardcoded city or use a free reverse geocoding API?
                // We'll just use a placeholder and let user know.
                userCity = `Lat ${latitude.toFixed(4)}, Lng ${longitude.toFixed(4)}`;
                currentLocationEl.innerHTML = `
                    <p><strong>Latitude:</strong> ${latitude.toFixed(6)}</p>
                    <p><strong>Longitude:</strong> ${longitude.toFixed(6)}</p>
                    <p class="text-xs text-white/40">Approximate location (city not resolved)</p>
                `;
                // Fetch nearby services
                fetchNearbyServices(latitude, longitude);
                window.showToast('Location acquired!', 'success');
                saveLogEntry('Location acquired', `lat: ${latitude}, lng: ${longitude}`);
                hideLoading();
            },
            (error) => {
                console.error('Geolocation error:', error);
                let msg = 'Unable to get location. ';
                if (error.code === 1) msg += 'Permission denied.';
                else if (error.code === 2) msg += 'Position unavailable.';
                else if (error.code === 3) msg += 'Request timeout.';
                window.showToast(msg, 'error');
                hideLoading();
                // Use default location
                userLocation = { lat: DEFAULT_LAT, lng: DEFAULT_LNG };
                userCity = DEFAULT_CITY;
                updateLocationDisplay();
                fetchNearbyServices(DEFAULT_LAT, DEFAULT_LNG);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    // --- Update Location Display (fallback) ---
    function updateLocationDisplay() {
        if (userLocation) {
            currentLocationEl.innerHTML = `
                <p><strong>Latitude:</strong> ${userLocation.lat.toFixed(6)}</p>
                <p><strong>Longitude:</strong> ${userLocation.lng.toFixed(6)}</p>
                <p class="text-xs text-white/40">${userCity !== 'Unknown' ? `City: ${userCity}` : 'City not resolved'}</p>
            `;
        }
    }

    // --- Fetch Nearby Services (Demo) ---
    function fetchNearbyServices(lat, lng) {
        // Generate realistic demo services based on location
        const services = generateDemoServices(lat, lng);
        renderNearbyServices(services);
    }

    // --- Generate Demo Services ---
    function generateDemoServices(lat, lng) {
        // Use a seed based on coordinates to get consistent results
        const seed = Math.round((lat + lng) * 1000);
        const rand = (max) => ((seed * 9301 + 49297) % 233280) / 233280 * max;

        const hospitals = [
            { name: 'City General Hospital', distance: (0.5 + rand(2)).toFixed(1), type: 'hospital' },
            { name: 'St. Mary\'s Medical Center', distance: (0.8 + rand(2.5)).toFixed(1), type: 'hospital' },
        ];
        const police = [
            { name: 'Central Police Station', distance: (0.3 + rand(1.5)).toFixed(1), type: 'police' },
            { name: 'District Police Precinct', distance: (1.2 + rand(2)).toFixed(1), type: 'police' },
        ];
        const pharmacies = [
            { name: 'MediQuick Pharmacy', distance: (0.2 + rand(1)).toFixed(1), type: 'pharmacy' },
            { name: 'HealthPlus Drugstore', distance: (0.7 + rand(1.8)).toFixed(1), type: 'pharmacy' },
        ];
        const fire = [
            { name: 'Fire Station #1', distance: (0.6 + rand(2)).toFixed(1), type: 'fire' },
            { name: 'Fire Rescue Unit', distance: (1.5 + rand(2.5)).toFixed(1), type: 'fire' },
        ];

        // Combine and shuffle
        const all = [...hospitals, ...police, ...pharmacies, ...fire];
        // Shuffle using seed
        all.sort((a, b) => {
            const aHash = a.name.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
            const bHash = b.name.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
            return aHash - bHash;
        });
        return all.slice(0, 6); // return top 6
    }

    // --- Render Nearby Services ---
    function renderNearbyServices(services) {
        if (!nearbyServicesEl) return;
        if (!services || services.length === 0) {
            nearbyServicesEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-map-pin"></i>
                    <p class="text-sm">No services found</p>
                    <p class="sub text-xs">Click "Get Location" to find nearby hospitals, police stations, and pharmacies</p>
                </div>
            `;
            return;
        }

        let html = '<div class="space-y-2">';
        services.forEach(service => {
            const iconMap = {
                hospital: 'fa-hospital',
                police: 'fa-shield-halved',
                pharmacy: 'fa-prescription-bottle',
                fire: 'fa-fire-extinguisher'
            };
            const icon = iconMap[service.type] || 'fa-building';
            const colorMap = {
                hospital: '#ff3d8a',
                police: '#4ecdc4',
                pharmacy: '#b44aff',
                fire: '#ff6b6b'
            };
            const color = colorMap[service.type] || '#8395a7';
            html += `
                <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/5 hover:border-cyan-400/30 transition">
                    <div class="flex items-center gap-3">
                        <i class="fas ${icon}" style="color:${color};"></i>
                        <div>
                            <div class="text-white/80 text-sm font-medium">${escapeHtml(service.name)}</div>
                            <div class="text-white/40 text-xs">${service.type.charAt(0).toUpperCase() + service.type.slice(1)}</div>
                        </div>
                    </div>
                    <div class="text-white/60 text-sm">${service.distance} km</div>
                </div>
            `;
        });
        html += '</div>';
        nearbyServicesEl.innerHTML = html;
    }

    // --- Escape HTML ---
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- SOS Handler ---
    function handleSOS() {
        // Confirm with user
        if (!confirm('🚨 Are you sure you need emergency assistance? This will alert nearby services.')) {
            return;
        }

        // Play alert sound
        playAlertSound();

        // Show modal
        showSOSModal();

        // Log
        saveLogEntry('SOS triggered', userCity);

        // Show toast
        window.showToast('🚨 Emergency alert sent! Help is on the way.', 'error');
    }

    // --- SOS Modal ---
    function showSOSModal() {
        // Create modal overlay
        const existingModal = document.getElementById('sos-modal');
        if (existingModal) return;

        const modal = document.createElement('div');
        modal.id = 'sos-modal';
        modal.style.cssText = `
            position: fixed;
            top: 0; left: 0; right: 0; bottom: 0;
            background: rgba(0,0,0,0.8);
            backdrop-filter: blur(8px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
            animation: fadeIn 0.3s ease;
        `;

        const content = document.createElement('div');
        content.style.cssText = `
            background: rgba(255,255,255,0.05);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255,61,138,0.3);
            border-radius: 2rem;
            padding: 2rem 2.5rem;
            max-width: 400px;
            width: 90%;
            text-align: center;
            color: #fff;
            box-shadow: 0 0 60px rgba(255,61,138,0.2);
        `;

        content.innerHTML = `
            <div style="font-size: 4rem; margin-bottom: 0.5rem;">🚨</div>
            <h2 style="font-size: 1.8rem; font-weight: 800; color: #ff3d8a; margin-bottom: 0.5rem;">SOS ALERT</h2>
            <p style="font-size: 1rem; color: rgba(255,255,255,0.7); margin-bottom: 1rem;">
                Emergency services have been notified.
            </p>
            <p style="font-size: 0.9rem; color: rgba(255,255,255,0.5); margin-bottom: 1.5rem;">
                Location: ${escapeHtml(userCity || 'Unknown')}
            </p>
            <div style="display: flex; gap: 0.75rem; justify-content: center;">
                <button id="sos-cancel-btn" style="background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15); padding: 0.6rem 1.5rem; border-radius: 9999px; color: #fff; cursor: pointer; font-weight: 600; transition: all 0.3s;">
                    I'm Safe
                </button>
                <button id="sos-call-btn" style="background: linear-gradient(135deg, #ff3d8a, #ff6b6b); border: none; padding: 0.6rem 1.5rem; border-radius: 9999px; color: #fff; cursor: pointer; font-weight: 600; transition: all 0.3s;">
                    <i class="fas fa-phone"></i> Call 911
                </button>
            </div>
            <p style="font-size: 0.75rem; color: rgba(255,255,255,0.3); margin-top: 1rem;">
                This is a simulation. In a real emergency, call your local emergency number.
            </p>
        `;

        modal.appendChild(content);
        document.body.appendChild(modal);

        // Add close functionality
        document.getElementById('sos-cancel-btn').addEventListener('click', () => {
            modal.remove();
            window.showToast('SOS cancelled. Stay safe!', 'info');
        });

        document.getElementById('sos-call-btn').addEventListener('click', () => {
            const phone = emergencyNumberEl.textContent.trim();
            if (phone) {
                window.location.href = `tel:${phone.replace(/\s+/g, '')}`;
            } else {
                window.showToast('No emergency number set.', 'warning');
            }
            modal.remove();
        });

        // Auto-close after 10 seconds
        setTimeout(() => {
            if (document.getElementById('sos-modal')) {
                document.getElementById('sos-modal').remove();
            }
        }, 10000);
    }

    // --- Travel Alerts ---
    function generateTravelAlerts() {
        const alerts = [
            { type: 'weather', message: 'Heavy rain expected in your area. Avoid flooded roads.', severity: 'high' },
            { type: 'health', message: 'COVID-19 advisory: Wear masks in crowded places.', severity: 'medium' },
            { type: 'safety', message: 'Local authorities report increased pickpocketing in tourist zones.', severity: 'medium' },
            { type: 'transport', message: 'Metro delays on Line 2. Allow extra travel time.', severity: 'low' },
        ];
        return alerts;
    }

    function renderTravelAlerts() {
        if (!travelAlertsEl) return;
        const alerts = generateTravelAlerts();
        if (!alerts.length) {
            travelAlertsEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p class="text-sm">No active alerts</p>
                    <p class="sub text-xs">Stay safe — we'll notify you of any travel advisories</p>
                </div>
            `;
            return;
        }

        let html = '<div class="space-y-2">';
        alerts.forEach(alert => {
            const color = alert.severity === 'high' ? '#ff3d8a' : alert.severity === 'medium' ? '#ffd700' : '#4ecdc4';
            const icon = alert.type === 'weather' ? 'fa-cloud-rain' : alert.type === 'health' ? 'fa-heart-pulse' : alert.type === 'safety' ? 'fa-shield' : 'fa-bus';
            html += `
                <div class="alert-item" style="border-left-color: ${color};">
                    <i class="fas ${icon}" style="color: ${color}; margin-right: 0.5rem;"></i>
                    ${escapeHtml(alert.message)}
                    <span class="time">${new Date().toLocaleTimeString()}</span>
                </div>
            `;
        });
        html += '</div>';
        travelAlertsEl.innerHTML = html;
    }

    // --- Emergency Contact Click Handler ---
    function setupContactCards() {
        document.querySelectorAll('.emergency-card').forEach(card => {
            card.addEventListener('click', function() {
                const number = this.querySelector('.number').textContent.trim();
                const name = this.querySelector('.name').textContent.trim();
                if (number) {
                    // Copy to clipboard
                    navigator.clipboard.writeText(number).then(() => {
                        window.showToast(`Copied ${name} number: ${number}`, 'success');
                    }).catch(() => {
                        // Fallback: show alert
                        window.showToast(`${name}: ${number}`, 'info');
                    });
                    // Also set emergency-number display
                    if (emergencyNumberEl) {
                        emergencyNumberEl.textContent = number;
                        emergencyNumberEl.style.color = '#ff3d8a';
                        window.showToast(`Emergency number set to ${number}`, 'info');
                    }
                }
            });
        });
    }

    // --- Initialize ---
    function init() {
        // Setup contact cards
        setupContactCards();

        // Get location button
        if (getLocationBtn) {
            getLocationBtn.addEventListener('click', getLocation);
        }

        // SOS button
        if (sosBtn) {
            sosBtn.addEventListener('click', handleSOS);
        }

        // Load initial travel alerts
        renderTravelAlerts();

        // Try to get location automatically on load (optional)
        // We'll let user click.

        console.log('Emergency Hub initialized.');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();