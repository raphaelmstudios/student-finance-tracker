# PESAANI — Student Finance Tracker

**Your Money • Your Clarity**

A responsive, accessible finance tracker built specifically for students. Track daily expenses, understand spending patterns, and build healthy financial habits without complexity or overwhelm.

**Live Demo:** https://raphaelmstudios.github.io/student-finance-tracker

**Developer:** Raphael Musau  
**GitHub:** @raphaelmstudios  
**Email:** r.musau@alustudent.com

---

## About

PESAANI derives its name from the Swahili word _pesa_, meaning "money". The application helps students understand and take control of their finances through clarity, simplicity, and accessibility.

### Why PESAANI Exists

Many students manage money informally through memory, notes, or guesswork. This often leads to poor financial awareness and difficulty budgeting effectively. PESAANI was created to address this challenge by providing:

**Clarity** — Students can see exactly where their money goes through categorized transactions and visual statistics.

**Structure** — Expenses are organized by category and date, making it easy to identify spending patterns.

**Visibility** — Dashboard statistics and a 7-day spending chart provide at-a-glance insights into financial habits.

**Simplicity** — The interface avoids complex finance jargon and overwhelming features, focusing instead on core functionality that students actually need.

The application is designed specifically for university students and young adults who want to build financial awareness early, without using complex or professional finance tools that may be unsuitable for everyday student use.

---

## Features

### Core Functionality

The application provides a complete set of features for managing personal finances:

**Transaction Management** — Users can add, edit, and delete transactions with descriptions, amounts in Rwandan Francs, categories, and dates. Each transaction is validated using regex patterns to ensure data integrity.

**Advanced Search** — A powerful regex-based search engine allows users to find transactions using pattern matching. Searches can be case-sensitive or case-insensitive, and matching text is highlighted in yellow for easy identification.

**Multi-Column Sorting** — Transactions can be sorted by date, amount, or description in ascending or descending order. Visual arrows indicate the current sort state.

**Dashboard Statistics** — The dashboard displays four key metrics: total number of transactions, total spending, top spending category, and spending in the last 7 days. These update automatically as transactions are added or removed.

**7-Day Spending Chart** — An animated bar chart visualizes daily spending over the past week. Hovering over bars reveals exact amounts, and today's bar is highlighted in a distinct color.

**Budget Cap System** — Users can set a monthly spending limit and receive real-time status updates. When under budget, a green message shows remaining funds. When over budget, a red pulsing alert displays the overage amount.

**Data Portability** — Transactions can be exported as JSON files for backup purposes. Previously exported data can be imported back, replacing the current dataset. This enables data migration between devices or restoration after data loss.

**Persistent Storage** — All transactions, settings, and budget caps are saved to browser localStorage, ensuring data survives page refreshes and browser restarts.

---

## Project Structure

```
student-finance-tracker/
├── index.html              # Main application interface
├── tests.html              # Automated test suite
├── seed.json               # Sample transaction data (12 records)
├── README.md               # This documentation file
│
├── assets/
│   └── Untitled design/    # Logo and branding assets
│       ├── 4.png           # Header logo (SVG recommended)
│       └── 5.png           # Favicon
│
├── scripts/                # JavaScript modules (ES6)
│   ├── ui.js               # Main controller (navigation, rendering, events)
│   ├── state.js            # In-memory state management
│   ├── storage.js          # localStorage abstraction layer
│   ├── validators.js       # Regex validation functions
│   └── search.js           # Regex compilation and highlighting
│
└── styles/
    └── main.css            # Complete design system (approximately 1000 lines)
```

### Module Architecture

The application follows a modular architecture with clear separation of concerns. Each module has a single responsibility and exports only the functions necessary for other modules to consume.

**storage.js** — Provides an abstraction layer over the localStorage API. This module handles all serialization and deserialization of JSON data. Functions include save (store transactions array), load (retrieve transactions array), clear (remove transactions), clearAll (remove transactions and settings), loadSettings (retrieve settings object), and saveSettings (store settings object). Error handling is implemented for quota exceeded errors and JSON parse failures.

**state.js** — Manages in-memory application state. This module maintains the current transactions array, exchange rates, and budget cap. It provides functions to initialize state from localStorage, retrieve transactions, add new transactions, update existing transactions, delete transactions, and manage settings. The module ensures data consistency by always saving to storage after state mutations.

**validators.js** — Encapsulates all validation logic using regex patterns. Each validation function takes a value and returns an object with valid (boolean) and error (string) properties. Functions include validateDescription (no leading/trailing spaces, no duplicate words), validateAmount (positive numbers with max 2 decimals), validateDate (YYYY-MM-DD format with calendar validation), validateCategory (letters, spaces, hyphens only), validateForm (validates all fields at once), and cleanDescription (removes extra whitespace).

**search.js** — Handles regex compilation and text highlighting. The compileRegex function safely creates RegExp objects from user input, catching syntax errors and returning null for invalid patterns. The highlight function wraps matching text in mark elements for visual highlighting, with HTML escaping to prevent XSS attacks. The searchTransactions function filters an array of transactions based on a regex pattern applied to descriptions and categories.

**ui.js** — Serves as the main controller and entry point. This module contains no exports and instead coordinates all other modules. It handles DOM manipulation, event listeners, section navigation, table rendering, form submission, search functionality, sorting, statistics calculation, chart rendering, and settings management. The module is approximately 700 lines and represents the majority of the application's interactive behavior.

---

## Regex Validation Catalog

PESAANI implements five regex patterns to ensure data integrity. These patterns range from basic format validation to advanced techniques like back-references.

### Pattern 1: Description Validation

**Regex:** `/^\S(?:.*\S)?$/`

**Purpose:** Ensures transaction descriptions do not begin or end with whitespace characters.

**How it works:**

- `^` asserts the start of the string
- `\S` matches any non-whitespace character (required first character)
- `(?:.*\S)?` is an optional non-capturing group that matches any characters (.\*) ending with a non-whitespace character (\S)
- `$` asserts the end of the string

**Valid examples:**

- "Coffee at Starbucks" — standard text with spaces
- "Lunch" — single word with no spaces
- "Bus pass for November" — multiple words with spaces

**Invalid examples:**

- " Coffee" — rejected due to leading space
- "Coffee " — rejected due to trailing space
- " " — rejected because it contains only whitespace

This pattern ensures clean data entry and prevents accidental whitespace that could cause duplicate entries or sorting issues.

### Pattern 2: Multiple Spaces Detection

**Regex:** `/\s{2,}/`

**Purpose:** Detects two or more consecutive whitespace characters within descriptions.

**How it works:**

- `\s` matches any whitespace character (space, tab, newline)
- `{2,}` quantifier matches two or more occurrences

**Valid examples:**

- "Coffee at Starbucks" — single spaces between words
- "Lunch break" — single space between words

**Invalid examples:**

- "Coffee at Starbucks" — contains double spaces
- "Lunch break" — contains triple space

This validation prevents formatting inconsistencies that could make the transaction list appear untidy or unprofessional.

### Pattern 3: Duplicate Word Detection (ADVANCED)

**Regex:** `/\b(\w+)\s+\1\b/i`

**Purpose:** Identifies accidentally repeated words within descriptions. This is the most advanced pattern in the application.

**How it works:**

- `\b` asserts a word boundary (transition between word and non-word character)
- `(\w+)` is a capturing group that matches one or more word characters and stores the match
- `\s+` matches one or more whitespace characters
- `\1` is a back-reference that matches the exact text captured by group 1
- `\b` asserts another word boundary
- `i` flag makes the match case-insensitive

**Valid examples:**

- "Coffee at Starbucks" — no repeated words
- "Lunch break today" — all unique words

**Invalid examples:**

- "Coffee coffee" — "coffee" appears twice consecutively
- "The the book" — "the" appears twice consecutively
- "Lunch lunch break" — "lunch" appears twice consecutively

**Why this is advanced:** Back-references are a powerful regex feature that allow patterns to reference previously captured groups. This enables validation that would be impossible with simple character matching. The pattern dynamically adapts to match any repeated word, not just a predefined list.

This validation catches common typing errors where users accidentally type the same word twice, improving data quality without being overly restrictive.

### Pattern 4: Amount Validation

**Regex:** `/^(0|[1-9]\d*)(\.\d{1,2})?$/`

**Purpose:** Ensures amounts are valid positive numbers with optional decimal places.

**How it works:**

- `^` asserts the start of the string
- `(0|[1-9]\d*)` matches either "0" or a number starting with 1-9 followed by any digits (prevents leading zeros)
- `(\.\d{1,2})?` is an optional group matching a decimal point followed by 1-2 digits
- `$` asserts the end of the string

**Valid examples:**

- "0" — zero is allowed
- "5000" — whole number
- "5000.5" — one decimal place
- "5000.50" — two decimal places

**Invalid examples:**

- "-100" — negative numbers rejected
- "01" — leading zero rejected
- "5000.123" — more than 2 decimal places rejected
- "abc" — non-numeric input rejected

This pattern ensures financial amounts are properly formatted and prevents negative values, which would not make sense in an expense tracker context.

### Pattern 5: Date Validation (YYYY-MM-DD)

**Regex:** `/^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/`

**Purpose:** Validates dates in YYYY-MM-DD format with basic calendar awareness.

**How it works:**

- `^\d{4}` matches exactly four digits for the year
- `(0[1-9]|1[0-2])` matches months 01-12 (0 followed by 1-9, or 1 followed by 0-2)
- `(0[1-9]|[12]\d|3[01])` matches days 01-31 (0 followed by 1-9, 1 or 2 followed by any digit, or 3 followed by 0-1)
- `$` asserts the end of the string

### Pattern 6: Category Validation

**Regex:** `/^[A-Za-z]+(?:[ -][A-Za-z]+)*$/`

**Purpose:** Ensures category names contain only letters, spaces, and hyphens.

**How it works:**

- `^[A-Za-z]+` matches one or more letters at the start
- `(?:[ -][A-Za-z]+)*` is a non-capturing group that matches zero or more occurrences of (space or hyphen followed by one or more letters)
- `$` asserts the end of the string

**Valid examples:**

- "Food" — single word
- "Self Help" — two words with space
- "Self-Help" — two words with hyphen

**Invalid examples:**

- "Food123" — contains numbers
- "Food " — trailing space
- "-Food" — starts with hyphen
- "Food-" — ends with hyphen

This pattern ensures category names remain clean and professional while allowing multi-word categories like "Self Help" or "Study Materials".

---

## Installation and Usage

### Option 1: Live Demo

The application is deployed and accessible at:
https://raphaelmstudios.github.io/student-finance-tracker

No installation is required. Simply visit the URL in any modern web browser.

### Option 2: Run Locally

Running the application locally requires a web server due to CORS restrictions on ES Modules.

**Step 1: Clone the repository**

```bash
git clone https://github.com/raphaelmstudios/student-finance-tracker.git
cd student-finance-tracker
```

**Step 2: Start a local web server**

Using Python 3:

```bash
python -m http.server 8000
```

Using Node.js http-server:

```bash
npx http-server -p 8000
```

Using PHP:

```bash
php -S localhost:8000
```

Using VS Code Live Server extension:
Right-click index.html and select "Open with Live Server"

**Step 3: Open in browser**
Navigate to: http://localhost:8000

### Option 3: Import Sample Data

To quickly populate the application with sample transactions:

1. Navigate to the Settings section using the navigation menu
2. Click the "Import JSON" button in the Data Management section
3. Select the included seed.json file from the file picker dialog
4. Confirm the import operation in the confirmation dialog (this will replace current data)
5. Navigate to the Records section to view the 12 imported sample transactions

The sample data includes diverse transaction types across all categories, providing a realistic dataset for testing search, sorting, and statistics features.

---

### Known Limitations

**Internet Explorer** — Not supported. The application uses ES6 syntax and modern CSS features that are not available in IE11 or earlier.

**Very Old Mobile Devices** — Devices running iOS 15 or earlier or Android 9 or earlier may experience degraded performance or missing features.

**JavaScript Disabled** — The application requires JavaScript to function. Users with JavaScript disabled will see no content beyond the HTML structure.

**Third-Party Cookies Disabled** — Does not affect functionality since the application uses localStorage, not cookies.

---

## Running Tests

The application includes an automated test suite to verify core functionality. Tests cover validation logic, storage operations, and data integrity.

### How to Run Tests

1. Open tests.html in a web browser: http://localhost:8000/tests.html
2. The tests execute automatically when the page loads
3. Results appear as a bulleted list with green (pass) or red (fail) indicators

### Test Coverage

The test suite validates the following functionality:

**Safe Regex Compilation** — Verifies that the compileRegex function handles invalid patterns gracefully by returning null instead of throwing errors. Tests the pattern "(" which is syntactically invalid.

**Description Validation** — Tests the duplicate word detection regex by confirming that "coffee coffee" is rejected as invalid.

**Amount Validation** — Confirms that valid decimal amounts like "5000.50" are accepted and negative values like "-100" are rejected.

**Date Validation** — Verifies that impossible calendar dates like "2026-02-30" are rejected even though they match the regex pattern.

**Category Validation** — Tests that categories containing numbers like "Food123" are properly rejected.

**Form Validation** — Confirms that the validateForm function correctly accepts valid data containing all required fields with correct values.

**localStorage Save/Load** — Tests that data can be saved to localStorage and retrieved correctly. Verifies that saved data maintains its structure and values.

**localStorage Clear** — Confirms that the clear function successfully removes all stored data, resulting in an empty array when load is called.

**JSON Schema Validation** — Fetches seed.json and validates that every record contains all required fields with correct data types. This ensures the sample data file is properly structured.

### Expected Results

When all tests pass, the results list will display nine green items. If any test fails, it will appear in red with a descriptive name indicating which functionality failed.

Common reasons for test failures include:

- Missing dependencies (validators.js, search.js, or storage.js not found)
- Module import errors (incorrect file paths)
- Changes to validation logic that break expected behavior
- Corrupted or invalid seed.json file
- Browser blocking localStorage access (private browsing mode)

---

## Author

**Raphael Musau**

GitHub: github.com/raphaelmstudios  
Email: r.musau@alustudent.com

This project was developed as part of the Responsive UI coursework at African Leadership University, demonstrating proficiency in vanilla web technologies, accessible design, and modular JavaScript architecture.

---

**Built for students, by a student.**
