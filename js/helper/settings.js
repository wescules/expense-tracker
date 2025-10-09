        let allTags = new Set();
        let editFormSelectedTags = new Set();
        let currentStartDate = 1;
        let draggedItem = null;
        let recurringExpenses = [];
        let recurringExpenseToDelete = null;
        let recurringExpenseToEdit = null;

        function showMessage(elementId, message, isSuccess) {
            const messageDiv = document.getElementById(elementId);
            messageDiv.textContent = message;
            messageDiv.className = isSuccess ? 'form-message success' : 'form-message error';
            setTimeout(() => {
                messageDiv.textContent = '';
                messageDiv.className = 'form-message';
            }, 3000);
        }

        // --- Category Management ---
        function renderCategories(categories_settings) {
            const list = document.getElementById('categories-list');
            list.innerHTML = '';
            categories_settings.forEach((category, index) => {
                const item = document.createElement('div');
                item.className = 'category-item';
                item.draggable = true;
                item.dataset.index = index;
                item.innerHTML = `
                    <div class="category-handle-area">
                        <span class="drag-handle"><i class="fa-solid fa-grip-lines"></i></span>
                        <span>${category}</span>
                    </div>
                    <button class="delete-button" onclick="removeCategory(${index})">
                        <i class="fa-solid fa-times"></i>
                    </button>
                `;
                item.addEventListener('dragstart', handleDragStart);
                item.addEventListener('dragover', handleDragOver);
                item.addEventListener('dragleave', handleDragLeave);
                item.addEventListener('dragend', handleDragEnd);
                item.addEventListener('drop', handleDrop);
                list.appendChild(item);
            });
        }

        function handleDragStart(e) {
            this.classList.add('dragging');
            draggedItem = this;
            e.dataTransfer.effectAllowed = 'move';
            e.dataTransfer.setData('text/html', this.innerHTML);
            removePlaceholders();
        }

        function handleDragOver(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            this.classList.add('drag-over');
            if (this === draggedItem) return false;
            const rect = this.getBoundingClientRect();
            const clientY = e.clientY;
            const threshold = rect.top + (rect.height / 2);
            const isBefore = clientY < threshold;
            removePlaceholders();
            const placeholder = document.createElement('div');
            placeholder.className = 'placeholder';
            if (isBefore) {
                this.parentNode.insertBefore(placeholder, this);
            } else {
                this.parentNode.insertBefore(placeholder, this.nextSibling);
            }
            return false;
        }

        function handleDragLeave() { this.classList.remove('drag-over'); }
        function handleDragEnd() {
            this.classList.remove('dragging');
            document.querySelectorAll('.category-item, .tag-item').forEach(item => item.classList.remove('drag-over'));
            removePlaceholders();
        }
        function removePlaceholders() { document.querySelectorAll('.placeholder').forEach(p => p.remove()); }

        function handleDrop(e) {
            e.stopPropagation();
            e.preventDefault();
            removePlaceholders();
            if (draggedItem !== this) {
                const fromIndex = parseInt(draggedItem.dataset.index, 10);
                let toIndex = parseInt(this.dataset.index, 10);
                const rect = this.getBoundingClientRect();
                const isBefore = e.clientY < rect.top + rect.height / 2;
                if (!isBefore) toIndex++;
                if (fromIndex < toIndex) toIndex--;
                const list = categories_settings;
                const movedItem = list.splice(fromIndex, 1)[0];
                list.splice(toIndex, 0, movedItem);
                renderCategories(categories_settings);
            }
            return false;
        }

        function addCategory() {
            const input = document.getElementById('newCategory');
            let category = input.value.trim();
            category = category.replace(/[<>]/g, ' ').trim();
            console.log(category)
            console.log(categories_settings)
            if (category && !categories_settings.includes(category)) {
                categories_settings.push(category);
                renderCategories(categories_settings);
                input.value = '';
            } else if (categories.includes(category)) {
                showMessage('categoriesMessage', 'Category already exists', false);
            } else if (!category) {
                showMessage('categoriesMessage', 'Category name cannot be empty.', false);
            }
        }

        function removeCategory(index) {
            categories_settings.splice(index, 1);
            renderCategories(categories_settings);
        }

        async function saveCategories() {
            if (categories.length === 0) {
                showMessage('categoriesMessage', 'At least one category is required', false);
                return;
            }
            try {
                const categoryMap = {categories: categories_settings};
                const response = await updateCategories(categoryMap);

                if (response) {
                    showMessage('categoriesMessage', 'Categories saved successfully', true);
                } else {
                    const error = await response.json();
                    showMessage('categoriesMessage', `Failed to save categories: ${error.error}`, false);
                }
            } catch (error) {
                console.error('Error saving categories:', error);
                showMessage('categoriesMessage', 'Error saving categories', false);
            }
        }

        // --- Currency & Start Date ---
        function populateCurrencySelect() {
            const selectExpense = document.getElementById('currencyExpenseSelect');
            selectExpense.innerHTML = Object.keys(currencyBehaviors).map(code => 
                `<option value="${code}" ${code === currentCurrency ? 'selected' : ''}>
                    ${code.toUpperCase()} (${currencyBehaviors[code].symbol})
                </option>`
            ).join('');
            const selectInput = document.getElementById('currencyInputSelect');
            selectInput.innerHTML = Object.keys(currencyBehaviors).map(code => 
                `<option value="${code}" ${code === currentCurrency ? 'selected' : ''}>
                    ${code.toUpperCase()} (${currencyBehaviors[code].symbol})
                </option>`
            ).join('');

            if (localStorage.getItem('userConfig')) {
                const config = JSON.parse(localStorage.getItem('userConfig'));
                selectExpense.value = config.convertCurrencyTo
                selectInput.value = config.defaultInputCurrency
            }
        }

        async function saveExpenseCurrency() {
            const currencyCode = document.getElementById('currencyExpenseSelect').value;
            try {
                localStorage.setItem('userConfig', JSON.stringify({
                    ...JSON.parse(localStorage.getItem('userConfig')),
                    convertCurrencyTo: currencyCode
                }));
                const response = await updateUserConfig();
                if (response) {
                    showMessage('currencyExpenseMessage', 'Currency saved successfully', true);
                    currentCurrency = currencyCode;
                } else {
                    showMessage('currencyExpenseMessage', 'Failed to save currency', false);
                }
            } catch (error) {
                console.error('Error saving currency:', error);
                showMessage('currencyExpenseMessage', 'Error saving currency', false);
            }
        }

        async function saveInputCurrency() {
            const currencyCode = document.getElementById('currencyInputSelect').value;
            try {
                localStorage.setItem('userConfig', JSON.stringify({
                    ...JSON.parse(localStorage.getItem('userConfig')),
                    defaultInputCurrency: currencyCode
                }));
                const response = await updateUserConfig();
                if (response) {
                    showMessage('currencyInputMessage', 'Currency saved successfully', true);
                    currentCurrency = currencyCode;
                } else {
                    showMessage('currencyInputMessage', 'Failed to save currency', false);
                }
            } catch (error) {
                console.error('Error saving currency:', error);
                showMessage('currencyInputMessage', 'Error saving currency', false);
            }
        }

        // --- Import/Export ---
        async function handleCsvImport(event) {
            const file = event.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('file', file);
            const messageDiv = document.getElementById('importMessage');
            const summaryDiv = document.getElementById('importSummary');

            messageDiv.textContent = 'Importing... this may take a while for large files.';
            messageDiv.className = 'form-message';
            summaryDiv.style.display = 'none';

            try {
                const response = await fetch('/import/csv', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (response.ok) {
                    messageDiv.textContent = 'Import completed!';
                    messageDiv.className = 'form-message success';
                    summaryDiv.style.display = 'block';
                    document.getElementById('summary-processed').textContent = result.total_processed;
                    document.getElementById('summary-imported').textContent = result.imported;
                    document.getElementById('summary-skipped').textContent = result.skipped;
                    document.getElementById('summary-new-categories').textContent = (result.new_categories || []).join(', ') || 'None';
                    
                    await initialize();
                } else {
                    messageDiv.textContent = `Error: ${result.error || 'Failed to import CSV'}`;
                    messageDiv.className = 'form-message error';
                }
            } catch (error) {
                console.error('Error importing CSV:', error);
                messageDiv.textContent = 'Error: An unexpected error occurred during import.';
                messageDiv.className = 'form-message error';
            } finally {
                event.target.value = '';
            }
        }

        // TODO: remove in the future; handles import from EO < v3.20
        async function handleCsvImportOld(event) {
            const file = event.target.files[0];
            if (!file) return;
            const formData = new FormData();
            formData.append('file', file);
            const messageDiv = document.getElementById('importMessage');
            const summaryDiv = document.getElementById('importSummary');

            messageDiv.textContent = 'Importing... this may take a while for large files.';
            messageDiv.className = 'form-message';
            summaryDiv.style.display = 'none';

            try {
                const response = await fetch('/import/csvold', {
                    method: 'POST',
                    body: formData
                });

                const result = await response.json();

                if (response.ok) {
                    messageDiv.textContent = 'Import completed!';
                    messageDiv.className = 'form-message success';
                    summaryDiv.style.display = 'block';
                    document.getElementById('summary-processed').textContent = result.total_processed;
                    document.getElementById('summary-imported').textContent = result.imported;
                    document.getElementById('summary-skipped').textContent = result.skipped;
                    document.getElementById('summary-new-categories').textContent = (result.new_categories || []).join(', ') || 'None';
                    
                    await initialize();
                } else {
                    messageDiv.textContent = `Error: ${result.error || 'Failed to import CSV'}`;
                    messageDiv.className = 'form-message error';
                }
            } catch (error) {
                console.error('Error importing CSV:', error);
                messageDiv.textContent = 'Error: An unexpected error occurred during import.';
                messageDiv.className = 'form-message error';
            } finally {
                event.target.value = '';
            }
        }

        // --- Initialization ---
        async function initialize() {
            try {
                const expensesResponse = JSON.parse(localStorage.getItem("allExpenses"))
                const configResponse = JSON.parse(localStorage.getItem("userConfig"))
                let cached = localStorage.getItem("allCategories")

                if (cached) {
                    categories_settings = JSON.parse(cached).categories || [];
                    currentStartDate = 1;
                    allTags.clear();
                    (expensesResponse || []).forEach(exp => (exp.tags || []).forEach(tag => allTags.add(tag)));
                    await Promise.all([renderCategories(categories_settings), populateCurrencySelect()]);
                }
                const categoriesResponse = await getAllCategories()
                categories_settings = categoriesResponse.categories || [];
                currentStartDate = 1;
                allTags.clear();
                (expensesResponse || []).forEach(exp => (exp.tags || []).forEach(tag => allTags.add(tag)));

                await Promise.all([renderCategories(categories_settings), populateCurrencySelect()]);
            } catch (error) {
                console.error('Failed to initialize settings:', error);
                showMessage('categoriesMessage', 'Failed to load settings', false);
            }
        }
        
        // --- Theme Management ---
        const themeSelect = document.getElementById('themeSelect');
        const currentTheme = localStorage.getItem('theme') || 'system';
        themeSelect.value = currentTheme;
        function applyTheme(theme) {
            if (theme === 'light') {
                document.documentElement.setAttribute('data-theme', 'light');
            } else if (theme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
            }
        }
        themeSelect.addEventListener('change', (e) => {
            const selectedTheme = e.target.value;
            localStorage.setItem('theme', selectedTheme);
            let config = JSON.parse(localStorage.getItem("userConfig")) || {};
            config.theme = selectedTheme;
            localStorage.setItem("userConfig", JSON.stringify(config));
            applyTheme(selectedTheme);
            showMessage('themeMessage', 'Theme updated successfully.', true);
        });

        // --- Event Listeners ---
        document.getElementById('addCategory').addEventListener('click', addCategory);
        document.getElementById('saveCategories').addEventListener('click', saveCategories);
        document.getElementById('saveInputCurrency').addEventListener('click', saveInputCurrency);
        document.getElementById('saveExpenseCurrency').addEventListener('click', saveExpenseCurrency);
        document.getElementById('csv-import-file').addEventListener('change', handleCsvImport);
        document.getElementById('csv-import-file-old').addEventListener('change', handleCsvImportOld);
        document.getElementById('newCategory').addEventListener('keypress', e => e.key === 'Enter' && addCategory());

        // document.addEventListener('DOMContentLoaded', initialize);
        window.removeCategory = removeCategory;