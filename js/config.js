// =============================================================================
// CONFIGURATION AND CONSTANTS
// =============================================================================

const CONFIG = {
    // API Keys
    WEATHER_API_KEY: 'c2fb0e86623880dc86162892b0fd9c95',
    
    // Google Sheets
    SHEET_ID: '1LclCz9hb0hlb1D92OyVqk6Cbam7PRK6KgAzGgiGs6iE',
    
    // Business Models
    BUSINESS_MODELS: {
        owner: {
            laborCost: 3000, // 2 brigádníci × 150 Kč/h × 10h
            description: 'Majitel: 2 brigádníci (150 Kč/h × 10h = 3000 Kč) + všechny náklady',
            donutCost: 32,
            hasRevenueshare: false
        },
        employee: {
            laborCost: 1500, // 1 brigádník × 150 Kč/h × 10h
            ownWage: 1500, // Vlastní mzda × 150 Kč/h × 10h
            revenueShare: 0.05, // 5% z obratu
            description: 'Zaměstnanec: vlastní mzda (1500 Kč) + 1 brigádník (1500 Kč) + 5% z obratu',
            donutCost: 32,
            hasRevenueshare: true
        },
        franchisee: {
            donutCost: 52, // Nákupní cena od vás
            yourProfit: 20, // Váš zisk na donut (52 - 32)
            description: 'Franšízant: nakupuje donuty za 52 Kč, váš zisk 20 Kč/donut',
            hasRevenueshare: false,
            isYourProfitCalculation: true
        }
    },
    
    // Conversion rates by event type
    CONVERSION_RATES: {
        'food festival': 0.22,
        'cokoladovy festival': 0.28,
        'rodinny festival': 0.18,
        'kulturni': 0.15,
        'ostatni': 0.12,
        'sportovni': 0.10,
        'veletrh': 0.08,
        'koncert': 0.06
    },
    
    // Duration factors
    DURATION_FACTORS: {
        1: 1,
        2: 1.75,
        3: 2.35,
        4: 2.8,
        5: 3.1
    },
    
    // Weather thresholds
    WEATHER: {
        TEMP_THRESHOLD: 28, // Temperature threshold for quality warning
        QUALITY_RISK_TEMP: 28
    },
    
    // Event colors for calendar
    EVENT_COLORS: [
        '#3498db', '#9b59b6', '#e74c3c', '#f39c12',
        '#27ae60', '#e67e22', '#34495e', '#16a085'
    ],
    
    // Category icons
    CATEGORY_ICONS: {
        'Donuty': '📦',
        'Práce (2 brigádníci)': '👥',
        'Brigádník': '👷',
        'Vlastní mzda': '💼',
        'Podíl z obratu (5%)': '📈',
        'Doprava': '🚚',
        'Nájem': '🏪',
        'Ostatní': '💼',
        'Nákup donutů (franšízant)': '📦',
        'Váš zisk z prodeje': '💎'
    }
};

// Global state
const GLOBAL_STATE = {
    allSheetData: [],
    historicalData: [],
    plannedEvents: [],
    localSavedEvents: [],
    lastPrediction: null,
    currentWeatherData: null,
    autocompleteData: {
        eventNames: [],
        locations: []
    }
};

// Computed properties
CONFIG.SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${CONFIG.SHEET_ID}/export?format=csv&gid=0`;
