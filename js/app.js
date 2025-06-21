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
            weatherApi: false,
            googleSheets: false
        };
        
        // Test Weather API
        if (this.managers.weather && this.config.apiKeys.weather) {
            try {
                const testResult = await this.managers.weather.testConnection();
                checks.weatherApi = testResult.success;
                if (testResult.success) {
                    console.log('✅ Weather API: ' + testResult.message);
                } else {
                    console.warn('⚠️ Weather API: ' + testResult.message);
                }
            } catch (error) {
                console.warn('⚠️ Weather API test failed:', error);
            }
        }
        
        // Test Google Sheets
        if (this.managers.data && this.config.apiKeys.sheets) {
            try {
                const sheetsTest = await this.managers.data.testConnection();
                checks.googleSheets = sheetsTest.success;
                console.log(sheetsTest.success ? '✅ Google Sheets OK' : '⚠️ Google Sheets: ' + sheetsTest.message);
            } catch (error) {
                console.warn('⚠️ Google Sheets test failed:', error);
            }
        }
        
        // Souhrn health checku
        const healthScore = Object.values(checks).filter(Boolean).length;
        const totalChecks = Object.keys(checks).length;
        
        console.log(`🏥 Health check: ${healthScore}/${totalChecks} OK`);
        
        // Upozornění na kritické problémy
        if (!checks.prediction) {
            console.error('🚨 KRITICKÉ: Predikční engine není dostupný!');
        }
        
        if (!checks.ui) {
            console.error('🚨 KRITICKÉ: UI Manager není dostupný!');
        }
        
        return checks;
    }

    // Zpracování chyby inicializace
    handleInitializationError(error) {
        console.error('💥 Kritická chyba inicializace:', error);
        
        // Zobrazení chybové zprávy uživateli
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.8);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
            font-family: Arial, sans-serif;
        `;
        
        errorDiv.innerHTML = `
            <div style="text-align: center; max-width: 500px; padding: 40px;">
                <h1 style="color: #ff6b6b; margin-bottom: 20px;">🚨 Chyba aplikace</h1>
                <p style="margin-bottom: 20px;">Nepodařilo se inicializovat Donuland Management System.</p>
                <p style="margin-bottom: 30px; font-size: 0.9em; opacity: 0.8;">
                    Chyba: ${error.message}
                </p>
                <button onclick="location.reload()" style="
                    background: #ff6b6b;
                    color: white;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 16px;
                ">🔄 Obnovit stránku</button>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
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
        
        console.log(`⚙️ Konfigurace aktualizována: ${path} = ${value}`);
    }

    // API pro práci s managery
    getManager(name) {
        return this.managers[name] || null;
    }

    // Aktualizace API klíčů
    updateApiKeys(keys) {
        if (keys.weather && keys.weather !== this.config.apiKeys.weather) {
            this.config.apiKeys.weather = keys.weather;
            if (this.managers.weather) {
                this.managers.weather.setApiKey(keys.weather);
            }
        }
        
        if (keys.maps && keys.maps !== this.config.apiKeys.maps) {
            this.config.apiKeys.maps = keys.maps;
        }
        
        if (keys.sheets && keys.sheets !== this.config.apiKeys.sheets) {
            this.config.apiKeys.sheets = keys.sheets;
            if (this.managers.data) {
                this.managers.data.updateSheetUrl(keys.sheets);
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
            
            // Reload Google Sheets dat
            let sheetsData = [];
            if (this.managers.data && this.config.apiKeys.sheets) {
                sheetsData = await this.managers.data.loadGoogleSheetsData();
                console.log(`📊 Obnoveno ${sheetsData.length} záznamů`);
            }
            
            // Aktualizace autocomplete
            if (this.managers.autocomplete) {
                this.managers.autocomplete.updateFromGoogleSheets(sheetsData);
            }
            
            // Aktualizace predikčního enginu
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

    // Test všech připojení
    async testAllConnections() {
        console.log('🔧 Testování všech připojení...');
        
        const results = {
            weather: { success: false, message: 'Neotestováno' },
            sheets: { success: false, message: 'Neotestováno' },
            maps: { success: false, message: 'Není implementováno' }
        };
        
        // Test Weather API
        if (this.managers.weather && this.config.apiKeys.weather) {
            try {
                results.weather = await this.managers.weather.testConnection();
            } catch (error) {
                results.weather = { success: false, message: error.message };
            }
        } else {
            results.weather.message = 'API klíč není nastaven';
        }
        
        // Test Google Sheets
        if (this.managers.data && this.config.apiKeys.sheets) {
            try {
                results.sheets = await this.managers.data.testConnection();
            } catch (error) {
                results.sheets = { success: false, message: error.message };
            }
        } else {
            results.sheets.message = 'URL není nastaveno';
        }
        
        // Zobrazení výsledků
        if (this.managers.ui) {
            for (const [service, result] of Object.entries(results)) {
                const icon = result.success ? '✅' : '❌';
                const type = result.success ? 'success' : 'error';
                this.managers.ui.showNotification(
                    `${icon} ${service.toUpperCase()}: ${result.message}`,
                    type
                );
            }
        }
        
        return results;
    }

    // Export kompletního stavu aplikace
    exportAppState() {
        const state = {
            version: this.version,
            timestamp: new Date().toISOString(),
            initialized: this.initialized,
            config: { ...this.config },
            managers: Object.keys(this.managers),
            healthCheck: null // Bude naplněno async
        };
        
        // Anonymizace citlivých dat
        if (state.config.apiKeys) {
            Object.keys(state.config.apiKeys).forEach(key => {
                if (state.config.apiKeys[key]) {
                    state.config.apiKeys[key] = '***HIDDEN***';
                }
            });
        }
        
        return state;
    }

    // Získání statistik o využití
    getUsageStats() {
        const stats = {
            version: this.version,
            uptime: this.initialized ? Date.now() - this.initTime : 0,
            managers: Object.keys(this.managers).length,
            config: {
                hasWeatherKey: !!this.config.apiKeys.weather,
                hasMapsKey: !!this.config.apiKeys.maps,
                hasSheetsUrl: !!this.config.apiKeys.sheets
            }
        };
        
        // Přidání stats z managerů
        if (this.managers.prediction) {
            const predictionStats = this.managers.prediction.getPredictionStats();
            stats.prediction = predictionStats;
        }
        
        if (this.managers.ui) {
            stats.ui = this.managers.ui.getCurrentState();
        }
        
        return stats;
    }

    // Debug informace
    getDebugInfo() {
        return {
            app: this.exportAppState(),
            usage: this.getUsageStats(),
            performance: {
                memory: performance.memory ? {
                    used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
                    total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
                    limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
                } : 'Nedostupné',
                timing: performance.timing ? {
                    load: performance.timing.loadEventEnd - performance.timing.navigationStart,
                    dom: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
                } : 'Nedostupné'
            },
            browser: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                online: navigator.onLine,
                cookieEnabled: navigator.cookieEnabled
            }
        };
    }

    // Restart aplikace
    async restart() {
        console.log('🔄 Restartování aplikace...');
        
        if (this.managers.ui) {
            this.managers.ui.showNotification('🔄 Restartování aplikace...', 'info');
        }
        
        // Reset stavu
        this.initialized = false;
        this.managers = {};
        
        // Vyčištění cache
        if (this.managers.weather) {
            this.managers.weather.clearCache();
        }
        
        // Nová inicializace
        await this.initialize();
    }

    // Kontrola verze a aktualizací
    checkForUpdates() {
        // V reálné aplikaci by se kontrolovalo proti serveru
        console.log(`ℹ️ Aktuální verze: ${this.version}`);
        return {
            currentVersion: this.version,
            latestVersion: this.version,
            updateAvailable: false,
            updateUrl: null
        };
    }
}

// Globální utility funkce
window.DonulandUtils = {
    // Formátování čísel
    formatNumber: (num) => num.toLocaleString('cs-CZ'),
    
    // Formátování ceny
    formatPrice: (price) => `${price.toLocaleString('cs-CZ')} Kč`,
    
    // Formátování data
    formatDate: (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('cs-CZ', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    },
    
    // Validace emailu
    validateEmail: (email) => {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Generování UUID
    generateUUID: () => {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    },
    
    // Deep clone objektu
    deepClone: (obj) => JSON.parse(JSON.stringify(obj)),
    
    // Kontrola mobilního zařízení
    isMobile: () => window.innerWidth <= 768,
    
    // Throttle funkce
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
    // Vytvoření globální instance
    window.donulandApp = new DonulandApp();
    
    // Inicializace
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
            
            // 1. Načtení konfigurace
            await this.loadConfiguration();
            
            // 2. Inicializace managerů
            await this.initializeManagers();
            
            // 3. Načtení dat
            await this.loadInitialData();
            
            // 4. Nastavení event listenerů
            this.setupEventListeners();
            
            // 5. Nastavení UI
            this.setupUI();
            
            // 6. Finální kontroly
            await this.performHealthCheck();
            
            this.initialized = true;
            console.log('✅ Aplikace úspěšně inicializována!');
            
            // Zobrazení uvítací zprávy
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
            // Načtení z localStorage
            const savedConfig = localStorage.getItem('donulandConfig');
            if (savedConfig) {
                const parsed = JSON.parse(savedConfig);
                this.config = { ...this.config, ...parsed };
                console.log('📄 Konfigurace načtena z localStorage');
            }
            
            // Načtení starého formátu nastavení pro kompatibilitu
            const oldSettings = localStorage.getItem('donulandSettings');
            if (oldSettings) {
                const parsed = JSON.parse(oldSettings);
                if (parsed.apiKeyWeather) this.config.apiKeys.weather = parsed.apiKeyWeather;
                if (parsed.apiKeyMaps) this.config.apiKeys.maps = parsed.apiKeyMaps;
                if (parsed.googleSheetUrl) this.config.apiKeys.sheets = parsed.googleSheetUrl;
                if (parsed.defaultPrice) this.config.settings.defaultPrice = parsed.defaultPrice;
                
                // Migrace na nový formát
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
            // UI Manager
            if (window.uiManager) {
                this.managers.ui = window.uiManager;
                console.log('✅ UI Manager připojen');
            }
            
            // Weather Manager
            if (window.weatherManager) {
                this.managers.weather = window.weatherManager;
                this.managers.weather.setApiKey(this.config.apiKeys.weather);
                console.log('✅ Weather Manager inicializován');
            }
            
            // Autocomplete Manager
            if (window.autocompleteManager) {
                this.managers.autocomplete = window.autocompleteManager;
                console.log('✅ Autocomplete Manager připojen');
            }
            
            // Business Model Manager
            if (window.businessModelManager) {
                this.managers.businessModel = window.businessModelManager;
                console.log('✅ Business Model Manager připojen');
            }
            
            // Prediction Engine
            if (window.predictionEngine) {
                this.managers.prediction = window.predictionEngine;
                console.log('✅ Prediction Engine připojen');
            }
            
            // Data Manager - pokud existuje
            if (window.dataManager) {
                this.managers.data = window.dataManager;
                await this.managers.data.initialize(this.config.apiKeys.sheets);
                console.log('✅ Data Manager inicializován');
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
            // Načtení dat z Google Sheets
            let sheetsData = [];
            if (this.managers.data && this.config.apiKeys.sheets) {
                try {
                    sheetsData = await this.managers.data.loadGoogleSheetsData();
                    console.log(`📈 Načteno ${sheetsData.length} záznamů z Google Sheets`);
                } catch (error) {
                    console.warn('⚠️ Nepodařilo se načíst Google Sheets:', error);
                }
            }
            
            // Inicializace autocomplete s daty
            if (this.managers.autocomplete) {
                await this.managers.autocomplete.initialize(sheetsData);
            }
            
            // Aktualizace predikčního enginu s historickými daty
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
        
        // Global error handler
        window.addEventListener('error', (event) => {
            console.error('🚨 Globální chyba:', event.error);
            if (this.managers.ui) {
                this.managers.ui.showNotification(
                    'Vyskytla se neočekávaná chyba. Zkuste akci opakovat.',
                    'error'
                );
            }
        });
        
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('🚨 Neošetřená promise rejection:', event.reason);
            event.preventDefault();
        });
        
        // Před zavřením stránky
        window.addEventListener('beforeunload', (event) => {
            this.saveConfiguration();
        });
        
        // Změna online/offline stavu
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
        
        // Nastavení výchozích hodnot ve formulářích
        this.setDefaultFormValues();
        
        // Aktivace autocomplete
        if (this.managers.autocomplete && this.managers.autocomplete.isInitialized()) {
            console.log('🔤 Autocomplete aktivován');
        }
        
        // Nastavení počasí updatu
        this.setupWeatherUpdates();
    }

    // Nastavení výchozích hodnot formulářů
    setDefaultFormValues() {
        // Nastavení zítřejšího data
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
        
        // Výchozí čas
        const timeInput = document.getElementById('eventTime');
        if (timeInput && !timeInput.value) {
            timeInput.value = '10:00';
        }
        
        // Výchozí ceny
        const priceInput = document.getElementById('pricePerDonut');
        if (priceInput && !priceInput.value) {
            priceInput.value = this.config.settings.defaultPrice;
        }
        
        const costInput = document.getElementById('costPerDonut');
        if (costInput && !costInput.value) {
            costInput.value = this.config.settings.defaultCost;
        }
        
        // Výchozí náklady na palivo
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
                    this.managers.weather.updateWeatherForecast();
                }
            }, 1500);
            
            locationInput.addEventListener('input', updateWeather);
            dateInput.addEventListener('change', updateWeather);
        }
