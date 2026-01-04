const balance = document.getElementById('balance');
const money_plus = document.getElementById('income');
const money_minus = document.getElementById('expense');
const list = document.getElementById('list');
const form = document.getElementById('transaction-form');
const text = document.getElementById('text');
const amount = document.getElementById('amount');

// Get transactions from Local Storage
const localStorageTransactions = JSON.parse(localStorage.getItem('transactions'));
let transactions = localStorage.getItem('transactions') !== null
    ? localStorageTransactions
    : [];

// Add new transaction
function addTransaction(e) {
    e.preventDefault();

    const transaction = {
        id: Math.floor(Math.random() * 1000000),
        text: text.value,
        amount: +amount.value
    };

    transactions.push(transaction);

    addTransactionDOM(transaction);
    updateValues();
    updateLocalStorage();

    text.value = '';
    amount.value = '';
}

// Add transaction to DOM
function addTransactionDOM(transaction) {
    const sign = transaction.amount < 0 ? '-' : '+';

    const item = document.createElement('div');
    item.classList.add('transaction-item');

    item.innerHTML = `
        <div class="transaction-info">
            <h4>${transaction.text}</h4>
            <span>${new Date().toLocaleDateString()}</span>
        </div>
        <div>
            <span class="${transaction.amount < 0 ? 'amt-expense' : 'amt-income'}">
                ${sign} ₹${Math.abs(transaction.amount).toFixed(2)}
            </span>
            <button class="delete-btn" onclick="removeTransaction(${transaction.id})">x</button>
        </div>
    `;

    list.appendChild(item);
}

// Update balance, income and expense
function updateValues() {
    const amounts = transactions.map(t => t.amount);

    const total = amounts
        .reduce((acc, item) => acc + item, 0)
        .toFixed(2);

    const income = amounts
        .filter(item => item > 0)
        .reduce((acc, item) => acc + item, 0)
        .toFixed(2);

    const expense = (
        amounts
            .filter(item => item < 0)
            .reduce((acc, item) => acc + item, 0) * -1
    ).toFixed(2);

    balance.innerText = `₹${total}`;
    money_plus.innerText = `+ ₹${income}`;
    money_minus.innerText = `- ₹${expense}`;
}

// Remove transaction
function removeTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    updateLocalStorage();
    init();
}

// Update Local Storage
function updateLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
}

// Initialize app
function init() {
    list.innerHTML = '';
    transactions.forEach(addTransactionDOM);
    updateValues();
}

// Event listener
form.addEventListener('submit', addTransaction);

// Start app
init();
