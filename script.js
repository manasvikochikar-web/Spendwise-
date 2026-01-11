/**
 * SpendWise Elite - Application Logic
 * Manages state, LocalStorage persistence, and Charting
 */

// Application State Object
let state = {
    // Load existing transactions or start empty
    transactions: JSON.parse(localStorage.getItem('elite_t')) || [],
    // Load user-defined budget or default to 50k
    budget: localStorage.getItem('elite_b') || 50000,
    // Pre-defined category map
    categories: {
        Food: ['Dining', 'Groceries', 'Snacks'],
        Bills: ['Rent', 'Electric', 'Internet', 'Subscriptions'],
        Travel: ['Fuel', 'Uber', 'Flights'],
        Health: ['Gym', 'Doctor', 'Pharmacy'],
        Salary: ['Base Pay', 'Bonus', 'Freelance']
    }
};

let pieChart; // Reference to the Chart.js instance for updates

/**
 * Initializes listeners and initial UI state
 */
function init() {
    updateSubCats(); // Fill sub-category dropdown based on initial category
    render();        // Draw initial data from storage
    
    // UI Event Listeners
    document.getElementById('t-cat').addEventListener('change', updateSubCats);
    document.getElementById('t-form').addEventListener('submit', handleTransactionSubmit);
}

/**
 * Simple Authentication Handlers
 */
function handleLogin() {
    document.getElementById('auth-overlay').style.display = 'none';
    init();
}

function logout() {
    // Hard refresh resets the temporary session (overlay shows again)
    location.reload();
}

/**
 * Updates the sub-category dropdown menu based on the parent category selection
 */
function updateSubCats() {
    const cat = document.getElementById('t-cat').value;
    const sub = document.getElementById('t-subcat');
    sub.innerHTML = state.categories[cat]
        .map(s => `<option value="${s}">${s}</option>`)
        .join('');
}

/**
 * Saves and persists the budget threshold
 */
function saveBudget() {
    const newBudget = document.getElementById('budget-limit').value;
    if (newBudget) {
        state.budget = newBudget;
        localStorage.setItem('elite_b', state.budget);
        render(); // Refresh UI to reflect new budget metrics
    }
}

/**
 * Processes form submission to create a new transaction record
 */
function handleTransactionSubmit(e) {
    e.preventDefault();
    const t = {
        id: Date.now(),
        text: document.getElementById('t-text').value,
        amount: parseFloat(document.getElementById('t-amount').value),
        cat: document.getElementById('t-cat').value,
        sub: document.getElementById('t-subcat').value,
        recur: document.getElementById('t-recur').checked,
        date: new Date().toISOString()
    };
    
    // Add to state and persist
    state.transactions.unshift(t);
    localStorage.setItem('elite_t', JSON.stringify(state.transactions));
    
    // Refresh UI
    render();
    e.target.reset(); // Clear form fields
}

/**
 * Primary Render Function: Synchronizes UI with the Current State
 */
function render() {
    // 1. Render Transaction History List
    const list = document.getElementById('history');
    list.innerHTML = state.transactions.map(t => `
        <div class="t-item">
            <div>
                <strong>${t.text}</strong> <small style="color:#64748b">${t.cat} > ${t.sub}</small>
                ${t.recur ? '<span class="badge">RECURRING</span>' : ''}
            </div>
            <span class="${t.amount < 0 ? 'danger-text' : 'success-text'}">
                ${t.amount < 0 ? '-' : '+'}₹${Math.abs(t.amount)}
            </span>
        </div>
    `).join('');

    // 2. Financial Calculations
    const inc = state.transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
    const exp = Math.abs(state.transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0));
    
    // 3. Update Text Counters
    document.getElementById('total-bal').innerText = `₹${inc - exp}`;
    document.getElementById('total-inc').innerText = `₹${inc}`;
    document.getElementById('total-exp').innerText = `₹${exp}`;
    
    // 4. Update Budget Progress
    const bRem = (((state.budget - exp) / state.budget) * 100).toFixed(0);
    const budgetEl = document.getElementById('budget-rem');
    budgetEl.innerText = `${bRem}%`;
    budgetEl.className = bRem < 15 ? 'danger-text' : ''; // Red warning if budget is < 15%

    // 5. Run Logic for AI Insights and Charting
    updateAI(exp, inc);
    updateChart();
}

/**
 * Basic Rule-Based AI Engine to provide financial advice
 */
function updateAI(exp, inc) {
    const insight = document.getElementById('ai-insight');
    if (exp > inc && inc > 0) {
        insight.innerText = "🚨 High Risk: Your spending exceeds income. Suggest cutting 'Dining' by 20%.";
    } else if (exp > state.budget * 0.8) {
        insight.innerText = "⚠️ Budget Alert: You have used 80% of your monthly limit.";
    } else {
        insight.innerText = "✅ Stability: Your spending patterns look healthy for this month.";
    }
}

/**
 * Generates/Updates the Doughnut Chart using Chart.js
 */
function updateChart() {
    // Calculate total expenses per main category
    const data = Object.keys(state.categories).map(c => 
        Math.abs(state.transactions.filter(t => t.cat === c && t.amount < 0).reduce((s,t) => s + t.amount, 0))
    );

    const ctx = document.getElementById('chart-pie').getContext('2d');
    
    // Destroy previous instance to prevent visual glitches on hover
    if (pieChart) pieChart.destroy();
    
    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(state.categories),
            datasets: [{ 
                data, 
                backgroundColor: ['#6366f1', '#a855f7', '#ef4444', '#f59e0b', '#22c55e'],
                borderWidth: 0
            }]
        },
        options: { 
            plugins: { legend: { display: false } },
            cutout: '70%' // Creates the hollow ring effect
        }
    });
}

/**
 * Converts transaction data into a downloadable CSV file
 */
function exportData() {
    if (state.transactions.length === 0) return alert("No transactions to export.");
    
    let csv = "Date,Description,Category,SubCategory,Amount\n";
    state.transactions.forEach(t => {
        csv += `${new Date(t.date).toLocaleDateString()},${t.text},${t.cat},${t.sub},${t.amount}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `spendwise_export_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); // Trigger browser download
}
init();
