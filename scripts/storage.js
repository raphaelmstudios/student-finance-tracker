// storage.js - Handles saving/loading data to/from localStorage

const STORAGE_KEY = "pesaani:transactions";
const SETTINGS_KEY = "pesaani:settings";

export function save(data) {
  try {
    const jsonString = JSON.stringify(data);
    localStorage.setItem(STORAGE_KEY, jsonString);
  } catch (error) {
    console.error("Failed to save data:", error);
  }
}

export function load() {
  try {
    const jsonString = localStorage.getItem(STORAGE_KEY);
    if (!jsonString) {
      return [];
    }
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Failed to load data:", error);
    return [];
  }
}

export function clear() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear data:", error);
  }
}

export function loadSettings() {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error("Failed to load settings:", error);
    return null;
  }
}

export function saveSettings(settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error("Failed to save settings:", error);
  }
}

export function clearAll() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(SETTINGS_KEY);
  } catch (error) {
    console.error("Failed to clear all data:", error);
  }
}
