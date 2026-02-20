# PESAANI — Student Finance Tracker

> A lightweight, accessible personal finance tracker built for students, using vanilla HTML, CSS, and JavaScript.

**Author:** Raphael Mumo
**GitHub:** [raphaelmstudios](https://github.com/raphaelmstudios)
**Email:** r.musau@alustudent.com
**Live Demo:** [https://raphaelmstudios.github.io/student-finance-tracker/](https://raphaelmstudios.github.io/student-finance-tracker/)

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Data Model](#data-model)
- [Validation Rules & Regex Catalog](#validation-rules--regex-catalog)
- [Keyboard Navigation Map](#keyboard-navigation-map)
- [Accessibility](#accessibility)
- [Testing](#testing)
- [Getting Started](#getting-started)
- [Limitations](#limitations)

---

## Overview

**PESAANI** (Swahili for "in the wallet") is a browser-based student finance tracker that helps users log, search, sort, and analyse their daily spending. It stores data locally in the browser using `localStorage` — no server, no signup, no dependencies.

The project is structured around ES Modules with a clear separation of concerns across five focused JavaScript files.

---

## Features

- **Add, edit, and delete** expense transactions
- **Search** transactions using regex patterns with optional case sensitivity
- **Sort** records by date, description, or amount
- **Dashboard** with live stats: total transactions, total spending, top category, and last 7 days
- **7-day bar chart** with hover tooltips showing daily spending
- **Budget cap** — set a monthly spending limit with visual alerts when exceeded
- **Currency conversion** — configurable RWF → USD and GBP exchange rates
- **Export** transactions as JSON
- **Import** transactions from a JSON file
- **Responsive design** — mobile drawer navigation, tablet and desktop layouts
- **Accessible** — ARIA roles, live regions, skip links, keyboard navigation, screen reader support
- All data stored in **localStorage** — works offline, no backend required

---

## Project Structure

```
/
├── index.html              # Main app shell — all 5 sections
├── tests.html              # Browser-based automated test suite
├── seed.json               # 20 sample transactions for testing
├── README.md
├── .gitignore
│
├── scripts/
│   ├── ui.js               # Main controller — DOM, events, rendering
│   ├── validators.js       # Regex-based form validation
│   ├── search.js           # Regex search and highlight logic
│   ├── state.js            # In-memory state management
│   └── storage.js          # localStorage read/write helpers
│
├── styles/
│   └── main.css            # All styles — layout, components, responsive
│
└── assets/
    └── images/
        ├── 4.png           # Header logo
        ├── 5.png           # Favicon
        └── hero.png        # About page hero image
```

### Module Responsibilities

| File            | Responsibility                                                                                                                              |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `ui.js`         | Initialises the app, handles all DOM interactions, renders the table and chart, manages navigation and form state                           |
| `validators.js` | Exports `validateDescription`, `validateAmount`, `validateDate`, `validateCategory`, `validateForm`, `cleanDescription`, and `compileRegex` |
| `search.js`     | Exports `compileRegex`, `highlight`, and `searchTransactions` for live regex search with HTML highlighting                                  |
| `state.js`      | Holds transactions, exchange rates, and budget cap in memory; syncs to `storage.js` on every change                                         |
| `storage.js`    | Wraps `localStorage` with safe `save`, `load`, `clear`, `saveSettings`, `loadSettings`, and `clearAll` functions                            |

---

## How It Works

The app is a single-page application with five sections controlled by JavaScript — only one section is visible at a time:

| Section          | Description                                                  |
| ---------------- | ------------------------------------------------------------ |
| **About**        | Project info, hero image, and developer contact              |
| **Dashboard**    | Stat cards, 7-day spending chart, and budget cap controls    |
| **Records**      | Searchable, sortable transaction table with edit and delete  |
| **Transactions** | Add or edit a transaction via a validated form               |
| **Settings**     | Configure exchange rates, export/import JSON, clear all data |

Navigation is handled entirely in JavaScript via `showSection()`. On mobile, a hamburger drawer slides in from the right with a backdrop overlay.

Data flows in one direction: the form writes to `state.js` → `state.js` persists via `storage.js` → `ui.js` reads state to re-render the table, chart, and stats.

---

## Data Model

Transactions are stored as a flat JSON array in `localStorage` under the key `pesaani:transactions`.

### Transaction Object

```json
{
  "id": "txn_1700000001",
  "description": "Cafeteria lunch",
  "amount": 3500,
  "category": "Food",
  "date": "2026-02-01",
  "createdAt": "2026-02-01T12:00:00.000Z",
  "updatedAt": "2026-02-01T12:00:00.000Z"
}
```

### Field Reference

| Field         | Type   | Notes                                                                  |
| ------------- | ------ | ---------------------------------------------------------------------- |
| `id`          | String | Generated as `txn_` + `Date.now()`                                     |
| `description` | String | User-entered, cleaned of extra whitespace                              |
| `amount`      | Number | Stored in RWF (Rwandan Francs)                                         |
| `category`    | String | One of: `Food`, `Books`, `Transport`, `Entertainment`, `Fees`, `Other` |
| `date`        | String | Format: `YYYY-MM-DD`                                                   |
| `createdAt`   | String | ISO 8601 timestamp                                                     |
| `updatedAt`   | String | ISO 8601 timestamp, updated on edit                                    |

### Settings Object

Stored separately under `pesaani:settings`:

```json
{
  "rates": { "usd": 0.000685, "gbp": 0.000504 },
  "budgetCap": 500000
}
```

---

## Validation Rules & Regex Catalog

All form input is validated in `validators.js` before any data is saved. The `compileRegex()` function wraps `new RegExp()` in a try/catch so invalid patterns fail gracefully.

| Field                                        | Pattern                                    | Description                                                                                 |
| -------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------- |
| Description — no leading/trailing spaces     | `^\S(?:.*\S)?$`                            | Rejects values that start or end with whitespace                                            |
| Description — no consecutive spaces          | `\s{2,}`                                   | Rejects two or more whitespace characters in a row                                          |
| Description — no duplicate adjacent words ⭐ | `\b(\w+)\s+\1\b` (back-reference)          | Advanced: catches repeated words like "the the"                                             |
| Amount — positive, max 2 decimals            | `^(0\|[1-9]\d*)(\.\d{1,2})?$`              | Accepts `5000` or `5000.50`, rejects negatives and extra decimals                           |
| Date — ISO 8601 format                       | `^\d{4}-\d{2}-\d{2}$`                      | Enforces `YYYY-MM-DD` format, followed by a real calendar date check                        |
| Category — letters, spaces, hyphens only     | `^[A-Za-z]+(?:[ -][A-Za-z]+)*$`            | Rejects numbers and special characters                                                      |
| Search — live regex                          | User-supplied pattern via `compileRegex()` | Compiled safely; matches against description and category fields with `<mark>` highlighting |

⭐ The duplicate word check uses a **regex back-reference** (`\1`) — an advanced pattern that references the first capture group to detect repeated adjacent words.

---

## Keyboard Navigation Map

The app is fully operable using a keyboard alone.

| Key                          | Action                                                                 |
| ---------------------------- | ---------------------------------------------------------------------- |
| `Tab`                        | Move focus forward through interactive elements                        |
| `Shift + Tab`                | Move focus backward                                                    |
| `Enter` / `Space`            | Activate focused button or link                                        |
| `Tab` on page load           | Reveals the skip link — press `Enter` to jump to main content          |
| `Escape`                     | Closes the mobile navigation drawer                                    |
| `Tab` into nav links         | Navigate between About, Dashboard, Records, Transactions, Settings     |
| `Tab` into table             | Focus sort buttons (Date, Description, Amount)                         |
| `Enter` on sort button       | Toggles sort ascending/descending for that column                      |
| `Tab` to Edit/Delete buttons | Focus row action buttons in the records table                          |
| `Enter` on Edit              | Opens the form pre-filled with that transaction's data                 |
| `Enter` on Delete            | Triggers confirmation dialog                                           |
| `Tab` through form           | Moves through Description → Amount → Category → Date → Submit → Cancel |
| `Enter` on Submit            | Validates and saves the transaction                                    |
| `Enter` on Cancel            | Resets the form and returns to Records                                 |

---

## Accessibility

PESAANI was built with accessibility as a core requirement, not an afterthought.

- **Semantic HTML** — proper use of `<header>`, `<nav>`, `<main>`, `<footer>`, `<section>`, `<table>`, `<form>`, and `<button>` throughout
- **Heading hierarchy** — `<h1>` → `<h2>` → `<h3>` maintained across all sections with no skipped levels
- **ARIA roles** — `role="banner"`, `role="contentinfo"`, `role="search"`, `role="status"`, `role="list"`, `role="alert"` applied to appropriate elements
- **ARIA live regions** — `aria-live="polite"` on search results count and budget status; `aria-live="assertive"` on form error messages and budget overage alerts so screen readers announce changes immediately
- **ARIA labels** — `aria-label` on nav, chart region, table, and all icon-only buttons (Edit, Delete, sort buttons, hamburger toggle)
- **ARIA required** — `aria-required="true"` on all mandatory form fields
- **Skip link** — a visually hidden "Skip to main content" link appears on first `Tab` press, allowing keyboard users to bypass the navigation
- **Focus indicators** — all interactive elements have visible `:focus-visible` outlines using `var(--forest-light)` colour
- **Colour contrast** — forest green (`#2d4a3e`) on cream (`#faf7f2`) background passes WCAG AA contrast ratio
- **Alt text** — all images have descriptive `alt` attributes
- **Screen reader chart** — the 7-day bar chart (`aria-hidden="true"`) has a companion `<p class="sr-only">` with a human-readable text summary updated via `aria-live="polite"`
- **Form error messages** — each field has a paired `<span role="alert">` that fills with the error message on failed validation and is announced immediately by screen readers

---

## Testing

Open `tests.html` in a browser to run the automated test suite. Tests are self-contained and output pass/fail results inline in green and red.

**Tests cover:**

- `compileRegex()` handles invalid patterns gracefully (returns `null` instead of throwing)
- `validateDescription()` rejects duplicate adjacent words
- `validateAmount()` accepts valid decimals and rejects negative values
- `validateDate()` rejects non-existent calendar dates (e.g. `2026-02-30`)
- `validateCategory()` rejects values containing numbers
- `validateForm()` passes with a complete, valid data object
- `localStorage` save and load round-trip works correctly
- `localStorage` clear leaves an empty array
- All 20 records in `seed.json` conform to the full transaction schema

---

## Getting Started

No build step or install required.

1. Clone the repository:

   ```bash
   git clone https://github.com/raphaelmstudios/student-finance-tracker.git
   cd student-finance-tracker
   ```

2. Serve locally using any of the following:

   ```bash
   # VS Code — install the Live Server extension and click "Go Live"

   # Node
   npx serve .

   # Python
   python -m http.server 8000
   ```

3. Open `http://localhost:8000` (or the Live Server URL) in your browser

4. To load sample data, go to **Settings → Import JSON** and select `seed.json`

5. To run the test suite, open `tests.html` in the browser

> **Note:** The app uses ES Modules (`type="module"`). It must be served over HTTP — opening `index.html` directly as a `file://` URL will cause module import errors.

---

## Limitations

- Client-side only — no backend, no authentication
- Data is tied to the browser and device (`localStorage`)
- Not optimised for very large transaction volumes
- Currency conversion rates are manually configured — not pulled from a live API

---

## Base Currency

All amounts are stored and displayed in **RWF (Rwandan Francs)**. Exchange rates for USD and GBP can be updated in Settings and are persisted to `localStorage`.

---

_© 2025 PESAANI — Developed by Raphael Mumo_
