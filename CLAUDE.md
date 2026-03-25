# Project: Personal Finance Dashboard with ML Clustering

## Overview
This is a production-grade personal finance dashboard. It ingests transaction data and uses an unsupervised machine learning model (Scikit-learn) in a Python backend to dynamically categorize spending, which is then visualized in a Next.js frontend.

## Tech Stack
* **Frontend:** Next.js (App Router), React, TypeScript, Tailwind CSS, Recharts.
* **Backend:** Python, FastAPI, Uvicorn.
* **Data Science / ML:** Pandas, Scikit-learn, NumPy.

## Strict Engineering Standards
1.  **Type Safety:** The frontend MUST use strict TypeScript. Define interfaces for all API payloads. Absolutely no `any` types.
2.  **Modularity:** Separate business logic from UI components in React. Keep FastAPI route handlers clean by moving ML logic into separate service modules.
3.  **Error Handling:** Implement robust error handling on both the frontend (try/catch, error boundaries) and backend (HTTPExceptions).
4.  **Data Processing:** The Python backend must gracefully handle null values, missing fields, and date string inconsistencies in the transaction data.

## AI Behavior & Token Conservation Rules
* **Do Not Hallucinate Dependencies:** Only use the libraries explicitly stated in this document or currently in the `package.json` / `requirements.txt`. Ask before installing new packages.
* **Write Concise Code:** Provide only the necessary code to fulfill the request. Do not rewrite entire files if only a small function needs changing.
* **Respect Context Limits:** NEVER run generic bash search commands (like `grep -r` or `find`) without explicitly excluding `node_modules`, `venv`, `.next`, and `__pycache__`. Rely on `.claudeignore`.
* **Think Before Coding:** For complex ML or architectural changes, briefly outline your mathematical approach or folder structure for approval before writing the code.