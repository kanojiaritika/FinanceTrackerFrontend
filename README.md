# 💸 FinanceFlow – Personal Finance Tracker

**FinanceFlow** is a sleek and intuitive personal finance tracker built using vanilla HTML, CSS, and JavaScript. It helps users **track income, expenses, balances, and spending patterns** over time, with dynamic visualizations and filters for insightful financial management.

---

## 🌟 Features

### 📊 Dashboard Overview
- Real-time display of:
  - **Total Income**
  - **Total Expenses**
  - **Current Balance**
- Visual indicators showing monthly performance and trends.

### ➕ Add Transactions
- Add new **income** or **expense** records.
- Fields include:
  - Amount
  - Type (Income/Expense)
  - Category (e.g., Food, Salary)
  - Date (defaults to today)
  - Optional Description
- Input validation and helpful error messages.

### 🧾 Transaction History
- Table view of all transactions with:
  - Date, Type, Category, Description, Amount, Balance
- Features include:
  - **Delete individual entries**
  - **Export to CSV**
  - **Clear all transactions**
  - **Persistent storage using `localStorage`**

### 🧠 Filtering Capabilities
- Filter transactions by:
  - Exact Date
  - Duration: Today, Last 7 days, 30 days, 3 months
  - Type: Income or Expense

### 📈 Charts and Analytics
- **Income & Expense Donut Charts**
  - Categorized data with percentage breakdown
- **Balance Trend Line Chart**
  - Visualizes balance change over time for selected month
- **Spending by Category Bar Chart**
  - Horizontal comparison of top expense categories per month

### 🔐 Data Persistence
- All transaction and chart data is saved using browser **`localStorage`**.
- Automatically reloaded when the app starts.

---

## 🛠️ Technologies Used

- HTML5
- CSS3
- JavaScript (ES6+)
- [Chart.js](https://www.chartjs.org/)


