// ui.js - Main controller that handles all user interface interactions

// Import all the functions we need from other files
import { save, clear, clearAll } from "./storage.js";
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
  setupHamburger();
  setupForm();
  setupSearch();
  setupSort();
  setupSettings();
  setupBudgetCap();
  populateRateInputs();
  renderTable();
  updateStats();
  renderChart();
});

/*Make navigation links work - clicking them shows/hides sections*/

function setupNavigation() {
  const links = document.querySelectorAll("#main-nav .nav-link");

  links.forEach((link) => {
    link.addEventListener("click", function (e) {
      e.preventDefault();

      const targetId = this.getAttribute("href").substring(1);

      const isDrawerOpen = document
        .getElementById("main-nav")
        .classList.contains("nav-open");

      if (isDrawerOpen) {
        // Close drawer first, then navigate after animation + overflow release
        closeHamburger();
        setTimeout(() => {
          showSection(targetId);
          window.scrollTo({ top: 0 }); // instant scroll after lock is released
        }, 380); // slightly after 350ms transition
      } else {
        // Desktop — just navigate immediately
        showSection(targetId);
      }
    });
  });
}

/*Make hamburger menu work on mobile*/

/*Show one section and hide all others*/
function closeHamburger() {
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");
  const backdrop = document.getElementById("nav-backdrop");

  if (!nav.classList.contains("nav-open")) return;

  nav.classList.remove("nav-open");
  backdrop.classList.remove("visible");

  toggle.setAttribute("aria-expanded", "false");
  toggle.setAttribute("aria-label", "Open navigation menu");

  document.body.style.overflow = "";
}

function setupHamburger() {
  const toggle = document.getElementById("nav-toggle");
  const nav = document.getElementById("main-nav");
  const backdrop = document.getElementById("nav-backdrop");

  toggle.addEventListener("click", () => {
    const isOpen = toggle.getAttribute("aria-expanded") === "true";

    if (isOpen) {
      closeHamburger();
    } else {
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close navigation menu");
      nav.classList.add("nav-open");
      backdrop.classList.add("visible");
      document.body.style.overflow = "hidden";
    }
  });

  backdrop.addEventListener("click", closeHamburger);

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeHamburger();
  });
}

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

  // Update navigation active state
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

  // Update search hint count
  const hint = document.getElementById("search-hint");
  if (currentSearch) {
    hint.textContent = `${filteredTransactions.length} result${filteredTransactions.length !== 1 ? "s" : ""} found`;
  } else {
    hint.textContent = "";
  }

  if (filteredTransactions.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" class="empty-state">
          <span class="empty-state-icon" aria-hidden="true">📋</span>
          ${currentSearch ? "No transactions match your search." : "No transactions yet. Add one to get started!"}
        </td>
      </tr>`;
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
        <td class="col-date">${transaction.date}</td>
        <td>${description}</td>
        <td class="col-amount">FRw ${formatNumber(transaction.amount)}</td>
        <td><span class="category-badge cat-${transaction.category.replace(/\s+/g, "-")}">${category}</span></td>
        <td>
          <button class="action-btn btn-edit" data-id="${transaction.id}"
            aria-label="Edit ${transaction.description}">Edit</button>
          <button class="action-btn btn-delete" data-id="${transaction.id}"
            aria-label="Delete ${transaction.description}">Delete</button>
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
  const sorted = [...transactions];

  sorted.sort((a, b) => {
    let valueA = a[field];
    let valueB = b[field];

    if (field === "amount") {
      valueA = Number(valueA);
      valueB = Number(valueB);
    }

    if (field === "date") {
      valueA = new Date(valueA);
      valueB = new Date(valueB);
    }

    if (field === "description" || field === "category") {
      valueA = valueA.toLowerCase();
      valueB = valueB.toLowerCase();
    }

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

    // Remove ANY existing arrow (↑ ↓ ↕)
    btn.textContent = btn.textContent.replace(/\s[↑↓↕]$/, "");

    if (field === currentSort.field) {
      const arrow = currentSort.order === "asc" ? " ↑" : " ↓";
      btn.textContent += arrow;
    } else {
      btn.textContent += " ↕";
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
  renderChart();
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
  const transactions = getTransactions();
  const transaction = transactions.find((t) => t.id === id);

  if (!transaction) return;

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
  const transactions = getTransactions();
  const transaction = transactions.find((t) => t.id === id);

  if (!transaction) return; // Silent fail — button shouldn't exist without a transaction

  const proceed = window.confirm(
    `Delete "${transaction.description}" (FRw ${formatNumber(transaction.amount)}) on ${transaction.date}?`,
  );

  if (proceed) {
    deleteTransaction(id);
    renderTable();
    updateStats();
    renderChart();
  }
}

/*Calculate and display all dashboard statistics*/
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

// Update budget cap status if one is set
function updateBudgetStatus(totalSpending) {
  const cap = getBudgetCap();
  const statusDiv = document.getElementById("cap-status");

  if (!cap) {
    statusDiv.textContent = "";
    statusDiv.className = "";
    return;
  }

  const remaining = cap - totalSpending;

  if (remaining >= 0) {
    statusDiv.textContent = `✓ FRw ${formatNumber(remaining)} remaining of your FRw ${formatNumber(cap)} budget.`;
    statusDiv.className = "under";
    statusDiv.setAttribute("aria-live", "polite");
  } else {
    const overage = Math.abs(remaining);
    statusDiv.textContent = `⚠️ You are FRw ${formatNumber(overage)} over your FRw ${formatNumber(cap)} budget!`;
    statusDiv.className = "over";
    statusDiv.setAttribute("aria-live", "assertive");
  }
}
/*Make the budget cap feature work*/
function setupBudgetCap() {
  const capInput = document.getElementById("cap-input");
  const capBtn = document.getElementById("cap-btn");
  const statusDiv = document.getElementById("cap-status");

  // Pre-populate input if a cap was previously saved
  const savedCap = getBudgetCap();
  if (savedCap) capInput.value = savedCap;

  capBtn.addEventListener("click", () => {
    const value = capInput.value.trim();

    if (!value) {
      setBudgetCap(null);
      statusDiv.textContent = "Budget cap removed.";
      statusDiv.className = "";
      setTimeout(() => {
        statusDiv.textContent = "";
      }, 3000);
      return;
    }

    const cap = parseFloat(value);

    if (isNaN(cap) || cap <= 0) {
      statusDiv.textContent = "Please enter a valid amount greater than 0.";
      statusDiv.className = "over";
      return;
    }

    setBudgetCap(cap);
    updateStats();
  });
}

/*Make import/export features work*/
function showNotice(id, message, isError = false) {
  const el = document.getElementById(id);
  el.textContent = message;
  el.style.background = isError ? "rgba(185,28,28,.09)" : "rgba(45,74,62,.09)";
  el.style.color = isError ? "var(--red)" : "var(--forest)";
  el.style.borderColor = isError ? "rgba(185,28,28,.2)" : "rgba(45,74,62,.2)";
  el.classList.add("visible");
  setTimeout(() => {
    el.classList.remove("visible");
    el.textContent = "";
  }, 3500);
}

function setupSettings() {
  const exportBtn = document.getElementById("export-btn");
  const importFile = document.getElementById("import-file");
  const clearBtn = document.getElementById("clear-all");
  const saveRatesBtn = document.getElementById("save-rates");

  // Export button
  exportBtn.addEventListener("click", () => {
    const transactions = getTransactions();
    const dataStr = JSON.stringify(transactions, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pesaani-export-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    showNotice("data-notice", "✓ Export downloaded successfully.");
  });

  // Import file
  importFile.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target.result);

        if (!Array.isArray(data)) {
          showNotice(
            "data-notice",
            "✗ Invalid file. Expected an array of transactions.",
            true,
          );
          return;
        }

        const isValid = data.every(
          (t) =>
            t.id &&
            t.description &&
            typeof t.amount === "number" &&
            t.category &&
            t.date,
        );

        if (!isValid) {
          showNotice(
            "data-notice",
            "✗ Invalid transaction data. Check the file format.",
            true,
          );
          return;
        }

        // Simple inline confirmation using the notice area
        const proceed = window.confirm(
          `Import ${data.length} transactions? This will replace your current data.`,
        );

        if (proceed) {
          clear();
          const transactions = data.map((t) => ({
            ...t,
            amount: parseFloat(t.amount),
          }));
          save(transactions);
          init();
          renderTable();
          updateStats();
          renderChart();
          showNotice(
            "data-notice",
            `✓ Imported ${data.length} transactions successfully.`,
          );
          showSection("records");
        }
      } catch (error) {
        showNotice(
          "data-notice",
          "✗ Error reading file. Make sure it's valid JSON.",
          true,
        );
        console.error("Import error:", error);
      }
    };

    reader.readAsText(file);
    e.target.value = "";
  });

  // Clear all data
  clearBtn.addEventListener("click", () => {
    const proceed = window.confirm(
      "Delete ALL transactions and settings? This cannot be undone.",
    );
    if (proceed) {
      clearAll();
      init();
      renderTable();
      updateStats();
      renderChart();
      showNotice("data-notice", "✓ All data has been cleared.");
    }
  });

  // Save exchange rates
  saveRatesBtn.addEventListener("click", () => {
    const usdRate = parseFloat(document.getElementById("rate-usd").value);
    const gbpRate = parseFloat(document.getElementById("rate-gbp").value);

    if (isNaN(usdRate) || isNaN(gbpRate) || usdRate <= 0 || gbpRate <= 0) {
      showNotice(
        "rates-notice",
        "✗ Please enter valid rates greater than 0.",
        true,
      );
      return;
    }

    setRates({ usd: usdRate, gbp: gbpRate });
    showNotice("rates-notice", "✓ Exchange rates saved successfully.");
  });
}

/* Pre-fill rate inputs from saved state */
function populateRateInputs() {
  const rates = getRates();
  document.getElementById("rate-usd").value = rates.usd;
  document.getElementById("rate-gbp").value = rates.gbp;
}

/* Build the 7-day spending bar chart */
function renderChart() {
  const chartBars = document.getElementById("chart-bars");
  const chartSr = document.getElementById("chart-sr");
  if (!chartBars) return;

  const transactions = getTransactions();

  // Build array of last 7 days oldest → newest
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-US", { weekday: "short" });
    const total = transactions
      .filter((t) => t.date === dateStr)
      .reduce((sum, t) => sum + t.amount, 0);
    days.push({ dateStr, label, total, isToday: i === 0 });
  }

  // Find max for scaling bar heights
  const max = Math.max(...days.map((d) => d.total), 1);

  // Build chart HTML
  chartBars.innerHTML = days
    .map((day) => {
      const heightPct = Math.round((day.total / max) * 100);
      const barClass = day.isToday ? "chart-bar is-today" : "chart-bar";
      const labelClass = day.isToday ? "chart-label is-today" : "chart-label";
      const amountLabel =
        day.total > 0 ? `FRw ${formatNumber(day.total)}` : "—";

      return `
        <div class="chart-col">
          <div class="${barClass}"
            style="height: ${heightPct}%"
            data-amount="${amountLabel}"
            aria-hidden="true">
          </div>
          <span class="${labelClass}">${day.label}</span>
        </div>`;
    })
    .join("");

  // Screen reader summary
  const srText = days
    .map(
      (d) =>
        `${d.label}: ${d.total > 0 ? "FRw " + formatNumber(d.total) : "nothing"}`,
    )
    .join(", ");
  chartSr.textContent = `7-day spending: ${srText}`;
}
