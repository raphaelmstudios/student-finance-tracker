# Pesaani

> A modular financial data validation system built with vanilla HTML, CSS, and JavaScript.

**Author:** Raphael Mumo

---

## Abstract

**Pesaani** is a modular financial data validation system implemented using modern JavaScript (ES Modules). The project enforces structural, syntactic, and logical integrity of financial records stored in JSON format prior to application-level processing.

Designed with a strong emphasis on modularity, correctness, and testability, Pesaani ensures that imported financial data fully complies with predefined validation constraints — without reliance on any external libraries or frameworks.

---

## Project Structure

```
/project-root
│
├── index.html
├── tests.html
├── validators.js
├── seed.json
└── README.md
```

### Module Overview

| File | Responsibility |
|------|---------------|
| `validators.js` | Encapsulates all validation logic via exported functions |
| `seed.json` | Structured test dataset used across validation scenarios |
| `tests.html` | Browser-based test harness aligned to validation rubric |
| `index.html` | Optional primary execution environment |

All modules are loaded using ES Module syntax (`type="module"`), ensuring scoped imports and explicit, auditable exports.

---

## Technology Stack

Built entirely with **vanilla web technologies** — no frameworks, no dependencies:

- **HTML** — Structure and test harness interface
- **CSS** — Presentation and layout
- **JavaScript (ES Modules)** — Validation logic and module architecture

---

## Data Model Specification

### Root Structure

```json
{
  "accounts": [],
  "transactions": []
}
```

Both root-level keys are mandatory. Absence of either key constitutes a structural validation failure.

---

### Account Schema

| Field | Type | Constraint |
|-------|------|------------|
| `id` | String | Required, must be unique |
| `name` | String | Required |
| `balance` | Number | Required, must be ≥ 0 |

---

### Transaction Schema

| Field | Type | Constraint |
|-------|------|------------|
| `id` | String | Required, must be unique |
| `accountId` | String | Must reference an existing account |
| `amount` | Number | Required, must be > 0 |
| `type` | String | Enumerated: `"credit"` or `"debit"` |
| `date` | String | Must conform to ISO 8601 format |

---

## Validation Strategy

Pesaani applies a layered, defence-in-depth validation pipeline:

### 1. Structural Validation
Confirms that required root keys exist, that arrays are correctly formed, and that all mandatory object fields are present before any deeper validation occurs.

### 2. Type Validation
Enforces primitive type correctness across all fields, rejecting `null`, `undefined`, or incorrectly typed values that would otherwise pass surface-level checks.

### 3. Regex-Based Validation
Implemented via the exported `compileRegex()` function, this layer validates account IDs, transaction IDs, ISO 8601 date strings, and enumerated transaction type values against defined patterns.

### 4. Referential Integrity Validation
Every transaction is verified to reference a valid, existing `accountId`. Orphaned transaction records — those pointing to non-existent accounts — are detected and rejected at this stage.

### 5. Defensive Validation
Guards against malformed JSON structures, partial imports, and corrupted data records. Invalid test cases are identified explicitly rather than silently passed or ignored.

---

## Testing Approach

The `tests.html` file provides a self-contained, browser-based test environment covering:

- Module import verification
- Function export accessibility checks
- Valid data acceptance tests
- Invalid data rejection tests
- Schema enforcement across all fields

Both valid and intentionally invalid JSON samples are used in tandem to confirm the robustness of each validation layer.

---

## Design Principles

Pesaani was designed with the following principles in mind:

- **Modularity** — Clear separation between data, validation logic, and presentation
- **Readability** — Self-documenting validation rules with minimal abstraction overhead
- **Correctness** — Validation fails loudly and explicitly on malformed input
- **Portability** — Runs entirely in the browser with zero external dependencies

---

## Limitations

- Client-side validation only — no server-side processing
- No persistence or database layer
- No authentication or authorisation mechanisms
- Not optimised for large-scale or streaming datasets

---

## Conclusion

Pesaani demonstrates disciplined schema validation through modern JavaScript module architecture. By combining structural, type-level, regex-based, and referential integrity checks, the system provides a robust, layered approach to financial data validation — built entirely from first principles using vanilla web technologies.

---

*Developed by Raphael Mumo*
