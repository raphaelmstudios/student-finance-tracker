// state.js - Manages the app's in-memory state

import { load, save, loadSettings, saveSettings } from "./storage.js";
// Current transactions in memory
let transactions = [];

// Current exchange rates
let rates = {
  usd: 0.000685,
  gbp: 0.000504,
};

// Budget cap
let budgetCap = null;

export function init() {
  transactions = load();
  const settings = loadSettings();
  if (settings) {
    if (settings.rates) rates = settings.rates;
    if (settings.budgetCap !== undefined) budgetCap = settings.budgetCap;
  }
}

export function setRates(newRates) {
  rates = { ...rates, ...newRates };
  saveSettings({ rates, budgetCap });
}

export function setBudgetCap(amount) {
  budgetCap = amount;
  saveSettings({ rates, budgetCap });
}

export function getTransactions() {
  return transactions;
}

export function addTransaction(transaction) {
  transactions.push(transaction);
  save(transactions);
}

export function updateTransaction(id, updatedData) {
  const index = transactions.findIndex((t) => t.id === id);
  if (index !== -1) {
    transactions[index] = { ...transactions[index], ...updatedData };
    save(transactions);
  }
}

export function deleteTransaction(id) {
  transactions = transactions.filter((t) => t.id !== id);
  save(transactions);
}

export function getRates() {
  return rates;
}

export function getBudgetCap() {
  return budgetCap;
}
