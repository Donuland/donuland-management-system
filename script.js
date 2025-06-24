// Donuland Management System v3.0 - JavaScript

// Configuration
const CONFIG = {
    weatherApiKey: 'c2fb0e86623880dc86162892b0fd9c95',
    mapsApiKey: 'AIzaSyBTTA_MKa6FrxKpkcd7c5-d3FnC6FBLVTc',
    sheetsUrl: 'https://docs.google.com/spreadsheets/d/1LclCz9hb0hlb1D92OyVqk6Cbam7PRK6KgAzGgiGs6iE/edit?usp=sharing',
    sheetsId: '1LclCz9hb0hlb1D92OyVqk6Cbam7PRK6KgAzGgiGs6iE'
};

// Global variables
let eventsData = [];
let historicalData = [];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let currentBusinessModel = 'owner';
let weatherData = null;
let charts = {};

// Czech cities for autocomplete
const czechCities = [
    'Praha', 'Brno', 'Ostrava', 'Plzeň', 'Liberec', 'Olomouc', 'České Budějovice',
    'Hradec Králové', 'Ústí nad Labem', 'Pardubice', 'Zlín', 'Havířov', 'Kladno',
    'Most', 'Opava', 'Frýdek-Místek', 'Karviná', 'Jihlava', 'Teplice', 'Děčín',
    'Karlovy Vary', 'Jablonec nad Nisou', 'Mladá Boleslav', 'Prostějov', 'Třebíč',
    'Tábor', 'Znojmo', 'Přerov', 'Cheb', 'Třinec', 'Chomutov', 'Kolín', 'Kutná Hora',
    'Nymburk', 'Poděbrady', 'Sázava', 'Humpolec', 'Lysá nad Labem', 'Kroměříž',
    'Vsetín', 'Pelhřimov', 'Kunětická Hora', 'Kralupy nad Vltavou', 'Přeštice',
    'Valtice', 'Jaroměř', 'Teplice', 'Mariánské Lázně', 'Milovice', 'Holešov',
    'Vodňany', 'Planá', 'Žďár nad Sázavou', 'Mnichovo Hradiště', 'Počátky',
    'Čáslav', 'Újezd nad Lesy', 'Jindřichův Hradec', 'Kostelec nad Černými Lesy',
    'Velké Popovice', 'Zbraslav', 'Rokycany', 'Ostrov', 'Třeboň', 'Chrudim'
];

// Event suggestions from historical data
const historicalEvents = [
    'ČokoFest', 'Winter Run', 'Street Food Festival', 'Food Day Festival',
    'Majáles', 'Night Run', 'Burger Fest', 'Polívkování', 'Čarodejnice',
    'Zahájení lázeňské sezóny', 'Bezva Fest', 'Hobby Fest', 'Pivní slavnosti',
    'Čáslavské slavnosti', 'Iron Maiden', 'Gastro Festival', 'BeerFood Festival',
    'Burger Festival', 'Legendy', 'Den Dětí', 'Festáček', 'Chinaski',
    'Rock For People', 'Imagine Dragons', 'Festival kávy a čaje', 'Delikatesy Festival',
    'Kozel Piknik Food Fest', 'Řečkovický Beer Festival', 'Jarní Street Food Festival',
    'Houkačky', 'Street Food Piknik Kačina', 'Tuning Sport', 'Vepřové hody',
    'Zabijačkové hodování', 'Amerika', 'Grill fest', 'Svatební salon'
];

// Initialize application
document.addEventListener('DOMContentLoaded', function() {
    showLoadingScreen();
    setTimeout(() => {
        hideLoadingScreen();
        initializeApp();
    }, 3000);
});

function showLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'flex';
    document.getElementById('mainApp').style.display = 'none';
}

function hideLoadingScreen() {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('mainApp').style.display = 'block';
}

function initializeApp() {
    loadSettings();
    loadData();
    initializeCalendar();
    initializeEventListeners();
    updatePrediction();
}

function initializeEventListeners() {
    // Form change listeners
    document.getElementById('eventType').addEventListener('change', updatePrediction);
    document.getElementById('expectedVisitors').addEventListener('input', updatePrediction);
    document.getElementById('eventEnvironment').addEventListener('change', updatePrediction);
    document.getElementById('eventDuration').addEventListener('change', updatePrediction);
    
    // Cost inputs
    document.getElementById('donutCost').addEventListener('input', updatePrediction);
    document.getElementById('donutPrice').addEventListener('input', updatePrediction);
    document.getElementById('transportCost').addEventListener('input', updatePrediction);
    document.getElementById('otherCosts').addEventListener('input', updatePrediction);
    
    // Rent model
    document.getElementById('rentModel').addEventListener('change', function() {
        toggleRentInputs();
        updatePrediction();
    });
    
    // Rent inputs
    document.getElementById('fixedRent').addEventListener('input', updatePrediction);
    document.getElementById('percentageRent').addEventListener('input', updatePrediction);
    document.getElementById('mixedFixed').addEventListener('input', updatePrediction);
    document.getElementById('mixedPercentage').addEventListener('input', updatePrediction);
}

// Section Navigation
function showSection(sectionId) {
    // Remove active class from all nav items and sections
    document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
    document.querySelectorAll('.section').forEach(section => section.classList.remove('active'));
    
    // Add active class to clicked nav item and corresponding section
    event.target.closest('.nav-item').classList.add('active');
    document.getElementById(sectionId).classList.add('active');
    
    // Load section-specific data
    if (sectionId === 'analytics') {
        loadAnalytics();
    } else if (sectionId === 'calendar') {
        updateCalendar();
    }
}

function displayWeather(data, isForecast) {
    const weatherSection = document.getElementById('weatherSection');
    
    let weatherInfo;
    if (isForecast && data.list) {
        // Find closest forecast to target date
        const targetDate = new Date(document.getElementById('eventDate').value);
        const closestForecast = data.list.find(item => {
            const forecastDate = new Date(item.dt * 1000);
            return forecastDate.toDateString() === targetDate.toDateString();
        }) || data.list[0];
        weatherInfo = closestForecast;
    } else {
        weatherInfo = data;
    }
    
    const temp = Math.round(weatherInfo.main?.temp || weatherInfo.temp);
    const description = weatherInfo.weather?.[0]?.description || 'Není k dispozici';
    const icon = getWeatherIcon(weatherInfo.weather?.[0]?.main || 'Clear');
    const humidity = weatherInfo.main?.humidity || 0;
    const windSpeed = Math.round((weatherInfo.wind?.speed || 0) * 3.6); // Convert m/s to km/h
    
    weatherSection.innerHTML = `
        <div class="weather-info">
            <div class="weather-icon">${icon}</div>
            <div class="weather-details">
                <h4>${temp}°C - ${description}</h4>
                <p>Vlhkost: ${humidity}%</p>
                <p>Vítr: ${windSpeed} km/h</p>
                <p>Vhodnost pro donuty: ${getDonutSuitability(temp, description)}</p>
            </div>
        </div>
    `;
}

function getWeatherIcon(weatherMain) {
    const icons = {
        'Clear': '☀️',
        'Clouds': '⛅',
        'Rain': '🌧️',
        'Drizzle': '🌦️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Fog': '🌫️'
    };
    return icons[weatherMain] || '🌤️';
}

function getDonutSuitability(temp, description) {
    if (temp > 25) return '⚠️ Vysoká teplota - riziko roztékání';
    if (temp < 5) return '❄️ Nízká teplota - pomalé roztávání';
    if (description.includes('rain') || description.includes('déšť')) return '🌧️ Déšť - snížená návštěvnost';
    return '✅ Ideální podmínky';
}

function checkWeatherWarnings(data) {
    const warning = document.getElementById('weatherWarning');
    const warningText = document.getElementById('weatherWarningText');
    
    let weatherInfo = data.main ? data : data.list?.[0];
    if (!weatherInfo) return;
    
    const temp = weatherInfo.main?.temp || weatherInfo.temp;
    const description = weatherInfo.weather?.[0]?.description || '';
    
    let warnings = [];
    
    if (temp > 25) {
        warnings.push('Vysoké teploty mohou způsobit roztékání čokoládových polev!');
    }
    if (temp > 30) {
        warnings.push('Extrémní teploty - doporučujeme chladící boxy!');
    }
    if (description.includes('rain') || description.includes('déšť')) {
        warnings.push('Déšť může snížit návštěvnost až o 30%!');
    }
    if (temp < 0) {
        warnings.push('Mráz může způsobit problémy s konzistencí!');
    }
    
    if (warnings.length > 0) {
        warningText.textContent = warnings.join(' ');
        warning.style.display = 'block';
    } else {
        warning.style.display = 'none';
    }
}

// Business Model Functions
function selectBusinessModel(model) {
    currentBusinessModel = model;
    
    // Update button states
    document.querySelectorAll('.model-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-model="${model}"]`).classList.add('active');
    
    // Update model info
    const modelInfo = document.getElementById('modelInfo');
    const modelInfos = {
        'owner': 'Majitel: 2 brigádníci (150 Kč/h × 10h = 3000 Kč) + všechny náklady',
        'employee': 'Zaměstnanec: 1 brigádník (150 Kč/h × 10h = 1500 Kč) + mzda',
        'franchise': 'Franšízant: Nakupujete donuty za 25 Kč/ks, ostatní náklady na vás'
    };
    modelInfo.textContent = modelInfos[model];
    
    updatePrediction();
}

// Rent Model Functions
function toggleRentInputs() {
    const rentModel = document.getElementById('rentModel').value;
    
    // Hide all rent input groups
    document.getElementById('fixedRentGroup').style.display = 'none';
    document.getElementById('percentageRentGroup').style.display = 'none';
    document.getElementById('mixedFixedGroup').style.display = 'none';
    document.getElementById('mixedPercentageGroup').style.display = 'none';
    
    // Show relevant input groups
    switch (rentModel) {
        case 'fixed':
            document.getElementById('fixedRentGroup').style.display = 'block';
            break;
        case 'percentage':
            document.getElementById('percentageRentGroup').style.display = 'block';
            break;
        case 'mixed':
            document.getElementById('mixedFixedGroup').style.display = 'block';
            document.getElementById('mixedPercentageGroup').style.display = 'block';
            break;
    }
}

// Prediction Functions
function updatePrediction() {
    const eventType = document.getElementById('eventType').value;
    const expectedVisitors = parseInt(document.getElementById('expectedVisitors').value) || 0;
    
    if (!eventType || !expectedVisitors) {
        document.getElementById('predictionPlaceholder').style.display = 'block';
        document.getElementById('predictionDisplay').style.display = 'none';
        return;
    }
    
    const prediction = calculatePrediction();
    displayPrediction(prediction);
    
    document.getElementById('predictionPlaceholder').style.display = 'none';
    document.getElementById('predictionDisplay').style.display = 'block';
}

function calculatePrediction() {
    const eventType = document.getElementById('eventType').value;
    const expectedVisitors = parseInt(document.getElementById('expectedVisitors').value) || 0;
    const duration = parseInt(document.getElementById('eventDuration').value) || 1;
    const environment = document.getElementById('eventEnvironment').value;
    
    const donutCost = parseFloat(document.getElementById('donutCost').value) || 8;
    const donutPrice = parseFloat(document.getElementById('donutPrice').value) || 45;
    const transportCost = parseFloat(document.getElementById('transportCost').value) || 500;
    const otherCosts = parseFloat(document.getElementById('otherCosts').value) || 0;
    
    // Base conversion rates by event type
    const conversionRates = {
        'food festival': 0.15,
        'veletrh': 0.12,
        'koncert': 0.08,
        'Sportovní akce (dospělí)': 0.10,
        'kulturní akce (rodinná)': 0.18,
        'rodinný festival': 0.20,
        'ostatní': 0.10
    };
    
    let baseConversion = conversionRates[eventType] || 0.10;
    
    // Weather adjustments
    if (weatherData) {
        const temp = weatherData.main?.temp || weatherData.list?.[0]?.main?.temp;
        const description = weatherData.weather?.[0]?.description || weatherData.list?.[0]?.weather?.[0]?.description || '';
        
        if (temp > 25) baseConversion *= 0.85; // Heat reduces sales
        if (temp < 5) baseConversion *= 0.90; // Cold reduces sales
        if (description.includes('rain')) baseConversion *= 0.70; // Rain significantly reduces sales
        if (description.includes('sun') || description.includes('clear')) baseConversion *= 1.10; // Good weather boosts sales
    }
    
    // Environment adjustments
    if (environment === 'indoor') baseConversion *= 1.05; // Indoor events are more predictable
    if (environment === 'mixed') baseConversion *= 1.02; // Mixed gives flexibility
    
    // Duration adjustments
    if (duration > 1) baseConversion *= (1 + (duration - 1) * 0.15); // Multi-day events
    
    // Calculate predicted sales
    const predictedSales = Math.round(expectedVisitors * baseConversion);
    const revenue = predictedSales * donutPrice;
    
    // Calculate costs based on business model
    let totalCosts = calculateTotalCosts(predictedSales, donutCost, transportCost, otherCosts, revenue);
    
    const profit = revenue - totalCosts;
    const confidence = calculateConfidence(eventType, expectedVisitors);
    
    return {
        sales: predictedSales,
        revenue: revenue,
        costs: totalCosts,
        profit: profit,
        confidence: confidence
    };
}

function calculateTotalCosts(sales, donutCost, transportCost, otherCosts, revenue) {
    const rentModel = document.getElementById('rentModel').value;
    let rentCost = 0;
    
    switch (rentModel) {
        case 'fixed':
            rentCost = parseFloat(document.getElementById('fixedRent').value) || 0;
            break;
        case 'percentage':
            const percentage = parseFloat(document.getElementById('percentageRent').value) || 0;
            rentCost = revenue * (percentage / 100);
            break;
        case 'mixed':
            const fixedPart = parseFloat(document.getElementById('mixedFixed').value) || 0;
            const percentagePart = parseFloat(document.getElementById('mixedPercentage').value) || 0;
            rentCost = fixedPart + (revenue * (percentagePart / 100));
            break;
    }
    
    // Business model specific costs
    let laborCosts = 0;
    let productCosts = sales * donutCost;
    
    switch (currentBusinessModel) {
        case 'owner':
            laborCosts = 3000; // 2 brigádníci × 150 Kč/h × 10h
            break;
        case 'employee':
            laborCosts = 1500; // 1 brigádník × 150 Kč/h × 10h
            productCosts = sales * donutCost; // Same product cost
            break;
        case 'franchise':
            laborCosts = 0; // No labor costs for franchise
            productCosts = sales * 25; // Fixed franchise price
            break;
    }
    
    return productCosts + laborCosts + rentCost + transportCost + otherCosts;
}

function calculateConfidence(eventType, visitors) {
    let confidence = 75; // Base confidence
    
    // Adjust based on event type (some are more predictable)
    const typeConfidence = {
        'food festival': 85,
        'veletrh': 80,
        'koncert': 70,
        'Sportovní akce (dospělí)': 75,
        'kulturní akce (rodinná)': 80,
        'rodinný festival': 85,
        'ostatní': 65
    };
    
    confidence = typeConfidence[eventType] || 70;
    
    // Adjust based on visitor count (larger events are more predictable)
    if (visitors > 10000) confidence += 10;
    else if (visitors > 5000) confidence += 5;
    else if (visitors < 1000) confidence -= 10;
    
    // Weather data availability
    if (weatherData) confidence += 5;
    
    return Math.min(95, Math.max(50, confidence));
}

function displayPrediction(prediction) {
    document.getElementById('predictedSales').textContent = prediction.sales;
    document.getElementById('expectedRevenue').textContent = formatCurrency(prediction.revenue);
    document.getElementById('totalCosts').textContent = formatCurrency(prediction.costs);
    
    const profitElement = document.getElementById('expectedProfit');
    profitElement.textContent = formatCurrency(prediction.profit);
    profitElement.style.color = prediction.profit >= 0 ? 'var(--success-color)' : 'var(--error-color)';
    
    const confidenceElement = document.getElementById('confidenceValue');
    const confidenceFill = document.getElementById('confidenceFill');
    confidenceElement.textContent = `${prediction.confidence}%`;
    confidenceFill.style.width = `${prediction.confidence}%`;
    
    // Update confidence color based on value
    if (prediction.confidence >= 80) {
        confidenceFill.style.background = 'var(--success-color)';
    } else if (prediction.confidence >= 60) {
        confidenceFill.style.background = 'var(--warning-color)';
    } else {
        confidenceFill.style.background = 'var(--error-color)';
    }
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('cs-CZ', {
        style: 'currency',
        currency: 'CZK',
        maximumFractionDigits: 0
    }).format(amount);
}

// Calendar Functions
function initializeCalendar() {
    updateCalendar();
}

function updateCalendar() {
    const monthNames = [
        'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
        'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
    ];
    
    document.getElementById('currentMonth').textContent = `${monthNames[currentMonth]} ${currentYear}`;
    
    const calendarGrid = document.getElementById('calendarGrid');
    calendarGrid.innerHTML = '';
    
    // Add day headers
    const dayHeaders = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
    dayHeaders.forEach(day => {
        const dayHeader = document.createElement('div');
        dayHeader.className = 'calendar-day-header';
        dayHeader.textContent = day;
        dayHeader.style.cssText = 'background: var(--bg-gray); font-weight: 600; text-align: center; padding: 0.5rem;';
        calendarGrid.appendChild(dayHeader);
    });
    
    // Get first day of month and number of days
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = (firstDay.getDay() + 6) % 7; // Convert to Monday = 0
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
        const emptyDay = document.createElement('div');
        emptyDay.className = 'calendar-day other-month';
        calendarGrid.appendChild(emptyDay);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'calendar-day';
        
        const currentDate = new Date(currentYear, currentMonth, day);
        const today = new Date();
        
        if (currentDate.toDateString() === today.toDateString()) {
            dayElement.classList.add('today');
        }
        
        dayElement.innerHTML = `
            <div class="day-number">${day}</div>
        `;
        
        // Check for events on this day
        const dayEvents = getEventsForDay(currentDate);
        if (dayEvents.length > 0) {
            const eventIndicator = document.createElement('div');
            eventIndicator.className = `event-indicator ${dayEvents[0].confirmed ? 'confirmed' : 'pending'}`;
            dayElement.appendChild(eventIndicator);
        }
        
        calendarGrid.appendChild(dayElement);
    }
}

function getEventsForDay(date) {
    // Mock function - in real implementation, filter eventsData
    const dateString = date.toISOString().split('T')[0];
    return eventsData.filter(event => event.date === dateString);
}

function previousMonth() {
    currentMonth--;
    if (currentMonth < 0) {
        currentMonth = 11;
        currentYear--;
    }
    updateCalendar();
}

function nextMonth() {
    currentMonth++;
    if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
    }
    updateCalendar();
}

// Analytics Functions
function loadAnalytics() {
    const analyticsLoading = document.querySelector('.analytics-loading');
    const analyticsContent = document.querySelector('.analytics-content');
    
    analyticsLoading.style.display = 'block';
    analyticsContent.style.display = 'none';
    
    setTimeout(() => {
        createCharts();
        analyticsLoading.style.display = 'none';
        analyticsContent.style.display = 'block';
    }, 2000);
}

function createCharts() {
    createSalesByTypeChart();
    createMonthlyTrendsChart();
    createProfitabilityChart();
    createWeatherImpactChart();
}

function createSalesByTypeChart() {
    const ctx = document.getElementById('salesByTypeChart').getContext('2d');
    
    if (charts.salesByType) {
        charts.salesByType.destroy();
    }
    
    charts.salesByType = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Food Festival', 'Veletrh', 'Koncert', 'Sportovní akce', 'Rodinné akce', 'Ostatní'],
            datasets: [{
                data: [35, 25, 15, 10, 10, 5],
                backgroundColor: [
                    '#ff6b35',
                    '#f7941d',
                    '#ffd23f',
                    '#27ae60',
                    '#3498db',
                    '#9b59b6'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function createMonthlyTrendsChart() {
    const ctx = document.getElementById('monthlyTrendsChart').getContext('2d');
    
    if (charts.monthlyTrends) {
        charts.monthlyTrends.destroy();
    }
    
    charts.monthlyTrends = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Led', 'Úno', 'Bře', 'Dub', 'Kvě', 'Čer'],
            datasets: [{
                label: 'Prodeje (ks)',
                data: [1200, 1800, 2500, 3200, 4100, 3800],
                borderColor: '#ff6b35',
                backgroundColor: 'rgba(255, 107, 53, 0.1)',
                fill: true
            }, {
                label: 'Zisk (Kč)',
                data: [25000, 35000, 48000, 62000, 78000, 72000],
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                fill: true,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    grid: {
                        drawOnChartArea: false,
                    },
                }
            }
        }
    });
}

function createProfitabilityChart() {
    const ctx = document.getElementById('profitabilityChart').getContext('2d');
    
    if (charts.profitability) {
        charts.profitability.destroy();
    }
    
    charts.profitability = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Praha', 'Brno', 'Ostrava', 'Plzeň', 'Liberec'],
            datasets: [{
                label: 'Průměrný zisk (Kč)',
                data: [8500, 6200, 5800, 7100, 5500],
                backgroundColor: [
                    '#ff6b35',
                    '#f7941d',
                    '#ffd23f',
                    '#27ae60',
                    '#3498db'
                ]
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

function createWeatherImpactChart() {
    const ctx = document.getElementById('weatherImpactChart').getContext('2d');
    
    if (charts.weatherImpact) {
        charts.weatherImpact.destroy();
    }
    
    charts.weatherImpact = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Prodeje vs Teplota',
                data: [
                    {x: 15, y: 450},
                    {x: 20, y: 680},
                    {x: 25, y: 820},
                    {x: 30, y: 650},
                    {x: 12, y: 380},
                    {x: 22, y: 750},
                    {x: 18, y: 580},
                    {x: 28, y: 720}
                ],
                backgroundColor: '#ff6b35'
            }]
        },
        options: {
            responsive: true,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Teplota (°C)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Prodeje (ks)'
                    }
                }
            }
        }
    });
}

// Settings Functions
function loadSettings() {
    const settings = JSON.parse(localStorage.getItem('donulandSettings')) || {};
    
    if (settings.defaultPrice) document.getElementById('defaultPrice').value = settings.defaultPrice;
    if (settings.defaultCost) document.getElementById('defaultCost').value = settings.defaultCost;
    if (settings.franchisePrice) document.getElementById('franchisePrice').value = settings.franchisePrice;
    if (settings.weatherApiKey) document.getElementById('weatherApiKey').value = settings.weatherApiKey;
    if (settings.mapsApiKey) document.getElementById('mapsApiKey').value = settings.mapsApiKey;
    if (settings.sheetsUrl) document.getElementById('sheetsUrl').value = settings.sheetsUrl;
}

function saveSettings() {
    const settings = {
        defaultPrice: document.getElementById('defaultPrice').value,
        defaultCost: document.getElementById('defaultCost').value,
        franchisePrice: document.getElementById('franchisePrice').value,
        weatherApiKey: document.getElementById('weatherApiKey').value,
        mapsApiKey: document.getElementById('mapsApiKey').value,
        sheetsUrl: document.getElementById('sheetsUrl').value
    };
    
    localStorage.setItem('donulandSettings', JSON.stringify(settings));
    
    // Update CONFIG with new values
    CONFIG.weatherApiKey = settings.weatherApiKey;
    CONFIG.mapsApiKey = settings.mapsApiKey;
    CONFIG.sheetsUrl = settings.sheetsUrl;
    
    alert('Nastavení bylo uloženo!');
}

function resetSettings() {
    if (confirm('Opravdu chcete obnovit výchozí nastavení?')) {
        localStorage.removeItem('donulandSettings');
        
        document.getElementById('defaultPrice').value = 45;
        document.getElementById('defaultCost').value = 8;
        document.getElementById('franchisePrice').value = 25;
        document.getElementById('weatherApiKey').value = 'c2fb0e86623880dc86162892b0fd9c95';
        document.getElementById('mapsApiKey').value = 'AIzaSyBTTA_MKa6FrxKpkcd7c5-d3FnC6FBLVTc';
        document.getElementById('sheetsUrl').value = 'https://docs.google.com/spreadsheets/d/1LclCz9hb0hlb1D92OyVqk6Cbam7PRK6KgAzGgiGs6iE/edit?usp=sharing';
        
        alert('Nastavení bylo obnoveno!');
    }
}

function exportData() {
    const data = {
        events: eventsData,
        historical: historicalData,
        settings: JSON.parse(localStorage.getItem('donulandSettings')) || {}
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `donuland-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Initialize debounced functions
const debouncedUpdatePrediction = debounce(updatePrediction, 500);

// Close suggestions when clicking outside
document.addEventListener('click', function(event) {
    if (!event.target.closest('.form-group')) {
        document.querySelectorAll('.suggestions').forEach(suggestions => {
            suggestions.classList.remove('show');
        });
    }
});

// Keyboard navigation for suggestions
document.addEventListener('keydown', function(event) {
    const activeSuggestions = document.querySelector('.suggestions.show');
    if (!activeSuggestions) return;
    
    const items = activeSuggestions.querySelectorAll('.suggestion-item');
    if (items.length === 0) return;
    
    let selectedIndex = Array.from(items).findIndex(item => item.classList.contains('selected'));
    
    if (event.key === 'ArrowDown') {
        event.preventDefault();
        selectedIndex = (selectedIndex + 1) % items.length;
    } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        selectedIndex = selectedIndex <= 0 ? items.length - 1 : selectedIndex - 1;
    } else if (event.key === 'Enter' && selectedIndex >= 0) {
        event.preventDefault();
        items[selectedIndex].click();
        return;
    } else if (event.key === 'Escape') {
        activeSuggestions.classList.remove('show');
        return;
    }
    
    // Update selected item
    items.forEach(item => item.classList.remove('selected'));
    if (selectedIndex >= 0) {
        items[selectedIndex].classList.add('selected');
    }
});

// Data Loading
async function loadData() {
    try {
        document.getElementById('statusIndicator').innerHTML = '<span class="status-dot" style="background: orange;"></span><span>Načítám...</span>';
        
        // Simulate Google Sheets data loading
        // In real implementation, this would fetch from Google Sheets API
        eventsData = await loadEventsFromSheets();
        historicalData = processHistoricalData(eventsData);
        
        document.getElementById('statusIndicator').innerHTML = '<span class="status-dot"></span><span>Online</span>';
        console.log('Data načtena úspěšně');
    } catch (error) {
        console.error('Chyba při načítání dat:', error);
        document.getElementById('statusIndicator').innerHTML = '<span class="status-dot" style="background: red;"></span><span>Offline</span>';
    }
}

// Mock data loading function (replace with actual Google Sheets API call)
async function loadEventsFromSheets() {
    // Simulated data based on the Google Sheet
    return new Promise(resolve => {
        setTimeout(() => {
            resolve([
                {
                    date: '2025-06-07',
                    city: 'Praha',
                    name: 'Festáček',
                    type: 'koncert',
                    confirmed: true,
                    attendance: 15000,
                    sales: 600,
                    revenue: 27000,
                    costs: 8000,
                    weather: 'slunečno'
                },
                {
                    date: '2025-06-07',
                    city: 'Plzeň',
                    name: 'Bezva Fest',
                    type: 'rodinný festival',
                    confirmed: true,
                    attendance: 5000,
                    sales: 800,
                    revenue: 36000,
                    costs: 15000,
                    weather: 'polojasno'
                },
                // Add more mock data...
            ]);
        }, 1000);
    });
}

function processHistoricalData(data) {
    // Process data for analytics and predictions
    return data.map(event => ({
        ...event,
        profit: event.revenue - event.costs,
        profitMargin: ((event.revenue - event.costs) / event.revenue) * 100
    }));
}

// Autocomplete Functions
function showEventSuggestions(value) {
    const suggestions = document.getElementById('eventSuggestions');
    if (value.length < 2) {
        suggestions.classList.remove('show');
        return;
    }
    
    const matches = historicalEvents.filter(event => 
        event.toLowerCase().includes(value.toLowerCase())
    );
    
    if (matches.length > 0) {
        suggestions.innerHTML = matches.map(event => 
            `<div class="suggestion-item" onclick="selectEvent('${event}')">${event}</div>`
        ).join('');
        suggestions.classList.add('show');
    } else {
        suggestions.classList.remove('show');
    }
}

function showCitySuggestions(value) {
    const suggestions = document.getElementById('citySuggestions');
    if (value.length < 2) {
        suggestions.classList.remove('show');
        return;
    }
    
    const matches = czechCities.filter(city => 
        city.toLowerCase().includes(value.toLowerCase())
    );
    
    if (matches.length > 0) {
        suggestions.innerHTML = matches.map(city => 
            `<div class="suggestion-item" onclick="selectCity('${city}')">${city}</div>`
        ).join('');
        suggestions.classList.add('show');
    } else {
        suggestions.classList.remove('show');
    }
}

function selectEvent(eventName) {
    document.getElementById('eventName').value = eventName;
    document.getElementById('eventSuggestions').classList.remove('show');
    updatePrediction();
}

function selectCity(cityName) {
    document.getElementById('eventCity').value = cityName;
    document.getElementById('citySuggestions').classList.remove('show');
    updateWeatherAndPrediction();
}

// Weather Functions
async function updateWeatherAndPrediction() {
    const city = document.getElementById('eventCity').value;
    const date = document.getElementById('eventDate').value;
    
    if (city && date) {
        await loadWeather(city, date);
    }
    updatePrediction();
}

async function loadWeather(city, date) {
    try {
        const weatherSection = document.getElementById('weatherSection');
        weatherSection.innerHTML = '<div class="weather-placeholder"><p>🔄 Načítám počasí...</p></div>';
        
        // Check if date is within 5 days for forecast
        const targetDate = new Date(date);
        const today = new Date();
        const daysDiff = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));
        
        let weatherUrl;
        if (daysDiff <= 5 && daysDiff >= 0) {
            // Use forecast API
            weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?q=${city},CZ&appid=${CONFIG.weatherApiKey}&units=metric&lang=cs`;
        } else {
            // Use current weather as fallback
            weatherUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city},CZ&appid=${CONFIG.weatherApiKey}&units=metric&lang=cs`;
        }
        
        const response = await fetch(weatherUrl);
        const data = await response.json();
        
        if (data.cod === 200) {
            weatherData = data;
            displayWeather(data, daysDiff <= 5 && daysDiff >= 0);
            checkWeatherWarnings(data);
        } else {
            throw new Error(data.message);
        }
    } catch (error) {
        console.error('Chyba při načítání počasí:', error);
        document.getElementById('weatherSection').innerHTML = 
            '<div class="weather-placeholder"><p>❌ Nepodařilo se načíst počasí</p></div>';
