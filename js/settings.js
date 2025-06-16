// =============================================================================
// SETTINGS MANAGEMENT
// =============================================================================

const settings = {
    // Default settings
    defaultSettings: {
        defaultDonutPrice: 110,
        defaultDonutCost: 32,
        franchiseDonutPrice: 52,
        defaultTransportCost: 500,
        defaultOtherCosts: 200,
        defaultRentalModel: 'fixed',
        defaultFixedRental: 5000,
        weatherApiEnabled: true,
        autoSavePredictions: true,
        showAdvancedFeatures: false
    },

    // Load settings from localStorage
    load() {
        const saved = localStorage.getItem('donulandSettings');
        if (saved) {
            try {
                const loadedSettings = JSON.parse(saved);
                
                // Update settings form fields
                this.updateFormFields(loadedSettings);
                
                // Update prediction form with default values
                this.updatePredictionForm(loadedSettings);
                
                // Update business model configurations
                this.updateBusinessModelConfigs(loadedSettings);
                
                console.log('✅ Settings loaded:', loadedSettings);
                return loadedSettings;
            } catch (e) {
                console.error('Error loading settings:', e);
                return this.defaultSettings;
            }
        }
        
        // Load default settings if none exist
        this.updateFormFields(this.defaultSettings);
        this.updatePredictionForm(this.defaultSettings);
        return this.defaultSettings;
    },

    // Save settings to localStorage
    save() {
        try {
            const settingsData = this.collectFormData();
            
            // Validate settings
            const validation = this.validate(settingsData);
            if (!validation.isValid) {
                ui.showMessage('Chyba v nastavení: ' + validation.errors.join(', '), 'error');
                return false;
            }
            
            localStorage.setItem('donulandSettings', JSON.stringify(settingsData));
            
            // Update business model configurations
            this.updateBusinessModelConfigs(settingsData);
            
            // Update prediction form
            this.updatePredictionForm(settingsData);
            
            ui.showMessage('Nastavení bylo uloženo', 'success');
            
            console.log('✅ Settings saved:', settingsData);
            return true;
            
        } catch (error) {
            console.error('Error saving settings:', error);
            ui.showMessage('Chyba při ukládání nastavení', 'error');
            return false;
        }
    },

    // Collect form data
    collectFormData() {
        return {
            defaultDonutPrice: parseFloat(document.getElementById('defaultDonutPrice')?.value) || this.defaultSettings.defaultDonutPrice,
            defaultDonutCost: parseFloat(document.getElementById('defaultDonutCost')?.value) || this.defaultSettings.defaultDonutCost,
            franchiseDonutPrice: parseFloat(document.getElementById('franchiseDonutPrice')?.value) || this.defaultSettings.franchiseDonutPrice,
            defaultTransportCost: parseFloat(document.getElementById('defaultTransportCost')?.value) || this.defaultSettings.defaultTransportCost,
            defaultOtherCosts: parseFloat(document.getElementById('defaultOtherCosts')?.value) || this.defaultSettings.defaultOtherCosts,
            defaultRentalModel: document.getElementById('defaultRentalModel')?.value || this.defaultSettings.defaultRentalModel,
            defaultFixedRental: parseFloat(document.getElementById('defaultFixedRental')?.value) || this.defaultSettings.defaultFixedRental,
            weatherApiEnabled: document.getElementById('weatherApiEnabled')?.checked ?? this.defaultSettings.weatherApiEnabled,
            autoSavePredictions: document.getElementById('autoSavePredictions')?.checked ?? this.defaultSettings.autoSavePredictions,
            showAdvancedFeatures: document.getElementById('showAdvancedFeatures')?.checked ?? this.defaultSettings.showAdvancedFeatures
        };
    },

    // Update form fields with settings
    updateFormFields(settingsData) {
        const fields = [
            'defaultDonutPrice',
            'defaultDonutCost', 
            'franchiseDonutPrice',
            'defaultTransportCost',
            'defaultOtherCosts',
            'defaultRentalModel',
            'defaultFixedRental'
        ];

        fields.forEach(field => {
            const element = document.getElementById(field);
            if (element && settingsData[field] !== undefined) {
                element.value = settingsData[field];
            }
        });

        // Handle checkboxes
        const checkboxes = ['weatherApiEnabled', 'autoSavePredictions', 'showAdvancedFeatures'];
        checkboxes.forEach(field => {
            const element = document.getElementById(field);
            if (element && settingsData[field] !== undefined) {
                element.checked = settingsData[field];
            }
        });
    },

    // Update prediction form with default values
    updatePredictionForm(settingsData) {
        const predictionFields = {
            'sellingPrice': settingsData.defaultDonutPrice,
            'donutCost': settingsData.defaultDonutCost,
            'transportCost': settingsData.defaultTransportCost,
            'otherCosts': settingsData.defaultOtherCosts,
            'rentalModel': settingsData.defaultRentalModel,
            'fixedRental': settingsData.defaultFixedRental
        };

        Object.entries(predictionFields).forEach(([fieldId, value]) => {
            const element = document.getElementById(fieldId);
            if (element && value !== undefined) {
                element.value = value;
            }
        });
    },

    // Update business model configurations
    updateBusinessModelConfigs(settingsData) {
        if (CONFIG && CONFIG.BUSINESS_MODELS) {
            CONFIG.BUSINESS_MODELS.owner.donutCost = settingsData.defaultDonutCost;
            CONFIG.BUSINESS_MODELS.employee.donutCost = settingsData.defaultDonutCost;
            CONFIG.BUSINESS_MODELS.franchisee.donutCost = settingsData.franchiseDonutPrice;
            CONFIG.BUSINESS_MODELS.franchisee.yourProfit = settingsData.franchiseDonutPrice - settingsData.defaultDonutCost;
        }
    },

    // Validate settings
    validate(settingsData) {
        const errors = [];

        // Price validation
        if (settingsData.defaultDonutPrice <= settingsData.defaultDonutCost) {
            errors.push('Prodejní cena musí být vyšší než náklady na donut');
        }

        if (settingsData.franchiseDonutPrice <= settingsData.defaultDonutCost) {
            errors.push('Prodejní cena franšízantovi musí být vyšší než náklady na výrobu');
        }

        // Positive number validation
        const positiveFields = [
            'defaultDonutPrice', 'defaultDonutCost', 'franchiseDonutPrice',
            'defaultTransportCost', 'defaultOtherCosts', 'defaultFixedRental'
        ];

        positiveFields.forEach(field => {
            if (settingsData[field] < 0) {
                errors.push(`${field} musí být kladné číslo`);
            }
        });

        // Range validation
        if (settingsData.defaultDonutPrice > 500) {
            errors.push('Prodejní cena donutu je příliš vysoká (max 500 Kč)');
        }

        if (settingsData.defaultTransportCost > 10000) {
            errors.push('Náklady na dopravu jsou příliš vysoké (max 10 000 Kč)');
        }

        return {
            isValid: errors.length === 0,
            errors: errors
        };
    },

    // Reset to default settings
    reset() {
        if (confirm('Opravdu chcete obnovit výchozí nastavení? Všechny změny budou ztraceny.')) {
            localStorage.removeItem('donulandSettings');
            this.updateFormFields(this.defaultSettings);
            this.updatePredictionForm(this.defaultSettings);
            this.updateBusinessModelConfigs(this.defaultSettings);
            ui.showMessage('Nastavení bylo obnoveno na výchozí hodnoty', 'info');
        }
    },

    // Export settings
    export() {
        try {
            const settingsData = this.collectFormData();
            const dataStr = JSON.stringify(settingsData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = 'donuland-settings.json';
            link.click();
            
            ui.showMessage('Nastavení bylo exportováno', 'success');
        } catch (error) {
            console.error('Export error:', error);
            ui.showMessage('Chyba při exportu nastavení', 'error');
        }
    },

    // Import settings
    import(file) {
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedSettings = JSON.parse(e.target.result);
                    const validation = this.validate(importedSettings);
                    
                    if (!validation.isValid) {
                        ui.showMessage('Neplatné nastavení: ' + validation.errors.join(', '), 'error');
                        return;
                    }
                    
                    localStorage.setItem('donulandSettings', JSON.stringify(importedSettings));
                    this.updateFormFields(importedSettings);
                    this.updatePredictionForm(importedSettings);
                    this.updateBusinessModelConfigs(importedSettings);
                    
                    ui.showMessage('Nastavení bylo importováno', 'success');
                } catch (parseError) {
                    ui.showMessage('Chyba při načítání souboru nastavení', 'error');
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('Import error:', error);
            ui.showMessage('Chyba při importu nastavení', 'error');
        }
    },

    // Get current settings
    get() {
        const saved = localStorage.getItem('donulandSettings');
        if (saved) {
            try {
                return JSON.parse(saved);
            } catch (e) {
                return this.defaultSettings;
            }
        }
        return this.defaultSettings;
    },

    // Initialize settings on app start
    initialize() {
        console.log('⚙️ Initializing settings...');
        this.load();
        
        // Update rental inputs if needed
        if (typeof rental !== 'undefined') {
            rental.updateRentalInputs();
        }
        
        // Update business model info if needed
        if (typeof businessModel !== 'undefined') {
            businessModel.updateInfo();
        }
    }
};
