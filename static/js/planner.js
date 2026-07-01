/**
 * planner.js — NexTrip AI Trip Planner
 * Handles form submission, API calls, rendering, saving, and PDF export.
 * Uses global helpers: showToast, showLoader, hideLoader (from main.js)
 */

(function() {
    'use strict';

    // --- DOM References ---
    const form = document.getElementById('plan-form');
    const destinationInput = document.getElementById('destination');
    const daysInput = document.getElementById('days');
    const budgetSelect = document.getElementById('budget');
    const travelersInput = document.getElementById('travelers');
    const interestsContainer = document.getElementById('interests-container');
    const generateBtn = document.getElementById('generate-btn');
    const loadingOverlay = document.getElementById('loading-overlay');
    const outputContent = document.getElementById('output-content');
    const actionButtons = document.getElementById('action-buttons');
    const saveBtn = document.getElementById('save-trip-btn');
    const downloadBtn = document.getElementById('download-pdf-btn');

    // --- State ---
    let currentPlanData = null; // { destination, days, budget, travelers, interests, plan }

    // --- Interest Tags ---
    function initInterests() {
        if (!interestsContainer) return;
        const tags = interestsContainer.querySelectorAll('.interest-tag');
        tags.forEach(tag => {
            tag.addEventListener('click', function() {
                this.classList.toggle('active');
            });
        });
    }

    function getSelectedInterests() {
        if (!interestsContainer) return [];
        const active = interestsContainer.querySelectorAll('.interest-tag.active');
        return Array.from(active).map(el => el.dataset.interest);
    }

    // --- Render Plan Output ---
    function renderPlan(planText) {
        if (!outputContent) return;

        // Convert markdown-like text to HTML
        let html = '<div class="prose prose-invert max-w-none text-white/90">';
        const lines = planText.split('\n');

        for (let line of lines) {
            const trimmed = line.trim();
            if (trimmed === '') {
                html += '<br>';
                continue;
            }

            // Headers: lines starting with ## or **bold** as header
            if (trimmed.startsWith('##')) {
                const content = trimmed.replace(/^##\s*/, '');
                html += `<h3 class="text-xl font-bold text-cyan-400 mt-4 mb-2">${content}</h3>`;
            } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                const content = trimmed.replace(/\*\*/g, '');
                html += `<h4 class="text-lg font-semibold text-purple-300 mt-3">${content}</h4>`;
            } else if (trimmed.startsWith('* ')) {
                const content = trimmed.replace(/^\*\s*/, '');
                html += `<li class="ml-4 text-white/80">${content}</li>`;
            } else if (trimmed.startsWith('- ')) {
                const content = trimmed.replace(/^-\s*/, '');
                html += `<li class="ml-4 text-white/80">${content}</li>`;
            } else {
                html += `<p class="my-1 text-white/80">${trimmed}</p>`;
            }
        }

        html += '</div>';
        outputContent.innerHTML = html;
    }

    // --- Show placeholder ---
    function showPlaceholder() {
        if (!outputContent) return;
        outputContent.innerHTML = `
            <div class="placeholder">
                <i class="fas fa-map-pin"></i>
                <p class="text-lg">Your trip plan will appear here</p>
                <p class="text-sm">Fill in the form and click Generate</p>
            </div>
        `;
    }

    // --- Generate Trip ---
    async function generateTrip(e) {
        e.preventDefault();

        const destination = destinationInput.value.trim();
        if (!destination) {
            window.showToast('Please enter a destination', 'warning');
            return;
        }

        const days = parseInt(daysInput.value) || 3;
        const budget = budgetSelect.value;
        const travelers = parseInt(travelersInput.value) || 1;
        const interests = getSelectedInterests();

        // Show loading
        loadingOverlay.classList.remove('hidden');
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

        try {
            const response = await fetch('/api/plan', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    destination,
                    days,
                    budget,
                    travelers,
                    interests
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            // Expect data.plan — API must return { plan: "..." }
            const plan = data.plan || 'No plan generated.';
            renderPlan(plan);

            // Store current plan data for save/PDF
            currentPlanData = {
                destination,
                days,
                budget,
                travelers,
                interests,
                plan
            };

            // Show action buttons
            actionButtons.classList.remove('hidden');
            window.showToast('Trip generated successfully!', 'success');

        } catch (error) {
            console.error('Generation error:', error);
            window.showToast('Failed to generate trip. Please try again.', 'error');
            // Show placeholder again if output is empty
            if (!currentPlanData) {
                showPlaceholder();
            }
        } finally {
            loadingOverlay.classList.add('hidden');
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> Generate Trip';
        }
    }

    // --- Save Trip to localStorage ---
    function saveTrip() {
        if (!currentPlanData) {
            window.showToast('No trip to save. Generate one first!', 'warning');
            return;
        }

        const tripsKey = 'nextrip_saved_trips';
        let trips = JSON.parse(localStorage.getItem(tripsKey) || '[]');

        const newTrip = {
            id: Date.now(),
            destination: currentPlanData.destination,
            days: currentPlanData.days,
            budget: currentPlanData.budget,
            travelers: currentPlanData.travelers,
            interests: currentPlanData.interests,
            plan: currentPlanData.plan,
            savedAt: new Date().toISOString()
        };

        trips.push(newTrip);
        localStorage.setItem(tripsKey, JSON.stringify(trips));
        window.showToast('Trip saved to favorites!', 'success');
    }

    // --- Download PDF using jsPDF ---
    function downloadPDF() {
        if (!currentPlanData) {
            window.showToast('No trip to export. Generate one first!', 'warning');
            return;
        }

        // Fix 1: Check if jsPDF is loaded
        if (typeof jspdf === 'undefined') {
            window.showToast('jsPDF library not loaded', 'error');
            return;
        }

        const { destination, days, budget, travelers, interests, plan } = currentPlanData;
        const doc = new jspdf.jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        let y = 20;

        // Title
        doc.setFontSize(22);
        doc.setTextColor(0, 240, 255);
        doc.text('NexTrip AI - Trip Plan', margin, y);
        y += 10;

        // Details
        doc.setFontSize(14);
        doc.setTextColor(200, 200, 255);
        doc.text(`Destination: ${destination}`, margin, y);
        y += 8;
        doc.text(`Days: ${days}`, margin, y);
        y += 8;
        doc.text(`Budget: ${budget}`, margin, y);
        y += 8;
        doc.text(`Travelers: ${travelers}`, margin, y);
        y += 8;
        doc.text(`Interests: ${interests.join(', ') || 'General'}`, margin, y);
        y += 12;

        // Plan content
        doc.setFontSize(12);
        doc.setTextColor(220, 220, 255);
        const lines = plan.split('\n');
        for (let line of lines) {
            const trimmed = line.trim();
            if (trimmed === '') {
                y += 4;
                continue;
            }

            // Detect headers for styling (simple)
            let fontSize = 12;
            let textColor = [220, 220, 255];
            if (trimmed.startsWith('##')) {
                fontSize = 16;
                textColor = [0, 240, 255];
                line = trimmed.replace(/^##\s*/, '');
            } else if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                fontSize = 14;
                textColor = [180, 74, 255];
                line = trimmed.replace(/\*\*/g, '');
            } else if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                line = '• ' + trimmed.replace(/^[\*\-\s]+/, '');
            }

            doc.setFontSize(fontSize);
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            const wrapped = doc.splitTextToSize(line, pageWidth - 2 * margin);
            doc.text(wrapped, margin, y);
            y += (wrapped.length * 6) + 2;
            // Reset for next line
            doc.setTextColor(220, 220, 255);
            doc.setFontSize(12);

            if (y > 270) {
                doc.addPage();
                y = 20;
            }
        }

        // Footer
        doc.setFontSize(10);
        doc.setTextColor(150, 150, 150);
        const footer = 'Generated by NexTrip AI';
        doc.text(footer, pageWidth - margin - doc.getTextWidth(footer), doc.internal.pageSize.getHeight() - 10);

        doc.save(`Trip_Plan_${destination}.pdf`);
        window.showToast('PDF downloaded!', 'success');
    }

    // --- Initialize ---
    function init() {
        // Interest tags
        initInterests();

        // Fix 2: Prevent null errors on event listeners
        if (form) {
            form.addEventListener('submit', generateTrip);
        }

        if (saveBtn) {
            saveBtn.addEventListener('click', saveTrip);
        }

        if (downloadBtn) {
            downloadBtn.addEventListener('click', downloadPDF);
        }

        // Show placeholder initially if no output
        if (outputContent && outputContent.children.length === 0) {
            showPlaceholder();
        }

        // Ensure action buttons are hidden initially
        if (actionButtons) {
            actionButtons.classList.add('hidden');
        }
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();