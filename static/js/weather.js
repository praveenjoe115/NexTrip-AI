/**
 * weather.js — NexTrip AI Weather Intelligence
 * Handles weather fetching, display, suggestions, forecast, and tips.
 * Uses global helpers: showToast (from main.js)
 */

(function() {
    'use strict';

    // --- DOM References ---
    const cityInput = document.getElementById('city-input');
    const getWeatherBtn = document.getElementById('get-weather-btn');
    const loadingOverlay = document.getElementById('weather-loading');
    const weatherResult = document.getElementById('weather-result');
    const tempDisplay = document.getElementById('temp-display');
    const conditionDisplay = document.getElementById('condition-display');
    const humidityDisplay = document.getElementById('humidity-display');
    const windDisplay = document.getElementById('wind-display');
    const travelSuggestions = document.getElementById('travel-suggestions');
    const forecastContainer = document.getElementById('forecast-container');
    const weatherTipsContainer = document.getElementById('weather-tips');

    // --- State ---
    let currentWeather = null; // Store latest weather data

    // --- Helper: Show/Hide Loading ---
    function showLoading() {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'flex';
        }
        if (weatherResult) {
            weatherResult.style.display = 'none';
        }
    }

    function hideLoading() {
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        if (weatherResult) {
            weatherResult.style.display = 'block';
        }
    }

    // --- Helper: Render Weather Data ---
    function renderWeather(weather) {
        if (!weather) return;

        // Update cards
        tempDisplay.textContent = weather.temp ? `${weather.temp}°C` : '--';
        conditionDisplay.textContent = weather.description || '--';
        humidityDisplay.textContent = weather.humidity ? `${weather.humidity}%` : '--';
        windDisplay.textContent = weather.wind_speed ? `${weather.wind_speed} m/s` : '--';

        // Update result section (show city and country)
        const cityName = weather.city || 'Unknown';
        const country = weather.country || '';
        const locationText = country ? `${cityName}, ${country}` : cityName;
        // Replace placeholder with actual weather info
        weatherResult.innerHTML = `
            <div class="glass p-6 rounded-2xl">
                <div class="flex items-center justify-between flex-wrap">
                    <div>
                        <h2 class="text-2xl font-bold text-white">${locationText}</h2>
                        <p class="text-white/50">${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                    <div class="text-right">
                        <span class="text-4xl font-bold text-cyan-400">${weather.temp || '--'}°C</span>
                        <p class="text-white/60">${weather.description || ''}</p>
                    </div>
                </div>
            </div>
        `;

        // Generate AI suggestions
        generateSuggestions(weather);

        // Generate 5-day forecast (simulated)
        generateForecast(weather);

        // Update travel tips
        updateTips(weather);
    }

    // --- Generate AI Travel Suggestions based on weather ---
    function generateSuggestions(weather) {
        if (!weather) return;
        const desc = (weather.description || '').toLowerCase();
        const temp = weather.temp || 0;
        let suggestions = [];

        // Temperature-based
        if (temp > 30) {
            suggestions.push('☀️ It\'s hot! Stay hydrated, wear sunscreen, and plan outdoor activities early morning or late evening.');
        } else if (temp > 20) {
            suggestions.push('🌤️ Pleasant weather! Great for sightseeing and outdoor exploration.');
        } else if (temp > 10) {
            suggestions.push('🌥️ Cool weather. Pack a light jacket and enjoy the crisp air.');
        } else {
            suggestions.push('❄️ Cold weather! Dress warmly, wear layers, and keep hot drinks handy.');
        }

        // Condition-based
        if (desc.includes('rain') || desc.includes('shower') || desc.includes('drizzle')) {
            suggestions.push('☔ Rain expected. Carry an umbrella and waterproof footwear.');
        }
        if (desc.includes('thunder') || desc.includes('storm')) {
            suggestions.push('⚡ Thunderstorms possible. Stay indoors and avoid open areas.');
        }
        if (desc.includes('snow')) {
            suggestions.push('❄️ Snowy conditions. Drive carefully and wear insulated boots.');
        }
        if (desc.includes('fog') || desc.includes('mist')) {
            suggestions.push('🌫️ Foggy visibility. Drive slow and use fog lights.');
        }
        if (desc.includes('clear') || desc.includes('sunny')) {
            suggestions.push('☀️ Clear skies. Perfect for photography and outdoor adventures.');
        }

        // General tips
        suggestions.push('💡 Always check local weather updates before heading out.');

        // Render suggestions
        let html = '';
        suggestions.forEach(s => {
            html += `<div class="suggestion-card"><i class="fas fa-lightbulb icon"></i> ${s}</div>`;
        });
        travelSuggestions.innerHTML = html;
    }

    // --- Generate 5-Day Forecast (simulated) ---
    function generateForecast(weather) {
        if (!weather) return;
        const baseTemp = weather.temp || 20;
        const desc = weather.description || 'Partly cloudy';
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
        const conditions = ['Sunny', 'Cloudy', 'Rainy', 'Clear', 'Partly Cloudy', 'Windy'];

        let forecastHtml = '';
        // Generate 5 days starting from tomorrow
        const today = new Date();
        for (let i = 1; i <= 5; i++) {
            const d = new Date(today);
            d.setDate(d.getDate() + i);
            const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
            // Random variation
            const tempOffset = (Math.random() * 6) - 3; // -3 to +3
            const dayTemp = Math.round(baseTemp + tempOffset);
            const condition = conditions[Math.floor(Math.random() * conditions.length)];
            forecastHtml += `
                <div class="forecast-item">
                    <div class="day">${dayName}</div>
                    <div class="temp">${dayTemp}°C</div>
                    <div class="condition">${condition}</div>
                </div>
            `;
        }
        forecastContainer.innerHTML = forecastHtml;
    }

    // --- Update Weather Travel Tips ---
    function updateTips(weather) {
        if (!weather) return;
        const desc = (weather.description || '').toLowerCase();
        const temp = weather.temp || 0;
        let tips = [];

        if (desc.includes('rain')) {
            tips.push('🌂 Keep umbrella handy');
            tips.push('🧥 Wear waterproof jacket');
        }
        if (desc.includes('sunny') || temp > 25) {
            tips.push('🧴 Apply sunscreen');
            tips.push('🕶️ Wear sunglasses');
            tips.push('💧 Stay hydrated');
        }
        if (temp < 10) {
            tips.push('🧤 Wear gloves and scarf');
            tips.push('🧥 Layer up');
        }
        if (desc.includes('wind')) {
            tips.push('🧥 Secure loose items');
            tips.push('🚴 Avoid cycling');
        }
        if (desc.includes('fog')) {
            tips.push('🚗 Drive with low beams');
            tips.push('🐢 Slow down');
        }
        // General
        tips.push('📱 Keep your phone charged');
        tips.push('🗺️ Have a backup plan for indoor activities');

        // Render tips as tags
        let html = '';
        tips.forEach(tip => {
            html += `<span class="tip-tag">${tip}</span>`;
        });
        weatherTipsContainer.innerHTML = html;
    }

    // --- Fetch Weather Data ---
    async function fetchWeather(city) {
        if (!city) {
            window.showToast('Please enter a city name.', 'warning');
            return;
        }

        showLoading();
        try {
            const url = `/api/weather?city=${encodeURIComponent(city)}`;
            const response = await fetch(url);
            const data = await response.json();

            if (data.error) throw new Error(data.error);

            const weather = data.weather || null;
            if (!weather) {
                throw new Error('No weather data received.');
            }

            currentWeather = weather;
            renderWeather(weather);
            hideLoading();
            window.showToast(`Weather for ${weather.city || city} loaded!`, 'success');

        } catch (error) {
            console.error('Weather fetch error:', error);
            window.showToast('Failed to fetch weather. Please try again.', 'error');
            // Show placeholder in result area
            weatherResult.innerHTML = `
                <div class="result-placeholder">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p class="text-lg">Unable to load weather</p>
                    <p class="text-sm opacity-50">Please check the city name or try again later.</p>
                </div>
            `;
            // Clear cards
            tempDisplay.textContent = '--';
            conditionDisplay.textContent = '--';
            humidityDisplay.textContent = '--';
            windDisplay.textContent = '--';
            travelSuggestions.innerHTML = '<p class="italic">Weather-based recommendations unavailable.</p>';
            forecastContainer.innerHTML = '<div class="text-white/40 text-sm italic">Forecast unavailable.</div>';
            weatherTipsContainer.innerHTML = '<span class="tip-tag">Check back later</span>';
            hideLoading();
        }
    }

    // --- Initialize ---
    function init() {
        // Event listener for button
        if (getWeatherBtn) {
            getWeatherBtn.addEventListener('click', () => {
                const city = cityInput.value.trim();
                fetchWeather(city);
            });
        }

        // Allow Enter key on input
        if (cityInput) {
            cityInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    getWeatherBtn.click();
                }
            });
        }

        // Auto-load default city: Bangalore
        const defaultCity = 'Bangalore';
        if (cityInput) {
            cityInput.value = defaultCity;
        }
        // Fetch on load
        fetchWeather(defaultCity);
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();