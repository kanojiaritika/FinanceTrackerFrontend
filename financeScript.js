// Global Variables
let form = document.getElementById("form");
let incomeData = {};
let expenseData = {};
let balance = 0;
let transactions = JSON.parse(localStorage.getItem("transactions")) || [];
let currentBalance = 0;

// Chart instances
let incomeChart, expenseChart, balanceLineChart, barChart;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
  initializeCharts();
  loadTransactionsFromStorage();
  updateAllDisplays();
  setDefaultDate();
  setupEventListeners();
});

// Set default date to today
function setDefaultDate() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('date').value = today;
  document.getElementById('monthSelect').value = today.substring(0, 7);
}

// Setup all event listeners
function setupEventListeners() {
  // Form submission
  form.addEventListener("submit", handleFormSubmit);
  
  // Filter listeners
  document.getElementById("filter-date").addEventListener("change", renderTransactions);
  document.getElementById("filter-duration").addEventListener("change", function() {
    document.getElementById("filter-date").value = "";
    renderTransactions();
  });
  document.getElementById("filter-type").addEventListener("change", renderTransactions);
  
  // Month selector for analytics
  document.getElementById("monthSelect").addEventListener("change", updateGraphs);
  
  // Export and clear buttons
  document.getElementById("export-btn").addEventListener("click", exportTransactions);
  document.getElementById("clear-all-btn").addEventListener("click", showClearAllModal);
  
  // Modal event listeners
  document.getElementById("modal-close").addEventListener("click", hideModal);
  document.getElementById("modal-cancel").addEventListener("click", hideModal);
  document.getElementById("modal-overlay").addEventListener("click", function(e) {
    if (e.target === this) hideModal();
  });
}

// Form submission handler
function handleFormSubmit(event) {
  event.preventDefault();
  
  const formData = getFormData();
  if (!validateForm(formData)) return;
  
  addTransactionData(formData);
  clearForm();
  showToast("Transaction added successfully!");
}

// Get form data
function getFormData() {
  return {
    amount: Number(document.getElementById("amount").value),
    type: document.getElementById("type").value,
    category: document.getElementById("category").value.trim(),
    date: document.getElementById("date").value,
    description: document.getElementById("desc").value.trim()
  };
}

// Validate form data
function validateForm(data) {
  let isValid = true;
  
  // Clear previous errors
  clearErrors();
  
  // Validate amount
  if (!data.amount || data.amount <= 0) {
    showError("amount", "Please enter a valid amount");
    isValid = false;
  }
  
  // Validate category
  if (!data.category) {
    showError("category", "Please enter a category");
    isValid = false;
  }
  
  // Validate date
  if (!data.date) {
    showError("date", "Please select a date");
    isValid = false;
  } else {
    const selectedDate = new Date(data.date);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (selectedDate > today) {
      showError("date", "Future dates are not allowed");
      isValid = false;
    }
  }
  
  return isValid;
}

// Show form error
function showError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const errorElement = document.getElementById(fieldId + "-error");
  
  field.classList.add("input-error");
  errorElement.textContent = message;
  errorElement.style.display = "block";
}

// Clear all form errors
function clearErrors() {
  const errorElements = document.querySelectorAll(".error");
  const inputElements = document.querySelectorAll(".input-error");
  
  errorElements.forEach(el => {
    el.style.display = "none";
    el.textContent = "";
  });
  
  inputElements.forEach(el => {
    el.classList.remove("input-error");
  });
}

// Add transaction data
function addTransactionData(data) {
  // Update category data
  if (data.type === "income") {
    incomeData[data.category] = (incomeData[data.category] || 0) + data.amount;
    balance += data.amount;
  } else {
    expenseData[data.category] = (expenseData[data.category] || 0) + data.amount;
    balance -= data.amount;
  }
  
  // Add to transactions array
  currentBalance += data.type === "income" ? data.amount : -data.amount;
  transactions.push({
    id: Date.now(),
    type: data.type,
    category: data.category,
    amount: data.amount,
    date: data.date,
    description: data.description,
    balance: currentBalance,
    timestamp: new Date().toISOString()
  });
  
  // Save to localStorage
  saveTransactionsToStorage();
  
  // Update all displays
  updateAllDisplays();
}

// Clear form
function clearForm() {
  document.getElementById("amount").value = "";
  document.getElementById("category").value = "";
  document.getElementById("desc").value = "";
  // Keep date and type as they are commonly reused
}

// Update all displays
function updateAllDisplays() {
  updateBalance();
  updateOverviewCards();
  updateCharts();
  renderTransactions();
  updateGraphs();
}

// Update balance display
function updateBalance() {
  const balanceElements = [
    document.getElementById("balance-amount"),
    document.getElementById("header-balance"),
    document.getElementById("current-balance")
  ];
  
  balanceElements.forEach(el => {
    if (el) {
      el.textContent = `₹${balance.toLocaleString('en-IN')}`;
      el.className = balance >= 0 ? 'stat-value positive' : 'stat-value negative';
    }
  });
}

// Update overview cards
function updateOverviewCards() {
  const totalIncome = Object.values(incomeData).reduce((sum, val) => sum + val, 0);
  const totalExpenses = Object.values(expenseData).reduce((sum, val) => sum + val, 0);
  
  document.getElementById("total-income").textContent = `₹${totalIncome.toLocaleString('en-IN')}`;
  document.getElementById("total-expenses").textContent = `₹${totalExpenses.toLocaleString('en-IN')}`;
  
  // Update change indicators (simplified for now)
  document.getElementById("income-change").textContent = `${Object.keys(incomeData).length} categories`;
  document.getElementById("expense-change").textContent = `${Object.keys(expenseData).length} categories`;
  document.getElementById("balance-change").textContent = balance >= 0 ? "Positive balance" : "Negative balance";
}

// Initialize charts
function initializeCharts() {
  // Center text plugin for donut charts
  const centerTextPlugin = {
    id: "centerText",
    beforeDraw: function (chart) {
      if (chart.config.type !== 'doughnut') return;
      
      const width = chart.width;
      const height = chart.height;
      const ctx = chart.ctx;
      
      ctx.restore();
      const fontSize = Math.min(width, height) / 16;
      ctx.font = `bold ${fontSize}px sans-serif`;
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#1e293b";
      
      const total = chart.config.data.datasets[0].data.reduce((a, b) => a + b, 0);
      if (total > 0) {
        const text = "₹" + total.toLocaleString('en-IN');
        const textX = Math.round((width - ctx.measureText(text).width) / 2);
        const textY = height / 2;
        
        ctx.fillText(text, textX, textY);
      }
      
      ctx.save();
    },
  };
  
  Chart.register(centerTextPlugin);
  
  // Initialize income chart
  const incomeCtx = document.getElementById("income").getContext("2d");
  incomeChart = new Chart(incomeCtx, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [],
        borderWidth: 0,
        hoverBorderWidth: 2,
        hoverBorderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            usePointStyle: true,
            font: {
              size: 12
            }
          }
        }
      },
      cutout: '60%'
    },
    plugins: [centerTextPlugin]
  });
  
  // Initialize expense chart
  const expenseCtx = document.getElementById("expense").getContext("2d");
  expenseChart = new Chart(expenseCtx, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [{
        data: [],
        backgroundColor: [],
        borderWidth: 0,
        hoverBorderWidth: 2,
        hoverBorderColor: '#fff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: "bottom",
          labels: {
            padding: 20,
            usePointStyle: true,
            font: {
              size: 12
            }
          }
        }
      },
      cutout: '60%'
    },
    plugins: [centerTextPlugin]
  });
  
  // Initialize balance line chart
  const balanceCtx = document.getElementById("balanceLineChart").getContext("2d");
  balanceLineChart = new Chart(balanceCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [{
        label: "Balance Over Time",
        data: [],
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.1)",
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: "#2563eb",
        pointBorderColor: "#fff",
        pointBorderWidth: 2
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
        x: {
          title: {
            display: true,
            text: "Date",
            font: {
              weight: 'bold'
            }
          },
          grid: {
            display: false
          }
        },
        y: {
          title: {
            display: true,
            text: "Balance (₹)",
            font: {
              weight: 'bold'
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        }
      }
    }
  });
  
  // Initialize bar chart
  const barCtx = document.getElementById("barChart").getContext("2d");
  barChart = new Chart(barCtx, {
    type: "bar",
    data: {
      labels: [],
      datasets: [{
        label: "Spending",
        data: [],
        backgroundColor: "rgba(239, 68, 68, 0.8)",
        borderColor: "#ef4444",
        borderWidth: 1,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: "y",
      plugins: {
        legend: {
          display: false
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          title: {
            display: true,
            text: "Amount (₹)",
            font: {
              weight: 'bold'
            }
          },
          grid: {
            color: 'rgba(0, 0, 0, 0.1)'
          }
        },
        y: {
          grid: {
            display: false
          }
        }
      }
    }
  });
}

// Generate color palette
function generateColorPalette(count, baseHue = 200) {
  const colors = [];
  const saturation = 70;
  const lightness = 60;
  
  for (let i = 0; i < count; i++) {
    const hue = (baseHue + (i * 360 / count)) % 360;
    colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
  }
  
  return colors;
}

// Update charts
function updateCharts() {
  updateIncomeChart();
  updateExpenseChart();
}

// Update income chart
function updateIncomeChart() {
  const values = Object.values(incomeData);
  const labels = Object.keys(incomeData);
  
  if (values.length === 0) {
    document.getElementById("income-empty").style.display = "flex";
    incomeChart.canvas.style.display = "none";
    return;
  }
  
  document.getElementById("income-empty").style.display = "none";
  incomeChart.canvas.style.display = "block";
  
  incomeChart.data.labels = labels;
  incomeChart.data.datasets[0].data = values;
  incomeChart.data.datasets[0].backgroundColor = generateColorPalette(values.length, 120);
  incomeChart.update();
}

// Update expense chart
function updateExpenseChart() {
  const values = Object.values(expenseData);
  const labels = Object.keys(expenseData);
  
  if (values.length === 0) {
    document.getElementById("expense-empty").style.display = "flex";
    expenseChart.canvas.style.display = "none";
    return;
  }
  
  document.getElementById("expense-empty").style.display = "none";
  expenseChart.canvas.style.display = "block";
  
  expenseChart.data.labels = labels;
  expenseChart.data.datasets[0].data = values;
  expenseChart.data.datasets[0].backgroundColor = generateColorPalette(values.length, 0);
  expenseChart.update();
}

// Render transactions table
function renderTransactions() {
  const tableBody = document.getElementById("transactions-body");
  const selectedDate = document.getElementById("filter-date").value;
  const duration = document.getElementById("filter-duration").value;
  const typeFilter = document.getElementById("filter-type").value;
  
  let filtered = filterTransactions(selectedDate, duration, typeFilter);
  
  if (filtered.length === 0) {
    tableBody.innerHTML = `
      <tr class="no-data">
        <td colspan="7">
          <div class="no-data-message">
            <i class="fas fa-inbox"></i>
            <p>No transactions found for the selected filters.</p>
          </div>
        </td>
      </tr>
    `;
    return;
  }
  
  tableBody.innerHTML = "";
  
  // Sort by date (newest first)
  filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  filtered.forEach((transaction) => {
    const row = document.createElement("tr");
    row.className = "fade-in";
    
    const typeClass = transaction.type === "income" ? "income" : "expense";
    const amountClass = transaction.type === "income" ? "amount-income" : "amount-expense";
    const amountPrefix = transaction.type === "income" ? "+" : "-";
    
    row.innerHTML = `
      <td>
        <span class="transaction-type ${typeClass}">
          <i class="fas fa-arrow-${transaction.type === 'income' ? 'up' : 'down'}"></i>
          ${transaction.type}
        </span>
      </td>
      <td>${transaction.category}</td>
      <td>${transaction.description || "-"}</td>
      <td class="${amountClass}">${amountPrefix}₹${transaction.amount.toLocaleString('en-IN')}</td>
      <td>${formatDate(transaction.date)}</td>
      <td>₹${transaction.balance.toLocaleString('en-IN')}</td>
      <td>
        <div class="action-buttons">
          <button class="action-btn delete" onclick="deleteTransaction(${transaction.id})" title="Delete">
            <i class="fas fa-trash"></i>
          </button>
        </div>
      </td>
    `;
    
    tableBody.appendChild(row);
  });
}

// Filter transactions
function filterTransactions(selectedDate, duration, typeFilter) {
  const today = new Date();
  
  return transactions.filter((t) => {
    // Date filter
    if (selectedDate && t.date !== selectedDate) return false;
    
    // Duration filter
    if (duration && !selectedDate) {
      const transactionDate = new Date(t.date);
      const daysDiff = Math.floor((today - transactionDate) / (1000 * 60 * 60 * 24));
      
      switch (duration) {
        case "today":
          if (daysDiff !== 0) return false;
          break;
        case "7days":
          if (daysDiff > 7) return false;
          break;
        case "30days":
          if (daysDiff > 30) return false;
          break;
        case "3months":
          if (daysDiff > 90) return false;
          break;
      }
    }
    
    // Type filter
    if (typeFilter && t.type !== typeFilter) return false;
    
    return true;
  });
}

// Format date for display
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

// Delete transaction
function deleteTransaction(id) {
  showModal(
    "Delete Transaction",
    "Are you sure you want to delete this transaction? This action cannot be undone.",
    () => {
      const transactionIndex = transactions.findIndex(t => t.id === id);
      if (transactionIndex === -1) return;
      
      const transaction = transactions[transactionIndex];
      
      // Update category data
      if (transaction.type === "income") {
        incomeData[transaction.category] -= transaction.amount;
        if (incomeData[transaction.category] <= 0) {
          delete incomeData[transaction.category];
        }
        balance -= transaction.amount;
      } else {
        expenseData[transaction.category] -= transaction.amount;
        if (expenseData[transaction.category] <= 0) {
          delete expenseData[transaction.category];
        }
        balance += transaction.amount;
      }
      
      // Remove from transactions array
      transactions.splice(transactionIndex, 1);
      
      // Recalculate balances for remaining transactions
      recalculateBalances();
      
      // Save and update displays
      saveTransactionsToStorage();
      updateAllDisplays();
      
      showToast("Transaction deleted successfully!");
      hideModal();
    }
  );
}

// Recalculate balances for all transactions
function recalculateBalances() {
  // Sort transactions by date
  transactions.sort((a, b) => new Date(a.date) - new Date(b.date));
  
  let runningBalance = 0;
  transactions.forEach(transaction => {
    runningBalance += transaction.type === "income" ? transaction.amount : -transaction.amount;
    transaction.balance = runningBalance;
  });
  
  currentBalance = runningBalance;
}

// Update graphs for selected month
function updateGraphs() {
  const selectedMonth = document.getElementById("monthSelect").value;
  if (!selectedMonth) {
    showEmptyCharts();
    return;
  }
  
  updateBalanceLineChart(selectedMonth);
  updateCategoryBarChart(selectedMonth);
}

// Update balance line chart
function updateBalanceLineChart(selectedMonth) {
  const monthTransactions = transactions
    .filter(t => t.date.startsWith(selectedMonth))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
  
  if (monthTransactions.length === 0) {
    document.getElementById("balance-empty").style.display = "flex";
    balanceLineChart.canvas.style.display = "none";
    return;
  }
  
  document.getElementById("balance-empty").style.display = "none";
  balanceLineChart.canvas.style.display = "block";
  
  const labels = [];
  const balanceValues = [];
  let runningBalance = 0;
  
  // Get starting balance (balance before this month)
  const monthStart = new Date(selectedMonth + "-01");
  const previousTransactions = transactions.filter(t => new Date(t.date) < monthStart);
  runningBalance = previousTransactions.reduce((sum, t) => {
    return sum + (t.type === "income" ? t.amount : -t.amount);
  }, 0);
  
  // Add starting point
  labels.push(selectedMonth + "-01");
  balanceValues.push(runningBalance);
  
  // Add each transaction
  monthTransactions.forEach(transaction => {
    runningBalance += transaction.type === "income" ? transaction.amount : -transaction.amount;
    labels.push(transaction.date);
    balanceValues.push(runningBalance);
  });
  
  balanceLineChart.data.labels = labels;
  balanceLineChart.data.datasets[0].data = balanceValues;
  balanceLineChart.update();
}

// Update category bar chart
function updateCategoryBarChart(selectedMonth) {
  const monthExpenses = transactions.filter(
    t => t.type === "expense" && t.date.startsWith(selectedMonth)
  );
  
  if (monthExpenses.length === 0) {
    document.getElementById("category-empty").style.display = "flex";
    barChart.canvas.style.display = "none";
    return;
  }
  
  document.getElementById("category-empty").style.display = "none";
  barChart.canvas.style.display = "block";
  
  const categoryTotals = {};
  monthExpenses.forEach(transaction => {
    categoryTotals[transaction.category] = (categoryTotals[transaction.category] || 0) + transaction.amount;
  });
  
  const sortedCategories = Object.entries(categoryTotals)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 10); // Top 10 categories
  
  const labels = sortedCategories.map(([category]) => category);
  const values = sortedCategories.map(([,amount]) => amount);
  
  barChart.data.labels = labels;
  barChart.data.datasets[0].data = values;
  barChart.update();
}

// Show empty charts
function showEmptyCharts() {
  document.getElementById("balance-empty").style.display = "flex";
  document.getElementById("category-empty").style.display = "flex";
  balanceLineChart.canvas.style.display = "none";
  barChart.canvas.style.display = "none";
}

// Export transactions
function exportTransactions() {
  if (transactions.length === 0) {
    showToast("No transactions to export!", "warning");
    return;
  }
  
  const csvContent = generateCSV();
  downloadCSV(csvContent, `transactions_${new Date().toISOString().split('T')[0]}.csv`);
  showToast("Transactions exported successfully!");
}

// Generate CSV content
function generateCSV() {
  const headers = ["Date", "Type", "Category", "Description", "Amount", "Balance"];
  const rows = transactions.map(t => [
    t.date,
    t.type,
    t.category,
    t.description || "",
    t.amount,
    t.balance
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(","))
    .join("\n");
  
  return csvContent;
}

// Download CSV file
function downloadCSV(content, filename) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

// Show clear all modal
function showClearAllModal() {
  if (transactions.length === 0) {
    showToast("No transactions to clear!", "warning");
    return;
  }
  
  showModal(
    "Clear All Transactions",
    "Are you sure you want to delete all transactions? This action cannot be undone and will reset all your data.",
    clearAllTransactions
  );
}

// Clear all transactions
function clearAllTransactions() {
  transactions = [];
  incomeData = {};
  expenseData = {};
  balance = 0;
  currentBalance = 0;
  
  saveTransactionsToStorage();
  updateAllDisplays();
  
  showToast("All transactions cleared successfully!");
  hideModal();
}

// Save transactions to localStorage
function saveTransactionsToStorage() {
  localStorage.setItem("transactions", JSON.stringify(transactions));
  localStorage.setItem("incomeData", JSON.stringify(incomeData));
  localStorage.setItem("expenseData", JSON.stringify(expenseData));
  localStorage.setItem("balance", balance.toString());
  localStorage.setItem("currentBalance", currentBalance.toString());
}

// Load transactions from localStorage
function loadTransactionsFromStorage() {
  const savedIncomeData = localStorage.getItem("incomeData");
  const savedExpenseData = localStorage.getItem("expenseData");
  const savedBalance = localStorage.getItem("balance");
  const savedCurrentBalance = localStorage.getItem("currentBalance");
  
  if (savedIncomeData) incomeData = JSON.parse(savedIncomeData);
  if (savedExpenseData) expenseData = JSON.parse(savedExpenseData);
  if (savedBalance) balance = parseFloat(savedBalance);
  if (savedCurrentBalance) currentBalance = parseFloat(savedCurrentBalance);
  
  // Ensure all transactions have IDs
  transactions.forEach((transaction, index) => {
    if (!transaction.id) {
      transaction.id = Date.now() + index;
    }
  });
}

// Show toast notification
function showToast(message, type = "success") {
  const toast = document.getElementById("toast");
  const toastMessage = document.getElementById("toast-message");
  
  toastMessage.textContent = message;
  toast.className = `toast ${type}`;
  toast.classList.add("show");
  
  setTimeout(() => {
    toast.classList.remove("show");
  }, 3000);
}

// Show modal
function showModal(title, message, confirmCallback) {
  const modal = document.getElementById("modal-overlay");
  const modalTitle = document.getElementById("modal-title");
  const modalMessage = document.getElementById("modal-message");
  const confirmBtn = document.getElementById("modal-confirm");
  
  modalTitle.textContent = title;
  modalMessage.textContent = message;
  
  // Remove previous event listeners
  const newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);
  
  // Add new event listener
  newConfirmBtn.addEventListener("click", confirmCallback);
  
  modal.classList.add("show");
}

// Hide modal
function hideModal() {
  const modal = document.getElementById("modal-overlay");
  modal.classList.remove("show");
}