// validators.js - Regex validation functions

/*CHECK IF DESCRIPTION IS VALID*/
export function validateDescription(value) {
  // Check if empty
  if (!value || value.trim() === "") {
    return { valid: false, error: "Please enter a description" };
  }

  // Check that text doesn't start or end with spaces
  const pattern = /^\S(?:.*\S)?$/;
  if (!pattern.test(value)) {
    return { valid: false, error: "Description cannot start or end with spaces" };
  }

  // Check for multiple spaces in a row
  if (/\s{2,}/.test(value)) {
    return { valid: false, error: "Please use only single spaces between words" };
  }

  // Check if same word appears twice in a row (ADVANCED pattern matching with back-reference)
  const duplicatePattern = /\b(\w+)\s+\1\b/i;
  if (duplicatePattern.test(value)) {
    return {
      valid: false,
      error: 'You typed the same word twice (e.g., "the the"). Please remove duplicates.',
    };
  }

  return { valid: true, error: "" };
}

/*CHECK IF AMOUNT IS VALID(positive number, max 2 decimals)*/
export function validateAmount(value) {
  // Check if empty
  if (!value || value.trim() === "") {
    return { valid: false, error: "Please enter an amount" };
  }

  // Check that it's a valid number format (no negatives, max 2 decimals)
  const pattern = /^(0|[1-9]\d*)(\.\d{1,2})?$/;
  if (!pattern.test(value)) {
    return {
      valid: false,
      error: "Please enter a valid amount (e.g., 5000 or 5000.50 max 2 decimals)",
    };
  }

  return { valid: true, error: "" };
}

/*CHECK IF DATE IS VALID(YYYY-MM-DD format)*/
export function validateDate(value) {
  // Check if empty
  if (!value || value.trim() === "") {
    return { valid: false, error: "Please enter a date" };
  }

  // Check that it follows the correct date format with valid months (01-12) and days (01-31)
  const pattern = /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;
  if (!pattern.test(value)) {
    return {
      valid: false,
      error: "Please use this date format: YYYY-MM-DD (e.g., 2025-01-15)",
    };
  }

  // Double-check that it's actually a real date (e.g., Feb 30 doesn't exist)
  const dateObj = new Date(value);
  if (isNaN(dateObj.getTime())) {
    return { valid: false, error: "This date doesn't exist. Please check the date." };
  }

  return { valid: true, error: "" };
}

/*CHECK IF CATEGORY IS VALID(letters, spaces, hyphens only)*/
export function validateCategory(value) {
  // Check if empty
  if (!value || value.trim() === "") {
    return { valid: false, error: "Please select a category" };
  }

  // Check that it only has letters, spaces, and hyphens (no numbers or special characters)
  const pattern = /^[A-Za-z]+(?:[ -][A-Za-z]+)*$/;
  if (!pattern.test(value)) {
    return { valid: false, error: "Category can only contain letters, spaces, and hyphens" };
  }

  return { valid: true, error: "" };
}

/*Clean up a description by removing extra spaces*/
export function cleanDescription(value) {
  return value.trim().replace(/\s+/g, " ");
}

/*CHECK IF FORM DATA IS VALID*/
export function validateForm(formData) {
  const errors = {};

/*Check Description*/
  const descResult = validateDescription(formData.description);
  if (!descResult.valid) {
    errors.description = descResult.error;
  }

/*Check Amount*/
  const amountResult = validateAmount(formData.amount);
  if (!amountResult.valid) {
    errors.amount = amountResult.error;
  }

/*Check Date*/  
  const dateResult = validateDate(formData.date);
  if (!dateResult.valid) {
    errors.date = dateResult.error;
  }

/*Check Category*/  
  const categoryResult = validateCategory(formData.category);
  if (!categoryResult.valid) {
    errors.category = categoryResult.error;
  }

/*Return whether everything is valid and any errors*/
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
