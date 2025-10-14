let currentCurrency = JSON.parse(localStorage.getItem("userConfig")).convertCurrencyTo
const theme = localStorage.getItem("theme") || 'dark';
let startDate = 1;
let chart = null;
let currentlySelectedChart = 'pie';
let currentDate = new Date();
let allExpenses = [];
let allTransactions = [];
let disabledCategories = new Set();
let categoryColors = {};
let categoryData = [];
let categories_settings = [];
let convertTableCurrency = 'none';

function switchToTransactions() {
    const historyNav = document.getElementById('historyNav')
    historyNav.classList.add('active')
    const dashboardNav = document.getElementById('dashboardNav')
    dashboardNav.classList.remove('active')
    const settingsNav = document.getElementById('settingsNav')
    settingsNav.classList.remove('active')

    const tableHistoryContainer = document.getElementById('tableHistoryContainer')
    tableHistoryContainer.style.display = 'flex';

    const monthNavigation = document.getElementById('monthNavigation')
    const toggleExpenseFormBtn = document.getElementById('toggleExpenseFormBtn')
    const cashflow_section = document.getElementById('cashflow-section')
    const chartContainer = document.getElementById('chartContainer')
    const tableContainer = document.getElementById('tableContainer')
    monthNavigation.style.display = 'none'
    toggleExpenseFormBtn.style.display = 'none'
    cashflow_section.style.display = 'none'
    chartContainer.style.display = 'none'
    tableContainer.style.display = 'none'

    const categories_manager = document.getElementById('categories_manager')
    const currency_selector = document.getElementById('currency_selector')
    const theme_selector = document.getElementById('theme_selector')
    categories_manager.style.display = 'none'
    currency_selector.style.display = 'none'
    theme_selector.style.display = 'none'
}

function switchToSettings() {
    const historyNav = document.getElementById('historyNav')
    historyNav.classList.remove('active')
    const dashboardNav = document.getElementById('dashboardNav')
    dashboardNav.classList.remove('active')
    const settingsNav = document.getElementById('settingsNav')
    settingsNav.classList.add('active')
    

    const tableHistoryContainer = document.getElementById('tableHistoryContainer')
    tableHistoryContainer.style.display = 'none';

    const monthNavigation = document.getElementById('monthNavigation')
    const toggleExpenseFormBtn = document.getElementById('toggleExpenseFormBtn')
    const cashflow_section = document.getElementById('cashflow-section')
    const chartContainer = document.getElementById('chartContainer')
    const tableContainer = document.getElementById('tableContainer')
    monthNavigation.style.display = 'none'
    toggleExpenseFormBtn.style.display = 'none'
    cashflow_section.style.display = 'none'
    chartContainer.style.display = 'none'
    tableContainer.style.display = 'none'


    const categories_manager = document.getElementById('categories_manager')
    const currency_selector = document.getElementById('currency_selector')
    const theme_selector = document.getElementById('theme_selector')
    categories_manager.style.display = ''
    currency_selector.style.display = ''
    theme_selector.style.display = ''
}

function switchToDashboard() {
    const historyNav = document.getElementById('historyNav')
    historyNav.classList.remove('active')
    const dashboardNav = document.getElementById('dashboardNav')
    dashboardNav.classList.add('active')
    const settingsNav = document.getElementById('settingsNav')
    settingsNav.classList.remove('active')

    const tableHistoryContainer = document.getElementById('tableHistoryContainer')
    tableHistoryContainer.style.display = 'none';

    const monthNavigation = document.getElementById('monthNavigation')
    const toggleExpenseFormBtn = document.getElementById('toggleExpenseFormBtn')
    const cashflow_section = document.getElementById('cashflow-section')
    const chartContainer = document.getElementById('chartContainer')
    const tableContainer = document.getElementById('tableContainer')
    monthNavigation.style.display = ''
    toggleExpenseFormBtn.style.display = ''
    cashflow_section.style.display = ''
    chartContainer.style.display = ''
    tableContainer.style.display = ''

    const categories_manager = document.getElementById('categories_manager')
    const currency_selector = document.getElementById('currency_selector')
    const theme_selector = document.getElementById('theme_selector')
    categories_manager.style.display = 'none'
    currency_selector.style.display = 'none'
    theme_selector.style.display = 'none'
}

function isEnabledCategory(category) {
    return disabledCategories.size !== 0 ? disabledCategories.has(category) : !disabledCategories.has(category)
}

function toggleCategory(category) {
    if (disabledCategories.has(category)) {
        disabledCategories.delete(category);
    } else {
        disabledCategories.add(category);
    }
    updateLegend();
    updateTable();
}

function editExpenseById(event, expenseId) {
    event.preventDefault();
    const expense = allExpenses.filter(exp => exp.id === expenseId)[0]
    document.getElementById('updateExpenseModal').classList.add('active');

    if (expense) {
        loadExpenseIntoModal(expense.id, expense.name, expense.category, expense.amount, expense.date, expense.currency);
    }
    document.getElementById('updateExpenseModal').classList.add('active');
}

function loadExpenseIntoModal(id, name, category, amount, date, currency) {
    document.getElementById('update_name_custom').value = name;
    document.getElementById('update_currency').value = currency;
    document.getElementById('update_category').value = category;
    document.getElementById('update_amount').value = Math.abs(amount);
    
    const localDate = new Date(date);
    const year = localDate.getFullYear();
    const month = String(localDate.getMonth() + 1).padStart(2, '0');
    const day = String(localDate.getDate()).padStart(2, '0');
    document.getElementById('update_date').value = `${year}-${month}-${day}`;
    
    const form = document.getElementById('updateExpenseForm');
    form.dataset.editId = id;
    
    form.scrollIntoView({ behavior: 'smooth' });
}

function updateTable() {
    document.querySelector('.month-navigation').style.display = 'flex';

    expensesForTable = getMonthExpenses(allExpenses);
    
    const tableContainer = document.getElementById('tableContainer');
    tableContainer.innerHTML = createTable(expensesForTable);

    const tds = tableContainer.querySelectorAll('td.amount');
    tds.forEach(td => {
        td.dataset.original = td.textContent.trim();
    });

    document.getElementById('currencyConverter').addEventListener('change', (event) => {
        convertTableCurrency = event.target.value;

        const container = document.getElementById('tableContainer');
        container.querySelectorAll('td.amount').forEach(td => {
            if (event.target.value == 'none'){
                td.textContent = td.dataset.original;
            }
            else{
                let value = td.textContent.trim();
                const originalCurrency = value.charAt(1) === '$' ? 'usd' : value.charAt(1) === '¥' ? 'cny' : 'inr';
                value = value.replace('$', '').replace("¥", '').replace("₹", '').replace(',', '');

                const oldValue = parseFloat(value);
                td.textContent = '-' + formatCurrencyInTable(convertCurrency(Math.abs(oldValue), originalCurrency, event.target.value), event.target.value); 
            }
        });

    });

}

function calculateCategoryBreakdown(expenses) {
    const categoryTotals = {};
    let totalAmount = 0;
    expenses.forEach(exp => {
        if (exp.amount < 0) {
            const amount = convertCurrency(Math.abs(exp.amount), exp.currency, currentCurrency);
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
    return expenses
        .filter(exp => exp.amount < 0).reduce((sum, exp) => sum + convertCurrency(Math.abs(exp.amount), exp.currency, currentCurrency), 0);
}

function populateCategoryDropDown(categories) {
    try {
        const categorySelect = document.getElementById('category');
        const updateCategorySelect = document.getElementById('update_category');
        let parsedCategories = [];
        if(typeof categories === 'object' && categories.categories){
            parsedCategories = categories.categories
        }else if (typeof categories === 'string'){
            parsedCategories = JSON.parse(categories).categories
        }
        categorySelect.innerHTML = parsedCategories.map(cat =>
            `<option value="${cat}">${cat}</option>`
        ).join('');
        updateCategorySelect.innerHTML = parsedCategories.map(cat =>
            `<option value="${cat}">${cat}</option>`
        ).join('');
    } catch (error) {
        console.warn('Failed to populate category dropdown:', error);
    }
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

document.getElementById('prevMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    updateMonthDisplay();
    updateTable();
    updateChartAndLegend();
});

document.getElementById('nextMonth').addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    updateMonthDisplay();
    updateTable();
    updateChartAndLegend();
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

document.getElementById('deleteModal').addEventListener('click', (e) => {
    if (e.target.className === 'modal active') {
        closeDeleteModal();
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

document.getElementById('updateBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    const form = document.getElementById('updateExpenseForm');
    form.reportValidity();
    if (!form.checkValidity()) {
        form.reportValidity();
    }else{
        await updateExpenseForm(e);
    }
});

let expenseToDelete = null;

function showDeleteModal(id) {
    expenseToDelete = id;
    const expenseName = allExpenses.filter(exp => exp.id === id)[0].name
    document.getElementById('deleteExpenseName').innerText = expenseName
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

async function submitExpenseForm(event) {
    event.preventDefault();
    let amount = parseFloat(document.getElementById('amount').value);

    const formData = {
        name: document.getElementById('name_custom').value,
        category: document.getElementById('category').value,
        amount: -amount,
        date: getISODateWithLocalTime(document.getElementById('date').value),
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

async function updateExpenseForm(event) {
    event.preventDefault();
    let amount = parseFloat(document.getElementById('update_amount').value);
    const editId = document.getElementById('updateExpenseForm').getAttribute('data-edit-id')
    const formData = {
        name: document.getElementById('update_name_custom').value,
        category: document.getElementById('update_category').value,
        amount: -amount,
        date: getISODateWithLocalTime(document.getElementById('update_date').value),
        currency: document.getElementById('update_currency').value
    };

    console.log('Form Data to submit:', formData);
    try {
        const spinner = document.getElementById("updateSpinner");
        const saveBtnText = document.getElementById("update-btn-text");
        const saveBtn = document.getElementById("updateBtn");
        saveBtn.disabled = true;
        saveBtnText.style.opacity = 0;
        spinner.style.display = "inline-block";


        const response = await updateExpense(editId, formData);
        const messageDiv = document.getElementById('updateFormMessage');
        if (response) {
            spinner.style.display = "none";
            saveBtnText.style.opacity = 1;
            saveBtn.disabled = false;
            messageDiv.textContent = 'Expense updated successfully!';
            messageDiv.className = 'form-message success';
            document.getElementById('updateExpenseForm').reset();
            document.getElementById('updateExpenseModal').classList.remove('active');
            await initialize();
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            document.getElementById('update_date').value = `${year}-${month}-${day}`;
        } else {
            const error = await response.json();
            messageDiv.textContent = `Error: ${error.error || 'Failed to update expense'}`;
            messageDiv.className = 'form-message error';
        }
        setTimeout(() => {
            messageDiv.textContent = '';
            messageDiv.className = 'form-message';
        }, 3000);
    } catch (error) {
        console.error('Error updating expense:', error);
        const messageDiv = document.getElementById('formMessage');
        messageDiv.textContent = 'Error: Failed to update expense';
        messageDiv.className = 'form-message error';
    }
}

async function initialize() {
    document.getElementById("pie").classList.add("active")
    document.getElementById("bar").classList.remove("active")
    document.getElementById("calendar").classList.remove("active")
    
    try {
        const cachedCurrency = localStorage.getItem("userConfig") ? JSON.parse(localStorage.getItem("userConfig")).defaultInputCurrency : null;
        const cachedTransactions = localStorage.getItem('transactions');
        const cachedCategories = localStorage.getItem("allCategories");
        const cachedExpenses = localStorage.getItem('allExpenses');

        const tableContainer = document.getElementById('tableHistoryContainer');
        const currencySelect = document.getElementById("currency");

        if (cachedCurrency) {
            currencySelect.value = cachedCurrency; // set dropdown
        }

        if (cachedTransactions) {
            allTransactions = JSON.parse(cachedTransactions);
            tableContainer.innerHTML = createTransactionTable();
        }

        if (cachedCategories) {
            populateCategoryDropDown(cachedCategories);
            renderCategories(JSON.parse(cachedCategories).categories)
        }

        if (cachedExpenses) {
            allExpenses = JSON.parse(cachedExpenses);
            const uniqueCategories = [...new Set(allExpenses.map(exp => exp.category))];
            assignCategoryColors(uniqueCategories);
            updateMonthDisplay();
            updateChartAndLegend();
            updateTable();
            switchToDashboard();
        }

        const [data, categories, transactions] = await Promise.all([getAllExpenses(), getAllCategories(), getAllTransactions()]);
        if (!data) throw new Error('Failed to fetch expenses');
        allExpenses = Array.isArray(data) ? data : (data && Array.isArray(data.expenses) ? data.expenses : []);
        allTransactions = Array.isArray(transactions) ? transactions : (transactions && Array.isArray(transactions.expenses) ? transactions.expenses : []);
        categories_settings = JSON.parse(cachedCategories).categories

        const uniqueCategories = [...new Set(allExpenses.map(exp => exp.category))];
        populateCategoryDropDown(categories);
        assignCategoryColors(uniqueCategories);
        updateMonthDisplay();
        updateChartAndLegend();
        updateTable();
        tableContainer.innerHTML = createTransactionTable(allTransactions)
        await Promise.all([renderCategories(categories.categories), populateCurrencySelect()]);
        if (document.getElementById('dashboardNav').classList.contains('active')) {
            switchToDashboard()
        } else if(document.getElementById('historyNav').classList.contains('active')){
            switchToTransactions()
        } else if(document.getElementById('settingsNav').classList.contains('active')){
            switchToSettings()
        }
    } catch (error) {
        console.error('Failed to initialize dashboard:', error);
    }
}

function closeUpdateExpenseModal() {
    document.getElementById('updateExpenseModal').classList.remove('active');
}

document.addEventListener('DOMContentLoaded', initialize);
