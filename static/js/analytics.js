/**
 * analytics.js — NexTrip AI Travel Analytics
 * Aggregates data from various localStorage sources, renders charts, and generates AI-style insights.
 * Uses global helpers: showToast (from main.js)
 * Uses Chart.js from CDN (loaded in base.html)
 */

(function() {
    'use strict';

    // --- DOM References ---
    const totalTripsEl = document.getElementById('total-trips');
    const totalBudgetEl = document.getElementById('total-budget');
    const favoriteDestinationEl = document.getElementById('favorite-destination');
    const journalEntriesEl = document.getElementById('journal-entries');

    const destinationChartCanvas = document.getElementById('destination-chart');
    const expenseChartCanvas = document.getElementById('expense-chart');
    const activityChartCanvas = document.getElementById('activity-chart');

    const insightsContainer = document.getElementById('ai-insights');
    const refreshBtn = document.getElementById('refresh-analytics-btn');
    const loadingOverlay = document.getElementById('analytics-loading');

    // --- Chart instances ---
    let destinationChartInstance = null;
    let expenseChartInstance = null;
    let activityChartInstance = null;

    // --- Storage Keys ---
    const STORAGE_KEYS = {
        trips: 'nextrip_saved_trips',
        favorites: 'nextrip_favorites',
        budget: 'nextrip_budget',
        expenses: 'nextrip_expenses',
        journals: 'nextrip_journals'
    };

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

    // --- Helper: Parse localStorage data with fallback ---
    function getData(key, defaultValue = []) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.warn(`Error parsing ${key}:`, e);
            return defaultValue;
        }
    }

    // --- Helper: Get category colors ---
    const CATEGORY_COLORS = {
        'Food': '#00f0ff',
        'Transport': '#b44aff',
        'Hotel': '#ff3d8a',
        'Shopping': '#4ecdc4',
        'Activities': '#ffd700',
        'Emergency': '#ff6b6b',
        'Other': '#8395a7'
    };

    // --- Update Stats ---
    function updateStats(trips, favorites, budgetData, expenses, journals) {
        // Total trips
        if (totalTripsEl) {
            totalTripsEl.textContent = trips.length;
        }

        // Total budget: use current budget from budgetData (if any) or sum of all trip budgets?
        // We'll use the current budget stored in nextrip_budget (object with totalBudget)
        let totalBudget = 0;
        if (budgetData && budgetData.totalBudget) {
            totalBudget = budgetData.totalBudget;
        }
        // Also consider expenses total spent? We'll show budget as the set amount.
        if (totalBudgetEl) {
            totalBudgetEl.textContent = `$${totalBudget.toFixed(2)}`;
        }

        // Favorite destination: from trips and favorites
        const destinations = {};
        // From trips
        trips.forEach(trip => {
            const dest = trip.destination || trip.location || '';
            if (dest) {
                destinations[dest] = (destinations[dest] || 0) + 1;
            }
        });
        // From favorites that have location/destination
        favorites.forEach(fav => {
            const dest = fav.destination || fav.location || '';
            if (dest) {
                destinations[dest] = (destinations[dest] || 0) + 1;
            }
        });

        let favorite = '—';
        let maxCount = 0;
        for (const [dest, count] of Object.entries(destinations)) {
            if (count > maxCount) {
                maxCount = count;
                favorite = dest;
            }
        }
        if (favoriteDestinationEl) {
            favoriteDestinationEl.textContent = favorite;
        }

        // Journal entries
        if (journalEntriesEl) {
            journalEntriesEl.textContent = journals.length;
        }
    }

    // --- Render Destination Chart (Bar) ---
    function renderDestinationChart(trips, favorites) {
        if (!destinationChartCanvas) return;

        // Collect destinations from trips and favorites
        const destinations = {};
        trips.forEach(trip => {
            const dest = trip.destination || trip.location || '';
            if (dest) {
                destinations[dest] = (destinations[dest] || 0) + 1;
            }
        });
        favorites.forEach(fav => {
            const dest = fav.destination || fav.location || '';
            if (dest) {
                destinations[dest] = (destinations[dest] || 0) + 1;
            }
        });

        const labels = Object.keys(destinations);
        const data = Object.values(destinations);

        // If no data, show empty state
        if (labels.length === 0) {
            if (destinationChartInstance) {
                destinationChartInstance.destroy();
                destinationChartInstance = null;
            }
            const ctx = destinationChartCanvas.getContext('2d');
            ctx.clearRect(0, 0, destinationChartCanvas.width, destinationChartCanvas.height);
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No destination data', destinationChartCanvas.width / 2, destinationChartCanvas.height / 2);
            return;
        }

        const colors = labels.map(() => `hsl(${Math.random() * 360}, 70%, 60%)`); // random vibrant colors

        if (destinationChartInstance) {
            destinationChartInstance.destroy();
        }

        const ctx = destinationChartCanvas.getContext('2d');
        destinationChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Visits',
                    data: data,
                    backgroundColor: colors.map(c => c + '80'),
                    borderColor: colors,
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'rgba(255,255,255,0.5)',
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'rgba(255,255,255,0.5)',
                            maxRotation: 45,
                            minRotation: 30
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // --- Render Expense Chart (Doughnut) ---
    function renderExpenseChart(expenses) {
        if (!expenseChartCanvas) return;

        if (expenses.length === 0) {
            if (expenseChartInstance) {
                expenseChartInstance.destroy();
                expenseChartInstance = null;
            }
            const ctx = expenseChartCanvas.getContext('2d');
            ctx.clearRect(0, 0, expenseChartCanvas.width, expenseChartCanvas.height);
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No expense data', expenseChartCanvas.width / 2, expenseChartCanvas.height / 2);
            return;
        }

        // Group by category
        const totals = {};
        expenses.forEach(exp => {
            const cat = exp.category || 'Other';
            totals[cat] = (totals[cat] || 0) + exp.amount;
        });

        const labels = Object.keys(totals);
        const data = Object.values(totals);
        const colors = labels.map(cat => CATEGORY_COLORS[cat] || '#8395a7');
        const bgColors = colors.map(c => c + '80');

        if (expenseChartInstance) {
            expenseChartInstance.destroy();
        }

        const ctx = expenseChartCanvas.getContext('2d');
        expenseChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: bgColors,
                    borderColor: colors,
                    borderWidth: 2,
                    hoverOffset: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'rgba(255,255,255,0.7)',
                            padding: 12,
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: { size: 11, family: 'Inter, sans-serif' }
                        }
                    }
                },
                cutout: '60%'
            }
        });
    }

    // --- Render Activity Chart (Line) ---
    function renderActivityChart(trips, journals) {
        if (!activityChartCanvas) return;

        // Combine trips and journals by month
        const monthMap = {};

        // From trips: use savedAt or createdAt
        trips.forEach(trip => {
            const date = trip.savedAt || trip.createdAt;
            if (date) {
                const d = new Date(date);
                const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
                monthMap[key] = monthMap[key] || { trips: 0, journals: 0 };
                monthMap[key].trips += 1;
            }
        });

        journals.forEach(journal => {
            const date = journal.createdAt;
            if (date) {
                const d = new Date(date);
                const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, '0')}`;
                monthMap[key] = monthMap[key] || { trips: 0, journals: 0 };
                monthMap[key].journals += 1;
            }
        });

        const sortedKeys = Object.keys(monthMap).sort();
        const labels = sortedKeys.map(k => {
            const [year, month] = k.split('-');
            return `${month}/${year.slice(2)}`;
        });
        const tripData = sortedKeys.map(k => monthMap[k].trips);
        const journalData = sortedKeys.map(k => monthMap[k].journals);

        if (sortedKeys.length === 0) {
            if (activityChartInstance) {
                activityChartInstance.destroy();
                activityChartInstance = null;
            }
            const ctx = activityChartCanvas.getContext('2d');
            ctx.clearRect(0, 0, activityChartCanvas.width, activityChartCanvas.height);
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.font = '14px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No activity data', activityChartCanvas.width / 2, activityChartCanvas.height / 2);
            return;
        }

        if (activityChartInstance) {
            activityChartInstance.destroy();
        }

        const ctx = activityChartCanvas.getContext('2d');
        activityChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Trips',
                        data: tripData,
                        borderColor: '#00f0ff',
                        backgroundColor: 'rgba(0, 240, 255, 0.1)',
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: '#00f0ff'
                    },
                    {
                        label: 'Journals',
                        data: journalData,
                        borderColor: '#b44aff',
                        backgroundColor: 'rgba(180, 74, 255, 0.1)',
                        fill: true,
                        tension: 0.3,
                        pointBackgroundColor: '#b44aff'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: {
                            color: 'rgba(255,255,255,0.7)',
                            usePointStyle: true,
                            pointStyle: 'circle',
                            font: { size: 11, family: 'Inter, sans-serif' }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            color: 'rgba(255,255,255,0.5)',
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(255,255,255,0.05)'
                        }
                    },
                    x: {
                        ticks: {
                            color: 'rgba(255,255,255,0.5)',
                            maxRotation: 45,
                            minRotation: 30
                        },
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });
    }

    // --- Generate AI Insights ---
    function generateInsights(trips, favorites, expenses, journals) {
        if (!insightsContainer) return;

        const insights = [];

        // Total trips
        const tripCount = trips.length;
        if (tripCount > 0) {
            insights.push(`You've planned <span class="highlight">${tripCount}</span> trip${tripCount > 1 ? 's' : ''}.`);
        } else {
            insights.push('Start planning your first trip to unlock insights.');
        }

        // Favorite destination (already computed in stats)
        const dests = {};
        trips.forEach(trip => {
            const d = trip.destination || trip.location || '';
            if (d) dests[d] = (dests[d] || 0) + 1;
        });
        favorites.forEach(fav => {
            const d = fav.destination || fav.location || '';
            if (d) dests[d] = (dests[d] || 0) + 1;
        });
        let topDest = '—';
        let maxCount = 0;
        for (const [d, c] of Object.entries(dests)) {
            if (c > maxCount) { maxCount = c; topDest = d; }
        }
        if (topDest !== '—') {
            insights.push(`Your favorite destination is <span class="highlight">${topDest}</span> with ${maxCount} visit${maxCount > 1 ? 's' : ''}.`);
        }

        // Expenses insights
        if (expenses.length > 0) {
            const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
            insights.push(`You've spent <span class="highlight">$${totalSpent.toFixed(2)}</span> across ${expenses.length} expense${expenses.length > 1 ? 's' : ''}.`);
            // Top category
            const catTotals = {};
            expenses.forEach(e => {
                catTotals[e.category] = (catTotals[e.category] || 0) + e.amount;
            });
            let topCat = 'Other';
            let maxAmount = 0;
            for (const [cat, amt] of Object.entries(catTotals)) {
                if (amt > maxAmount) { maxAmount = amt; topCat = cat; }
            }
            if (topCat) {
                insights.push(`Top expense category: <span class="highlight">${topCat}</span> ($${maxAmount.toFixed(2)}).`);
            }
        } else {
            insights.push('Add some expenses to get spending insights.');
        }

        // Journals
        if (journals.length > 0) {
            insights.push(`You've written <span class="highlight">${journals.length}</span> journal entr${journals.length > 1 ? 'ies' : 'y'}.`);
            // Latest entry
            const latest = journals.reduce((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b);
            if (latest) {
                const date = new Date(latest.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                insights.push(`Latest entry: <span class="highlight">${latest.title}</span> on ${date}.`);
            }
        } else {
            insights.push('Write a journal entry to capture your memories.');
        }

        // Overall tip
        if (tripCount > 0 && expenses.length > 0 && journals.length > 0) {
            insights.push('🌟 You\'re a well-rounded traveler! Keep exploring and documenting your journey.');
        } else if (tripCount > 0 && expenses.length > 0) {
            insights.push('🌟 Great planning! You\'re tracking your budget well. Consider journaling to capture memories.');
        } else if (tripCount > 0 && journals.length > 0) {
            insights.push('🌟 You love writing! Track your expenses to get a full picture of your travel habits.');
        } else {
            insights.push('🌟 Start using all features of NexTrip AI to get personalized travel insights.');
        }

        // Render insights
        let html = '';
        insights.forEach(text => {
            html += `<div class="insight-item">${text}</div>`;
        });
        insightsContainer.innerHTML = html;
    }

    // --- Main function: Load data and render everything ---
    function loadAndRender() {
        showLoading();

        // Gather data
        const trips = getData(STORAGE_KEYS.trips, []);
        const favorites = getData(STORAGE_KEYS.favorites, []);
        const budgetData = getData(STORAGE_KEYS.budget, {});
        const expenses = getData(STORAGE_KEYS.expenses, []);
        const journals = getData(STORAGE_KEYS.journals, []);

        // Update stats
        updateStats(trips, favorites, budgetData, expenses, journals);

        // Render charts (pass required data)
        renderDestinationChart(trips, favorites);
        renderExpenseChart(expenses);
        renderActivityChart(trips, journals);

        // Generate insights
        generateInsights(trips, favorites, expenses, journals);

        hideLoading();
    }

    // --- Initialize ---
    function init() {
        // Load and render on page load
        loadAndRender();

        // Refresh button
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                loadAndRender();
                window.showToast('Analytics refreshed!', 'success');
            });
        }

        console.log('Analytics initialized.');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();