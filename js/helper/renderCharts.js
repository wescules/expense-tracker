Chart.defaults.color = '#b3b3b3';
Chart.defaults.borderColor = '#606060';
Chart.defaults.font.family = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';

function renderChartType(type, forceRender = false) {
    const calendarDiv = document.getElementById('cal-heatmap');
    const chartCanvas = document.getElementById('chartCanvas');
    const pieButton = document.getElementById("pie");
    const barButton = document.getElementById("bar");
    const calendarButton = document.getElementById("calendar");

    if (type === 'pie' && (currentlySelectedChart !== 'pie' || forceRender)) {
        calendarDiv.innerHTML = ''; // Clear previous calendar view
        chartCanvas.style.display = 'block';
        chartCanvas.style.visibility = 'visible';

        pieButton.classList.add("active")
        barButton.classList.remove("active")
        calendarButton.classList.remove("active")
        createPieChart();
    } else if (type === 'bar' && (currentlySelectedChart !== 'bar' || forceRender)) {
        calendarDiv.innerHTML = ''; // Clear previous calendar view
        chartCanvas.style.display = 'block';
        chartCanvas.style.visibility = 'visible'

        pieButton.classList.remove("active")
        barButton.classList.add("active")
        calendarButton.classList.remove("active")
        drawExpenseChart();
    } else if (type === 'calendar' && (currentlySelectedChart !== 'calendar' || forceRender)) {
        calendarDiv.innerHTML = ''; // Clear previous calendar view
        pieButton.classList.remove("active")
        barButton.classList.remove("active")
        calendarButton.classList.add("active")
        createCalendarView();
    }
}

function createCalendarView() {
    if (chart) {
        chart.destroy();
    }
    currentlySelectedChart = 'calendar';
    document.getElementById('chartCanvas').style.display = 'none';
    document.getElementById('chartCanvas').style.visibility = 'hidden';

    let spendingData = [];
    let minExpense = 1000000;
    let maxExpense = 0;

    allExpenses.forEach((exp) => {
        const day = exp.date.split("T")[0];
        const amount = convertCurrency(
        Math.abs(exp.amount),
        exp.currency,
        currentCurrency
        );
        spendingData.push({ date: day, value: amount });
        minExpense = Math.min(minExpense, amount);
        maxExpense = Math.max(maxExpense, amount);
    });
    
    const cal = new CalHeatmap();
    cal.paint(
        {
        theme: theme,
        itemSelector: "#cal-heatmap",
        range: 1,
        date: { start: currentDate }, // October = month index 9
        domain: {
            type: "month",
            padding: [10, 10, 10, 10],
            label: { text: "" },
        },
        subDomain: {
            type: "xDay",
            radius: 2,
            width: 30,
            height: 30,
            label: "D",
        },
        data: {
            source: spendingData,
            type: "json",
            x: "date",
            y: "value",
        },
        scale: {
            color: {
                range: ["#FFF9C4", "#F44336"],
                type: "linear",
                domain: [minExpense, maxExpense],
            },
        },
        legend: [50, 100, 150, 200, 250],
        tooltip: false,
        },
        [
        [
            Tooltip,
            {
            text: function (date, value, dayjsDate) {
                return (
                (value ? currencyBehaviors[currentCurrency].symbol + value.toFixed(2) : "No data") +
                " on " +
                dayjsDate.format("LL")
                );
            },
            },
        ],
        ]
    );

}

function updateChartAndLegend() {
    const monthExpenses = getMonthExpenses(allExpenses);
    const chartBox = document.querySelector('.chart-box');
    const legendBox = document.getElementById('customLegend');
    const cashflowSection = document.getElementById('cashflow-section');
    const noDataMessage = document.getElementById('noDataMessage');
    const hasExpenses = monthExpenses.some(e => e.amount < 0);
    if (!hasExpenses) {
        if (chart) {
            chart.destroy();
            chart = null;
        } 
        chartBox.style.display = 'none';
        legendBox.style.display = 'none';
        cashflowSection.style.display = 'none';
        noDataMessage.style.display = 'block';
    } else {
        chartBox.style.display = 'flex';
        legendBox.style.display = 'flex';
        cashflowSection.style.display = 'flex';
        noDataMessage.style.display = 'none';
        categoryData = calculateCategoryBreakdown(monthExpenses);
        updateCashflow(monthExpenses);
        renderChartType(currentlySelectedChart, true);
        updateLegend();
    }
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

function createPieChart() {
    if (chart) {
        chart.destroy();
    }
    currentlySelectedChart = 'pie';

    chart = new Chart('chartCanvas', {
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

function drawExpenseChart() {
    if (chart) {
        chart.destroy();
    }
    currentlySelectedChart = 'bar';
    const ctx = document.getElementById("chartCanvas").getContext("2d");
    if (!allExpenses || allExpenses.length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        return;
    }
    const year1 = currentDate.getFullYear();
    const month1 = currentDate.getMonth();
    const allDays = getDaysInMonth(year1, month1);

    // Step 2: Aggregate expenses per day
    const expensesByDay = {};
    const convertCurrencyTo = JSON.parse(localStorage.getItem("userConfig")).convertCurrencyTo;
    allExpenses.forEach((exp) => {
        const day = exp.date.split("T")[0];
        const amount = convertCurrency(
            Math.abs(exp.amount),
            exp.currency,
            convertCurrencyTo
        );
        expensesByDay[day] = (expensesByDay[day] || 0) + amount;
    });

    if (Object.keys(expensesByDay).length === 0) {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        return;
    }

    // Step 3: Prepare dataset with zeros for missing days
    const data = allDays.map((day) => expensesByDay[day] || 0);

    // Step 4: Chart.js
    chart = new Chart(ctx, {
    type: "bar",
    data: {
        labels: allDays,
        datasets: [
        {
            label: "Daily Expenses",
            data: data,
            backgroundColor: "#8338EC",
        },
        ],
    },
    options: {
        plugins: {
            title: {
                display: false
            }
        },
        scales: {
        x: {
            type: "time",
            time: {
            unit: "day", // your data is daily
            tooltipFormat: "MMM d", // tooltip shows e.g., Oct 1
            displayFormats: {
                day: "MMM d", // x-axis label shows e.g., Oct 1
            },
            },
            grid: {
            drawOnChartArea: false, // hides vertical grid lines
            drawTicks: true, // optional, keeps tick marks
            },
            ticks: {
            autoSkip: true,
            maxTicksLimit: 5,
            },
        }, // show all dates
        y: { beginAtZero: true },
        },
    },
    });
}

function updateLegend() {
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

        const isDisabled = disabledCategories.has(category);
        const hasAnyDisabled = disabledCategories.size > 0;
        item.className = `legend-item${isDisabled ? ' disabled' : hasAnyDisabled ? ' enabled' : ''}`;

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

    const activeTotalExpenses = monthExpenses
        .filter(exp => exp.amount < 0 && isEnabledCategory(exp.category)).reduce((sum, exp) => sum +
            convertCurrency(Math.abs(exp.amount), exp.currency, currentCurrency), 0);

    activeTotalExpensesCount = monthExpenses
        .filter(exp => exp.amount < 0 && isEnabledCategory(exp.category)).length

    const totalsHtml = `
                <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid var(--border);">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>Total <lmao style="font-size: x-small">(${activeTotalExpensesCount} expenses)</lmao></span>
                        <span class="amount">
                            ${formatCurrency(activeTotalExpenses)}
                        </span>
                    </div>
                </div>
                `;
    legendContainer.insertAdjacentHTML('beforeend', totalsHtml);
}
