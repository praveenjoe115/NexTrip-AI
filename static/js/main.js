/**
 * main.js — NexTrip AI Global Core Script
 * Provides global utilities, toast, loader, theme effects, scroll animations, and helpers.
 * IIFE pattern | Modern ES6 | Production Ready
 */

(function() {
    'use strict';

    // ============================================================
    // 1. DOM REFERENCES
    // ============================================================
    const toastContainer = document.getElementById('toast-container');
    const loaderOverlay = document.getElementById('loader-overlay');

    // ============================================================
    // 2. TOAST SYSTEM
    // ============================================================
    /**
     * Display a toast notification
     * @param {string} message - The message to display
     * @param {string} type - 'success', 'error', 'warning', 'info'
     * @param {number} duration - Duration in ms
     */
    function showToast(message, type = 'info', duration = 4000) {
        if (!toastContainer) {
            console.warn('Toast container not found. Creating one.');
            createToastContainer();
        }
        const container = document.getElementById('toast-container');
        if (!container) return;

        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-triangle-exclamation',
            info: 'fa-circle-info'
        };

        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i><span>${message}</span>`;
        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) toast.remove();
            }, 400);
        }, duration);
    }

    /**
     * Hide all toasts immediately
     */
    function hideAllToasts() {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toasts = container.querySelectorAll('.toast');
        toasts.forEach(t => {
            t.classList.remove('show');
            setTimeout(() => {
                if (t.parentNode) t.remove();
            }, 400);
        });
    }

    /**
     * Create toast container if it doesn't exist
     */
    function createToastContainer() {
        if (document.getElementById('toast-container')) return;
        const container = document.createElement('div');
        container.id = 'toast-container';
        container.style.cssText = `
            position: fixed;
            bottom: 6rem;
            right: 2rem;
            z-index: 10000;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
            max-width: 340px;
            width: 100%;
            pointer-events: none;
        `;
        document.body.appendChild(container);
    }

    // ============================================================
    // 3. LOADER OVERLAY
    // ============================================================
    function showGlobalLoader() {
        if (loaderOverlay) {
            loaderOverlay.classList.remove('hidden');
        } else {
            console.warn('Loader overlay not found.');
        }
    }

    function hideGlobalLoader() {
        if (loaderOverlay) {
            loaderOverlay.classList.add('hidden');
        }
    }

    // ============================================================
    // 4. THEME EFFECTS — optional enhancements
    // ============================================================

    // 4a. Animated particles (lightweight canvas)
    function initParticles() {
        const canvas = document.createElement('canvas');
        canvas.id = 'particles-canvas';
        canvas.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 0;
            opacity: 0.15;
        `;
        document.body.appendChild(canvas);

        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];

        function resize() {
            width = canvas.width = window.innerWidth;
            height = canvas.height = window.innerHeight;
        }
        window.addEventListener('resize', resize);
        resize();

        const count = Math.min(80, Math.floor((width * height) / 20000));
        for (let i = 0; i < count; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                radius: Math.random() * 2 + 1,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                color: `hsl(${Math.random() * 60 + 180}, 80%, 60%)`
            });
        }

        function draw() {
            ctx.clearRect(0, 0, width, height);
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.fill();

                // Draw connections
                particles.forEach(p2 => {
                    const dx = p.x - p2.x;
                    const dy = p.y - p2.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(p.x, p.y);
                        ctx.lineTo(p2.x, p2.y);
                        ctx.strokeStyle = `rgba(0, 240, 255, ${0.08 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                });
            });
            requestAnimationFrame(draw);
        }
        draw();
    }

    // 4b. Cursor trail effect (lightweight)
    function initCursorTrail() {
        const trail = document.createElement('div');
        trail.id = 'cursor-trail';
        trail.style.cssText = `
            position: fixed;
            width: 30px;
            height: 30px;
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            background: radial-gradient(circle, rgba(0,240,255,0.3), transparent 70%);
            opacity: 0;
            transition: opacity 0.3s;
            transform: translate(-50%, -50%);
        `;
        document.body.appendChild(trail);

        let mouseX = 0, mouseY = 0;
        let trailX = 0, trailY = 0;

        document.addEventListener('mousemove', (e) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
            trail.style.opacity = '1';
        });

        document.addEventListener('mouseleave', () => {
            trail.style.opacity = '0';
        });

        function animateTrail() {
            trailX += (mouseX - trailX) * 0.1;
            trailY += (mouseY - trailY) * 0.1;
            trail.style.left = trailX + 'px';
            trail.style.top = trailY + 'px';
            requestAnimationFrame(animateTrail);
        }
        animateTrail();
    }

    // ============================================================
    // 5. NAVBAR ACTIVE LINK DETECTION
    // ============================================================
    function highlightActiveNav() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href && currentPath === href) {
                link.classList.add('active');
                link.style.color = '#00f0ff';
                link.style.textShadow = '0 0 12px rgba(0,240,255,0.5)';
            } else {
                link.classList.remove('active');
                link.style.color = '';
                link.style.textShadow = '';
            }
        });
    }

    // ============================================================
    // 6. SCROLL ANIMATIONS (Intersection Observer)
    // ============================================================
    function initScrollAnimations() {
        const elements = document.querySelectorAll('.animate-on-scroll');
        if (!elements.length) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

        elements.forEach(el => observer.observe(el));
    }

    // ============================================================
    // 7. BACK TO TOP BUTTON
    // ============================================================
    function createBackToTop() {
        if (document.getElementById('back-to-top')) return;

        const btn = document.createElement('button');
        btn.id = 'back-to-top';
        btn.innerHTML = '<i class="fas fa-arrow-up"></i>';
        btn.style.cssText = `
            position: fixed;
            bottom: 2rem;
            left: 2rem;
            z-index: 998;
            width: 44px;
            height: 44px;
            border-radius: 50%;
            background: linear-gradient(135deg, #00f0ff, #b44aff);
            border: none;
            color: #fff;
            font-size: 1.2rem;
            cursor: pointer;
            opacity: 0;
            visibility: hidden;
            transition: all 0.3s;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
        `;
        btn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        document.body.appendChild(btn);

        // Show/hide on scroll
        window.addEventListener('scroll', () => {
            if (window.pageYOffset > 400) {
                btn.style.opacity = '1';
                btn.style.visibility = 'visible';
                btn.style.transform = 'translateY(0)';
            } else {
                btn.style.opacity = '0';
                btn.style.visibility = 'hidden';
                btn.style.transform = 'translateY(20px)';
            }
        });
        // Initial state
        btn.style.transform = 'translateY(20px)';
    }

    // ============================================================
    // 8. LOCALSTORAGE HELPERS
    // ============================================================
    function saveData(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            console.error('Error saving to localStorage:', e);
            return false;
        }
    }

    function loadData(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.error('Error loading from localStorage:', e);
            return defaultValue;
        }
    }

    function removeData(key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (e) {
            console.error('Error removing from localStorage:', e);
            return false;
        }
    }

    // ============================================================
    // 9. UTILITY HELPERS
    // ============================================================
    function formatCurrency(amount, currency = 'USD') {
        try {
            return new Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: currency
            }).format(amount);
        } catch {
            return `$${amount.toFixed(2)}`;
        }
    }

    function formatDate(date, options = {}) {
        if (!(date instanceof Date)) date = new Date(date);
        if (isNaN(date.getTime())) return 'Invalid date';
        const defaultOptions = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', { ...defaultOptions, ...options });
    }

    function generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    // ============================================================
    // 10. GLOBAL ERROR HANDLER
    // ============================================================
    window.addEventListener('error', function(event) {
        console.error('Global error:', event.error || event.message);
        showToast('An unexpected error occurred. Please try again.', 'error');
        // Optionally log to a service
    });

    // ============================================================
    // 11. API FETCH WRAPPER
    // ============================================================
    async function apiRequest(url, options = {}) {
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };
        const mergedOptions = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...(options.headers || {})
            }
        };

        if (mergedOptions.body && typeof mergedOptions.body === 'object') {
            mergedOptions.body = JSON.stringify(mergedOptions.body);
        }

        try {
            showGlobalLoader();
            const response = await fetch(url, mergedOptions);
            let data;
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                try { data = JSON.parse(text); } catch { data = { message: text }; }
            }

            if (!response.ok) {
                const error = new Error(data.message || data.error || `HTTP ${response.status}`);
                error.status = response.status;
                error.data = data;
                throw error;
            }
            return data;
        } catch (error) {
            console.error('API request error:', error);
            showToast(error.message || 'Network error', 'error');
            throw error;
        } finally {
            hideGlobalLoader();
        }
    }

    // ============================================================
    // 12. INITIALIZE
    // ============================================================
    function init() {
        // Ensure toast container exists
        if (!document.getElementById('toast-container')) {
            createToastContainer();
        }

        // Highlight active nav
        highlightActiveNav();

        // Back to top button
        createBackToTop();

        // Scroll animations
        initScrollAnimations();

        // Theme effects (enable only if not disabled by user preference)
        // Check for data attribute or user preference
        const enableEffects = true; // Could be toggled by user settings
        if (enableEffects) {
            try {
                initParticles();
                initCursorTrail();
            } catch (e) {
                console.warn('Theme effects not initialized:', e);
            }
        }

        console.log('NexTrip AI core initialized.');
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // ============================================================
    // 13. EXPOSE GLOBALLY
    // ============================================================
    window.showToast = showToast;
    window.hideAllToasts = hideAllToasts;
    window.showGlobalLoader = showGlobalLoader;
    window.hideGlobalLoader = hideGlobalLoader;
    window.saveData = saveData;
    window.loadData = loadData;
    window.removeData = removeData;
    window.formatCurrency = formatCurrency;
    window.formatDate = formatDate;
    window.generateId = generateId;
    window.apiRequest = apiRequest;
    // Also alias for convenience
    window.NexTrip = {
        showToast,
        hideAllToasts,
        showGlobalLoader,
        hideGlobalLoader,
        saveData,
        loadData,
        removeData,
        formatCurrency,
        formatDate,
        generateId,
        apiRequest
    };

})();