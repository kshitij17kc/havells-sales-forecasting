// =================================================-----------------------------
// Havells Sales Forecasting Dashboard Logic
// =================================================-----------------------------

// 1. DATASETS
const ANNUAL_DATA = [
    { Date: '2017-03-31', Sales_Cr: 6130.16, FY: 2017, YoY_Growth: null },
    { Date: '2018-03-31', Sales_Cr: 8116.21, FY: 2018, YoY_Growth: 32.40 },
    { Date: '2019-03-31', Sales_Cr: 10073.43, FY: 2019, YoY_Growth: 24.11 },
    { Date: '2020-03-31', Sales_Cr: 9440.26, FY: 2020, YoY_Growth: -6.29 },
    { Date: '2021-03-31', Sales_Cr: 10457.30, FY: 2021, YoY_Growth: 10.77 },
    { Date: '2022-03-31', Sales_Cr: 13938.48, FY: 2022, YoY_Growth: 33.29 },
    { Date: '2023-03-31', Sales_Cr: 16910.73, FY: 2023, YoY_Growth: 21.32 },
    { Date: '2024-03-31', Sales_Cr: 18590.01, FY: 2024, YoY_Growth: 9.93 },
    { Date: '2025-03-31', Sales_Cr: 21778.06, FY: 2025, YoY_Growth: 17.15 },
    { Date: '2026-03-31', Sales_Cr: 22527.77, FY: 2026, YoY_Growth: 3.44 }
];

const QUARTERLY_DATA = [
    { Quarter: 'Dec 2023', Sales_Cr: 4413.86 },
    { Quarter: 'Mar 2024', Sales_Cr: 5442.02 },
    { Quarter: 'Jun 2024', Sales_Cr: 5806.21 },
    { Quarter: 'Sep 2024', Sales_Cr: 4539.31 },
    { Quarter: 'Dec 2024', Sales_Cr: 4888.98 },
    { Quarter: 'Mar 2025', Sales_Cr: 6543.56 },
    { Quarter: 'Jun 2025', Sales_Cr: 5455.35 },
    { Quarter: 'Sep 2025', Sales_Cr: 4779.33 },
    { Quarter: 'Dec 2025', Sales_Cr: 5587.89 },
    { Quarter: 'Mar 2026', Sales_Cr: 6705.20 }
];

const MODEL_RESULTS = [
    { Model: 'Linear Regression (Leaked)', MAE: 0.00, RMSE: 0.00, MAPE: 0.00, Color: '#f43f5e' },
    { Model: 'XGBoost', MAE: 3594.58, RMSE: 3614.07, MAPE: 16.20, Color: '#6366f1' },
    { Model: 'Random Forest', MAE: 4375.20, RMSE: 4391.23, MAPE: 19.73, Color: '#06b6d4' },
    { Model: 'Prophet', MAE: 10855.76, RMSE: 10907.38, MAPE: 48.94, Color: '#f59e0b' }
];

const FORECAST_3YR = {
    Years: ['2026', '2027', '2028'],
    Dates: ['2026-12-31', '2027-12-31', '2028-12-31'],
    Prophet: [17146, 18837, 21357],
    ProphetLower: [15729, 17375, 19955],
    ProphetUpper: [18512, 20119, 22624],
    LinearRegression: [24186, 26075, 27964]
};

// 2. STATE VARIABLES
let activeTab = 'tab-dashboard';
let annualChartMode = 'sales'; // 'sales' or 'growth'
let forecastChartModel = 'prophet'; // 'prophet' or 'lr'

// Chart instances
let annualSalesChart = null;
let quarterlyChart = null;
let modelMapeChart = null;
let modelRmseChart = null;
let salesForecastChart = null;
let sandboxChartInstance = null;

// Get Chart theme configurations
function getChartColors() {
    const isDark = document.body.classList.contains('theme-dark');
    return {
        grid: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
        text: isDark ? '#a1a1aa' : '#475569',
        accentPrimary: '#6366f1',
        accentSecondary: '#06b6d4',
        accentSuccess: '#10b981',
        accentDanger: '#f43f5e',
        background: isDark ? 'rgba(24, 24, 27, 0.8)' : 'rgba(255, 255, 255, 0.9)',
        border: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
    };
}

// 3. PAGE VIEW / ROUTING CONTROLLER
function setupRouting() {
    const menuItems = document.querySelectorAll('.menu-item');
    menuItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active classes
            menuItems.forEach(m => m.classList.remove('active'));
            document.querySelectorAll('.content-section').forEach(sec => sec.classList.remove('active'));
            
            // Add active class
            item.classList.add('active');
            activeTab = item.getAttribute('data-target');
            const targetSection = document.getElementById(activeTab);
            targetSection.classList.add('active');
            
            // Title updates
            const pageTitle = item.querySelector('span').innerText;
            document.getElementById('page-title').innerText = pageTitle;
            
            // Render specific tab charts to ensure animation / dimension correctness
            handleTabChange(activeTab);
        });
    });
}

function handleTabChange(tabId) {
    if (tabId === 'tab-dashboard') {
        renderAnnualSalesChart();
        renderQuarterlyChart();
    } else if (tabId === 'tab-evaluation') {
        renderModelEvaluationCharts();
    } else if (tabId === 'tab-forecast') {
        renderSalesForecastChart();
    } else if (tabId === 'tab-sandbox') {
        updateSandbox();
    }
}

// 4. CHART RENDERING MODULES

// Custom Global Defaults
Chart.defaults.font.family = "'Plus Jakarta Sans', sans-serif";
Chart.defaults.font.size = 12;

// Annual Sales Chart (Tab 1)
function renderAnnualSalesChart() {
    const ctx = document.getElementById('chart-annual-sales').getContext('2d');
    const colors = getChartColors();
    
    if (annualSalesChart) {
        annualSalesChart.destroy();
    }
    
    const labels = ANNUAL_DATA.map(d => d.FY);
    
    if (annualChartMode === 'sales') {
        const salesData = ANNUAL_DATA.map(d => d.Sales_Cr);
        const gradient = ctx.createLinearGradient(0, 0, 0, 300);
        gradient.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
        gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');

        annualSalesChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Sales (₹ Cr)',
                    data: salesData,
                    borderColor: colors.accentPrimary,
                    borderWidth: 3,
                    backgroundColor: gradient,
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: colors.accentPrimary,
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 6,
                    pointHoverRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        padding: 12,
                        cornerRadius: 10,
                        backgroundColor: colors.background,
                        titleColor: colors.accentPrimary,
                        bodyColor: colors.text,
                        borderColor: colors.border,
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                return `Sales: ₹${context.raw.toLocaleString('en-IN')} Cr`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: colors.text }
                    },
                    y: {
                        grid: { color: colors.grid },
                        ticks: { color: colors.text }
                    }
                }
            }
        });
    } else {
        const growthData = ANNUAL_DATA.map(d => d.YoY_Growth);
        const barColors = growthData.map(val => val >= 0 ? 'rgba(16, 185, 129, 0.85)' : 'rgba(244, 63, 94, 0.85)');
        
        annualSalesChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'YoY Growth (%)',
                    data: growthData,
                    backgroundColor: barColors,
                    borderRadius: 8,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        padding: 12,
                        cornerRadius: 10,
                        backgroundColor: colors.background,
                        titleColor: colors.text,
                        bodyColor: colors.text,
                        borderColor: colors.border,
                        borderWidth: 1,
                        callbacks: {
                            label: function(context) {
                                if (context.raw === null) return 'Growth: N/A';
                                return `Growth: ${context.raw.toFixed(2)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: colors.text }
                    },
                    y: {
                        grid: { color: colors.grid },
                        ticks: { color: colors.text }
                    }
                }
            }
        });
    }
}

// Quarterly Sales Chart (Tab 1)
function renderQuarterlyChart() {
    const ctx = document.getElementById('chart-quarterly').getContext('2d');
    const colors = getChartColors();
    
    if (quarterlyChart) {
        quarterlyChart.destroy();
    }
    
    const labels = QUARTERLY_DATA.map(d => d.Quarter);
    const data = QUARTERLY_DATA.map(d => d.Sales_Cr);
    
    const gradient = ctx.createLinearGradient(0, 0, 0, 300);
    gradient.addColorStop(0, 'rgba(6, 182, 212, 0.3)');
    gradient.addColorStop(1, 'rgba(6, 182, 212, 0)');

    quarterlyChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Quarterly Sales (₹ Cr)',
                data: data,
                borderColor: colors.accentSecondary,
                borderWidth: 2.5,
                backgroundColor: gradient,
                fill: true,
                tension: 0.2,
                pointBackgroundColor: colors.accentSecondary,
                pointBorderColor: '#ffffff',
                pointBorderWidth: 1.5,
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    padding: 12,
                    cornerRadius: 10,
                    backgroundColor: colors.background,
                    titleColor: colors.accentSecondary,
                    bodyColor: colors.text,
                    borderColor: colors.border,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `Quarterly Sales: ₹${context.raw.toLocaleString('en-IN')} Cr`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: colors.text }
                },
                y: {
                    grid: { color: colors.grid },
                    ticks: { color: colors.text }
                }
            }
        }
    });
}

// Model Evaluation Charts (Tab 2)
function renderModelEvaluationCharts() {
    const colors = getChartColors();
    
    // Sort models appropriately for representation
    const sortedMape = [...MODEL_RESULTS].sort((a,b) => b.MAPE - a.MAPE);
    const sortedRmse = [...MODEL_RESULTS].sort((a,b) => b.RMSE - a.RMSE);
    
    // 1. MAPE Bar Chart
    const ctxMape = document.getElementById('chart-model-mape').getContext('2d');
    if (modelMapeChart) modelMapeChart.destroy();
    
    modelMapeChart = new Chart(ctxMape, {
        type: 'bar',
        data: {
            labels: sortedMape.map(m => m.Model),
            datasets: [{
                data: sortedMape.map(m => m.MAPE),
                backgroundColor: sortedMape.map(m => m.Color),
                borderRadius: 8,
                barThickness: 32
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    padding: 12,
                    cornerRadius: 10,
                    backgroundColor: colors.background,
                    bodyColor: colors.text,
                    borderColor: colors.border,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `MAPE: ${context.raw}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: colors.grid },
                    ticks: { color: colors.text }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: colors.text }
                }
            }
        }
    });
    
    // 2. RMSE Bar Chart
    const ctxRmse = document.getElementById('chart-model-rmse').getContext('2d');
    if (modelRmseChart) modelRmseChart.destroy();
    
    modelRmseChart = new Chart(ctxRmse, {
        type: 'bar',
        data: {
            labels: sortedRmse.map(m => m.Model),
            datasets: [{
                data: sortedRmse.map(m => m.RMSE),
                backgroundColor: sortedRmse.map(m => m.Color),
                borderRadius: 8,
                barThickness: 32
            }]
        },
        options: {
            indexAxis: 'y',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    padding: 12,
                    cornerRadius: 10,
                    backgroundColor: colors.background,
                    bodyColor: colors.text,
                    borderColor: colors.border,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            return `RMSE: ₹${context.raw.toLocaleString('en-IN')} Cr`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { color: colors.grid },
                    ticks: { color: colors.text }
                },
                y: {
                    grid: { display: false },
                    ticks: { color: colors.text }
                }
            }
        }
    });
}

// 3-Year Sales Forecast Chart (Tab 3)
function renderSalesForecastChart() {
    const ctx = document.getElementById('chart-sales-forecast').getContext('2d');
    const colors = getChartColors();
    
    if (salesForecastChart) {
        salesForecastChart.destroy();
    }
    
    // Slice data to focus exactly on 2018 to 2025 (indices 1 to 8 of ANNUAL_DATA)
    const filteredActuals = ANNUAL_DATA.slice(1, 9);
    const histLabels = filteredActuals.map(d => d.FY);
    const histValues = filteredActuals.map(d => d.Sales_Cr);
    
    const futureLabels = ['2026 (Pred)', '2027 (Pred)', '2028 (Pred)'];
    const allLabels = [...histLabels, ...futureLabels];
    
    // Create the dataset array. 
    // Data padding: 8 years of actuals (2018-2025), plus 3 nulls for prediction years
    const datasets = [
        {
            label: 'Actual Sales',
            data: [...histValues, null, null, null],
            borderColor: colors.text,
            backgroundColor: colors.text,
            pointRadius: 5,
            borderWidth: 0,
            showLine: false
        }
    ];
    
    // Forecast data connects at 2025 actual (last item of histValues: indices 0-7, so index 7 has 2025 actual)
    const paddingSize = histValues.length - 1; // 7 nulls before the 2025 connection point
    
    if (forecastChartModel === 'prophet') {
        const prophetForecastValues = [
            ...Array(paddingSize).fill(null), 
            histValues[histValues.length - 1], // 2025 actual connection point
            ...FORECAST_3YR.Prophet
        ];
        
        const upperValues = [
            ...Array(paddingSize).fill(null), 
            histValues[histValues.length - 1], 
            ...FORECAST_3YR.ProphetUpper
        ];
        
        const lowerValues = [
            ...Array(paddingSize).fill(null), 
            histValues[histValues.length - 1], 
            ...FORECAST_3YR.ProphetLower
        ];

        datasets.push({
            label: 'Prophet Prediction',
            data: prophetForecastValues,
            borderColor: colors.accentPrimary,
            backgroundColor: 'rgba(99, 102, 241, 0.15)',
            borderWidth: 3,
            borderDash: [5, 5],
            fill: false,
            tension: 0.1,
            pointRadius: 6,
            pointBackgroundColor: colors.accentPrimary
        });
        
        // Upper Confidence Band
        datasets.push({
            label: 'Confidence Upper Limit',
            data: upperValues,
            borderColor: 'rgba(99, 102, 241, 0.25)',
            borderWidth: 1.5,
            fill: '+1', 
            backgroundColor: 'rgba(99, 102, 241, 0.05)',
            tension: 0.1,
            pointRadius: 0
        });
        
        // Lower Confidence Band
        datasets.push({
            label: 'Confidence Lower Limit',
            data: lowerValues,
            borderColor: 'rgba(99, 102, 241, 0.25)',
            borderWidth: 1.5,
            fill: false,
            tension: 0.1,
            pointRadius: 0
        });

    } else {
        const lrForecastValues = [
            ...Array(paddingSize).fill(null), 
            histValues[histValues.length - 1], 
            ...FORECAST_3YR.LinearRegression
        ];
        
        datasets.push({
            label: 'Linear Regression Forecast',
            data: lrForecastValues,
            borderColor: colors.accentWarning,
            borderWidth: 3,
            borderDash: [5, 5],
            fill: false,
            tension: 0,
            pointRadius: 6,
            pointBackgroundColor: colors.accentWarning
        });
    }

    salesForecastChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: allLabels,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: colors.text }
                },
                tooltip: {
                    padding: 12,
                    cornerRadius: 10,
                    backgroundColor: colors.background,
                    titleColor: colors.accentPrimary,
                    bodyColor: colors.text,
                    borderColor: colors.border,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            if (context.raw === null) return '';
                            return `${context.dataset.label}: ₹${context.raw.toLocaleString('en-IN')} Cr`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: colors.text }
                },
                y: {
                    grid: { color: colors.grid },
                    ticks: { color: colors.text }
                }
            }
        }
    });
}

// 5. INTERACTIVE SANDBOX WHAT-IF ENGINE
function updateSandbox() {
    const growthRate = parseFloat(document.getElementById('sandbox-growth-rate').value);
    const baseSales = parseFloat(document.getElementById('sandbox-base-sales').value);
    const projectionSpan = parseInt(document.getElementById('sandbox-years').value);
    
    // Labels & Data Generation
    const histLabels = ANNUAL_DATA.map(d => d.FY);
    const histSales = ANNUAL_DATA.map(d => d.Sales_Cr);
    
    const futureLabels = [];
    const futureSales = [baseSales];
    
    let currentSales = baseSales;
    for (let t = 1; t <= projectionSpan; t++) {
        const year = 2026 + t;
        futureLabels.push('FY' + year);
        currentSales = currentSales * (1 + (growthRate / 100));
        futureSales.push(currentSales);
    }
    
    // Update metric displays
    const finalSalesVal = futureSales[futureSales.length - 1];
    const addedSalesVal = finalSalesVal - baseSales;
    
    document.getElementById('sandbox-metric-final-sales').innerText = `₹${Math.round(finalSalesVal).toLocaleString('en-IN')} Cr`;
    document.getElementById('sandbox-metric-added-sales').innerText = `₹${Math.round(addedSalesVal).toLocaleString('en-IN')} Cr`;
    
    // Setup Chart
    const ctx = document.getElementById('chart-sandbox').getContext('2d');
    const colors = getChartColors();
    
    if (sandboxChartInstance) {
        sandboxChartInstance.destroy();
    }
    
    const allLabels = [...histLabels, ...futureLabels];
    const fullFutureSales = [...Array(histSales.length - 1).fill(null), ...futureSales];
    
    sandboxChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: allLabels,
            datasets: [
                {
                    label: 'Historical Sales',
                    data: [...histSales, ...Array(projectionSpan).fill(null)],
                    borderColor: colors.text,
                    borderWidth: 2,
                    pointRadius: 4,
                    showLine: true
                },
                {
                    label: 'What-If Simulation',
                    data: fullFutureSales,
                    borderColor: colors.accentSecondary,
                    borderWidth: 3,
                    borderDash: [5, 5],
                    pointRadius: 5,
                    pointBackgroundColor: colors.accentSecondary,
                    showLine: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: colors.text }
                },
                tooltip: {
                    padding: 12,
                    cornerRadius: 10,
                    backgroundColor: colors.background,
                    bodyColor: colors.text,
                    borderColor: colors.border,
                    borderWidth: 1,
                    callbacks: {
                        label: function(context) {
                            if (context.raw === null) return '';
                            return `${context.dataset.label}: ₹${Math.round(context.raw).toLocaleString('en-IN')} Cr`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: colors.text }
                },
                y: {
                    grid: { color: colors.grid },
                    ticks: { color: colors.text }
                }
            }
        }
    });
}

// 6. INITIALIZATION & EVENT LISTENERS
document.addEventListener('DOMContentLoaded', () => {
    // Basic setup
    setupRouting();
    
    // Toggle active theme
    const themeDarkBtn = document.getElementById('dark-theme-btn');
    const themeLightBtn = document.getElementById('light-theme-btn');
    
    themeDarkBtn.addEventListener('click', () => {
        themeLightBtn.classList.remove('active');
        themeDarkBtn.classList.add('active');
        document.body.className = 'theme-dark';
        handleTabChange(activeTab); // Redraw active tab charts with new colors
    });
    
    themeLightBtn.addEventListener('click', () => {
        themeDarkBtn.classList.remove('active');
        themeLightBtn.classList.add('active');
        document.body.className = 'theme-light';
        handleTabChange(activeTab); // Redraw active tab charts with new colors
    });
    
    // Tab 1 Dashboard toggles
    const btnSales = document.getElementById('btn-annual-sales');
    const btnGrowth = document.getElementById('btn-annual-growth');
    
    btnSales.addEventListener('click', () => {
        btnGrowth.classList.remove('active');
        btnSales.classList.add('active');
        annualChartMode = 'sales';
        renderAnnualSalesChart();
    });
    
    btnGrowth.addEventListener('click', () => {
        btnSales.classList.remove('active');
        btnGrowth.classList.add('active');
        annualChartMode = 'growth';
        renderAnnualSalesChart();
    });
    
    // Tab 3 Forecast toggles
    const btnProphet = document.getElementById('btn-show-prophet');
    const btnLR = document.getElementById('btn-show-lr');
    
    btnProphet.addEventListener('click', () => {
        btnLR.classList.remove('active');
        btnProphet.classList.add('active');
        forecastChartModel = 'prophet';
        renderSalesForecastChart();
    });
    
    btnLR.addEventListener('click', () => {
        btnProphet.classList.remove('active');
        btnLR.classList.add('active');
        forecastChartModel = 'lr';
        renderSalesForecastChart();
    });
    
    // Tab 4 Sandbox sliders
    const growthSlider = document.getElementById('sandbox-growth-rate');
    const growthVal = document.getElementById('val-growth-rate');
    
    growthSlider.addEventListener('input', (e) => {
        growthVal.innerText = e.target.value + '%';
        updateSandbox();
    });
    
    document.getElementById('sandbox-base-sales').addEventListener('input', updateSandbox);
    document.getElementById('sandbox-years').addEventListener('change', updateSandbox);
    
    document.getElementById('btn-reset-sandbox').addEventListener('click', () => {
        growthSlider.value = 15.6;
        growthVal.innerText = '15.6%';
        document.getElementById('sandbox-base-sales').value = 22527.77;
        document.getElementById('sandbox-years').value = 3;
        updateSandbox();
    });
    
    // Default initial draw
    handleTabChange('tab-dashboard');
});
