        let currentCurrency = JSON.parse(localStorage.getItem("userConfig")).convertCurrencyTo;
        let allTransactions = [];
        let expensesForTable = [];
        let categoryColors = {}

        function createTable() {
            if (!allTransactions || allTransactions.length === 0) {
                return `<div class="no-data">No transactions found</div>`;
            }
            // allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date))
            
            const aggregated = allTransactions.reduce((acc, transaction) => {
                const date = new Date(transaction.date).toISOString().split('T')[0]; // "YYYY-MM-DD"
                if (!acc[date]) acc[date] = [];
                acc[date].push(transaction);
                return acc;
            }, {});
            return `
                <table class="expense-table">
                    <thead>
                        <tr>
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
                                .map(transaction => `
                                    <tr>
                                    <td style="text-align: center">
                                        ${transaction.user === 'wescules'
                                        ? `<img src="assets/wes.webp" class="circle-img">`
                                        : `<img src="assets/abbie.webp" class="circle-img">`
                                        }
                                    </td>
                                    <td>
                                        <lmao style="color: ${transaction.transactionType === 'create' ? '#8AC926' :transaction.transactionType === 'update'? 'goldenrod' : '#e74c3c'}">
                                            ${transaction.transactionType.charAt(0).toUpperCase() + transaction.transactionType.slice(1)}d
                                        </lmao>${escapeHTML(transaction.name)}
                                    </td> 
                                    <td class="amount" style="color: #e74c3c;">${formatCurrencyInTable(transaction.amount, transaction.currency)}</td>
                                    </tr>
                                `)
                                .join('');

                                return dateHeader + rows; // combine header + rows
                            })
                            .join('')
                        }
                    </tbody>
                </table>
            `;
        }

        async function initialize() {
            try {
                const cached = localStorage.getItem('transactions');
                const tableContainer = document.getElementById('tableContainer');
                if (cached) {
                    allTransactions = JSON.parse(cached);
                    const uniqueCategories = [...new Set(allTransactions.map(exp => exp.category))];
                    assignCategoryColors(uniqueCategories);
                    tableContainer.innerHTML = createTable(allTransactions);
                }

                const data = await getAllTransactions();
                allTransactions = Array.isArray(data) ? data : (data && Array.isArray(data.expenses) ? data.expenses : []);
                
                const uniqueCategories = [...new Set(allTransactions.map(exp => exp.category))];
                assignCategoryColors(uniqueCategories);
                tableContainer.innerHTML = createTable(allTransactions)
            } catch (error) {
                console.error('Failed to initialize table:', error);
                document.getElementById('tableContainer').innerHTML = 
                    '<div class="no-data">Failed to load expenses</div>';
            }
        }

        document.addEventListener('DOMContentLoaded', initialize);