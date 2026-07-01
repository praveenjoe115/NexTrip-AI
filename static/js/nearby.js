/**
 * nearby.js — NexTrip AI Nearby Places Explorer
 * Handles searching, displaying, and saving nearby places.
 * Uses global helpers: showToast (from main.js)
 */

(function() {
    'use strict';

    // --- DOM References ---
    const locationInput = document.getElementById('nearby-location');
    const categorySelect = document.getElementById('nearby-category');
    const searchBtn = document.getElementById('search-nearby-btn');
    const resultsContainer = document.getElementById('nearby-results');
    const loadingOverlay = document.getElementById('nearby-loading');

    // --- State ---
    let currentPlaces = [];
    let currentLocation = '';

    // --- Storage Key for favorites ---
    const FAVORITES_KEY = 'nextrip_favorites';

    // --- Helper: Show/Hide Loading ---
    function showLoading() {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        if (resultsContainer) {
            resultsContainer.style.display = 'none';
        }
    }

    function hideLoading() {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        if (resultsContainer) {
            resultsContainer.style.display = 'block';
        }
    }

    // --- Helper: Get Favorites from localStorage ---
    function getFavorites() {
        try {
            return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
        } catch {
            return [];
        }
    }

    // --- Helper: Save Favorite ---
    function saveFavorite(place) {
        const favorites = getFavorites();
        // Check if already saved (by name and location)
        const exists = favorites.some(f =>
            f.name === place.name &&
            (f.vicinity === place.vicinity || f.address === place.address)
        );
        if (exists) {
            window.showToast('Already in favorites!', 'info');
            return false;
        }
        // Add location info
        const favorite = {
            ...place,
            savedAt: new Date().toISOString(),
            type: 'place'
        };
        favorites.push(favorite);
        localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
        window.showToast(`"${place.name}" added to favorites!`, 'success');
        return true;
    }

    // --- Render Results ---
    function renderResults(places, location) {
        if (!resultsContainer) return;

        if (!places || places.length === 0) {
            resultsContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-search"></i>
                    <p class="text-lg">No places found</p>
                    <p class="sub">Try adjusting your location or category</p>
                </div>
            `;
            return;
        }

        // Generate random distances and open/closed status for demo
        const now = new Date().getHours();
        const isOpen = (h) => (h >= 8 && h <= 22); // 8 AM - 10 PM

        let html = `
            <div class="results-stats">
                <span class="count">Found <span>${places.length}</span> places</span>
                <span>📍 ${location || 'Nearby'}</span>
            </div>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        `;

        places.forEach((place, index) => {
            const randomDist = (Math.random() * 5 + 0.5).toFixed(1);
            const status = isOpen(now) ? 'open' : 'closed';
            const statusLabel = status === 'open' ? 'Open Now' : 'Closed';
            const rating = place.rating || (Math.random() * 2 + 3).toFixed(1);

            html += `
                <div class="place-card">
                    <div class="place-header">
                        <div class="place-name">${escapeHtml(place.name || 'Unnamed Place')}</div>
                        <div class="place-rating">⭐ ${rating}</div>
                    </div>
                    <div class="place-address">
                        <i class="fas fa-location-dot"></i>
                        ${escapeHtml(place.vicinity || place.address || 'Address not available')}
                    </div>
                    <div class="place-meta">
                        <div class="place-distance">
                            <i class="fas fa-route"></i> ${randomDist} km
                        </div>
                        <span class="place-status ${status}">${statusLabel}</span>
                        <button class="btn-outline-glass save-btn" data-index="${index}">
                            <i class="fas fa-bookmark"></i> Save
                        </button>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        resultsContainer.innerHTML = html;

        // Attach save events
        resultsContainer.querySelectorAll('.save-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const idx = parseInt(this.dataset.index);
                const place = places[idx];
                if (place) {
                    const saved = saveFavorite(place);
                    if (saved) {
                        this.classList.add('saved');
                        this.innerHTML = '<i class="fas fa-check"></i> Saved';
                    }
                }
            });
        });

        // Check which are already saved and update buttons
        const favorites = getFavorites();
        resultsContainer.querySelectorAll('.save-btn').forEach(btn => {
            const idx = parseInt(btn.dataset.index);
            const place = places[idx];
            if (place) {
                const exists = favorites.some(f =>
                    f.name === place.name &&
                    (f.vicinity === place.vicinity || f.address === place.address)
                );
                if (exists) {
                    btn.classList.add('saved');
                    btn.innerHTML = '<i class="fas fa-check"></i> Saved';
                }
            }
        });
    }

    // --- Helper: Escape HTML ---
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Show Empty State ---
    function showEmptyState() {
        if (!resultsContainer) return;
        resultsContainer.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-compass"></i>
                <p class="text-lg">Discover places near you</p>
                <p class="sub">Enter a location and select a category to explore</p>
            </div>
        `;
    }

    // --- Fetch Places from API ---
    async function fetchPlaces(location, category) {
        if (!location) {
            window.showToast('Please enter a location.', 'warning');
            return;
        }

        showLoading();

        try {
            // Use POST as required, but fallback to GET if needed (we'll try POST first)
            const response = await fetch('/api/places', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ location, category })
            });

            // If POST fails (405), try GET
            let data;
            if (!response.ok && response.status === 405) {
                // Fallback to GET
                const getResponse = await fetch(`/api/places?location=${encodeURIComponent(location)}&type=${category}`);
                data = await getResponse.json();
            } else {
                data = await response.json();
            }

            if (data.error) throw new Error(data.error);

            const places = data.places || [];
            currentPlaces = places;
            currentLocation = location;

            if (places.length === 0) {
                window.showToast('No places found in this area.', 'info');
            } else {
                window.showToast(`Found ${places.length} places!`, 'success');
            }

            renderResults(places, location);
            hideLoading();

        } catch (error) {
            console.error('Nearby fetch error:', error);
            window.showToast('Failed to fetch places. Using demo data.', 'error');
            // Fallback demo data
            const demoPlaces = generateDemoPlaces(location, category);
            renderResults(demoPlaces, location);
            hideLoading();
        }
    }

    // --- Generate Demo Places (fallback) ---
    function generateDemoPlaces(location, category) {
        const names = {
            restaurant: ['The Gourmet Table', 'Spice Garden', 'Urban Bites', 'Seafood Shack', 'Vegan Delight'],
            hotel: ['Grand Plaza Hotel', 'Sunset Inn', 'City Lodge', 'Heritage Palace', 'Budget Stay'],
            hospital: ['City General Hospital', 'St. Mary\'s Medical', 'HealthPlus Clinic', 'Emergency Care'],
            atm: ['Bank of America ATM', 'Chase ATM', 'Wells Fargo ATM', 'Citibank ATM'],
            shopping_mall: ['City Center Mall', 'Fashion Avenue', 'Market Square', 'Outlet Village'],
            tourist_attraction: ['Historic Museum', 'Botanical Gardens', 'Art Gallery', 'Sunset Point', 'Ancient Temple']
        };

        const categoryMap = {
            restaurant: 'Restaurant',
            hotel: 'Hotel',
            hospital: 'Hospital',
            atm: 'ATM',
            shopping_mall: 'Shopping Mall',
            tourist_attraction: 'Tourist Attraction'
        };

        const placeNames = names[category] || names.restaurant;
        const label = categoryMap[category] || category;

        return placeNames.map(name => ({
            name: `${name} - ${location}`,
            vicinity: `Main St, ${location}`,
            rating: (Math.random() * 2 + 3).toFixed(1),
            category: label,
            address: `123 ${name} Blvd, ${location}`,
            distance: (Math.random() * 5 + 0.5).toFixed(1),
            status: Math.random() > 0.3 ? 'open' : 'closed'
        }));
    }

    // --- Search Handler ---
    function handleSearch() {
        const location = locationInput.value.trim();
        const category = categorySelect.value;
        if (!location) {
            window.showToast('Please enter a location.', 'warning');
            return;
        }
        fetchPlaces(location, category);
    }

    // --- Initialize ---
    function init() {
        // Set default location
        const defaultCity = 'Bangalore';
        if (locationInput) {
            locationInput.value = defaultCity;
        }

        // Show empty state
        showEmptyState();

        // Event listeners
        if (searchBtn) {
            searchBtn.addEventListener('click', handleSearch);
        }

        if (locationInput) {
            locationInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSearch();
                }
            });
        }

        // Auto-search on load
        setTimeout(() => {
            handleSearch();
        }, 300);

        console.log('Nearby Places initialized.');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();