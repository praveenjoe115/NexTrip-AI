/**
 * expenses.js — NexTrip AI Budget Planner
 * Handles budget management, expenses, chart, and export.
 * Uses global helpers: showToast (from main.js)
 * Uses Chart.js from CDN (loaded in base.html)
 */

(function() {
    'use strict';

    // --- DOM References ---
    const tripNameInput = document.getElementById('trip-name');
    const totalBudgetInput = document.getElementById('total-budget');
    const setBudgetBtn = document.getElementById('set-budget-btn');

    const expenseTitleInput = document.getElementById('expense-title');
    const expenseAmountInput = document.getElementById('expense-amount');
    const expenseCategorySelect = document.getElementById('expense-category');
    const addExpenseBtn = document.getElementById('add-expense-btn');

    const budgetDisplay = document.getElementById('budget-display');
    const spentDisplay = document.getElementById('spent-display');
    const remainingDisplay = document.getElementById('remaining-display');

    const expenseChartCanvas = document.getElementById('expense-chart');
    const expenseListContainer = document.getElementById('expense-list');

    const clearExpensesBtn = document.getElementById('clear-expenses-btn');
    const exportBudgetBtn = document.getElementById('export-budget-btn');

    // --- State ---
    let budgetData = {
        tripName: '',
        totalBudget: 0,
        expenses: []
    };

    let chartInstance = null;

    // --- Storage Keys ---
    const STORAGE_KEYS = {
        budget: 'nextrip_budget',
        expenses: 'nextrip_expenses'
    };

    // --- Category Colors ---
    const CATEGORY_COLORS = {
        'Food': '#00f0ff',
        'Transport': '#b44aff',
        'Hotel': '#ff3d8a',
        'Shopping': '#4ecdc4',
        'Activities': '#ffd700',
        'Emergency': '#ff6b6b',
        'Other': '#8395a7'
    };

    const CATEGORY_BG_COLORS = {
        'Food': 'rgba(0, 240, 255, 0.2)',
        'Transport': 'rgba(180, 74, 255, 0.2)',
        'Hotel': 'rgba(255, 61, 138, 0.2)',
        'Shopping': 'rgba(78, 205, 196, 0.2)',
        'Activities': 'rgba(255, 215, 0, 0.2)',
        'Emergency': 'rgba(255, 107, 107, 0.2)',
        'Other': 'rgba(131, 149, 167, 0.2)'
    };

    // --- Load Data from localStorage ---
    function loadBudgetData() {
        // Load budget object (tripName + totalBudget)
        const savedBudget = JSON.parse(localStorage.getItem(STORAGE_KEYS.budget) || '{}');
        budgetData.tripName = savedBudget.tripName || '';
        budgetData.totalBudget = savedBudget.totalBudget || 0;

        // Load expenses array
        const savedExpenses = localStorage.getItem(STORAGE_KEYS.expenses);
        budgetData.expenses = savedExpenses ? JSON.parse(savedExpenses) : [];

        // Update UI fields
        if (tripNameInput) tripNameInput.value = budgetData.tripName;
        if (totalBudgetInput) totalBudgetInput.value = budgetData.totalBudget || '';

        renderAll();
    }

    // --- Save Data to localStorage ---
    function saveBudgetData() {
        // Save budget object
        localStorage.setItem(STORAGE_KEYS.budget, JSON.stringify({
            tripName: budgetData.tripName,
            totalBudget: budgetData.totalBudget
        }));
        // Save expenses
        localStorage.setItem(STORAGE_KEYS.expenses, JSON.stringify(budgetData.expenses));
    }

    // --- Save Trip Name ---
    function saveTripName() {
        const name = tripNameInput.value.trim();
        budgetData.tripName = name;
        saveBudgetData();
        renderAll();
    }

    // --- Set Budget ---
    function setBudget() {
        const amount = parseFloat(totalBudgetInput.value);
        if (isNaN(amount) || amount <= 0) {
            window.showToast('Please enter a valid budget amount.', 'warning');
            return;
        }
        budgetData.totalBudget = amount;
        saveBudgetData();
        renderAll();
        window.showToast(`Budget set to $${amount.toFixed(2)}`, 'success');
    }

    // --- Add Expense ---
    function addExpense() {
        const title = expenseTitleInput.value.trim();
        const amount = parseFloat(expenseAmountInput.value);
        const category = expenseCategorySelect.value;

        if (!title) {
            window.showToast('Please enter an expense title.', 'warning');
            return;
        }
        if (isNaN(amount) || amount <= 0) {
            window.showToast('Please enter a valid amount.', 'warning');
            return;
        }

        const expense = {
            id: Date.now(),
            title: title,
            amount: amount,
            category: category,
            date: new Date().toISOString()
        };

        budgetData.expenses.push(expense);
        saveBudgetData();
        renderAll();

        // Clear inputs
        expenseTitleInput.value = '';
        expenseAmountInput.value = '';

        window.showToast(`Added "${title}" - $${amount.toFixed(2)}`, 'success');
    }

    // --- Delete Expense ---
    function deleteExpense(id) {
        if (!confirm('Delete this expense?')) return;

        const expense = budgetData.expenses.find(e => e.id === id);
        budgetData.expenses = budgetData.expenses.filter(e => e.id !== id);
        saveBudgetData();
        renderAll();

        if (expense) {
            window.showToast(`Removed "${expense.title}"`, 'info');
        }
    }

    // --- Clear All Expenses ---
    function clearAllExpenses() {
        if (budgetData.expenses.length === 0) {
            window.showToast('No expenses to clear.', 'info');
            return;
        }

        if (!confirm('Delete all expenses? This cannot be undone.')) return;

        budgetData.expenses = [];
        saveBudgetData();
        renderAll();
        window.showToast('All expenses cleared.', 'info');
    }

    // --- Calculate Totals ---
    function calculateTotals() {
        const totalSpent = budgetData.expenses.reduce((sum, e) => sum + e.amount, 0);
        const remaining = budgetData.totalBudget - totalSpent;
        return { totalSpent, remaining };
    }

    // --- Render Summary Cards ---
    function renderSummary() {
        const { totalSpent, remaining } = calculateTotals();

        if (budgetDisplay) {
            budgetDisplay.textContent = `$${budgetData.totalBudget.toFixed(2)}`;
        }
        if (spentDisplay) {
            spentDisplay.textContent = `$${totalSpent.toFixed(2)}`;
        }
        if (remainingDisplay) {
            const remainingColor = remaining < 0 ? '#ff3d8a' : '#00f0ff';
            remainingDisplay.textContent = `$${remaining.toFixed(2)}`;
            remainingDisplay.style.color = remainingColor;
        }
    }

    // --- Render Expense List ---
    function renderExpenseList() {
        if (!expenseListContainer) return;

        if (budgetData.expenses.length === 0) {
            expenseListContainer.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-wallet"></i>
                    <p class="text-lg">No expenses recorded yet</p>
                    <p class="text-sm opacity-50">Add your first expense to start tracking</p>
                </div>
            `;
            return;
        }

        // Sort by date (newest first)
        const sorted = [...budgetData.expenses].reverse();

        let html = '';
        sorted.forEach(expense => {
            const categoryClass = expense.category.toLowerCase();
            const color = CATEGORY_COLORS[expense.category] || '#8395a7';

            html += `
                <div class="expense-item">
                    <div class="info">
                        <div class="title">${escapeHtml(expense.title)}</div>
                        <div class="category">
                            <span class="category-badge ${categoryClass}">${expense.category}</span>
                            <span style="font-size:0.75rem;color:rgba(255,255,255,0.3);margin-left:0.5rem;">
                                ${new Date(expense.date).toLocaleDateString()}
                            </span>
                        </div>
                    </div>
                    <div class="amount" style="color:${color}">$${expense.amount.toFixed(2)}</div>
                    <button class="delete-btn" data-id="${expense.id}" title="Delete">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
        });

        expenseListContainer.innerHTML = html;

        // Attach delete events
        expenseListContainer.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                deleteExpense(id);
            });
        });
    }

    // --- Simple HTML escaping ---
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // --- Render Chart ---
    function renderChart() {
        if (!expenseChartCanvas) return;

        // Group expenses by category
        const categoryTotals = {};
        budgetData.expenses.forEach(expense => {
            const cat = expense.category;
            categoryTotals[cat] = (categoryTotals[cat] || 0) + expense.amount;
        });

        const categories = Object.keys(categoryTotals);
        const amounts = categories.map(c => categoryTotals[c]);
        const colors = categories.map(c => CATEGORY_COLORS[c] || '#8395a7');
        const bgColors = categories.map(c => CATEGORY_BG_COLORS[c] || 'rgba(131,149,167,0.2)');

        // Destroy existing chart if it exists
        if (chartInstance) {
            chartInstance.destroy();
            chartInstance = null;
        }

        // If no expenses, show empty state
        if (categories.length === 0) {
            // Show a placeholder in the canvas
            const ctx = expenseChartCanvas.getContext('2d');
            ctx.clearRect(0, 0, expenseChartCanvas.width, expenseChartCanvas.height);
            ctx.fillStyle = 'rgba(255,255,255,0.2)';
            ctx.font = '16px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('No data to display', expenseChartCanvas.width / 2, expenseChartCanvas.height / 2);
            return;
        }

        // Create new chart
        const ctx = expenseChartCanvas.getContext('2d');
        chartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: amounts,
                    backgroundColor: colors.map(c => c + '80'), // 50% opacity
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
                            font: {
                                size: 11,
                                family: 'Inter, sans-serif'
                            }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                const percentage = total > 0 ? ((context.parsed / total) * 100).toFixed(1) : 0;
                                return `$${context.parsed.toFixed(2)} (${percentage}%)`;
                            }
                        },
                        backgroundColor: 'rgba(11,11,26,0.9)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        titleColor: '#fff',
                        bodyColor: '#e0e0ff',
                        cornerRadius: 8,
                        padding: 12
                    }
                },
                cutout: '65%'
            }
        });
    }

    // --- Render All ---
    function renderAll() {
        renderSummary();
        renderExpenseList();
        renderChart();
    }

    // --- Export Budget Report ---
    function exportBudgetReport() {
        if (budgetData.expenses.length === 0) {
            window.showToast('No expenses to export.', 'warning');
            return;
        }

        const { totalSpent, remaining } = calculateTotals();
        const now = new Date().toLocaleString();

        let report = '═══════════════════════════════════════\n';
        report += '  NEXTRIP AI — BUDGET REPORT\n';
        report += '═══════════════════════════════════════\n\n';
        report += `  Trip:        ${budgetData.tripName || 'Untitled Trip'}\n`;
        report += `  Generated:   ${now}\n`;
        report += `  Total Budget: $${budgetData.totalBudget.toFixed(2)}\n`;
        report += `  Total Spent:  $${totalSpent.toFixed(2)}\n`;
        report += `  Remaining:    $${remaining.toFixed(2)}\n`;
        report += `  Expenses:     ${budgetData.expenses.length}\n\n`;
        report += '─────────────────────────────────────────\n';
        report += '  EXPENSE DETAILS\n';
        report += '─────────────────────────────────────────\n\n';

        // Group by category for summary
        const categoryTotals = {};
        budgetData.expenses.forEach(e => {
            categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
        });

        report += '  Category Breakdown:\n';
        for (const [cat, total] of Object.entries(categoryTotals)) {
            const percentage = ((total / totalSpent) * 100).toFixed(1);
            report += `    ${cat.padEnd(12)} $${total.toFixed(2)} (${percentage}%)\n`;
        }

        report += '\n─────────────────────────────────────────\n';
        report += '  Individual Expenses:\n';
        report += '─────────────────────────────────────────\n\n';

        budgetData.expenses.forEach((e, i) => {
            const date = new Date(e.date).toLocaleDateString();
            report += `  ${(i + 1).toString().padStart(2)}. ${e.title.padEnd(20)} ${e.category.padEnd(10)} $${e.amount.toFixed(2).padStart(8)}  ${date}\n`;
        });

        report += '\n═══════════════════════════════════════\n';
        report += '  Generated by NexTrip AI\n';
        report += '═══════════════════════════════════════\n';

        // Create and download file
        const blob = new Blob([report], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Budget_Report_${budgetData.tripName || 'Trip'}_${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        window.showToast('Budget report exported!', 'success');
    }

    // --- Initialize ---
    function init() {
        // Load data
        loadBudgetData();

        // Event listeners
        if (setBudgetBtn) {
            setBudgetBtn.addEventListener('click', setBudget);
        }

        if (addExpenseBtn) {
            addExpenseBtn.addEventListener('click', addExpense);
        }

        if (clearExpensesBtn) {
            clearExpensesBtn.addEventListener('click', clearAllExpenses);
        }

        if (exportBudgetBtn) {
            exportBudgetBtn.addEventListener('click', exportBudgetReport);
        }

        // Allow Enter key on expense form
        if (expenseTitleInput) {
            expenseTitleInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    expenseAmountInput.focus();
                }
            });
        }

        if (expenseAmountInput) {
            expenseAmountInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    addExpenseBtn.click();
                }
            });
        }

        // Save trip name on blur
        if (tripNameInput) {
            tripNameInput.addEventListener('blur', saveTripName);
            tripNameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    tripNameInput.blur();
                }
            });
        }

        // Auto-set budget if number is entered with Enter
        if (totalBudgetInput) {
            totalBudgetInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    setBudgetBtn.click();
                }
            });
        }

        // Initialize chart
        renderChart();

        console.log('Budget Planner initialized. Expenses:', budgetData.expenses.length);
    }

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();