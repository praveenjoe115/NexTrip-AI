/**
 * journal.js — NexTrip AI Travel Journal
 * Handles saving, loading, deleting, exporting, and AI story generation for journal entries.
 * Uses global helpers: showToast (from main.js)
 * Uses jsPDF from CDN (loaded in base.html)
 */

(function() {
    'use strict';

    // --- DOM References ---
    const titleInput = document.getElementById('journal-title');
    const locationInput = document.getElementById('journal-location');
    const contentTextarea = document.getElementById('journal-content');
    const charCount = document.getElementById('char-count');
    const generateBtn = document.getElementById('generate-story-btn');
    const saveBtn = document.getElementById('save-journal-btn');
    const exportPdfBtn = document.getElementById('export-pdf-btn');
    const journalList = document.getElementById('journal-list');
    const loadingOverlay = document.getElementById('journal-loading');
    const clearAllBtn = document.getElementById('clear-journal-btn');

    const countDisplay = document.getElementById('journal-count');
    const locationsCountDisplay = document.getElementById('journal-locations-count');
    const latestDateDisplay = document.getElementById('journal-latest-date');

    // --- Storage Key ---
    const STORAGE_KEY = 'nextrip_journals';

    // --- State ---
    let journals = [];

    // --- Load Journals from localStorage ---
    function loadJournals() {
        const stored = localStorage.getItem(STORAGE_KEY);
        journals = stored ? JSON.parse(stored) : [];
        renderAll();
    }

    // --- Save Journals to localStorage ---
    function saveJournals() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(journals));
    }

    // --- Helper: Escape HTML ---
    function escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Character Counter ---
    function updateCharCount() {
        if (!contentTextarea || !charCount) return;
        const maxLength = 2000;
        const current = contentTextarea.value.length;
        charCount.textContent = `${current} / ${maxLength}`;
        if (current > maxLength) {
            charCount.classList.add('limit');
        } else {
            charCount.classList.remove('limit');
        }
        // Truncate if over limit
        if (current > maxLength) {
            contentTextarea.value = contentTextarea.value.substring(0, maxLength);
            charCount.textContent = `${maxLength} / ${maxLength}`;
        }
    }

    // --- Save Journal Entry ---
    function saveJournal() {
        const title = titleInput.value.trim();
        const location = locationInput.value.trim();
        const content = contentTextarea.value.trim();

        if (!title) {
            window.showToast('Please enter a title.', 'warning');
            return;
        }
        if (!content) {
            window.showToast('Please write some content.', 'warning');
            return;
        }

        const entry = {
            id: Date.now(),
            title: title,
            location: location || 'Unknown',
            content: content,
            createdAt: new Date().toISOString()
        };

        journals.push(entry);
        saveJournals();
        renderAll();

        // Clear form
        titleInput.value = '';
        locationInput.value = '';
        contentTextarea.value = '';
        updateCharCount();

        window.showToast('Journal entry saved!', 'success');
    }

    // --- Render Journal History ---
    function renderJournals() {
        if (!journalList) return;

        if (journals.length === 0) {
            journalList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book"></i>
                    <p class="text-lg">No journal entries yet</p>
                    <p class="sub">Write your first travel story and start building memories</p>
                </div>
            `;
            return;
        }

        // Sort by date (newest first)
        const sorted = [...journals].reverse();

        let html = '';
        sorted.forEach(entry => {
            const date = new Date(entry.createdAt);
            const dateStr = date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
            const timeStr = date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });

            html += `
                <div class="journal-card">
                    <div class="card-header">
                        <div class="title">${escapeHtml(entry.title)}</div>
                        <div class="location"><i class="fas fa-map-pin"></i> ${escapeHtml(entry.location)}</div>
                    </div>
                    <div class="card-content">${escapeHtml(entry.content)}</div>
                    <div class="card-footer">
                        <span class="date"><i class="far fa-calendar-alt"></i> ${dateStr} at ${timeStr}</span>
                        <button class="delete-btn" data-id="${entry.id}">
                            <i class="fas fa-times"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        });

        journalList.innerHTML = html;

        // Attach delete events
        journalList.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                deleteJournal(id);
            });
        });
    }

    // --- Delete Journal Entry ---
    function deleteJournal(id) {
        if (!confirm('Delete this journal entry?')) return;
        journals = journals.filter(entry => entry.id !== id);
        saveJournals();
        renderAll();
        window.showToast('Journal entry deleted.', 'info');
    }

    // --- Clear All Journals ---
    function clearAllJournals() {
        if (journals.length === 0) {
            window.showToast('No journals to clear.', 'info');
            return;
        }
        if (!confirm('Delete all journal entries?')) return;
        journals = [];
        saveJournals();
        renderAll();
        window.showToast('All journals cleared.', 'info');
    }

    // --- Update Statistics ---
    function updateStats() {
        if (countDisplay) countDisplay.textContent = journals.length;

        // Unique locations
        const locations = new Set(journals.map(j => j.location.toLowerCase().trim()));
        if (locationsCountDisplay) locationsCountDisplay.textContent = locations.size;

        // Latest date
        if (journals.length > 0 && latestDateDisplay) {
            const latest = journals.reduce((a, b) => new Date(a.createdAt) > new Date(b.createdAt) ? a : b);
            const date = new Date(latest.createdAt);
            latestDateDisplay.textContent = date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });
        } else if (latestDateDisplay) {
            latestDateDisplay.textContent = '—';
        }
    }

    // --- Render All ---
    function renderAll() {
        updateStats();
        renderJournals();
    }

    // --- AI Story Generator ---
    async function generateStory() {
        const title = titleInput.value.trim();
        const location = locationInput.value.trim();
        const content = contentTextarea.value.trim();

        // If no content, use a default prompt
        const prompt = content || `Write a short travel story about ${location || 'a travel experience'}${title ? ` titled "${title}"` : ''}.`;

        // Show loading on button
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';

        try {
            const response = await fetch('/api/journal', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    title: title || 'Untitled',
                    location: location || 'Unknown',
                    content: prompt
                })
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);

            // Insert the story into the textarea
            const story = data.story || data.received || 'No story generated.';
            contentTextarea.value = story;
            updateCharCount();

            window.showToast('AI story generated!', 'success');

        } catch (error) {
            console.error('AI story generation error:', error);
            window.showToast('Failed to generate story. Please try again.', 'error');
        } finally {
            generateBtn.disabled = false;
            generateBtn.innerHTML = '<i class="fas fa-wand-magic-sparkles"></i> AI Story';
        }
    }

    // --- Export PDF using jsPDF ---
    function exportPdf() {
        if (journals.length === 0) {
            window.showToast('No journals to export.', 'warning');
            return;
        }

        // Check if jsPDF is loaded
        if (typeof jspdf === 'undefined') {
            window.showToast('jsPDF library not loaded.', 'error');
            return;
        }

        const doc = new jspdf.jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const margin = 20;
        let y = 20;

        // Title
        doc.setFontSize(22);
        doc.setTextColor(0, 240, 255);
        doc.text('Travel Journal - NexTrip AI', margin, y);
        y += 10;

        // Date
        doc.setFontSize(12);
        doc.setTextColor(200, 200, 200);
        const now = new Date().toLocaleString();
        doc.text(`Exported: ${now}`, margin, y);
        y += 8;
        doc.text(`Total entries: ${journals.length}`, margin, y);
        y += 12;

        // Each journal entry
        doc.setFontSize(14);
        doc.setTextColor(255, 255, 255);

        // Sort by date (newest first)
        const sorted = [...journals].reverse();

        for (const entry of sorted) {
            // Check page space
            if (y > 240) {
                doc.addPage();
                y = 20;
            }

            const date = new Date(entry.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });

            // Title
            doc.setFontSize(16);
            doc.setTextColor(0, 240, 255);
            doc.text(`📖 ${entry.title || 'Untitled'}`, margin, y);
            y += 7;

            // Location
            doc.setFontSize(12);
            doc.setTextColor(180, 74, 255);
            doc.text(`📍 ${entry.location || 'Unknown'}  •  ${date}`, margin, y);
            y += 7;

            // Content
            doc.setFontSize(11);
            doc.setTextColor(220, 220, 220);
            const lines = doc.splitTextToSize(entry.content || '', pageWidth - 2 * margin);
            for (const line of lines) {
                if (y > 270) {
                    doc.addPage();
                    y = 20;
                }
                doc.text(line, margin, y);
                y += 5;
            }
            y += 4;

            // Divider
            doc.setDrawColor(255, 255, 255, 0.1);
            doc.line(margin, y, pageWidth - margin, y);
            y += 6;
        }

        doc.save(`Journal_Export_${new Date().toISOString().split('T')[0]}.pdf`);
        window.showToast('Journal exported as PDF!', 'success');
    }

    // --- Initialize ---
    function init() {
        // Load journals
        loadJournals();

        // Character counter
        if (contentTextarea) {
            contentTextarea.addEventListener('input', updateCharCount);
            updateCharCount();
        }

        // Save button
        if (saveBtn) {
            saveBtn.addEventListener('click', saveJournal);
        }

        // Generate AI story
        if (generateBtn) {
            generateBtn.addEventListener('click', generateStory);
        }

        // Export PDF
        if (exportPdfBtn) {
            exportPdfBtn.addEventListener('click', exportPdf);
        }

        // Clear all
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', clearAllJournals);
        }

        // Allow Ctrl+Enter to save
        if (contentTextarea) {
            contentTextarea.addEventListener('keydown', (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                    e.preventDefault();
                    saveBtn.click();
                }
            });
        }

        console.log('Journal initialized. Entries:', journals.length);
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();