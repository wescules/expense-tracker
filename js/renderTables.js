let startX = 0;
let currentRow = null;
let isSwiping = false;

function toggleSlide(event, row) {
    // Prevent toggling if clicking a button inside the row
    if (event.target.closest('button')) return;

    // Close all other rows
    document.querySelectorAll('.row-content.swiped').forEach(r => {
        if (r !== row.querySelector('.row-content')) {
        r.classList.remove('swiped');
        }
    });

    // Toggle the clicked row (for desktop)
    const content = row.querySelector('.row-content');
    content.classList.toggle('swiped');
}

// Touch start (finger touches screen)
document.addEventListener('touchstart', e => {
    const row = e.target.closest('.swipe-row');
    if (!row) return;

    startX = e.touches[0].clientX;
    currentRow = row;
    isSwiping = false;
});

// Touch move (finger moves)
document.addEventListener('touchmove', e => {
    if (!currentRow) return;

    const diffX = e.touches[0].clientX - startX;
    const content = currentRow.querySelector('.row-content');

    // Detect direction & prevent accidental triggers
    if (Math.abs(diffX) > 10) isSwiping = true;

    // Move left = open
    if (diffX < -40) {
        document.querySelectorAll('.row-content.swiped').forEach(r => {
        if (r !== content) r.classList.remove('swiped');
        });
        content.classList.add('swiped');
    }

    // Move right = close
    if (diffX > 40) {
        content.classList.remove('swiped');
    }
});

// Touch end (finger lifted)
document.addEventListener('touchend', () => {
    currentRow = null;
    isSwiping = false;
});

// Click outside closes all rows
document.addEventListener('click', e => {
    if (!e.target.closest('.swipe-row')) {
        document
        .querySelectorAll('.row-content.swiped')
        .forEach(r => r.classList.remove('swiped'));
    }
});

function createTable(expenses) {
    if (!expenses || expenses.length === 0) {
        const message = 'No expenses recorded for this month';
        return `<div class="no-data">${message}</div>`;
    }
    // Aggregate by day
    if (disabledCategories.size !== 0){
        expenses = expenses.filter(expense => disabledCategories.has(expense.category))
    }
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
                </tr>
            </thead>
            <tbody>
            ${
                Object.keys(aggregated)
                .sort()
                .reverse()
                .map((date) => {
                    // Optional: display the date as a header
                    const dateHeader = `<td colspan="5" style="text-align: left;font-weight:bold;background-color: var(--bg-primary);">${formatDateFromUTC(
                    date
                    )
                    .slice(0, 6)
                    .replace(",", "")}</td>`;

                    // Map over each expense for this date
                    const rows = aggregated[date]
                    .map(expense => `
                    <tr class="swipe-row" onclick="toggleSlide(event, this)">
                    <td colspan="4" style="padding: 0;">
                        <div class="row-container">
                        <div class="row-content">
                            <table style="width: 100%; table-layout: fixed;">
                            <tr>
                                <td style="text-align: center; width: 10%;">
                                ${
                                    expense.user === "wescules"
                                    ? `<img src="assets/wes.webp" class="circle-img">`
                                    : `<img src="assets/abbie.webp" class="circle-img">`
                                }
                                </td>
                                <td style="width: 65%; padding-left: 15px">
                                <div>${escapeHTML(expense.name)}</div>
                                <div style="color: ${
                                    categoryColors[expense.category]
                                };">
                                    ${escapeHTML(expense.category)}
                                </div>
                                </td>
                                <td class="amount" style="color: #e74c3c;text-align: center;white-space: nowrap; width: 25%;">
                                ${formatCurrencyInTable(
                                    expense.amount,
                                    expense.currency
                                )}
                                </td>
                            </tr>
                            </table>
                        </div>

                        <!-- Hidden buttons revealed on swipe -->
                        <div class="row-actions">
                            <button class="edit-button" onclick="editExpenseById(event, '${
                                expense.id
                            }')">
                                <i class="fa-solid fa-pen-to-square"></i>
                            </button>
                            <button class="delete-button" onclick="handleDeleteClick(event, '${
                                expense.id
                            }')">
                                <i class="fa-solid fa-trash-can"></i>
                            </button>
                        </div>
                        </div>
                    </td>
                    </tr>
                    `
                    )
                    .join(""); // join all rows for this date

                    return dateHeader + rows; // combine header + rows
                })
                .join("") // join all dates together
            }

            </tbody>
        </table>
    `;
}

function createTransactionTable() {
    if (!allTransactions || allTransactions.length === 0) {
        return `<div class="no-data">No transactions found</div>`;
    }
    allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date))
    
    const aggregated = allTransactions.reduce((acc, transaction) => {
        const chinaTimeOffset = new Date(transaction.date).getTime()+ 8 * 60 * 60 * 1000; // China time
        // const indiaTimeOffset = new Date().getTime()+ 5 * 60 + 30 * 60 * 1000; // India time
        const localDate = new Date(chinaTimeOffset).toISOString().split('T')[0];

        if (!acc[localDate]) acc[localDate] = [];
        acc[localDate].push(transaction);
        return acc;
    }, {});
    return `
        <table class="expense-table">
            <thead>
                <tr>
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
                            <td class="amount" style="color: #e74c3c;text-align: center;white-space: nowrap;">${formatCurrencyInTable(transaction.amount, transaction.currency)}</td>
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
