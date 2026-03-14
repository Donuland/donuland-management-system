// app.js - Hlavní koordinační soubor Donuland Management System
class DonulandApp {
            constructor() {
                            this.version = '3.1';
                            this.initialized = false;
                            this.managers = {};
                            this.config = {
                                                apiKeys: {
                                                                        weather: '',
                                                                        maps: '',
                                                                        sheets: ''
                                                },
                                                settings: {
                                                                        defaultPrice: 45,
                                                                        defaultCost: 18,
                                                                        minOrderQuantity: 50,
                                                                        currency: 'Kč'
                                                }
                            };
                            console.log(`🍩 Donuland Management System v${this.version} se inicializuje...`);
            }

    // Hlavní inicializace aplikace
    async initialize() {
                    try {
                                        console.log('🚀 Spouštím inicializaci aplikace...');
                                        await this.loadConfiguration();
                                        await this.initializeManagers();
                                        await this.loadInitialData();
                                        this.setupEventListeners();
                                        this.setupUI();
                                        await this.performHealthCheck();
                                        this.initialized = true;
                                        console.log('✅ Aplikace úspěšně inicializována!');
                                        if (window.uiManager) {
                                                                window.uiManager.showNotification(
                                                                                            `🍩 Donuland Management System v${this.version} je připraven!`,
                                                                                            'success'
                                                                                        );
                                        }
                    } catch (error) {
                                        console.error('❌ Chyba při inicializaci aplikace:', error);
                                        this.handleInitializationError(error);
                    }
    }

    // Načtení konfigurace
    async loadConfiguration() {
                    console.log('⚙️ Načítám konfiguraci...');
                    try {
                                        const savedConfig = localStorage.getItem('donulandConfig');
                                        if (savedConfig) {
                                                                const parsed = JSON.parse(savedConfig);
                                                                this.config = { ...this.config, ...parsed };
                                                                console.log('📄 Konfigurace načtena z localStorage');
                                        }
                                        const oldSettings = localStorage.getItem('donulandSettings');
                                        if (oldSettings) {
                                                                const parsed = JSON.parse(oldSettings);
                                                                if (parsed.apiKeyWeather) this.config.apiKeys.weather = parsed.apiKeyWeather;
                                                                if (parsed.apiKeyMaps) this.config.apiKeys.maps = parsed.apiKeyMaps;
                                                                if (parsed.googleSheetUrl) this.config.apiKeys.sheets = parsed.googleSheetUrl;
                                                                if (parsed.googleSheetsUrl) this.config.apiKeys.sheets = parsed.googleSheetsUrl;
                                                                if (parsed.weatherApiKey) this.config.apiKeys.weather = parsed.weatherApiKey;
                                                                if (parsed.defaultPrice) this.config.settings.defaultPrice = parsed.defaultPrice;
                                                                this.saveConfiguration();
                                                                console.log('🔄 Migrace starého nastavení dokončena');
                                        }
                    } catch (error) {
                                        console.warn('⚠️ Chyba při načítání konfigurace:', error);
                    }
    }

    // Uložení konfigurace
    saveConfiguration() {
                    try {
                                        localStorage.setItem('donulandConfig', JSON.stringify(this.config));
                                        console.log('💾 Konfigurace uložena');
                    } catch (error) {
                                        console.error('❌ Chyba při ukládání konfigurace:', error);
                    }
    }

    // Inicializace všech managerů
    async initializeManagers() {
                    console.log('🔧 Inicializuji managery...');
                    try {
                                        if (window.uiManager) {
                                                                this.managers.ui = window.uiManager;
                                                                console.log('✅ UI Manager připojen');
                                        }
                                        if (window.weatherManager) {
                                                                this.managers.weather = window.weatherManager;
                                                                if (this.config.apiKeys.weather) {
                                                                                            this.managers.weather.setApiKey(this.config.apiKeys.weather);
                                                                }
                                                                console.log('✅ Weather Manager inicializován');
                                        }
                                        if (window.autocompleteManager) {
                                                                this.managers.autocomplete = window.autocompleteManager;
                                                                console.log('✅ Autocomplete Manager připojen');
                                        }
                                        if (window.businessModelManager) {
                                                                this.managers.businessModel = window.businessModelManager;
                                                                console.log('✅ Business Model Manager připojen');
                                        }
                                        if (window.predictionEngine) {
                                                                this.managers.prediction = window.predictionEngine;
                                                                console.log('✅ Prediction Engine připojen');
                                        }
                                        if (window.dataManager) {
                                                                this.managers.data = window.dataManager;
                                                                // DataManager se inicializuje sám - pouze nastavíme URL pokud ji máme
                                            if (this.config.apiKeys.sheets && window.dataManager.setGoogleSheetUrl) {
                                                                        window.dataManager.setGoogleSheetUrl(this.config.apiKeys.sheets);
                                            }
                                                                console.log('✅ Data Manager připojen');
                                        }
                    } catch (error) {
                                        console.error('❌ Chyba při inicializaci managerů:', error);
                                        throw error;
                    }
    }

    // Načtení počátečních dat
    async loadInitialData() {
                    console.log('📊 Načítám počáteční data...');
                    try {
                                        let sheetsData = [];
                                        if (this.managers.data && this.config.apiKeys.sheets) {
                                                                try {
                                                                                            sheetsData = await this.managers.data.loadGoogleSheetsData();
                                                                                            console.log(`📈 Načteno ${sheetsData.length} záznamů z Google Sheets`);
                                                                } catch (error) {
                                                                                            console.warn('⚠️ Nepodařilo se načíst Google Sheets:', error);
                                                                }
                                        }
                                        if (this.managers.autocomplete) {
                                                                if (typeof this.managers.autocomplete.initialize === 'function') {
                                                                                            await this.managers.autocomplete.initialize(sheetsData);
                                                                }
                                        }
                                        if (this.managers.prediction) {
                                                                this.managers.prediction.updateHistoricalData(sheetsData);
                                        }
                    } catch (error) {
                                        console.warn('⚠️ Chyba při načítání dat:', error);
                    }
    }

    // Nastavení globálních event listenerů
    setupEventListeners() {
                    console.log('👂 Nastavuji event listenery...');
                    window.addEventListener('error', (event) => {
                                        console.error('🚨 Globální chyba:', event.error);
                    });
                    window.addEventListener('unhandledrejection', (event) => {
                                        console.error('🚨 Neošetřená promise rejection:', event.reason);
                                        event.preventDefault();
                    });
                    window.addEventListener('beforeunload', () => {
                                        this.saveConfiguration();
                    });
                    window.addEventListener('online', () => {
                                        if (this.managers.ui) {
                                                                this.managers.ui.showNotification('🌐 Připojení obnoveno', 'success');
                                        }
                    });
                    window.addEventListener('offline', () => {
                                        if (this.managers.ui) {
                                                                this.managers.ui.showNotification('📶 Ztraceno internetové připojení', 'warning');
                                        }
                    });
    }

    // Nastavení UI
    setupUI() {
                    console.log('🎨 Nastavuji uživatelské rozhraní...');
                    this.setDefaultFormValues();
                    this.setupWeatherUpdates();
    }

    // Nastavení výchozích hodnot formulářů
    setDefaultFormValues() {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    const tomorrowStr = tomorrow.toISOString().split('T')[0];
                    const startDateInput = document.getElementById('eventStartDate');
                    if (startDateInput && !startDateInput.value) {
                                        startDateInput.value = tomorrowStr;
                                        startDateInput.min = new Date().toISOString().split('T')[0];
                    }
                    const newEventDateInput = document.getElementById('newEventDate');
                    if (newEventDateInput && !newEventDateInput.value) {
                                        newEventDateInput.value = tomorrowStr;
                    }
                    const timeInput = document.getElementById('eventTime');
                    if (timeInput && !timeInput.value) {
                                        timeInput.value = '10:00';
                    }
                    const priceInput = document.getElementById('pricePerDonut');
                    if (priceInput && !priceInput.value) {
                                        priceInput.value = this.config.settings.defaultPrice;
                    }
                    const costInput = document.getElementById('costPerDonut');
                    if (costInput && !costInput.value) {
                                        costInput.value = this.config.settings.defaultCost;
                    }
                    const fuelCostInput = document.getElementById('fuelCostPerKm');
                    if (fuelCostInput && !fuelCostInput.value) {
                                        fuelCostInput.value = '8';
                    }
    }

    // Nastavení automatických aktualizací počasí
    setupWeatherUpdates() {
                    const locationInput = document.getElementById('location');
                    const dateInput = document.getElementById('eventStartDate');
                    if (locationInput && dateInput && this.managers.weather) {
                                        const updateWeather = this.debounce(() => {
                                                                if (locationInput.value && dateInput.value) {
                                                                                            if (typeof this.managers.weather.updateWeatherForecast === 'function') {
                                                                                                                            this.managers.weather.updateWeatherForecast();
                                                                                                    }
                                                                }
                                        }, 1500);
                                        locationInput.addEventListener('input', updateWeather);
                                        dateInput.addEventListener('change', updateWeather);
                    }
    }

    // Debounce utility
    debounce(func, wait) {
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

    // Kontrola zdraví aplikace
    async performHealthCheck() {
                    console.log('🏥 Provádím health check...');
                    const checks = {
                                        ui: !!this.managers.ui,
                                        weather: !!this.managers.weather,
                                        autocomplete: !!this.managers.autocomplete,
                                        businessModel: !!this.managers.businessModel,
                                        prediction: !!this.managers.prediction,
                                        data: !!this.managers.data
                    };
                    const healthScore = Object.values(checks).filter(Boolean).length;
                    const totalChecks = Object.keys(checks).length;
                    console.log(`🏥 Health check: ${healthScore}/${totalChecks} OK`, checks);
                    return checks;
    }

    // Zpracování chyby inicializace
    handleInitializationError(error) {
                    console.error('💥 Kritická chyba inicializace:', error);
                    // Skryjeme loading screen a zobrazíme hlavní aplikaci i při chybě
                const loadingScreen = document.getElementById('loadingScreen');
                    const mainApp = document.getElementById('mainApp');
                    if (loadingScreen) loadingScreen.style.display = 'none';
                    if (mainApp) mainApp.style.display = 'block';
                    if (window.uiManager && window.uiManager.showNotification) {
                                        window.uiManager.showNotification(`⚠️ Chyba inicializace: ${error.message}. Základní funkce jsou dostupné.`, 'warning');
                    }
    }

    // API pro práci s konfigurací
    getConfig(path) {
                    const keys = path.split('.');
                    let value = this.config;
                    for (const key of keys) {
                                        if (value && typeof value === 'object' && key in value) {
                                                                value = value[key];
                                        } else {
                                                                return undefined;
                                        }
                    }
                    return value;
    }

    setConfig(path, value) {
                    const keys = path.split('.');
                    const lastKey = keys.pop();
                    let obj = this.config;
                    for (const key of keys) {
                                        if (!(key in obj) || typeof obj[key] !== 'object') {
                                                                obj[key] = {};
                                        }
                                        obj = obj[key];
                    }
                    obj[lastKey] = value;
                    this.saveConfiguration();
    }

    getManager(name) {
                    return this.managers[name] || null;
    }

    // Aktualizace API klíčů
    updateApiKeys(keys) {
                    if (keys.weather) {
                                        this.config.apiKeys.weather = keys.weather;
                                        if (this.managers.weather) {
                                                                this.managers.weather.setApiKey(keys.weather);
                                        }
                    }
                    if (keys.maps) {
                                        this.config.apiKeys.maps = keys.maps;
                    }
                    if (keys.sheets) {
                                        this.config.apiKeys.sheets = keys.sheets;
                                        if (this.managers.data && this.managers.data.setGoogleSheetUrl) {
                                                                this.managers.data.setGoogleSheetUrl(keys.sheets);
                                        }
                    }
                    this.saveConfiguration();
                    console.log('🔑 API klíče aktualizovány');
    }

    // Reload dat z externích zdrojů
    async reloadData() {
                    if (!this.initialized) {
                                        console.warn('⚠️ Aplikace není inicializována');
                                        return;
                    }
                    console.log('🔄 Obnovuji data...');
                    try {
                                        if (this.managers.ui) {
                                                                this.managers.ui.showNotification('🔄 Obnovuji data...', 'info');
                                        }
                                        let sheetsData = [];
                                        if (this.managers.data) {
                                                                sheetsData = await this.managers.data.loadGoogleSheetsData();
                                                                console.log(`📊 Obnoveno ${sheetsData.length} záznamů`);
                                        }
                                        if (this.managers.autocomplete && this.managers.autocomplete.updateFromGoogleSheets) {
                                                                this.managers.autocomplete.updateFromGoogleSheets(sheetsData);
                                        }
                                        if (this.managers.prediction) {
                                                                this.managers.prediction.updateHistoricalData(sheetsData);
                                        }
                                        if (this.managers.ui) {
                                                                this.managers.ui.showNotification('✅ Data úspěšně obnovena!', 'success');
                                        }
                    } catch (error) {
                                        console.error('❌ Chyba při obnově dat:', error);
                                        if (this.managers.ui) {
                                                                this.managers.ui.showNotification(`❌ Chyba při obnově dat: ${error.message}`, 'error');
                                        }
                    }
    }

    // Export stavu aplikace
    exportAppState() {
                    return {
                                        version: this.version,
                                        timestamp: new Date().toISOString(),
                                        initialized: this.initialized,
                                        managers: Object.keys(this.managers)
                    };
    }

    // Získání statistik
    getUsageStats() {
                    return {
                                        version: this.version,
                                        uptime: this.initialized ? Date.now() - (this.initTime || Date.now()) : 0,
                                        managers: Object.keys(this.managers).length
                    };
    }

    // Restart aplikace
    async restart() {
                    console.log('🔄 Restartování aplikace...');
                    this.initialized = false;
                    this.managers = {};
                    await this.initialize();
    }
}

// Globální utility funkce
window.DonulandUtils = {
            formatNumber: (num) => num.toLocaleString('cs-CZ'),
            formatPrice: (price) => `${price.toLocaleString('cs-CZ')} Kč`,
            formatDate: (dateStr) => {
                            const date = new Date(dateStr);
                            return date.toLocaleDateString('cs-CZ', {
                                                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                            });
            },
            validateEmail: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
            generateUUID: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                            const r = Math.random() * 16 | 0;
                            const v = c == 'x' ? r : (r & 0x3 | 0x8);
                            return v.toString(16);
            }),
            deepClone: (obj) => JSON.parse(JSON.stringify(obj)),
            isMobile: () => window.innerWidth <= 768,
            throttle: (func, limit) => {
                            let inThrottle;
                            return function() {
                                                const args = arguments;
                                                const context = this;
                                                if (!inThrottle) {
                                                                        func.apply(context, args);
                                                                        inThrottle = true;
                                                                        setTimeout(() => inThrottle = false, limit);
                                                }
                            };
            }
};

// Inicializace aplikace po načtení DOM
document.addEventListener('DOMContentLoaded', async () => {
            window.donulandApp = new DonulandApp();
            try {
                            await window.donulandApp.initialize();
                            window.donulandApp.initTime = Date.now();
            } catch (error) {
                            console.error('💥 Aplikace se nepodařila spustit:', error);
            }
});

// Export pro testování
if (typeof module !== 'undefined' && module.exports) {
            module.exports = DonulandApp;
}
