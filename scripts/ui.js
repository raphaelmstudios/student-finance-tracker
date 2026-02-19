// ui.js - Main controller that handles all user interface interactions

// Import all the functions we need from other files
import { save, clear } from "./storage.js";
import {
  init,
  getTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getRates,
  setRates,
  getBudgetCap,
  setBudgetCap,
} from "./state.js";

import { validateForm, cleanDescription } from "./validators.js";
import { compileRegex, highlight, searchTransactions } from "./search.js";

// Keep track of current state
let currentSort = { field: null, order: "asc" };
let currentSearch = "";
let caseSensitive = false;
let editingId = null;

// When the page loads, run this function
document.addEventListener("DOMContentLoaded", () => {
  init();
  setupNavigation();
  setupForm();
  setupSearch();
  setupSort();
  setupSettings();
  setupBudgetCap();
  renderTable();
  updateStats();
});

/*Make navigation links work - clicking them shows/hides sections*/

function setupNavigation() {
  // Get all navigation links
  const navLinks = document.querySelectorAll(".nav-link");

  navLinks.forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault(); // Stop the page from jumping

      // Get which section to show (e.g., "about", "dashboard")
      const targetId = link.getAttribute("href").substring(1); // Remove the # symbol
      showSection(targetId);
    });
  });
}

/*Show one section and hide all others*/
function showSection(sectionId) {
  // Hide all sections
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.remove("active");
  });

  // Show the requested section
  const targetSection = document.getElementById(sectionId);
  if (targetSection) {
    targetSection.classList.add("active");
  }

  // Update navigation to show which link is active
  document.querySelectorAll(".nav-link").forEach((link) => {
    link.classList.remove("active");
    if (link.getAttribute("href") === `#${sectionId}`) {
      link.classList.add("active");
    }
  });

  // If showing records section, refresh the table
  if (sectionId === "records") {
    renderTable();
  }

  // If showing dashboard, refresh stats
  if (sectionId === "dashboard") {
    updateStats();
  }
}

/*Display all transactions in the table*/

function renderTable() {
  const tbody = document.getElementById("records-body");
  const transactions = getTransactions();

  // Apply search filter if user is searching
  let filteredTransactions = transactions;
  if (currentSearch) {
    const regex = compileRegex(currentSearch, caseSensitive ? "" : "i");
    if (regex) {
      filteredTransactions = searchTransactions(
        transactions,
        currentSearch,
        caseSensitive,
      );
    }
  }

  // Apply sorting if a column is sorted
  if (currentSort.field) {
    filteredTransactions = sortTransactions(
      filteredTransactions,
      currentSort.field,
      currentSort.order,
    );
  }

  // If no transactions, show empty message
  if (filteredTransactions.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="5" class="empty-state">No transactions found.</td></tr>';
    return;
  }

  // Build the table rows
  const regex = currentSearch
    ? compileRegex(currentSearch, caseSensitive ? "" : "i")
    : null;

  tbody.innerHTML = filteredTransactions
    .map((transaction) => {
      // Highlight search matches in description and category
      const description = regex
        ? highlight(transaction.description, regex)
        : transaction.description;
      const category = regex
        ? highlight(transaction.category, regex)
        : transaction.category;

      return `
      <tr>
        <td>${transaction.date}</td>
        <td>${description}</td>
        <td>FRw ${formatNumber(transaction.amount)}</td>
        <td>${category}</td>
        <td>
          <button class="action-btn btn-edit" data-id="${transaction.id}">Edit</button>
          <button class="action-btn btn-delete" data-id="${transaction.id}">Delete</button>
        </td>
      </tr>
    `;
    })
    .join("");

  // Add click listeners to Edit and Delete buttons
  tbody.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => handleEdit(btn.dataset.id));
  });

  tbody.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", () => handleDelete(btn.dataset.id));
  });
}

/*Format a number with commas (e.g., 1000 → 1,000)*/

function formatNumber(num) {
  return num.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/*Make sort buttons work*/

function setupSort() {
  const sortButtons = document.querySelectorAll(".sort-btn");

  sortButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const field = btn.dataset.field; // Which column (date, description, amount)

      // If clicking the same column, reverse the order
      if (currentSort.field === field) {
        currentSort.order = currentSort.order === "asc" ? "desc" : "asc";
      } else {
        // If clicking a new column, sort ascending
        currentSort.field = field;
        currentSort.order = "asc";
      }

      renderTable();
      updateSortButtons();
    });
  });
}

/*Sort transactions by a field*/

function sortTransactions(transactions, field, order) {
  const sorted = [...transactions]; // Make a copy so we don't modify original

  sorted.sort((a, b) => {
    let valueA = a[field];
    let valueB = b[field];

    // For text fields, convert to lowercase for consistent sorting
    if (field === "description" || field === "category") {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }

    // Compare values
    if (valueA < valueB) return order === "asc" ? -1 : 1;
    if (valueA > valueB) return order === "asc" ? 1 : -1;
    return 0;
  });

  return sorted;
}

/*Update sort button appearance to show which column is sorted*/

function updateSortButtons() {
  document.querySelectorAll(".sort-btn").forEach((btn) => {
    const field = btn.dataset.field;

    if (field === currentSort.field) {
      // Show arrow indicating sort direction
      const arrow = currentSort.order === "asc" ? " ↑" : " ↓";
      btn.textContent = btn.textContent.replace(/ [↑↓]$/, "") + arrow;
    } else {
      // Show neutral sort indicator
      btn.textContent = btn.textContent.replace(/ [↑↓]$/, "") + " ↕";
    }
  });
}

/*Make the search box work - filters table as you type*/
function setupSearch() {
  const searchInput = document.getElementById("search-input");
  const caseCheckbox = document.getElementById("search-case");

  // When user types in search box
  searchInput.addEventListener("input", () => {
    currentSearch = searchInput.value;
    renderTable(); // Refresh table with search results
  });

  // When user toggles case-sensitive checkbox
  caseCheckbox.addEventListener("change", () => {
    caseSensitive = caseCheckbox.checked;
    renderTable(); // Refresh table with new setting
  });
}

/*Make the transaction form work*/
function setupForm() {
  const form = document.getElementById("transaction-form");
  const cancelBtn = document.getElementById("form-cancel");

  // When user submits the form
  form.addEventListener("submit", (e) => {
    e.preventDefault(); // Don't reload the page
    handleFormSubmit();
  });

  // When user clicks Cancel button
  cancelBtn.addEventListener("click", () => {
    resetForm();
    showSection("records"); // Go back to records table
  });
}

/*Handle form submission (add or edit transaction)*/
function handleFormSubmit() {
  // Get all the values from the form
  const formData = {
    description: document.getElementById("form-description").value,
    amount: document.getElementById("form-amount").value,
    category: document.getElementById("form-category").value,
    date: document.getElementById("form-date").value,
  };

  // Clean the description (remove extra spaces)
  formData.description = cleanDescription(formData.description);

  // Validate all fields
  const validation = validateForm(formData);

  // Clear any old error messages
  clearErrors();

  // If validation failed, show errors
  if (!validation.valid) {
    displayErrors(validation.errors);
    return; // Stop here, don't save
  }

  // If editing existing transaction
  if (editingId) {
    const transaction = {
      id: editingId,
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: formData.date,
      updatedAt: new Date().toISOString(),
    };

    updateTransaction(editingId, transaction);
  }
  // If adding new transaction
  else {
    const transaction = {
      id: generateId(),
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: formData.date,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    addTransaction(transaction);
  }

  // Success! Clean up and go back to table
  resetForm();
  showSection("records");
  renderTable();
  updateStats();
}

/*Clear all error messages from the form*/
function clearErrors() {
  document.querySelectorAll(".error").forEach((el) => {
    el.textContent = "";
  });
}

/*Show error messages on the form*/
function displayErrors(errors) {
  if (errors.description) {
    document.getElementById("error-description").textContent =
      errors.description;
  }
  if (errors.amount) {
    document.getElementById("error-amount").textContent = errors.amount;
  }
  if (errors.category) {
    document.getElementById("error-category").textContent = errors.category;
  }
  if (errors.date) {
    document.getElementById("error-date").textContent = errors.date;
  }
}

/*Clear the form and reset to "add" mode*/
function resetForm() {
  document.getElementById("transaction-form").reset();
  document.getElementById("form-id").value = "";
  editingId = null;
  document.getElementById("form-heading").textContent = "Add Transaction";
  document.getElementById("form-submit").textContent = "Add Transaction";
  clearErrors();
}

/*Generate a unique ID for new transactions*/
function generateId() {
  return "txn_" + Date.now();
}

/*Handle editing a transaction*/
function handleEdit(id) {
  // Find the transaction with this ID
  const transactions = getTransactions();
  const transaction = transactions.find((t) => t.id === id);

  // If not found, show error and stop
  if (!transaction) {
    alert("Transaction not found");
    return;
  }

  // Fill the form with the transaction's data
  document.getElementById("form-id").value = transaction.id;
  document.getElementById("form-description").value = transaction.description;
  document.getElementById("form-amount").value = transaction.amount;
  document.getElementById("form-category").value = transaction.category;
  document.getElementById("form-date").value = transaction.date;

  // Remember we're editing (not adding new)
  editingId = id;

  // Update form heading and button text
  document.getElementById("form-heading").textContent = "Edit Transaction";
  document.getElementById("form-submit").textContent = "Save Changes";

  // Switch to the form section
  showSection("add-edit");
}

/*Handle deleting a transaction*/
function handleDelete(id) {
  // Find the transaction to show its details in confirmation
  const transactions = getTransactions();
  const transaction = transactions.find((t) => t.id === id);

  if (!transaction) {
    alert("Transaction not found");
    return;
  }

  // Ask user to confirm deletion
  const confirmMessage =
    `Are you sure you want to delete this transaction?\n\n` +
    `Description: ${transaction.description}\n` +
    `Amount: FRw ${formatNumber(transaction.amount)}\n` +
    `Date: ${transaction.date}`;

  if (confirm(confirmMessage)) {
    // User clicked OK - delete it
    deleteTransaction(id);
    renderTable();
    updateStats();
  }
  // If user clicked Cancel, do nothing
}

/**
 * Calculate and display all dashboard statistics
 */
function updateStats() {
  const transactions = getTransactions();

  // Stat 1: Total number of transactions
  const totalCount = transactions.length;
  document.getElementById("stat-total").textContent = totalCount;

  // Stat 2: Total spending (sum of all amounts)
  const totalSpending = transactions.reduce((sum, t) => sum + t.amount, 0);
  document.getElementById("stat-spending").textContent =
    `FRw ${formatNumber(totalSpending)}`;

  // Stat 3: Top category (category with most spending)
  const topCategory = getTopCategory(transactions);
  document.getElementById("stat-category").textContent = topCategory || "—";

  // Stat 4: Last 7 days spending
  const last7Days = getLast7DaysSpending(transactions);
  document.getElementById("stat-week").textContent =
    `FRw ${formatNumber(last7Days)}`;

  // Update budget cap status if one is set
  updateBudgetStatus(totalSpending);
}

/*Find which category has the most spending*/
function getTopCategory(transactions) {
  if (transactions.length === 0) return null;

  // Count spending per category
  const categoryTotals = {};

  transactions.forEach((t) => {
    if (!categoryTotals[t.category]) {
      categoryTotals[t.category] = 0;
    }
    categoryTotals[t.category] += t.amount;
  });

  // Find the category with highest total
  let topCategory = null;
  let maxAmount = 0;

  for (const category in categoryTotals) {
    if (categoryTotals[category] > maxAmount) {
      maxAmount = categoryTotals[category];
      topCategory = category;
    }
  }

  return topCategory;
}

/*Calculate spending in the last 7 days*/
function getLast7DaysSpending(transactions) {
  // Get today's date
  const today = new Date();

  // Get date from 7 days ago
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setDate(today.getDate() - 7);

  // Filter transactions from last 7 days and sum them
  const recentTotal = transactions
    .filter((t) => {
      const transactionDate = new Date(t.date);
      return transactionDate >= sevenDaysAgo && transactionDate <= today;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  return recentTotal;
}

/*Update budget cap status message*/
function updateBudgetStatus(totalSpending) {
  const cap = getBudgetCap();
  const statusDiv = document.getElementById("cap-status");

  // If no cap is set, clear the message
  if (!cap) {
    statusDiv.textContent = "";
    statusDiv.style.backgroundColor = "";
    statusDiv.style.color = "";
    return;
  }

  const remaining = cap - totalSpending;

  // If under budget
  if (remaining >= 0) {
    statusDiv.textContent = `You have FRw ${formatNumber(remaining)} remaining in your budget.`;
    statusDiv.style.backgroundColor = "#d1fae5"; // Light green
    statusDiv.style.color = "#065f46"; // Dark green text
    statusDiv.setAttribute("aria-live", "polite");
  }
  // If over budget
  else {
    const overage = Math.abs(remaining);
    statusDiv.textContent = `⚠️ You are FRw ${formatNumber(overage)} over your budget!`;
    statusDiv.style.backgroundColor = "#fee2e2"; // Light red
    statusDiv.style.color = "#991b1b"; // Dark red text
    statusDiv.setAttribute("aria-live", "assertive");
  }
}

/*Make the budget cap feature work*/
function setupBudgetCap() {
  const capInput = document.getElementById("cap-input");
  const capBtn = document.getElementById("cap-btn");

  // When user clicks "Set Cap" button
  capBtn.addEventListener("click", () => {
    const value = capInput.value.trim();

    // If they typed nothing, clear the cap
    if (!value) {
      setBudgetCap(null);
      document.getElementById("cap-status").textContent = "Budget cap removed.";
      setTimeout(() => {
        document.getElementById("cap-status").textContent = "";
      }, 3000); // Clear message after 3 seconds
      return;
    }

    // Convert to number
    const cap = parseFloat(value);

    // Validate it's a positive number
    if (isNaN(cap) || cap <= 0) {
      document.getElementById("cap-status").textContent =
        "Please enter a valid amount greater than 0.";
      document.getElementById("cap-status").style.backgroundColor = "#fee2e2";
      document.getElementById("cap-status").style.color = "#991b1b";
      return;
    }

    // Save the cap
    setBudgetCap(cap);

    // Show success message
    document.getElementById("cap-status").textContent =
      `Budget cap set to FRw ${formatNumber(cap)}.`;
    document.getElementById("cap-status").style.backgroundColor = "#dbeafe";
    document.getElementById("cap-status").style.color = "#1e40af";

    // Update stats to show budget status
    updateStats();
  });
}

/*Make import/export features work*/
function setupSettings() {
  const exportBtn = document.getElementById("export-btn");
  const importFile = document.getElementById("import-file");
  const clearBtn = document.getElementById("clear-all");
  const saveRatesBtn = document.getElementById("save-rates");

  // Export button - download transactions as JSON
  exportBtn.addEventListener("click", () => {
    const transactions = getTransactions();
    const dataStr = JSON.stringify(transactions, null, 2); // Pretty format with 2-space indent
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    // Create download link
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `finance-tracker-${new Date().toISOString().split("T")[0]}.json`;
    link.click();

    // Clean up
    URL.revokeObjectURL(url);
  });

  //Import file - load transactions from JSON
  importFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        // Validate it's an array
        if (!Array.isArray(data)) {
          alert("Invalid file format. Expected an array of transactions.");
          return;
        }

        // Validate each transaction has required fields
        const isValid = data.every(
          (t) =>
            t.id &&
            t.description &&
            typeof t.amount === "number" &&
            t.category &&
            t.date,
        );

        if (!isValid) {
          alert("Invalid transaction data. Please check the file format.");
          return;
        }

        // Ask for confirmation
        if (
          confirm(
            `Import ${data.length} transactions? This will replace your current data.`,
          )
        ) {
          // Clear existing data first
          clear();

          // Format transactions properly
          const transactions = data.map((t) => ({
            ...t,
            amount: parseFloat(t.amount), // Ensure amount is a number
          }));

          // Save all at once (more efficient!)
          save(transactions);

          // Reload state and refresh UI
          init();
          renderTable();
          updateStats();

          alert("Import successful!");
          showSection("records");
        }
      } catch (error) {
        alert("Error reading file. Please make sure it's a valid JSON file.");
        console.error("Import error:", error);
      }
    };

    reader.readAsText(file);

    // Reset file input so same file can be selected again
    e.target.value = "";
  });

  // Clear all data button
  clearBtn.addEventListener("click", () => {
    if (
      confirm(
        "Are you sure you want to delete ALL transactions? This cannot be undone!",
      )
    ) {
      // Ask again to be really sure
      if (
        confirm(
          "This will permanently delete everything. Are you absolutely sure?",
        )
      ) {
        clear(); // ← Direct call, no import needed!
        init(); // Reload (will be empty)
        renderTable();
        updateStats();
        alert("All data has been cleared.");
      }
    }
  });

  // Save exchange rates
  saveRatesBtn.addEventListener("click", () => {
    const usdRate = parseFloat(document.getElementById("rate-usd").value);
    const gbpRate = parseFloat(document.getElementById("rate-gbp").value);

    if (isNaN(usdRate) || isNaN(gbpRate) || usdRate <= 0 || gbpRate <= 0) {
      alert("Please enter valid exchange rates.");
      return;
    }

    setRates({ usd: usdRate, gbp: gbpRate });
    alert("Exchange rates saved!");
  });
}
