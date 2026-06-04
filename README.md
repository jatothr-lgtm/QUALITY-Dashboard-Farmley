# Farmley Quality Dashboard — Vercel Ready

This project is a modern, Vercel-ready dashboard for tracking plant-wise quality performance. It connects to a Google Sheets backend via Google Apps Script.

## 🚀 Setup Instructions

### 1. Google Apps Script Backend
1. Open your Google Sheet.
2. Go to `Extensions` → `Apps Script`.
3. Copy the content of `Farmley_Quality_AppsScript.gs` into the editor.
4. Click `Deploy` → `New Deployment`.
5. Select `Web App`.
   - **Execute as**: Me
   - **Who has access**: Anyone
6. Copy the **Web App URL**.

### 2. Local Configuration
1. Clone this repository to your local machine.
2. Create a `.env` file in the root directory (you can copy `.env.example`).
3. Paste your Apps Script Web App URL:
   ```env
   VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/.../exec
   ```
4. Install dependencies:
   ```bash
   npm install
   ```
5. Run locally:
   ```bash
   npm run dev
   ```

### 3. Vercel Deployment
1. Push this project to a GitHub repository.
2. Go to [Vercel](https://vercel.com) and import the repository.
3. In the **Environment Variables** section during setup, add:
   - **Key**: `VITE_APPS_SCRIPT_URL`
   - **Value**: (Your Apps Script URL)
4. Click **Deploy**.

## 📁 Project Structure
- `index.html`: Main dashboard structure.
- `style.css`: Premium design tokens and layouts.
- `main.js`: Dashboard logic and data fetching.
- `Farmley_Quality_AppsScript.gs`: Backend code for your Google Sheet.
- `vercel.json`: Vercel configuration for clean routing.
