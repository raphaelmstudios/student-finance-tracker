// storage.js - Handles saving/loading data to/from localStorage

const STORAGE_KEY = "finance-tracker-data";


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
