// search.js - Handles searching with regex patterns and highlighting matches
/*Safely create a regex pattern from user input
 *If the pattern is invalid, returns null instead of crashing*/

export function compileRegex(input, flags = 'i') {
  // If nothing was typed, return null
  if (!input || input.trim() === '') {
    return null;
  }

  try {
    // Try to create the regex pattern
    return new RegExp(input, flags);
  } catch (error) {
    // If the pattern is invalid (e.g., unclosed bracket), return null
    console.warn('Invalid regex pattern:', input, error);
    return null;
  }
}

/*Highlight all matches in text by wrapping them in <mark> tags*/
export function highlight(text, regex) {
  // If no regex or no text, return the original text unchanged
  if (!regex || !text) {
    return text;
  }

  // Replace all matches with <mark>match</mark>

  const globalRegex = new RegExp(regex.source, regex.flags + 'g');
  
  return text.replace(globalRegex, match => `<mark>${match}</mark>`);
}

/*Search through transactions and return matches*/
export function searchTransactions(transactions, searchInput, caseSensitive = false) {
  // If no search input, return all transactions
  if (!searchInput || searchInput.trim() === '') {
    return transactions;
  }

  // Create the regex pattern
  const flags = caseSensitive ? '' : 'i';
  const regex = compileRegex(searchInput, flags);

  // If regex is invalid, return all transactions
  if (!regex) {
    return transactions;
  }

  // Filter transactions that match the pattern in description or category
  return transactions.filter(transaction => {
    const descMatch = regex.test(transaction.description);
    const categoryMatch = regex.test(transaction.category);
    return descMatch || categoryMatch;
  });
}