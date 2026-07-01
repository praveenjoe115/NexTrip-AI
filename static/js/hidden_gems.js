/**
 * hidden_gems.js — NexTrip AI Hidden Gems Explorer
 * Handles searching, displaying, and saving hidden gems.
 * Uses global helpers: showToast (from main.js)
 */

(function() {
    'use strict';

    // --- DOM References ---
    const locationInput = document.getElementById('location-input');
    const findGemsBtn = document.getElementById('find-gems-btn');
    const loadingOverlay = document.getElementById('gems-loading');
    const gemsResults = document.getElementById('gems-results');

    // --- State ---
    let currentGems = []; // Store latest gems data for saving

    // --- Helper: Show/Hide Loading ---
    function showLoading() {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        if (gemsResults) {
            gemsResults.style.display = 'none';
        }
    }

    function hideLoading() {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        if (gemsResults) {
            gemsResults.style.display = 'block';
        }
    }

    // --- Helper: Render Gem Cards ---
    function renderGems(gems) {
        if (!gemsResults) return;

        if (!gems || gems.length === 0) {
            gemsResults.innerHTML = `
                <div class="gems-placeholder">
                    <i class="fas fa-search"></i>
                    <p class="text-lg">No hidden gems found</p>
                    <p class="sub">Try searching for a different location</p>
                </div>
            `;
            return;
        }

        let html = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">`;
        gems.forEach((gem, index) => {
            const gemId = `gem-${index}-${Date.now()}`;
            const imageUrl = gem.photo || 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=200&fit=crop&auto=format';
            const rating = gem.rating || 0;
            const stars = '⭐'.repeat(Math.floor(rating)) + (rating % 1 >= 0.5 ? '⭐' : '');

            html += `
                <div class="gem-card" data-gem-id="${gemId}">
                    <div class="gem-image" style="background-image: url('${imageUrl}');">
                        <span class="rating-badge">${stars} ${rating}</span>
                    </div>
                    <div class="gem-body">
                        <div class="gem-name">${gem.name || 'Unnamed Gem'}</div>
                        <div class="gem-description">${gem.description || 'No description available.'}</div>
                        <button class="btn-save-gem" data-gem='${JSON.stringify(gem).replace(/'/g, "&#39;")}'>
                            <i class="fas fa-bookmark"></i> Save
                        </button>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        gemsResults.innerHTML = html;

        // Attach event listeners to save buttons
        document.querySelectorAll('.btn-save-gem').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const gemData = JSON.parse(this.dataset.gem);
                saveGem(gemData, this);
            });
            // Check if already saved and update button state
            const gemData = JSON.parse(btn.dataset.gem);
            if (isGemSaved(gemData)) {
                btn.classList.add('saved');
                btn.innerHTML = '<i class="fas fa-check"></i> Saved';
            }
        });

        currentGems = gems;
    }

    // --- Helper: Check if gem is already saved (using current location input) ---
    function isGemSaved(gem) {
        const favorites = JSON.parse(localStorage.getItem('nextrip_favorites') || '[]');
        const location = locationInput.value.trim() || 'Unknown';
        return favorites.some(f => f.name === gem.name && f.location === location);
    }

    // --- Helper: Save Gem to localStorage ---
    function saveGem(gem, buttonElement) {
        if (!gem) return;

        const favorites = JSON.parse(localStorage.getItem('nextrip_favorites') || '[]');
        const location = locationInput.value.trim() || 'Unknown';

        // Check for duplicate (by name and current location)
        const exists = favorites.some(f => f.name === gem.name && f.location === location);
        if (exists) {
            window.showToast('Already saved in favorites!', 'info');
            return;
        }

        const gemToSave = { ...gem, location, savedAt: new Date().toISOString() };
        favorites.push(gemToSave);
        localStorage.setItem('nextrip_favorites', JSON.stringify(favorites));

        // Update button
        if (buttonElement) {
            buttonElement.classList.add('saved');
            buttonElement.innerHTML = '<i class="fas fa-check"></i> Saved';
        }

        window.showToast(`"${gem.name}" saved to favorites!`, 'success');
    }

    // --- Fetch Hidden Gems from API ---
    async function fetchHiddenGems(location) {
        if (!location) {
            window.showToast('Please enter a location.', 'warning');
            return;
        }

        showLoading();

        try {
            const response = await fetch('/api/hidden-gems', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ location })
            });

            const data = await response.json();

            if (data.error) throw new Error(data.error);

            const gems = data.gems || [];
            if (gems.length === 0) {
                window.showToast('No hidden gems found in this location.', 'info');
            } else {
                window.showToast(`Found ${gems.length} hidden gems!`, 'success');
            }
            renderGems(gems);
            hideLoading();

        } catch (error) {
            console.error('Hidden gems fetch error:', error);
            window.showToast('Failed to fetch hidden gems. Please try again.', 'error');
            // Show empty state
            gemsResults.innerHTML = `
                <div class="gems-placeholder">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p class="text-lg">Unable to load hidden gems</p>
                    <p class="sub">Please check your connection and try again.</p>
                </div>
            `;
            hideLoading();
        }
    }

    // --- Initialize ---
    function init() {
        // Event listener for button
        if (findGemsBtn) {
            findGemsBtn.addEventListener('click', () => {
                const location = locationInput.value.trim();
                fetchHiddenGems(location);
            });
        }

        // Allow Enter key on input
        if (locationInput) {
            locationInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    findGemsBtn.click();
                }
            });
        }

        // Auto-load default city: Bangalore
        const defaultCity = 'Bangalore';
        if (locationInput) {
            locationInput.value = defaultCity;
        }
        // Fetch on load
        fetchHiddenGems(defaultCity);
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();