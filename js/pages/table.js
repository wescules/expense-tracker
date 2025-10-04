        let currentCurrency = JSON.parse(localStorage.getItem("userConfig")).convertCurrencyTo;
        let currentDate = new Date();
        let allExpenses = [];
        let expensesForTable = [];
        let startDate = 1;
        let categoryColors = {}

        function createTable(expenses) {
            if (!expenses || expenses.length === 0) {
                const message = document.getElementById('showAllToggle').checked ? 
                                'No transactions found' : 
                                'No expenses recorded for this month';
                return `<div class="no-data">${message}</div>`;
            }
            return `
                <table class="expense-table">
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        ${expenses.map((expense, index) => `
                            <tr>
                                <td>
                                    <div>${escapeHTML(expense.name)}</div>
                                    <div style="color: ${categoryColors[expense.category]};">${escapeHTML(expense.category)}</div>
                                </td>
                                <td style="white-space: nowrap;">${formatDateFromUTC(expense.date).slice(0, 6).replace(',', '')}</td>
                                <td class="amount" style="color: #e74c3c;text-align: center;white-space: nowrap;">${formatCurrencyInTable(expense.amount, expense.currency)}</td>
                                
                                <td>
                                    <button class="edit-button" onclick="editExpenseByIndex(${index})">
                                        <i class="fa-solid fa-pen-to-square"></i>
                                    </button>
                                    <button class="delete-button" onclick="handleDeleteClick(event, '${expense.id}')">
                                        <i class="fa-solid fa-trash-can"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
        }

        function updateTable() {
            const showAll = document.getElementById('showAllToggle').checked;
            document.querySelector('.month-navigation').style.display = showAll ? 'none' : 'flex';

            expensesForTable = showAll
                ? allExpenses.slice().sort((a, b) => new Date(b.date) - new Date(a.date))
                : getMonthExpenses(allExpenses);
            
            const tableContainer = document.getElementById('tableContainer');
            tableContainer.innerHTML = createTable(expensesForTable);
        }

        function editExpenseByIndex(index) {
            const expense = expensesForTable[index];
            if (expense) {
                editExpense(expense.id, expense.name, expense.category, expense.amount, expense.date);
            }
        }

        function editExpense(id, name, category, amount, date) {
            document.getElementById('name').value = name;
            document.getElementById('category').value = category;
            document.getElementById('amount').value = Math.abs(amount);
            
            const localDate = new Date(date);
            const year = localDate.getFullYear();
            const month = String(localDate.getMonth() + 1).padStart(2, '0');
            const day = String(localDate.getDate()).padStart(2, '0');
            document.getElementById('date').value = `${year}-${month}-${day}`;
            
            const form = document.getElementById('expenseForm');
            form.dataset.editId = id;
            const submitButton = form.querySelector('button[type="submit"]');
            submitButton.textContent = 'Update Expense';
            
            form.scrollIntoView({ behavior: 'smooth' });
        }

        async function getCategories() {
            return JSON.parse(localStorage.getItem("allCategories"))
                        || await getAllCategories();
        }

        async function initialize() {
            try {
                const config = await getCategories()
                const categorySelect = document.getElementById('category');
                categorySelect.innerHTML = config.categories.map(cat => 
                    `<option value="${cat}">${cat}</option>`
                ).join('');
                startDate = 1;
                
                const cached = localStorage.getItem('allExpenses');
                if (cached) {
                    allExpenses = JSON.parse(cached);
                    const uniqueCategories = [...new Set(allExpenses.map(exp => exp.category))];
                    assignCategoryColors(uniqueCategories);
                    updateMonthDisplay();
                    updateTable();
                }

                const data = await getAllExpenses();
                allExpenses = Array.isArray(data) ? data : (data && Array.isArray(data.expenses) ? data.expenses : []);
                
                const uniqueCategories = [...new Set(allExpenses.map(exp => exp.category))];
                assignCategoryColors(uniqueCategories);
                updateMonthDisplay();
                updateTable();
            } catch (error) {
                console.error('Failed to initialize table:', error);
                document.getElementById('tableContainer').innerHTML = 
                    '<div class="no-data">Failed to load expenses</div>';
            }
        }

        document.getElementById('showAllToggle').addEventListener('change', updateTable);

        document.getElementById('prevMonth').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            updateMonthDisplay();
            updateTable();
        });

        document.getElementById('nextMonth').addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            updateMonthDisplay();
            updateTable();
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

        document.getElementById('expenseForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const form = e.target;
            const editId = form.dataset.editId;
            let amount = parseFloat(document.getElementById('amount').value);

            const formData = {
                name: document.getElementById('name').value,
                category: document.getElementById('category').value,
                amount: -amount,
                date: getISODateWithLocalTime(document.getElementById('date').value),
            };
            try {
                const response = await updateExpense(editId, formData);
                const messageDiv = document.getElementById('formMessage');
                if (response) {
                    messageDiv.textContent = editId ? 'Expense updated successfully!' : 'Expense added successfully!';
                    messageDiv.className = 'form-message success';
                    form.reset();
                    delete form.dataset.editId;
                    form.querySelector('button[type="submit"]').textContent = 'Add Expense';
                    await initialize();
                    const today = new Date();
                    const year = today.getFullYear();
                    const month = String(today.getMonth() + 1).padStart(2, '0');
                    const day = String(today.getDate()).padStart(2, '0');
                    document.getElementById('date').value = `${year}-${month}-${day}`;
                } else {
                    const error = await response.json();
                    messageDiv.textContent = `Error: ${error.error || 'Failed to save expense'}`;
                    messageDiv.className = 'form-message error';
                }
                setTimeout(() => {
                    messageDiv.textContent = '';
                    messageDiv.className = 'form-message';
                }, 3000);
            } catch (error) {
                console.error('Error saving expense:', error);
                const messageDiv = document.getElementById('formMessage');
                messageDiv.textContent = 'Error: Failed to save expense';
                messageDiv.className = 'form-message error';
            }
        });
        document.addEventListener('DOMContentLoaded', initialize);

        document.getElementById('name').addEventListener('click', (e) => {
            if (e.target.value === '-') {
                e.target.value = '';
            }
        });
        
        window.editExpenseByIndex = editExpenseByIndex;