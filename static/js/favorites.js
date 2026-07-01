/**
 * favorites.js — NexTrip AI Favorites Manager
 * Handles loading, displaying, searching, filtering, and exporting favorites.
 * Uses global helpers: showToast (from main.js)
 */

(function() {
    'use strict';

    // --- DOM References ---
    const container = document.getElementById('favorites-container');
    const searchInput = document.getElementById('favorites-search');
    const filterAll = document.getElementById('filter-all');
    const filterTrips = document.getElementById('filter-trips');
    const filterPlaces = document.getElementById('filter-places');
    const filterGems = document.getElementById('filter-gems');
    const clearAllBtn = document.getElementById('clear-favorites-btn');
    const exportBtn = document.getElementById('export-favorites-btn');

    const totalFavoritesEl = document.getElementById('total-favorites');
    const savedTripsCountEl = document.getElementById('saved-trips-count');
    const savedGemsCountEl = document.getElementById('saved-gems-count');
    const favoritesCountEl = document.getElementById('favorites-count');

    // --- State ---
    let favorites = [];
    let currentFilter = 'all'; // 'all', 'trip', 'place', 'gem'
    let searchTerm = '';

    // --- Storage Key ---
    const STORAGE_KEY = 'nextrip_favorites';

    // --- Load Favorites from localStorage ---
    function loadFavorites() {
        const stored = localStorage.getItem(STORAGE_KEY);
        favorites = stored ? JSON.parse(stored) : [];
        renderAll();
    }

    // --- Save Favorites to localStorage ---
    function saveFavorites() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
    }

    // --- Helper: Get category label and icon ---
    function getCategoryInfo(item) {
        // Determine category based on available properties
        if (item.plan) return { label: 'Trip', icon: 'fa-route', class: 'trip' };
        if (item.description && item.rating !== undefined) return { label: 'Gem', icon: 'fa-gem', class: 'gem' };
        if (item.vicinity || item.address) return { label: 'Place', icon: 'fa-location-dot', class: 'place' };
        return { label: 'Other', icon: 'fa-star', class: 'other' };
    }

    // --- Render Favorites ---
    function renderFavorites() {
        if (!container) return;

        // Filter logic
        let filtered = [...favorites];

        // Filter by category
        if (currentFilter !== 'all') {
            filtered = filtered.filter(item => {
                const cat = getCategoryInfo(item).label.toLowerCase();
                return cat === currentFilter;
            });
        }

        // Filter by search term
        if (searchTerm.trim()) {
            const term = searchTerm.trim().toLowerCase();
            filtered = filtered.filter(item => {
                const name = (item.name || item.title || item.destination || '').toLowerCase();
                const desc = (item.description || item.plan || '').toLowerCase();
                return name.includes(term) || desc.includes(term);
            });
        }

        // Update count
        if (favoritesCountEl) {
            favoritesCountEl.textContent = `(${filtered.length})`;
        }

        // Empty state
        if (filtered.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-heart"></i>
                    <p class="text-lg">${favorites.length === 0 ? 'No favorites saved yet' : 'No matches found'}</p>
                    <p class="sub">${favorites.length === 0 ? 'Start saving trips, places, and hidden gems to build your collection' : 'Try adjusting your search or filter'}</p>
                </div>
            `;
            return;
        }

        // Build cards
        let html = `<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">`;
        filtered.forEach((item, index) => {
            const catInfo = getCategoryInfo(item);
            const name = item.name || item.title || item.destination || 'Unnamed';
            const description = item.description || item.plan || 'No description';
            const image = item.image || item.photo || 'https://images.unsplash.com/photo-1501854140801-50d01698950b?w=400&h=200&fit=crop&auto=format';
            const savedDate = item.savedAt ? new Date(item.savedAt).toLocaleDateString() : 'Unknown date';
            const rating = item.rating ? `⭐ ${item.rating}` : '';

            // Use index as fallback id if item.id is missing
            const itemId = item.id !== undefined ? item.id : index;

            html += `
                <div class="favorite-card" data-index="${index}">
                    <div class="card-image" style="background-image: url('${image}');">
                        <span class="category-badge ${catInfo.class}">
                            <i class="fas ${catInfo.icon}"></i> ${catInfo.label}
                        </span>
                        ${rating ? `<span style="position:absolute;bottom:0.75rem;right:0.75rem;background:rgba(0,0,0,0.6);padding:0.2rem 0.6rem;border-radius:9999px;font-size:0.75rem;color:#ffd700;">${rating}</span>` : ''}
                    </div>
                    <div class="card-body">
                        <div class="title">${escapeHtml(name)}</div>
                        <div class="description">${escapeHtml(description.substring(0, 120))}${description.length > 120 ? '...' : ''}</div>
                        <div class="meta">
                            <span class="saved-date"><i class="far fa-calendar-alt"></i> ${savedDate}</span>
                            <button class="remove-btn" data-id="${itemId}">
                                <i class="fas fa-times"></i> Remove
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });
        html += `</div>`;
        container.innerHTML = html;

        // Attach remove events
        container.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                const id = this.dataset.id;
                removeFavorite(id);
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

    // --- Update Stats ---
    function updateStats() {
        if (totalFavoritesEl) {
            totalFavoritesEl.textContent = favorites.length;
        }

        // Count trips vs gems
        let trips = 0, gems = 0, places = 0;
        favorites.forEach(item => {
            const cat = getCategoryInfo(item).label.toLowerCase();
            if (cat === 'trip') trips++;
            else if (cat === 'gem') gems++;
            else if (cat === 'place') places++;
        });

        if (savedTripsCountEl) savedTripsCountEl.textContent = trips;
        if (savedGemsCountEl) savedGemsCountEl.textContent = gems;
    }

    // --- Render All (stats + favorites) ---
    function renderAll() {
        updateStats();
        renderFavorites();
    }

    // --- Remove Favorite (safer version) ---
    function removeFavorite(id) {
        // Use filter to remove item by comparing stringified id or index
        favorites = favorites.filter((item, index) => {
            const itemId = item.id !== undefined ? item.id : index;
            return String(itemId) !== String(id);
        });

        saveFavorites();
        renderAll();
        window.showToast('Favorite removed', 'info');
    }

    // --- Clear All Favorites ---
    function clearAll() {
        if (favorites.length === 0) {
            window.showToast('No favorites to clear', 'info');
            return;
        }
        if (!confirm('Remove all favorites?')) return;
        favorites = [];
        saveFavorites();
        renderAll();
        window.showToast('All favorites cleared', 'info');
    }

    // --- Export Favorites ---
    function exportFavorites() {
        if (favorites.length === 0) {
            window.showToast('No favorites to export', 'warning');
            return;
        }

        // Create a readable text report
        const now = new Date().toLocaleString();
        let report = '═══════════════════════════════════════\n';
        report += '  NEXTRIP AI — FAVORITES EXPORT\n';
        report += '═══════════════════════════════════════\n\n';
        report += `  Exported:  ${now}\n`;
        report += `  Total:     ${favorites.length} items\n\n`;
        report += '─────────────────────────────────────────\n';
        report += '  FAVORITES LIST\n';
        report += '─────────────────────────────────────────\n\n';

        favorites.forEach((item, i) => {
            const catInfo = getCategoryInfo(item);
            const name = item.name || item.title || item.destination || 'Unnamed';
            const desc = item.description || item.plan || 'No description';
            const date = item.savedAt ? new Date(item.savedAt).toLocaleDateString() : 'Unknown';
            report += `  ${(i+1).toString().padStart(2)}. ${catInfo.label.padEnd(8)} ${name}\n`;
            report += `     ${desc.substring(0, 80)}${desc.length > 80 ? '...' : ''}\n`;
            report += `     Saved: ${date}\n\n`;
        });

        report += '═══════════════════════════════════════\n';
        report += '  Generated by NexTrip AI\n';
        report += '═══════════════════════════════════════\n';

        // Download as .txt
        const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Favorites_Export_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        window.showToast('Favorites exported!', 'success');
    }

    // --- Search Handler ---
    function handleSearch() {
        searchTerm = searchInput.value;
        renderFavorites();
    }

    // --- Filter Handlers ---
    function setFilter(filter) {
        currentFilter = filter;
        // Update active class
        document.querySelectorAll('.btn-filter').forEach(btn => btn.classList.remove('active'));
        if (filter === 'all') filterAll.classList.add('active');
        else if (filter === 'trip') filterTrips.classList.add('active');
        else if (filter === 'place') filterPlaces.classList.add('active');
        else if (filter === 'gem') filterGems.classList.add('active');
        renderFavorites();
    }

    // --- Initialize ---
    function init() {
        // Load data
        loadFavorites();

        // Event listeners
        if (searchInput) {
            searchInput.addEventListener('input', handleSearch);
        }

        if (filterAll) filterAll.addEventListener('click', () => setFilter('all'));
        if (filterTrips) filterTrips.addEventListener('click', () => setFilter('trip'));
        if (filterPlaces) filterPlaces.addEventListener('click', () => setFilter('place'));
        if (filterGems) filterGems.addEventListener('click', () => setFilter('gem'));

        if (clearAllBtn) clearAllBtn.addEventListener('click', clearAll);
        if (exportBtn) exportBtn.addEventListener('click', exportFavorites);

        // Initial render
        renderAll();

        console.log('Favorites initialized. Count:', favorites.length);
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();