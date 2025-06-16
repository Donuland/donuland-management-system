// =============================================================================
// MAIN APPLICATION INITIALIZATION
// =============================================================================

class DonulandApp {
    constructor() {
        this.initialized = false;
        this.version = '3.0';
        console.log(`🍩 Donuland Management System v${this.version} starting...`);
    }

    // Initialize the entire application
    async initialize() {
        try {
            console.log('🚀 Initializing Donuland Management System...');
            
            // Set default date to tomorrow
            this.setDefaultDate();
            
            // Initialize all modules in correct order
            await this.initializeModules();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Load initial data
            await this.loadInitialData();
            
            // Mark as initialized
            this.initialized = true;
            
            console.log('✅ Application initialized successfully');
            ui.showMessage('Aplikace byla úspěšně načtena', 'success');
            
        } catch (error) {
            console.error('❌ Initialization error:', error);
            ui.showMessage('Chyba při inicializaci aplikace: ' + error.message, 'error');
        }
    }

    // Set default date to tomorrow
    setDefaultDate() {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const eventDateField = document.getElementById('eventDate');
        if (eventDateField) {
            eventDateField.value = tomorrow.toISOString().split('T')[0];
        }
    }

    // Initialize all modules
    async initializeModules() {
        console.log('🔧 Initializing modules...');
        
        // 1. Settings (must be first)
        settings.initialize();
        
        // 2. Autocomplete
        autocomplete.initialize();
        autocomplete.addCommonCities();
        autocomplete.addCommonEventTypes();
        
        // 3. Business model
        businessModel.updateInfo();
        
        // 4. Rental model
        rental.updateRentalInputs();
        
        console.log('✅ All modules initialized');
    }

    // Setup global event listeners
    setupEventListeners() {
        console.log('🎧 Setting up event listeners...');
        
        // Handle form changes
        this.setupFormChangeListeners();
        
        // Handle keyboard shortcuts
        this.setupKeyboardShortcuts();
        
        // Handle window events
        this.setupWindowEvents();
        
        console.log('✅ Event listeners set up');
    }

    // Setup form change listeners
    setupFormChangeListeners() {
        // Auto-update prediction on form changes
        const predictionFields = [
            'eventType', 'expectedVisitors', 'eventDuration', 
            'donutCost', 'sellingPrice', 'transportCost', 'otherCosts',
            'fixedRental', 'percentageRental', 'mixedFixed', 'mixedPercentage'
        ];

        predictionFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('change', utils.debounce(() => {
                    if (this.initialized) {
                        prediction.updatePrediction();
                    }
                }, 300));
            }
        });

        // Auto-load weather on location/date changes
        const weatherFields = ['eventLocation', 'eventDate', 'eventDuration'];
        weatherFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('change', utils.debounce(() => {
                    if (this.initialized && document.getElementById('eventLocation').value.trim()) {
                        weather.loadWeather();
                    }
                }, 500));
            }
        });

        // Business model changes
        const businessModelRadios = document.querySelectorAll('input[name="businessModel"]');
        businessModelRadios.forEach(radio => {
            radio.addEventListener('change', () => {
                if (this.initialized) {
                    businessModel.updateInfo();
                    prediction.updatePrediction();
                }
            });
        });

        // Rental model changes
        const rentalModelSelect = document.getElementById('rentalModel');
        if (rentalModelSelect) {
            rentalModelSelect.addEventListener('change', () => {
                if (this.initialized) {
                    rental.updateRentalInputs();
                    prediction.updatePrediction();
                }
            });
        }

        // Environment changes
        const environmentSelect = document.getElementById('eventEnvironment');
        if (environmentSelect) {
            environmentSelect.addEventListener('change', () => {
                if (this.initialized) {
                    prediction.handleEnvironmentChange();
                }
            });
        }
    }

    // Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S to save prediction
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                if (GLOBAL_STATE.lastPrediction) {
                    prediction.saveCurrentPrediction();
                }
            }

            // Ctrl/Cmd + R to reload data
            if ((e.ctrlKey || e.metaKey) && e.key === 'r') {
                e.preventDefault();
                dataManager.loadData();
            }

            // Ctrl/Cmd + 1-4 to switch tabs
            if ((e.ctrlKey || e.metaKey) && e.key >= '1' && e.key <= '4') {
                e.preventDefault();
                const tabNames = ['prediction', 'calendar', 'analytics', 'settings'];
                const tabIndex = parseInt(e.key) - 1;
                if (tabNames[tabIndex]) {
                    ui.showTab(tabNames[tabIndex]);
                }
            }
        });
    }

    // Setup window events
    setupWindowEvents() {
        // Handle page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.initialized) {
                // Refresh data when page becomes visible again
                this.refreshDataIfNeeded();
            }
        });

        // Handle online/offline status
        window.addEventListener('online', () => {
            ui.showMessage('Připojení obnoveno', 'success');
            if (this.initialized) {
                dataManager.loadData();
            }
        });

        window.addEventListener('offline', () => {
            ui.showMessage('Připojení ztraceno - pracuje se v offline režimu', 'warning');
        });

        // Handle before unload
        window.addEventListener('beforeunload', (e) => {
            // Save any unsaved prediction
            if (GLOBAL_STATE.lastPrediction && !this.isCurrentPredictionSaved()) {
                e.preventDefault();
                e.returnValue = 'Máte neuloženou predikci. Opravdu chcete opustit stránku?';
            }
        });
    }

    // Load initial data
    async loadInitialData() {
        console.log('📊 Loading initial data...');
        
        try {
            // Load data from Google Sheets
            await dataManager.loadData();
            
            // Update autocomplete after data load
            autocomplete.updateData();
            
            console.log('✅ Initial data loaded');
            
        } catch (error) {
            console.error('❌ Error loading initial data:', error);
            // App will continue with demo data
        }
    }

    // Check if current prediction is saved
    isCurrentPredictionSaved() {
        if (!GLOBAL_STATE.lastPrediction) return true;
        
        const predictionId = utils.generateEventId(
            GLOBAL_STATE.lastPrediction.eventName,
            GLOBAL_STATE.lastPrediction.date,
            GLOBAL_STATE.lastPrediction.location
        );
        
        return GLOBAL_STATE.localSavedEvents.some(event => event.id === predictionId);
    }

    // Refresh data if needed (when page becomes visible)
    refreshDataIfNeeded() {
        const lastRefresh = localStorage.getItem('lastDataRefresh');
        const now = Date.now();
        const fiveMinutes = 5 * 60 * 1000;
        
        if (!lastRefresh || (now - parseInt(lastRefresh)) > fiveMinutes) {
            console.log('🔄 Auto-refreshing data...');
            dataManager.loadData();
            localStorage.setItem('lastDataRefresh', now.toString());
        }
    }

    // Get application status
    getStatus() {
        return {
            initialized: this.initialized,
            version: this.version,
            dataLoaded: GLOBAL_STATE.allSheetData.length > 0,
            historicalEvents: GLOBAL_STATE.historicalData.length,
            plannedEvents: GLOBAL_STATE.plannedEvents.length,
            localEvents: GLOBAL_STATE.localSavedEvents.length,
            lastPrediction: GLOBAL_STATE.lastPrediction ? true : false,
            weatherData: GLOBAL_STATE.currentWeatherData ? true : false
        };
    }

    // Debug information
    debug() {
        console.log('🐛 Debug Information:');
        console.log('Status:', this.getStatus());
        console.log('Global State:', GLOBAL_STATE);
        console.log('Config:', CONFIG);
        console.log('Autocomplete Stats:', autocomplete.getStats());
        console.log('Settings:', settings.get());
    }
}

// Global app instance
let app;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 DOM loaded, initializing app...');
    
    try {
        app = new DonulandApp();
        await app.initialize();
        
        // Make app available globally for debugging
        window.donulandApp = app;
        
    } catch (error) {
        console.error('❌ Failed to initialize app:', error);
        ui.showMessage('Kritická chyba při spuštění aplikace', 'error');
    }
});

// Global error handler
window.addEventListener('error', (e) => {
    console.error('Global error:', e.error);
    ui.showMessage('Neočekávaná chyba: ' + e.message, 'error');
});

// Global unhandled promise rejection handler
window.addEventListener('unhandledrejection', (e) => {
    console.error('Unhandled promise rejection:', e.reason);
    ui.showMessage('Chyba při asynchronní operaci', 'error');
});

// Expose key functions globally for HTML onclick handlers
window.ui = ui;
window.dataManager = dataManager;
window.weather = weather;
window.businessModel = businessModel;
window.rental = rental;
window.prediction = prediction;
window.autocomplete = autocomplete;
window.settings = settings;
