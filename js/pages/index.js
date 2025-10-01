        let currentCurrency = JSON.parse(localStorage.getItem("userConfig")).convertCurrencyTo
        let startDate = 1;
        let pieChart = null;
        let lineChart = null;
        let currentDate = new Date();
        let allExpenses = [];
        let disabledCategories = new Set();
        let categoryColors = {};

        function createTable(expenses) {
            if (!expenses || expenses.length === 0) {
                const message = 'No expenses recorded for this month';
                return `<div class="no-data">${message}</div>`;
            }
            // Aggregate by day
            const aggregated = expenses.reduce((acc, expense) => {
                const date = new Date(expense.date).toISOString().split('T')[0]; // "YYYY-MM-DD"
                if (!acc[date]) acc[date] = [];
                acc[date].push(expense);
                return acc;
            }, {});

            return `
                <table class="expense-table">
                    <thead>
                        <tr>
                            <th></th>
                            <th></th>
                            <th></th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                       ${Object.keys(aggregated)
  .sort()
  .reverse()
  .map(date => {
    // Optional: display the date as a header
    const dateHeader = `<td colspan="5" style="text-align: left;font-weight:bold;background-color: var(--bg-primary);">${formatDateFromUTC(date).slice(0, 6).replace(',', '')}</td>`;

    // Map over each expense for this date
    const rows = aggregated[date]
      .map(expense => `
        <tr>
          <td style="text-align: center">
            ${expense.user === 'wescules'
              ? `<img src="img/wes.webp" class="circle-img">`
              : `<img src="img/abbie.webp" class="circle-img">`
            }
          </td>
          <!-- <td>${formatDateFromUTC(expense.date).slice(0, 6).replace(',', '')}</td> -->
          <td>
            <div>${escapeHTML(expense.name)}</div>
            <div style="color: ${categoryColors[expense.category]};">${escapeHTML(expense.category)}</div>
          </td>
          <td class="amount" style="color: #e74c3c; text-align: center;">${formatCurrencyInTable(expense.amount, expense.currency)}</td>
          <td>                
                <button class="delete-button" onclick="handleDeleteClick(event, '${expense.id}')">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </td>
        </tr>
      `)
      .join(''); // join all rows for this date

    return dateHeader + rows; // combine header + rows
  })
  .join('') // join all dates together
}

                    </tbody>
                </table>
            `;
        }

        function updateTable() {
            const showAll = false; //document.getElementById('showAllToggle').checked;
            document.querySelector('.month-navigation').style.display = showAll ? 'none' : 'flex';

            expensesForTable = getMonthExpenses(allExpenses);
            
            const tableContainer = document.getElementById('tableContainer');
            tableContainer.innerHTML = createTable(expensesForTable);
        }

        function assignCategoryColors(categories) {
            categories.forEach((category, index) => {
                if (!categoryColors[category]) {
                    categoryColors[category] = colorPalette[index % colorPalette.length];
                }
            });
        }

        function calculateCategoryBreakdown(expenses) {
            const categoryTotals = {};
            let totalAmount = 0;
            const convertCurrencyTo = JSON.parse(localStorage.getItem('userConfig')).convertCurrencyTo
            expenses.forEach(exp => {
                if (exp.amount < 0 && !disabledCategories.has(exp.category)) {
                    const amount = convertCurrency(Math.abs(exp.amount), exp.currency, convertCurrencyTo);
                    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + amount; totalAmount += amount;
                }
            });
            return Object.entries(categoryTotals).map(([category, total]) => ({
                category,
                total,
                percentage: totalAmount > 0 ? (total / totalAmount) * 100 : 0
            }))
                .sort((a, b) => b.total - a.total);
        }

        function calculateIncome(expenses) {
            return expenses
                .filter(exp => exp.amount > 0)
                .reduce((sum, exp) => sum + exp.amount, 0);
        }

        function calculateExpenses(expenses) {
            const convertCurrencyTo = JSON.parse(localStorage.getItem('userConfig')).convertCurrencyTo
            return expenses
                .filter(exp => exp.amount < 0).reduce((sum, exp) => sum + convertCurrency(Math.abs(exp.amount), exp.currency, convertCurrencyTo), 0);
        }

        function updateChartAndLegend() {
            const monthExpenses = getMonthExpenses(allExpenses);
            const chartBox = document.querySelector('.chart-box');
            const legendBox = document.getElementById('customLegend');
            const cashflowSection = document.getElementById('cashflow-section');
            const noDataMessage = document.getElementById('noDataMessage');
            const hasExpenses = monthExpenses.some(e => e.amount < 0); if (!hasExpenses) {
                if (pieChart) {
                    pieChart.destroy(); pieChart = null;
                } chartBox.style.display = 'none'; legendBox.style.display = 'none';
                cashflowSection.style.display = 'none'; noDataMessage.style.display = 'block';
            } else {
                chartBox.style.display = 'flex'; legendBox.style.display = 'flex'; cashflowSection.style.display = 'flex';
                noDataMessage.style.display = 'none'; const categoryData = calculateCategoryBreakdown(monthExpenses);
                updateCashflow(monthExpenses); createPieChart(categoryData); updateLegend(categoryData);
            }
        }

          const currencySelect = document.getElementById("currency");

        // Load from localStorage
        const cachedCurrency = localStorage.getItem("userConfig") ? JSON.parse(localStorage.getItem("userConfig")).defaultInputCurrency : null;
        if (cachedCurrency) {
            currencySelect.value = cachedCurrency; // set dropdown
        }

        
        function updateCashflow(expenses) {
            const income = calculateIncome(expenses);
            const expenseTotal = calculateExpenses(expenses);
            const balance = income - expenseTotal;
            document.getElementById('cashflow-income').textContent = formatCurrency(income);
            document.getElementById('cashflow-expenses').textContent = formatCurrency(expenseTotal);
            document.getElementById('cashflow-balance').textContent = formatCurrency(balance);
            const balanceElement = document.getElementById('cashflow-balance');
            if (balance >= 0) {
                balanceElement.classList.add('positive');
                balanceElement.classList.remove('negative');
            } else {
                balanceElement.classList.add('negative');
                balanceElement.classList.remove('positive');
            }
        }

        function createPieChart(categoryData) {
            if (pieChart) pieChart.destroy();
            pieChart = new Chart('categoryPieChart', {
                type: 'doughnut',
                data: {
                    labels: categoryData.map(c => c.category),
                    datasets: [{
                        data: categoryData.map(c => c.total),
                        backgroundColor: categoryData.map(c => categoryColors[c.category]),
                        borderColor: '#1a1a1a',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            callbacks: {
                                label: (context) => {
                                    const value = context.raw;
                                    const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                                    return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }

        function updateLegend(categoryData) {
            const legendContainer = document.getElementById('customLegend');
            legendContainer.innerHTML = '';
            const monthExpenses = getMonthExpenses(allExpenses);
            const currentMonthCategories = [...new Set(monthExpenses
                .filter(exp => exp.amount < 0).map(exp => exp.category))];
            const categoryMap = new Map(categoryData.map(cat => [cat.category, cat]));

            currentMonthCategories.sort((a, b) => {
                const dataA = categoryMap.get(a);
                const dataB = categoryMap.get(b);
                if (dataA && dataB) return dataB.total - dataA.total;
                if (dataA) return -1;
                if (dataB) return 1;
                return a.localeCompare(b);
            }).forEach(category => {
                const item = document.createElement('div');
                item.className = `legend-item${disabledCategories.has(category) ? ' disabled' : ''}`;
                const color = categoryColors[category];
                const categoryDataItem = categoryMap.get(category);
                const percentage = categoryDataItem ? ` (${categoryDataItem.percentage.toFixed(1)}%)` : '';
                const amount = categoryDataItem ? formatCurrency(categoryDataItem.total) : '';
                item.innerHTML = `
                    <div class="color-box" style="background-color: ${color}"></div>
                    <div class="legend-text">
                        <span>${category}${percentage}</span>
                        <span class="amount">${amount}</span>
                    </div>
                    `;
                item.addEventListener('click', () => toggleCategory(category));
                legendContainer.appendChild(item);
            });

            const convertCurrencyTo = JSON.parse(localStorage.getItem('userConfig')).convertCurrencyTo
            const activeTotalExpenses = monthExpenses
                .filter(exp => exp.amount < 0 && !disabledCategories.has(exp.category)).reduce((sum, exp) => sum +
                    convertCurrency(Math.abs(exp.amount), exp.currency, convertCurrencyTo), 0);

            const totalsHtml = `
                        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                            <div style="display: flex; justify-content: space-between; align-items: center;">
                                <span>Total:</span>
                                <span class="amount">
                                    ${formatCurrency(activeTotalExpenses)}
                                </span>
                            </div>
                        </div>
                        `;
            legendContainer.insertAdjacentHTML('beforeend', totalsHtml);
        }

        function toggleCategory(category) {
            if (disabledCategories.has(category)) {
                disabledCategories.delete(category);
            } else {
                disabledCategories.add(category);
            }
            updateChartAndLegend();
        }

        function populateCategoryDropDown(categories) {
            try {
                const categorySelect = document.getElementById('category');
                let parsedCategories = [];
                if(typeof categories === 'object' && categories.categories){
                    parsedCategories = categories.categories
                }else if (typeof categories === 'string'){
                    parsedCategories = JSON.parse(categories).categories
                }
                categorySelect.innerHTML = parsedCategories.map(cat =>
                    `<option value="${cat}">${cat}</option>`
                ).join('');
            } catch (error) {
                console.warn('Failed to populate category dropdown:', error);
            }
        }

        async function initialize() {
            
            try {
                let cachedCategories = localStorage.getItem("allCategories")
                if (cachedCategories) {
                    populateCategoryDropDown(cachedCategories);
                }

                const cachedExpenses = localStorage.getItem('allExpenses');
                if (cachedExpenses) {
                    allExpenses = JSON.parse(cachedExpenses);
                    const uniqueCategories = [...new Set(allExpenses.map(exp => exp.category))];
                    assignCategoryColors(uniqueCategories);
                    updateMonthDisplay();
                    updateChartAndLegend();
                    updateTable();
                }
                const [data, categories] = await Promise.all([getAllExpenses(), getAllCategories()]);
                if (!data) throw new Error('Failed to fetch expenses');
                allExpenses = Array.isArray(data) ? data : (data && Array.isArray(data.expenses) ? data.expenses
                    : []);

                const uniqueCategories = [...new Set(allExpenses.map(exp => exp.category))];
                populateCategoryDropDown(categories);
                assignCategoryColors(uniqueCategories);
                updateMonthDisplay();
                updateChartAndLegend();
                updateTable();
                //drawExpenseChart();
            } catch (error) {
                console.error('Failed to initialize dashboard:', error);
            }
        }

        function drawExpenseChart() {
            if (lineChart) lineChart.destroy();
            const ctx = document.getElementById('expenseChart').getContext('2d');
            if (!allExpenses || allExpenses.length === 0) {
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                return;
            }
            const year1 = currentDate.getFullYear();
            const month1 = currentDate.getMonth();
            const allDays = getDaysInMonth(year1, month1);

            // Step 2: Aggregate expenses per day
            const expensesByDay = {};
            const convertCurrencyTo = JSON.parse(localStorage.getItem('userConfig')).convertCurrencyTo
            allExpenses.forEach(exp => {
                const day = exp.date.split('T')[0];
                const amount = convertCurrency(Math.abs(exp.amount), exp.currency, convertCurrencyTo);
                expensesByDay[day] = (expensesByDay[day] || 0) + amount;
            });

            if (Object.keys(expensesByDay).length === 0) {
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                return;
            }

            // Step 3: Prepare dataset with zeros for missing days
            const data = allDays.map(day => expensesByDay[day] || 0);

            // Step 4: Chart.js
            lineChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: allDays,
                    datasets: [{
                        label: 'Daily Expenses',
                        data: data,
                        backgroundColor: 'rgba(75, 192, 192, 0.5)'
                    }]
                },
                options: {
                    scales: {
                        x: { type: 'time',
                        time: {
                            unit: 'day',                 // your data is daily
                            tooltipFormat: 'MMM d',      // tooltip shows e.g., Oct 1
                            displayFormats: {
                                day: 'MMM d'             // x-axis label shows e.g., Oct 1
                            }
                        },
            grid: {
                drawOnChartArea: false,  // hides vertical grid lines
                drawTicks: true           // optional, keeps tick marks
            },
                        ticks: {
                            autoSkip: true,
                            maxTicksLimit: 10
                        } }, // show all dates
                        y: { beginAtZero: true }
                    }
                }
            });
        }
        // Step 1: Generate all dates of the month
        function getDaysInMonth(year, month) {
            const dates = [];
            const date = new Date(year, month, 1);
            while (date.getMonth() === month) {
                // Format as YYYY-MM-DD using local time
                const day = date.getDate().toString().padStart(2, '0');
                const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');
                dates.push(`${date.getFullYear()}-${monthStr}-${day}`);
                date.setDate(date.getDate() + 1);
            }
            return dates;

        }
        
        Chart.defaults.color = '#b3b3b3';
        Chart.defaults.borderColor = '#606060';
        Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

        document.getElementById('prevMonth').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            updateMonthDisplay();
            updateTable();
            updateChartAndLegend();
            //drawExpenseChart();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            updateMonthDisplay();
            updateTable();
            updateChartAndLegend();
            //drawExpenseChart();
        });

        document.getElementById('toggleExpenseFormBtn').addEventListener('click', function () {
            document.getElementById('addExpenseModal').classList.add('active');
            const input = document.getElementById("name_custom");
            input.focus();
        });

        document.getElementById('name_custom').addEventListener('input', function (e) {
            const value = document.getElementById('name_custom').value.trim();
            if (value){
                const category = categorizeExpense(value);
                document.getElementById('category').value = category;
            }
        });

        document.getElementById('saveBtn').addEventListener('click', async (e) => {
            e.preventDefault();
            const form = document.getElementById('expenseForm');
            form.reportValidity();
            if (!form.checkValidity()) {
                form.reportValidity();
            }else{
                await submitExpenseForm(e);
            }
        });

        let expenseToDelete = null;

        function showDeleteModal(id) {
            expenseToDelete = id;
            document.getElementById('deleteModal').classList.add('active');
        }

        function handleDeleteClick(event, id) {
            if (event.shiftKey) {
                expenseToDelete = id;
                confirmDelete();
            } else {
                showDeleteModal(id);
            }
        }

        function closeDeleteModal() {
            expenseToDelete = null;
            document.getElementById('deleteModal').classList.remove('active');
        }

        async function confirmDelete() {
            if (!expenseToDelete) return;
            try {
                const spinner = document.getElementById("deleteSpinner");
                const deleteBtnText = document.getElementById("delete-btn-text");
                const deleteBtn = document.getElementById("deleteBtn");
                deleteBtn.disabled = true;
                deleteBtnText.style.opacity = 0;
                spinner.style.display = "inline-block";

                const response = await deleteExpense(expenseToDelete);
                if (!response) {
                    throw new Error('Failed to delete expense from database');
                }
                spinner.style.display = "none";
                deleteBtnText.style.opacity = 1;
                deleteBtn.disabled = false;
                
                closeDeleteModal();
                await initialize();
            } catch (error) {
                console.error('Error deleting expense:', error);
                alert('Failed to delete expense. Please try again.');
            }
        }

        document.getElementById('deleteModal').addEventListener('click', (e) => {
            if (e.target.className === 'modal active') {
                closeDeleteModal();
            }
        });

        async function submitExpenseForm(event) {
            event.preventDefault();
            let amount = parseFloat(document.getElementById('amount').value);

            const formData = {
                name: document.getElementById('name_custom').value,
                category: document.getElementById('category').value,
                amount: -amount,
                date: getISODateWithLocalTime(document.getElementById('date').value),
                tags: [],
                currency: document.getElementById('currency').value
            };

            console.log('Form Data to submit:', formData);
            try {
                const spinner = document.getElementById("saveSpinner");
                const saveBtnText = document.getElementById("save-btn-text");
                const saveBtn = document.getElementById("saveBtn");
                saveBtn.disabled = true;
                saveBtnText.style.opacity = 0;
                spinner.style.display = "inline-block";


                const response = await addExpense(formData);
                const messageDiv = document.getElementById('formMessage');
                if (response) {
                    spinner.style.display = "none";
                    saveBtnText.style.opacity = 1;
                    saveBtn.disabled = false;
                    messageDiv.textContent = 'Expense added successfully!';
                    messageDiv.className = 'form-message success';
                    document.getElementById('expenseForm').reset();
                    document.getElementById('addExpenseModal').classList.remove('active');
                    await initialize();
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const day = String(today.getDate()).padStart(2, '0');
                    document.getElementById('date').value = `${year}-${month}-${day}`;
                } else {
                    const error = await response.json();
                    messageDiv.textContent = `Error: ${error.error || 'Failed to add expense'}`;
                    messageDiv.className = 'form-message error';
                }
                setTimeout(() => {
                    messageDiv.textContent = '';
                    messageDiv.className = 'form-message';
                }, 3000);
            } catch (error) {
                console.error('Error adding expense:', error);
                const messageDiv = document.getElementById('formMessage');
                messageDiv.textContent = 'Error: Failed to add expense';
                messageDiv.className = 'form-message error';
            }
        }

        function closeAddExpenseModal() {
            document.getElementById('addExpenseModal').classList.remove('active');
        }
        
        document.addEventListener('DOMContentLoaded', initialize);

        document.getElementById('name_custom').addEventListener('click', (e) => {
            if (e.target.value === '-') {
                e.target.value = '';
            }
        });