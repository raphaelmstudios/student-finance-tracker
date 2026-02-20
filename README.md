# PESAANI — Student Finance Tracker

> A lightweight, accessible personal finance tracker built for students, using vanilla HTML, CSS, and JavaScript.

**Author:** Raphael Mumo  
**GitHub:** [raphaelmstudios](https://github.com/raphaelmstudios)  
**Email:** r.musau@alustudent.com

---

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Project Structure](#project-structure)
- [How It Works](#how-it-works)
- [Data Model](#data-model)
- [Validation Rules](#validation-rules)
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
│
├── scripts/
│   ├── ui.js               # Main controller — DOM, events, rendering
│   ├── validators.js       # Regex-based form validation
│   ├── search.js           # Regex search and highlight logic
│   ├── state.js            # In-memory state management
│   └── storage.js          # localStorage read/write helpers
│
└── styles/
    └── main.css            # All styles — layout, components, responsive
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
| **About**        | Project info and developer contact                           |
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

## Validation Rules

All form input is validated in `validators.js` before any data is saved.

| Field         | Rule                                                                                                                 |
| ------------- | -------------------------------------------------------------------------------------------------------------------- |
| `description` | Cannot be empty, cannot start/end with spaces, no consecutive spaces, no duplicate adjacent words (e.g. `"the the"`) |
| `amount`      | Must be a positive number, max 2 decimal places (e.g. `5000` or `5000.50`)                                           |
| `date`        | Must match `YYYY-MM-DD` and represent a real calendar date                                                           |
| `category`    | Must be selected from the predefined list; letters, spaces, and hyphens only                                         |

The `compileRegex()` function in both `validators.js` and `search.js` wraps `new RegExp()` in a try/catch so invalid patterns fail gracefully rather than throwing.

---

## Testing

Open `tests.html` in a browser to run the automated test suite. Tests are self-contained and output pass/fail results inline.

**Tests cover:**

- `compileRegex()` handles invalid patterns gracefully
- `validateDescription()` rejects duplicate words
- `validateAmount()` accepts valid decimals and rejects negatives
- `validateDate()` rejects non-existent calendar dates (e.g. `2026-02-30`)
- `validateCategory()` rejects values containing numbers
- `validateForm()` passes with a complete, valid data object
- `localStorage` save and load round-trip
- `localStorage` clear leaves an empty array
- All 20 records in `seed.json` conform to the transaction schema

---

## Getting Started

No build step or install required.

1. Clone or download the repository
2. Open `index.html` in any modern browser
3. To load sample data, go to **Settings → Import JSON** and select `seed.json`
4. To run tests, open `tests.html` in the browser

> The app uses ES Modules (`type="module"`), so it must be served over HTTP rather than opened as a `file://` URL. Use a local server such as VS Code Live Server, `npx serve`, or `python -m http.server`.

---

## Limitations

- Client-side only — no backend, no authentication
- Data is tied to the browser and device (`localStorage`)
- Not optimised for very large transaction volumes
- Currency conversion rates are manually configured — not live

---

## Base Currency

All amounts are stored and displayed in **RWF (Rwandan Francs)**. Exchange rates for USD and GBP can be updated in Settings and are saved to `localStorage`.

---

_© 2025 PESAANI — Developed by Raphael Mumo_
