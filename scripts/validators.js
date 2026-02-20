// validators.js - Regex validation functions

/*SAFE REGEX COMPILER*/
export function compileRegex(pattern, flags = "") {
  try {
    return new RegExp(pattern, flags);
  } catch (error) {
    console.error("Invalid regex pattern:", error);
    return null;
  }
}

/*CHECK IF DESCRIPTION IS VALID*/
export function validateDescription(value) {
  // Check if empty
  if (!value || value.trim() === "") {
    return { valid: false, error: "Please enter a description" };
  }

  // Check that text doesn't start or end with spaces
  const pattern = compileRegex("^\\S(?:.*\\S)?$");
  if (!pattern || !pattern.test(value)) {
    return {
      valid: false,
      error: "Description cannot start or end with spaces",
    };
  }

  // Check for multiple spaces in a row
  const multiSpacePattern = compileRegex("\\s{2,}");
  if (multiSpacePattern && multiSpacePattern.test(value)) {
    return {
      valid: false,
      error: "Please use only single spaces between words",
    };
  }

  // ADVANCED pattern matching with back-reference
  const duplicatePattern = compileRegex("\\b(\\w+)\\s+\\1\\b", "i");
  if (duplicatePattern && duplicatePattern.test(value)) {
    return {
      valid: false,
      error:
        'You typed the same word twice (e.g., "the the"). Please remove duplicates.',
    };
  }

  return { valid: true, error: "" };
}

/*CHECK IF AMOUNT IS VALID(positive number, max 2 decimals)*/
export function validateAmount(value) {
  if (!value || value.trim() === "") {
    return { valid: false, error: "Please enter an amount" };
  }

  const pattern = compileRegex("^(0|[1-9]\\d*)(\\.\\d{1,2})?$");
  if (!pattern || !pattern.test(value)) {
    return {
      valid: false,
      error:
        "Please enter a valid amount (e.g., 5000 or 5000.50 max 2 decimals)",
    };
  }

  return { valid: true, error: "" };
}

/*CHECK IF DATE IS VALID(YYYY-MM-DD format)*/
export function validateDate(value) {
  if (!value || value.trim() === "") {
    return { valid: false, error: "Please enter a date" };
  }

  const pattern = compileRegex("^\\d{4}-\\d{2}-\\d{2}$");
  if (!pattern || !pattern.test(value)) {
    return {
      valid: false,
      error: "Please use this date format: YYYY-MM-DD (e.g., 2025-01-15)",
    };
  }

  const [year, month, day] = value.split("-").map(Number);
  const dateObj = new Date(value);

  if (
    dateObj.getFullYear() !== year ||
    dateObj.getMonth() + 1 !== month ||
    dateObj.getDate() !== day
  ) {
    return {
      valid: false,
      error: "This date doesn't exist. Please check the date.",
    };
  }

  return { valid: true, error: "" };
}

/*CHECK IF CATEGORY IS VALID(letters, spaces, hyphens only)*/
export function validateCategory(value) {
  if (!value || value.trim() === "") {
    return { valid: false, error: "Please select a category" };
  }

  const pattern = compileRegex("^[A-Za-z]+(?:[ -][A-Za-z]+)*$");
  if (!pattern || !pattern.test(value)) {
    return {
      valid: false,
      error: "Category can only contain letters, spaces, and hyphens",
    };
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

  const descResult = validateDescription(formData.description);
  if (!descResult.valid) {
    errors.description = descResult.error;
  }

  const amountResult = validateAmount(formData.amount);
  if (!amountResult.valid) {
    errors.amount = amountResult.error;
  }

  const dateResult = validateDate(formData.date);
  if (!dateResult.valid) {
    errors.date = dateResult.error;
  }

  const categoryResult = validateCategory(formData.category);
  if (!categoryResult.valid) {
    errors.category = categoryResult.error;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}
