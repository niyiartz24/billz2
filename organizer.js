document.addEventListener('DOMContentLoaded', function () {
    const storedUsername = localStorage.getItem('username');
    const storedPassword = localStorage.getItem('password');
    const storedCurrency = localStorage.getItem('currency') || 'USD';  // Default to USD
    const bills = JSON.parse(localStorage.getItem('bills')) || [];
    const themeBtn = document.getElementById('theme-btn');
    const billList = document.getElementById('bill-list');
    const billForm = document.getElementById('bill-form');
    const categoryFilter = document.getElementById('category-filter');
    const searchBillInput = document.getElementById('search-bill');
    const clearBillsBtn = document.getElementById('clear-bills');
    const logoutBtn = document.getElementById('logout-btn');
    const totalAmount = document.getElementById('total-amount');
    const signupContainer = document.getElementById('signup-container');
    const loginContainer = document.getElementById('login-container');
    const forgotPasswordContainer = document.getElementById('forgot-password-container');
    const billManagerContainer = document.getElementById('bill-manager-container');
    const downloadBtn = document.getElementById('download-btn');
    const currencySelect = document.getElementById('currency-select'); // Dropdown for currency selection

    // Set the initial selected currency
    currencySelect.value = storedCurrency;

    // Show login form
    document.getElementById('show-login').addEventListener('click', function () {
        signupContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    });

    // Show signup form
    document.getElementById('show-signup').addEventListener('click', function () {
        loginContainer.style.display = 'none';
        signupContainer.style.display = 'block';
    });

    // Show forgot password form
    document.getElementById('forgot-password').addEventListener('click', function () {
        loginContainer.style.display = 'none';
        forgotPasswordContainer.style.display = 'block';
    });

    // Back to login from forgot password
    document.getElementById('show-login-from-forgot').addEventListener('click', function () {
        forgotPasswordContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    });

    // Forgot password functionality
    document.getElementById('forgot-password-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const newPassword = document.getElementById('forgot-password-new').value;
        if (newPassword) {
            localStorage.setItem('password', newPassword);
            alert('Password reset successfully!');
            forgotPasswordContainer.style.display = 'none';
            loginContainer.style.display = 'block';
        }
    });

    // Sign up functionality
    document.getElementById('signup-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const username = document.getElementById('signup-username').value;
        const password = document.getElementById('signup-password').value;

        if (username && password) {
            localStorage.setItem('username', username);
            localStorage.setItem('password', password);
            alert('Sign-up successful! You can now log in.');
            signupContainer.style.display = 'none';
            loginContainer.style.display = 'block';
        } else {
            alert('Please fill out both fields.');
        }
    });

    // Login functionality
    document.getElementById('login-form').addEventListener('submit', function (e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;

        if (username === storedUsername && password === storedPassword) {
            loginContainer.style.display = 'none';
            billManagerContainer.style.display = 'block';
            loadBills();
        } else {
            alert('Invalid credentials. Please try again.');
        }
    });

    // Currency selection
    currencySelect.addEventListener('change', function () {
        const selectedCurrency = currencySelect.value;
        localStorage.setItem('currency', selectedCurrency);
        updateTotal(); // Update the total amount when currency changes
        loadBills();   // Reload bills to update currency display
    });

    // Toggle theme
    themeBtn.addEventListener('click', function () {
        document.body.classList.toggle('dark-mode');
    });

    // Add Bill
    billForm.addEventListener('submit', function (e) {
        e.preventDefault();
        const billName = document.getElementById('bill-name').value;
        const billAmount = parseFloat(document.getElementById('bill-amount').value);
        const billCategory = document.getElementById('bill-category').value;
        const isRecurring = document.getElementById('recurring-bill').checked;

        if (billName && !isNaN(billAmount) && billAmount > 0) {
            const bill = {
                name: billName,
                amount: billAmount,
                category: billCategory,
                paid: false,
                recurring: isRecurring,
                dueDate: new Date().toISOString().split('T')[0] // Today's date as due date
            };
            bills.push(bill);
            saveBills();
            addBillToList(bill);
            updateTotal();
            document.getElementById('bill-form').reset();
        } else {
            alert('Please fill in all fields correctly.');
        }
    });

    // Log out
    logoutBtn.addEventListener('click', function () {
        localStorage.removeItem('username');
        localStorage.removeItem('password');
        billManagerContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    });

    // Download Bills
    downloadBtn.addEventListener('click', function () {
        const csv = bills.map(bill => `${bill.name},${bill.amount},${bill.category},${bill.paid},${bill.recurring},${bill.dueDate}`).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'bills.csv';
        link.click();
    });

    // Save bills to local storage
    function saveBills() {
        localStorage.setItem('bills', JSON.stringify(bills));
    }

    function loadBills() {
        billList.innerHTML = ''; // Clear the bill list
        bills.forEach(bill => addBillToList(bill)); // Add all bills initially
        updateTotal(); // Update the total amount
    }

    // Add bill to list
    function addBillToList(bill) {
        const li = document.createElement('li');
        li.classList.add('bill-item');
        if (bill.paid) li.classList.add('paid');
        li.innerHTML = `
            <span>${bill.name} - ${formatCurrency(bill.amount)} - ${bill.category} - ${bill.dueDate} - ${bill.recurring ? 'Recurring' : 'One-Time'}</span>
            <button class="mark-paid-btn">${bill.paid ? 'Unmark Paid' : 'Mark as Paid'}</button>
            <button class="delete-btn">Delete</button>
        `;
        billList.appendChild(li);

        // Mark as Paid
        const markPaidBtn = li.querySelector('.mark-paid-btn');
        markPaidBtn.addEventListener('click', function () {
            bill.paid = !bill.paid;
            saveBills();
            loadBills();
        });

        // Delete Bill
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', function () {
            const index = bills.indexOf(bill);
            if (index > -1) {
                bills.splice(index, 1);
                saveBills();
                loadBills();
            }
        });
    }

    // Clear all bills
    clearBillsBtn.addEventListener('click', function () {
        // Clear bills from local storage
        localStorage.removeItem('bills');

        // Clear bills from the UI
        billList.innerHTML = '';

        // Update the total amount
        updateTotal();

        // Optionally, show a message or alert
        alert('All bills have been cleared!');
    });

    // Update total amount
    function updateTotal() {
        const total = bills.reduce((sum, bill) => bill.paid ? sum : sum + bill.amount, 0);
        totalAmount.textContent = `Total: ${formatCurrency(total)}`;
    }

    // Format currency based on selected currency
    function formatCurrency(amount) {
        const currency = localStorage.getItem('currency') || 'USD';
        const formatter = new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency
        });
        return formatter.format(amount);
    }
});

// Category Filter Event Listener
categoryFilter.addEventListener('change', function () {
    const selectedCategory = categoryFilter.value;
    filterBillsByCategory(selectedCategory);
});

// Function to filter bills by selected category
function filterBillsByCategory(category) {
    billList.innerHTML = ''; // Clear the bill list before updating
    const filteredBills = category === 'all' ? bills : bills.filter(bill => bill.category === category);
    filteredBills.forEach(bill => addBillToList(bill)); // Add filtered bills to the list
    updateTotal(); // Update the total amount after filtering
}
