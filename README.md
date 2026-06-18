# 📊 Havells India Ltd — Sales Forecasting Hub

An interactive financial dashboard and machine learning modeling workspace built to visualize and forecast the quarterly and annual sales of **Havells India Ltd (NSE: HAVELLS)**.

## 🔗 Live Demo
If running locally, open the dashboard in your browser:
👉 **[http://localhost:8000](http://localhost:8000)** (when served locally) or open `index.html` directly.

---

## 🚀 Key Features

### 1. Dynamic KPI & Overview Dashboard
- Metric cards showing **10-Year CAGR (15.6%)**, **total growth expansion (267.5%)**, and **average YoY growth (16.2%)**.
- Interactive annual sales trend visualization with toggles for sales figures (₹ Cr) and YoY growth rates (%).
- Quarterly seasonality chart showing recent 10-quarter sales patterns.

### 2. Model Analytics & Feature Leakage Diagnostic
- Comparison of machine learning models (Facebook Prophet, XGBoost, Random Forest, and Linear Regression) by **MAPE (%)** and **RMSE (₹ Cr)**.
- Detailed walk-through explaining how target data leakage in feature engineering (rolling average including current sales) created a perfect model in validation (0.00% error), and how we corrected it.

### 3. Forecast Projections (2018–2025 vs Predicted 2026–2028)
- Plots actual historical sales alongside retrained, leak-free predictions.
- Toggle between **Meta's Prophet model** (providing an 80% confidence interval band) and **Linear Regression** (modeling the absolute historical slope).

### 4. What-If Sandbox Simulator
- Interactive parameter sliders to simulate custom annual growth rates (from -10% to +40%) and custom base sales.
- Instantly recalculates future projection curves and displays the net additions in sales.

---

## 📁 Repository Structure
- `index.html` — Layout page with sidebar navigation, grids, and documentation.
- `index.css` — Custom stylesheet specifying glassmorphism, transitions, layout grids, and light/dark theme variables.
- `app.js` — Client-side controller script configuring Chart.js charts, active tab routing, and running What-If math.
- `Havells_Sales_Forecasting.ipynb` — The original Jupyter Notebook containing the data exploration, model training, and metrics evaluations.

---

## 🔧 Running Locally
You don't need any complex frameworks to run this dashboard. It is built entirely on standard HTML5, Vanilla CSS, and JavaScript.

### Option A: Double-Click (Easiest)
Simply double-click the `index.html` file in your file explorer to open it in any modern web browser.

### Option B: Local HTTP Server (Python)
To run it on a local server, open your terminal inside the project directory and run:
```bash
python -m http.server 8000
```
Then, open your browser and navigate to: **[http://localhost:8000](http://localhost:8000)**
