/**
 * map.js — NexTrip AI Maps & Directions
 * Handles location, directions, nearby places, and route visualization.
 * Uses global helpers: showToast (from main.js)
 */

(function() {
    'use strict';

    // --- DOM References ---
    const destinationInput = document.getElementById('destination-input');
    const currentLocationBtn = document.getElementById('current-location-btn');
    const getDirectionsBtn = document.getElementById('get-directions-btn');
    const nearbyPlacesBtn = document.getElementById('nearby-places-btn');
    const placeTypeSelect = document.getElementById('place-type');
    const mapContainer = document.getElementById('map');
    const mapContent = document.getElementById('map-content');
    const loadingOverlay = document.getElementById('loading-overlay');
    const distanceDisplay = document.getElementById('distance-display');
    const durationDisplay = document.getElementById('duration-display');
    const costDisplay = document.getElementById('cost-display');
    const routeInfo = document.getElementById('route-info');
    const nearbyResults = document.getElementById('nearby-results');

    // --- State ---
    let currentPosition = null; // { lat, lng, name }
    let currentRouteData = null; // store for history

    // --- Constants ---
    const STORAGE_KEY = 'nextrip_recent_routes';

    // --- Helper: Show/Hide Loading ---
    function showLoading() {
        if (loadingOverlay) loadingOverlay.classList.remove('hidden');
    }

    function hideLoading() {
        if (loadingOverlay) loadingOverlay.classList.add('hidden');
    }

    // --- Helper: Update Map Content ---
    function updateMapContent(htmlContent) {
        if (!mapContent) return;
        mapContent.innerHTML = htmlContent;
    }

    // --- Helper: Render Route Visualization ---
    function renderRouteVisual(points) {
        // Create a canvas-based route visualization
        const canvas = document.createElement('canvas');
        canvas.width = mapContainer.clientWidth || 600;
        canvas.height = mapContainer.clientHeight || 350;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.borderRadius = '1.5rem';

        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const pad = 40;

        // Clear with gradient background
        const grad = ctx.createLinearGradient(0, 0, w, h);
        grad.addColorStop(0, 'rgba(0, 240, 255, 0.02)');
        grad.addColorStop(1, 'rgba(180, 74, 255, 0.02)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // Grid
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= w; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y <= h; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        if (!points || points.length < 2) {
            ctx.fillStyle = 'rgba(255,255,255,0.3)';
            ctx.font = '16px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Route not available', w/2, h/2);
            mapContent.innerHTML = '';
            mapContent.appendChild(canvas);
            return;
        }

        // Generate random positions for each point within canvas with padding
        const positions = points.map(() => ({
            x: pad + Math.random() * (w - 2 * pad),
            y: pad + Math.random() * (h - 2 * pad)
        }));

        // Draw route lines
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.5)';
        ctx.lineWidth = 3;
        ctx.setLineDash([8, 6]);
        ctx.moveTo(positions[0].x, positions[0].y);
        for (let i = 1; i < positions.length; i++) {
            ctx.lineTo(positions[i].x, positions[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw markers
        positions.forEach((pos, idx) => {
            const isStart = idx === 0;
            const isEnd = idx === positions.length - 1;

            // Glow
            const glow = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 25);
            if (isStart) {
                glow.addColorStop(0, 'rgba(0, 240, 255, 0.3)');
            } else if (isEnd) {
                glow.addColorStop(0, 'rgba(255, 61, 138, 0.3)');
            } else {
                glow.addColorStop(0, 'rgba(180, 74, 255, 0.2)');
            }
            glow.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = glow;
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 25, 0, Math.PI * 2);
            ctx.fill();

            // Circle
            ctx.beginPath();
            ctx.arc(pos.x, pos.y, 10, 0, Math.PI * 2);
            if (isStart) {
                ctx.fillStyle = '#00f0ff';
                ctx.shadowColor = '#00f0ff';
                ctx.shadowBlur = 15;
            } else if (isEnd) {
                ctx.fillStyle = '#ff3d8a';
                ctx.shadowColor = '#ff3d8a';
                ctx.shadowBlur = 15;
            } else {
                ctx.fillStyle = '#b44aff';
                ctx.shadowColor = '#b44aff';
                ctx.shadowBlur = 10;
            }
            ctx.fill();
            ctx.shadowBlur = 0;
            ctx.strokeStyle = 'rgba(255,255,255,0.5)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Label
            ctx.fillStyle = 'rgba(255,255,255,0.85)';
            ctx.font = '11px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            const label = isStart ? `🚩 ${points[idx]}` : (isEnd ? `🏁 ${points[idx]}` : `${idx}. ${points[idx]}`);
            ctx.fillText(label, pos.x, pos.y - 16);
        });

        // Add legend
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText('🚀 Route visualization (demo)', w - pad, h - 10);

        mapContent.innerHTML = '';
        mapContent.appendChild(canvas);
    }

    // --- 1. Get Current Location ---
    function getCurrentLocation() {
        if (!navigator.geolocation) {
            window.showToast('Geolocation not supported.', 'warning');
            return;
        }

        showLoading();
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                currentPosition = {
                    lat: latitude,
                    lng: longitude,
                    name: 'Current Location'
                };
                window.showToast('Location acquired!', 'success');
                hideLoading();
                // Show on map
                updateMapContent(`
                    <div style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;color:rgba(255,255,255,0.5);flex-direction:column;gap:0.5rem;">
                        <i class="fas fa-location-dot" style="font-size:3rem;color:#00f0ff;"></i>
                        <span>📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}</span>
                        <span style="font-size:0.8rem;opacity:0.5;">Click "Get Directions" to use this as origin</span>
                    </div>
                `);
            },
            (error) => {
                console.warn('Geolocation error:', error);
                window.showToast('Unable to get location. Please enter manually.', 'error');
                hideLoading();
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    // --- 2. Get Directions ---
    async function getDirections() {
        const destination = destinationInput.value.trim();
        if (!destination) {
            window.showToast('Please enter a destination.', 'warning');
            return;
        }

        // Build start: use current position if available, else default to "Bangalore"
        let start = 'Bangalore';
        if (currentPosition && currentPosition.lat && currentPosition.lng) {
            start = `${currentPosition.lat},${currentPosition.lng}`;
        }

        showLoading();

        try {
            // Use POST /api/route-optimize
            const response = await fetch('/api/route-optimize', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    start: start,
                    stops: [destination]
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            // Update displays
            const distance = data.total_distance || '--';
            const duration = data.total_duration || '--';
            const cost = data.estimated_cost || 0;

            distanceDisplay.textContent = distance !== '--' ? `${distance} km` : '--';
            durationDisplay.textContent = duration !== '--' ? `${duration} min` : '--';
            costDisplay.textContent = cost ? `$${cost.toFixed(2)}` : '--';

            // Render route info
            const segments = data.segments || [];
            let routeHtml = `<p class="text-white/80"><strong>Route:</strong> ${start} → ${destination}</p>`;
            if (segments.length > 0) {
                routeHtml += `<ul class="mt-2 list-disc list-inside text-white/60 text-sm space-y-1">`;
                segments.forEach(seg => {
                    routeHtml += `<li>${seg.from} → ${seg.to}: ${seg.distance} km (${seg.duration} min)</li>`;
                });
                routeHtml += `</ul>`;
            }
            routeHtml += `<p class="mt-2 text-xs text-cyan-400/70"><i class="fas fa-info-circle"></i> Demo data — upgrade for real directions.</p>`;
            routeInfo.innerHTML = routeHtml;

            // Build points for visualization
            const points = data.optimized_route || [start, destination];
            renderRouteVisual(points);

            // Store route history
            const routeData = {
                origin: start,
                destination: destination,
                distance: distance,
                duration: duration,
                cost: cost,
                timestamp: new Date().toISOString()
            };
            saveRouteHistory(routeData);

            window.showToast('Directions loaded!', 'success');
            hideLoading();

        } catch (error) {
            console.error('Directions error:', error);
            window.showToast('Failed to get directions. Using demo.', 'error');
            // Fallback demo data
            const demoDist = (Math.random() * 50 + 10).toFixed(1);
            const demoDur = (demoDist * 1.5 + Math.random() * 15).toFixed(0);
            const demoCost = (demoDist * 0.15).toFixed(2);

            distanceDisplay.textContent = `${demoDist} km`;
            durationDisplay.textContent = `${demoDur} min`;
            costDisplay.textContent = `$${demoCost}`;

            routeInfo.innerHTML = `
                <p class="text-white/80"><strong>Route:</strong> ${start} → ${destination}</p>
                <p class="text-white/60 text-sm">Distance: ${demoDist} km | Duration: ${demoDur} min</p>
                <p class="mt-2 text-xs text-cyan-400/70"><i class="fas fa-info-circle"></i> Demo data — upgrade for real directions.</p>
            `;
            renderRouteVisual([start, destination]);
            hideLoading();
        }
    }

    // --- Save Route History to localStorage ---
    function saveRouteHistory(routeData) {
        try {
            let history = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
            history.push(routeData);
            if (history.length > 20) history = history.slice(-20);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
        } catch (e) {
            console.warn('Could not save route history:', e);
        }
    }

    // --- 3. Nearby Places ---
    function getNearbyPlaces() {
        const location = destinationInput.value.trim();
        if (!location) {
            window.showToast('Please enter a location first.', 'warning');
            return;
        }

        const type = placeTypeSelect ? placeTypeSelect.value : 'tourist_attraction';
        showLoading();

        // Use POST /api/places
        fetch('/api/places', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ location, category: type })
        })
        .then(res => res.json())
        .then(data => {
            if (data.error) throw new Error(data.error);
            const places = data.places || [];
            renderNearbyPlaces(places, type);
            hideLoading();
            window.showToast(`Found ${places.length} places!`, 'success');
        })
        .catch(error => {
            console.warn('Nearby places fallback:', error);
            // Demo fallback
            const demoPlaces = generateDemoPlaces(location, type);
            renderNearbyPlaces(demoPlaces, type);
            hideLoading();
            window.showToast('Showing demo places (API unavailable).', 'info');
        });
    }

    // --- Render Nearby Places ---
    function renderNearbyPlaces(places, type) {
        if (!nearbyResults) return;
        if (!places || places.length === 0) {
            nearbyResults.innerHTML = `<p class="text-white/50 text-sm italic">No ${type} found nearby.</p>`;
            return;
        }

        let html = `<div class="space-y-2">`;
        places.forEach(place => {
            const rating = place.rating ? `⭐ ${place.rating}` : '';
            const address = place.vicinity || place.address || 'Address not available';
            html += `
                <div class="nearby-item flex items-center justify-between p-2.5 bg-white/5 rounded-lg border border-white/5 hover:border-cyan-400/30 transition">
                    <div>
                        <div class="font-medium text-white/80">${escapeHtml(place.name || 'Unnamed')}</div>
                        <div class="text-white/40 text-sm">${escapeHtml(address)}</div>
                    </div>
                    <div class="text-white/60">${rating}</div>
                </div>
            `;
        });
        html += `</div>`;
        nearbyResults.innerHTML = html;
    }

    // --- Helper: Escape HTML ---
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Generate Demo Places (fallback) ---
    function generateDemoPlaces(location, type) {
        const placeTypes = {
            restaurant: ['The Gourmet Kitchen', 'Spice Garden', 'Urban Eats', 'Seafood House', 'Vegan Spot'],
            hotel: ['Grand Plaza', 'Sunset Inn', 'City Lodge', 'Heritage Palace', 'Budget Stay'],
            hospital: ['City General Hospital', 'St. Mary\'s Medical', 'HealthPlus Clinic', 'Emergency Center'],
            atm: ['Bank ATM', 'Cash Point', 'Money Express', '24/7 ATM'],
            shopping_mall: ['City Center Mall', 'Fashion Avenue', 'Market Square', 'Outlet Mall'],
            tourist_attraction: ['Historic Museum', 'Botanical Gardens', 'Art Gallery', 'Sunset Point', 'Ancient Temple']
        };
        const names = placeTypes[type] || placeTypes.tourist_attraction;
        return names.map(name => ({
            name: `${name} - ${location}`,
            vicinity: `Main St, ${location}`,
            rating: (Math.random() * 2 + 3).toFixed(1)
        }));
    }

    // --- 4. Initialize Map with placeholder ---
    function initMap() {
        updateMapContent(`
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;width:100%;height:100%;color:rgba(255,255,255,0.3);gap:0.5rem;">
                <i class="fas fa-map" style="font-size:4rem;opacity:0.2;"></i>
                <p>Map will appear here</p>
                <p style="font-size:0.85rem;opacity:0.5;">Enter a destination and use the controls</p>
            </div>
        `);
    }

    // --- Initialize ---
    function init() {
        initMap();

        // Event listeners
        if (currentLocationBtn) {
            currentLocationBtn.addEventListener('click', getCurrentLocation);
        }
        if (getDirectionsBtn) {
            getDirectionsBtn.addEventListener('click', getDirections);
        }
        if (nearbyPlacesBtn) {
            nearbyPlacesBtn.addEventListener('click', getNearbyPlaces);
        }

        // Allow Enter key on destination input
        if (destinationInput) {
            destinationInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    getDirections();
                }
            });
        }

        console.log('Map module initialized.');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();