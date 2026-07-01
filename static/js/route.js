/**
 * route.js — NexTrip AI Route Optimizer
 * Handles multi-stop route planning, optimization simulation, and visualization.
 * Uses global helpers: showToast (from main.js)
 */

(function() {
    'use strict';

    // --- DOM References ---
    const startInput = document.getElementById('start-location');
    const stopInput = document.getElementById('stop-location');
    const addStopBtn = document.getElementById('add-stop-btn');
    const stopsList = document.getElementById('stops-list');
    const stopsCount = document.getElementById('stops-count');
    const optimizeBtn = document.getElementById('optimize-route-btn');

    const mapContent = document.getElementById('route-map-content');
    const loadingOverlay = document.getElementById('route-loading');

    const totalDistanceEl = document.getElementById('total-distance');
    const totalDurationEl = document.getElementById('total-duration');
    const estimatedCostEl = document.getElementById('estimated-cost');

    const routeListEl = document.getElementById('optimized-route-list');

    // --- State ---
    let stops = [];

    // --- Storage Key ---
    const STORAGE_KEY = 'nextrip_optimized_routes';

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

    // --- Helper: Render Stops List ---
    function renderStops() {
        if (!stopsList || !stopsCount) return;

        if (stops.length === 0) {
            stopsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-plus-circle"></i>
                    <p class="text-sm">No stops added yet</p>
                    <p class="sub text-xs">Add stops to optimize your route</p>
                </div>
            `;
            stopsCount.textContent = '0';
            return;
        }

        let html = '';
        stops.forEach((stop, index) => {
            html += `
                <div class="stop-item">
                    <div class="stop-label">
                        <span class="index">${index + 1}</span>
                        <span class="name">${escapeHtml(stop)}</span>
                    </div>
                    <button class="remove-stop-btn" data-index="${index}">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        });

        stopsList.innerHTML = html;
        stopsCount.textContent = stops.length;

        // Attach remove events
        stopsList.querySelectorAll('.remove-stop-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.dataset.index);
                removeStop(idx);
            });
        });
    }

    // --- Helper: Escape HTML ---
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Add Stop ---
    function addStop() {
        const stop = stopInput.value.trim();
        if (!stop) {
            window.showToast('Please enter a stop location.', 'warning');
            return;
        }

        // Prevent duplicates (case-insensitive)
        if (stops.some(s => s.toLowerCase() === stop.toLowerCase())) {
            window.showToast('Stop already added.', 'warning');
            stopInput.value = '';
            return;
        }

        stops.push(stop);
        stopInput.value = '';
        renderStops();
        window.showToast(`Stop "${stop}" added.`, 'success');
        stopInput.focus();
    }

    // --- Remove Stop ---
    function removeStop(index) {
        if (index < 0 || index >= stops.length) return;
        const removed = stops[index];
        stops.splice(index, 1);
        renderStops();
        window.showToast(`Removed "${removed}".`, 'info');
        // Clear results if any
        clearResults();
    }

    // --- Clear Results ---
    function clearResults() {
        if (totalDistanceEl) totalDistanceEl.textContent = '--';
        if (totalDurationEl) totalDurationEl.textContent = '--';
        if (estimatedCostEl) estimatedCostEl.textContent = '--';
        if (routeListEl) {
            routeListEl.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-map-pin"></i>
                    <p class="text-lg">No route planned yet</p>
                    <p class="sub">Add locations and click "Optimize Route"</p>
                </div>
            `;
        }
        // Reset map to placeholder
        if (mapContent) {
            mapContent.innerHTML = `
                <div class="map-placeholder">
                    <i class="fas fa-map"></i>
                    <p>Route map will appear here</p>
                    <p class="text-sm opacity-50">Add stops and optimize to see your route</p>
                </div>
            `;
        }
    }

    // --- Optimize Route ---
    function optimizeRoute() {
        const start = startInput.value.trim();
        if (!start) {
            window.showToast('Please enter a starting point.', 'warning');
            return;
        }
        if (stops.length === 0) {
            window.showToast('Please add at least one stop.', 'warning');
            return;
        }

        showLoading();

        // Simulate processing delay
        setTimeout(() => {
            // Generate optimized order (simulate with a simple algorithm: start from start, then stops in a random but deterministic order)
            // We'll use a seeded random based on stop names to get consistent results.
            const stopsCopy = [...stops];
            // Sort by a hash of the name to make it deterministic but "optimized" looking.
            stopsCopy.sort((a, b) => {
                const hashA = a.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
                const hashB = b.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
                return hashA - hashB;
            });

            // Generate random distances between consecutive points (including start)
            const points = [start, ...stopsCopy];
            const distances = [];
            const durations = [];
            let totalDist = 0;
            let totalDur = 0;

            for (let i = 0; i < points.length - 1; i++) {
                // Random distance between 10 and 80 km
                const dist = Math.round((10 + Math.random() * 70) * 10) / 10;
                // Random duration: 15 min per 10 km + some variation
                const dur = Math.round((dist / 10) * 15 + Math.random() * 10);
                distances.push(dist);
                durations.push(dur);
                totalDist += dist;
                totalDur += dur;
            }

            // Estimated cost: $0.15 per km
            const cost = totalDist * 0.15;

            // Update UI
            if (totalDistanceEl) totalDistanceEl.textContent = `${totalDist.toFixed(1)} km`;
            if (totalDurationEl) totalDurationEl.textContent = `${totalDur} min`;
            if (estimatedCostEl) estimatedCostEl.textContent = `$${cost.toFixed(2)}`;

            // Render optimized route list
            let routeHtml = '';
            points.forEach((point, idx) => {
                if (idx === 0) {
                    routeHtml += `
                        <div class="route-step">
                            <span class="step-detail"><i class="fas fa-flag-checkered" style="color:#00f0ff;"></i> Start: ${escapeHtml(point)}</span>
                            <span class="step-distance"></span>
                        </div>
                    `;
                } else {
                    const dist = distances[idx - 1];
                    const dur = durations[idx - 1];
                    routeHtml += `
                        <div class="route-step">
                            <span class="step-detail"><i class="fas fa-location-dot" style="color:#ff3d8a;"></i> Stop ${idx}: ${escapeHtml(point)}</span>
                            <span class="step-distance">${dist.toFixed(1)} km (${dur} min)</span>
                        </div>
                    `;
                }
            });
            // Add total summary
            routeHtml += `
                <div class="route-step" style="border-left-color: #ffd700; background: rgba(255,215,0,0.05);">
                    <span class="step-detail"><strong>Total</strong></span>
                    <span class="step-distance" style="color:#ffd700;">${totalDist.toFixed(1)} km, ${totalDur} min</span>
                </div>
            `;
            routeListEl.innerHTML = routeHtml;

            // Render map visualization
            renderMap(points);

            // Save to localStorage
            const routeData = {
                start: start,
                stops: stopsCopy,
                optimizedPoints: points,
                distances: distances,
                durations: durations,
                totalDistance: totalDist,
                totalDuration: totalDur,
                totalCost: cost,
                timestamp: new Date().toISOString()
            };
            saveRoute(routeData);

            window.showToast('Route optimized successfully!', 'success');
            hideLoading();
        }, 800); // simulate processing
    }

    // --- Render Map Visualization ---
    function renderMap(points) {
        if (!mapContent) return;

        // Simple canvas-based route visualization
        // We'll draw circles for each point and lines connecting them.
        const canvas = document.createElement('canvas');
        canvas.width = mapContent.clientWidth || 600;
        canvas.height = mapContent.clientHeight || 300;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.borderRadius = '1.5rem';

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        const padding = 40;

        // Clear
        ctx.clearRect(0, 0, width, height);

        // Background
        const gradient = ctx.createLinearGradient(0, 0, width, height);
        gradient.addColorStop(0, 'rgba(0, 240, 255, 0.02)');
        gradient.addColorStop(1, 'rgba(180, 74, 255, 0.02)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Draw grid lines (subtle)
        ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        ctx.lineWidth = 0.5;
        for (let x = 0; x <= width; x += 50) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let y = 0; y <= height; y += 50) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        // Generate random positions for points within canvas
        const positions = points.map(() => {
            return {
                x: padding + Math.random() * (width - 2 * padding),
                y: padding + Math.random() * (height - 2 * padding)
            };
        });

        // Ensure start and end have distinct positions (adjust if too close)
        // We'll just accept random for simplicity.

        // Draw lines
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0, 240, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.moveTo(positions[0].x, positions[0].y);
        for (let i = 1; i < positions.length; i++) {
            ctx.lineTo(positions[i].x, positions[i].y);
        }
        ctx.stroke();
        ctx.setLineDash([]);

        // Draw points
        positions.forEach((pos, idx) => {
            const isStart = idx === 0;
            const isEnd = idx === positions.length - 1;

            // Glow effect
            const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, 20);
            gradient.addColorStop(0, isStart ? 'rgba(0, 240, 255, 0.3)' : 'rgba(180, 74, 255, 0.3)');
            gradient.addColorStop(1, 'rgba(0,0,0,0)');
            ctx.fillStyle = gradient;
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
            ctx.fillStyle = 'rgba(255,255,255,0.8)';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'bottom';
            const label = isStart ? `🚩 ${points[idx]}` : (isEnd ? `🏁 ${points[idx]}` : `${idx}. ${points[idx]}`);
            ctx.fillText(label, pos.x, pos.y - 16);
        });

        // Replace map content
        mapContent.innerHTML = '';
        mapContent.appendChild(canvas);
    }

    // --- Save Route to localStorage ---
    function saveRoute(routeData) {
        let routes = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        routes.push(routeData);
        // Keep only last 10 routes
        if (routes.length > 10) routes = routes.slice(-10);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(routes));
    }

    // --- Load saved routes (optional, not required for UI) ---

    // --- Initialize ---
    function init() {
        // Render empty stops
        renderStops();
        clearResults();

        // Event listeners
        if (addStopBtn) {
            addStopBtn.addEventListener('click', addStop);
        }

        if (stopInput) {
            stopInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addStop();
                }
            });
        }

        if (optimizeBtn) {
            optimizeBtn.addEventListener('click', optimizeRoute);
        }

        // Auto-focus start input
        if (startInput) {
            startInput.focus();
        }

        console.log('Route Optimizer initialized.');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();