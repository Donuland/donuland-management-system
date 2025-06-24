// script.js - Kompatibilní přechodná verze
console.log('🍩 Donuland Management System - kompatibilní verze se načítá...');

// Globální fallback funkce pro HTML onclick handlery
window.showSection = function(sectionId) {
    console.log('📋 Zobrazuji sekci:', sectionId);
    
    // Skrytí všech sekcí
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    // Zobrazení cílové sekce
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    }
    
    // Aktivní stav navigace
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => item.classList.remove('active'));
    
    const activeNav = document.querySelector(`[onclick*="${sectionId}"]`);
    if (activeNav) {
        activeNav.classList.add('active');
    }
};

window.updatePrediction = function() {
    console.log('🔮 Aktualizuji predikci...');
    
    if (window.predictionEngine && typeof window.predictionEngine.calculatePrediction === 'function') {
        // Použije skutečný predikční engine
        const eventData = getFormData();
        window.predictionEngine.calculatePrediction(eventData).then(result => {
            displayPredictionResults(result);
        }).catch(error => {
            console.error('Chyba predikce:', error);
            showFallbackPrediction();
        });
    } else {
        // Fallback jednoduché predikce
        showFallbackPrediction();
    }
};

window.updateWeatherAndPrediction = function() {
    console.log('🌤️ Aktualizuji počasí a predikci...');
    
    if (window.weatherManager && typeof window.weatherManager.updateWeatherForecast === 'function') {
        window.weatherManager.updateWeatherForecast();
    } else {
        showFallbackWeather();
    }
    
    // Také aktualizuj predikci
    updatePrediction();
};

window.updateBusinessModelInfo = function() {
    console.log('👔 Aktualizuji business model info...');
    
    if (window.businessModelManager && typeof window.businessModelManager.updateBusinessModelInfo === 'function') {
        const select = document.getElementById('businessModel');
        if (select) {
            window.businessModelManager.updateBusinessModelInfo(select.value);
        }
    } else {
        showFallbackBusinessModel();
    }
};

window.updateRentModel = function() {
    console.log('🏪 Aktualizuji model nájmu...');
    
    const rentModel = document.getElementById('rentModel')?.value;
    const groups = {
        'fixed': 'fixedRentGroup',
        'percentage': 'percentageRentGroup', 
        'mixed': 'fixedPercentageGroup'
    };
    
    // Skrytí všech skupin
    Object.values(groups).forEach(groupId => {
        const group = document.getElementById(groupId);
        if (group) group.style.display = 'none';
    });
    
    // Zobrazení relevantní skupiny
    if (groups[rentModel]) {
        const group = document.getElementById(groups[rentModel]);
        if (group) group.style.display = 'block';
    }
    
    updatePrediction();
};

window.showEventSuggestions = function(value) {
    console.log('💡 Zobrazuji návrhy akcí pro:', value);
    
    if (window.autocompleteManager && typeof window.autocompleteManager.showEventSuggestions === 'function') {
        window.autocompleteManager.showEventSuggestions(value);
    }
};

window.showCitySuggestions = function(value) {
    console.log('🏙️ Zobrazuji návrhy měst pro:', value);
    
    if (window.autocompleteManager && typeof window.autocompleteManager.showCitySuggestions === 'function') {
        window.autocompleteManager.showCitySuggestions(value);
    }
};

window.loadData = function() {
    console.log('📊 Načítám data...');
    
    if (window.dataManager && typeof window.dataManager.loadGoogleSheetsData === 'function') {
        window.dataManager.loadGoogleSheetsData(true).then(data => {
            if (window.showNotification) {
                window.showNotification(`✅ Načteno ${data.length} záznamů!`, 'success');
            } else {
                alert(`Načteno ${data.length} záznamů z Google Sheets!`);
            }
        }).catch(error => {
            console.error('Chyba načítání:', error);
            if (window.showNotification) {
                window.showNotification(`❌ Chyba: ${error.message}`, 'error');
            } else {
                alert(`Chyba při načítání: ${error.message}`);
            }
        });
    } else {
        alert('Data manager není k dispozici. Zkontrolujte konzoli.');
    }
};

// Fallback funkce pro jednoduchou predikci
function showFallbackPrediction() {
    const attendance = parseInt(document.getElementById('expectedAttendees')?.value) || 0;
    const eventType = document.getElementById('eventType')?.value || '';
    
    if (attendance === 0 || !eventType) {
        const display = document.getElementById('predictionDisplay');
        if (display) {
            display.innerHTML = '📍 Vyplňte typ akce a návštěvnost pro načtení predikce';
        }
        return;
    }
    
    // Jednoduchý výpočet
    const conversionRates = {
        'food-festival': 0.15,
        'chocolate': 0.25,
        'family': 0.18,
        'cultural': 0.12,
        'other': 0.10
    };
    
    const rate = conversionRates[eventType] || 0.10;
    const expectedSales = Math.round(attendance * rate);
    const price = parseFloat(document.getElementById('donutPrice')?.value) || 50;
    const cost = parseFloat(document.getElementById('donutCost')?.value) || 25;
    const transport = parseFloat(document.getElementById('transportCost')?.value) || 500;
    const other = parseFloat(document.getElementById('otherCosts')?.value) || 1000;
    
    const revenue = expectedSales * price;
    const totalCosts = expectedSales * cost + transport + other;
    const profit = revenue - totalCosts;
    
    const display = document.getElementById('predictionDisplay');
    if (display) {
        display.innerHTML = `
            <div class="prediction-results">
                <h4>📊 Základní predikce</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px;">
                    <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 1.5em; font-weight: bold;">${expectedSales}</div>
                        <div style="font-size: 0.9em; color: #666;">donutů</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 1.5em; font-weight: bold;">${revenue.toLocaleString()}</div>
                        <div style="font-size: 0.9em; color: #666;">Kč tržby</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: #f8f9fa; border-radius: 8px;">
                        <div style="font-size: 1.5em; font-weight: bold;">${totalCosts.toLocaleString()}</div>
                        <div style="font-size: 0.9em; color: #666;">Kč náklady</div>
                    </div>
                    <div style="text-align: center; padding: 10px; background: ${profit > 0 ? '#d4edda' : '#f8d7da'}; border-radius: 8px;">
                        <div style="font-size: 1.5em; font-weight: bold; color: ${profit > 0 ? '#155724' : '#721c24'};">${profit.toLocaleString()}</div>
                        <div style="font-size: 0.9em; color: #666;">Kč zisk</div>
                    </div>
                </div>
                <div style="margin-top: 15px; padding: 10px; background: #fff3cd; border-radius: 6px; font-size: 0.9em;">
                    ⚠️ Základní výpočet. Pro pokročilé funkce počkejte na načtení všech modulů.
                </div>
            </div>
        `;
    }
}

// Fallback pro počasí
function showFallbackWeather() {
    const city = document.getElementById('location')?.value || '';
    const date = document.getElementById('eventStartDate')?.value || '';
    
    const display = document.getElementById('weatherForecast');
    if (display && city && date) {
        display.innerHTML = `
            <div style="text-align: center; padding: 20px; background: #e3f2fd; border-radius: 10px;">
                <div style="font-size: 3em;">🌤️</div>
                <h4>${city} - ${date}</h4>
                <p>Předpověď počasí není dostupná</p>
                <p style="font-size: 0.9em; color: #666;">Nastavte Weather API klíč v nastavení</p>
            </div>
        `;
    }
}

// Fallback pro business model
function showFallbackBusinessModel() {
    const model = document.getElementById('businessModel')?.value || '';
    const display = document.getElementById('businessModelInfo');
    
    if (display && model) {
        const descriptions = {
            'owner': '🏪 Majitel: Vy + 2 brigádníci, všechny náklady, 100% zisku',
            'employee': '👷 Zaměstnanec: Fixní mzda, méně rizika',
            'franchise': '🤝 Franšízant: Podpora značky, franšízový poplatek'
        };
        
        display.innerHTML = `
            <div style="padding: 10px; background: #f8f9fa; border-radius: 6px; margin-top: 10px;">
                ${descriptions[model] || 'Vyberte model podnikání'}
            </div>
        `;
        display.style.display = 'block';
    }
}

// Získání dat z formuláře
function getFormData() {
    return {
        name: document.getElementById('eventName')?.value || '',
        category: document.getElementById('eventType')?.value || '',
        startDate: document.getElementById('eventStartDate')?.value || '',
        location: document.getElementById('location')?.value || '',
        expectedAttendees: parseInt(document.getElementById('expectedAttendees')?.value) || 0,
        pricePerDonut: parseFloat(document.getElementById('donutPrice')?.value) || 50,
        costPerDonut: parseFloat(document.getElementById('donutCost')?.value) || 25,
        businessModel: document.getElementById('businessModel')?.value || ''
    };
}

// Zobrazení výsledků predikce
function displayPredictionResults(result) {
    const display = document.getElementById('predictionDisplay');
    if (!display) return;
    
    // Zde by bylo zobrazení pokročilých výsledků z prediction engine
    console.log('Zobrazuji pokročilé výsledky predikce:', result);
}

// Inicializace při načtení
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Spouštím kompatibilní inicializaci...');
    
    // Skrytí loading screen po 3 sekundách
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (mainApp) mainApp.style.display = 'block';
        
        console.log('✅ Aplikace zobrazena s kompatibilním scriptem');
        
        // Zkus aktivovat pokročilé funkce pokud jsou dostupné
        setTimeout(() => {
            checkAndActivateAdvancedFeatures();
        }, 1000);
        
    }, 3000);
});

// Kontrola a aktivace pokročilých funkcí
function checkAndActivateAdvancedFeatures() {
    console.log('🔍 Kontroluji dostupnost pokročilých modulů...');
    
    const modules = {
        dataManager: window.dataManager,
        weatherManager: window.weatherManager,
        autocompleteManager: window.autocompleteManager,
        businessModelManager: window.businessModelManager,
        predictionEngine: window.predictionEngine,
        donulandApp: window.donulandApp
    };
    
    const available = [];
    const missing = [];
    
    Object.entries(modules).forEach(([name, module]) => {
        if (module && typeof module === 'object') {
            available.push(name);
        } else {
            missing.push(name);
        }
    });
    
    console.log('✅ Dostupné moduly:', available);
    console.log('❌ Chybějící moduly:', missing);
    
    // Aktivace dostupných funkcí
    if (available.length > 0) {
        activateAvailableFeatures(available);
    }
    
    // Zobrazení stavu uživateli
    showModuleStatus(available, missing);
}

// Aktivace dostupných funkcí
function activateAvailableFeatures(availableModules) {
    console.log('🚀 Aktivuji dostupné funkce...');
    
    // Inicializace autocomplete pokud je dostupný
    if (availableModules.includes('autocompleteManager')) {
        try {
            window.autocompleteManager.initialize();
            console.log('✅ Autocomplete aktivován');
        } catch (error) {
            console.warn('⚠️ Chyba aktivace autocomplete:', error);
        }
    }
    
    // Inicializace weather manageru
    if (availableModules.includes('weatherManager')) {
        try {
            // Nastavení API klíče z localStorage nebo default
            const savedSettings = localStorage.getItem('donulandSettings');
            if (savedSettings) {
                const settings = JSON.parse(savedSettings);
                if (settings.weatherApiKey) {
                    window.weatherManager.setApiKey(settings.weatherApiKey);
                    console.log('✅ Weather manager aktivován s API klíčem');
                }
            }
        } catch (error) {
            console.warn('⚠️ Chyba aktivace weather manageru:', error);
        }
    }
    
    // Aktivace business model manageru
    if (availableModules.includes('businessModelManager')) {
        try {
            // Business model je už automaticky aktivní
            console.log('✅ Business model manager aktivován');
        } catch (error) {
            console.warn('⚠️ Chyba aktivace business model manageru:', error);
        }
    }
    
    // Inicializace data manageru
    if (availableModules.includes('dataManager')) {
        try {
            // Načtení konfigurace data manageru
            console.log('✅ Data manager aktivován');
        } catch (error) {
            console.warn('⚠️ Chyba aktivace data manageru:', error);
        }
    }
    
    // Inicializace predikčního enginu
    if (availableModules.includes('predictionEngine')) {
        try {
            // Predikční engine je připraven
            console.log('✅ Prediction engine aktivován');
        } catch (error) {
            console.warn('⚠️ Chyba aktivace prediction engine:', error);
        }
    }
    
    // Inicializace hlavní aplikace
    if (availableModules.includes('donulandApp')) {
        try {
            console.log('✅ Hlavní aplikace aktivována');
        } catch (error) {
            console.warn('⚠️ Chyba aktivace hlavní aplikace:', error);
        }
    }
}

// Zobrazení stavu modulů uživateli
function showModuleStatus(available, missing) {
    const statusHtml = `
        <div style="position: fixed; top: 10px; right: 10px; background: white; border: 2px solid #ddd; border-radius: 10px; padding: 15px; box-shadow: 0 4px 8px rgba(0,0,0,0.1); z-index: 9999; max-width: 300px;">
            <h4 style="margin: 0 0 10px 0; color: #333;">🔧 Stav modulů</h4>
            
            ${available.length > 0 ? `
                <div style="margin-bottom: 10px;">
                    <strong style="color: #28a745;">✅ Aktivní (${available.length}):</strong><br>
                    <small style="color: #666;">${available.join(', ')}</small>
                </div>
            ` : ''}
            
            ${missing.length > 0 ? `
                <div style="margin-bottom: 10px;">
                    <strong style="color: #dc3545;">❌ Chybí (${missing.length}):</strong><br>
                    <small style="color: #666;">${missing.join(', ')}</small>
                </div>
            ` : ''}
            
            <div style="margin-top: 10px; padding-top: 10px; border-top: 1px solid #eee;">
                <small style="color: #666;">
                    ${available.length === 6 ? '🎉 Všechny moduly fungují!' : '⚠️ Některé funkce jsou omezené'}
                </small>
            </div>
            
            <button onclick="this.parentElement.style.display='none'" style="position: absolute; top: 5px; right: 8px; background: none; border: none; font-size: 16px; cursor: pointer;">×</button>
        </div>
    `;
    
    // Zobrazení na 10 sekund
    const statusDiv = document.createElement('div');
    statusDiv.innerHTML = statusHtml;
    document.body.appendChild(statusDiv);
    
    setTimeout(() => {
        if (statusDiv.parentElement) {
            statusDiv.parentElement.removeChild(statusDiv);
        }
    }, 10000);
}

// Nastavení výchozích hodnot
function setDefaultValues() {
    // Nastavení zítřejšího data
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    const dateInput = document.getElementById('eventStartDate');
    if (dateInput && !dateInput.value) {
        dateInput.value = tomorrowStr;
        dateInput.min = new Date().toISOString().split('T')[0];
    }
}

// Aktivace nastavení
window.saveSettings = function() {
    console.log('💾 Ukládám nastavení...');
    
    const settings = {
        defaultDonutPrice: document.getElementById('defaultDonutPrice')?.value || 50,
        defaultDonutCost: document.getElementById('defaultDonutCost')?.value || 25,
        franchiseDonutPrice: document.getElementById('franchiseDonutPrice')?.value || 35,
        weatherApiKey: document.getElementById('weatherApiKey')?.value || '',
        googleSheetsUrl: document.getElementById('googleSheetsUrl')?.value || ''
    };
    
    localStorage.setItem('donulandSettings', JSON.stringify(settings));
    
    // Aplikace nastavení na weather manager
    if (window.weatherManager && settings.weatherApiKey) {
        window.weatherManager.setApiKey(settings.weatherApiKey);
    }
    
    // Aplikace nastavení na data manager
    if (window.dataManager && settings.googleSheetsUrl) {
        window.dataManager.setGoogleSheetUrl(settings.googleSheetsUrl);
    }
    
    // Vizuální potvrzení
    const saveButton = document.getElementById('saveSettings');
    if (saveButton) {
        const originalText = saveButton.textContent;
        saveButton.textContent = '✅ Uloženo!';
        saveButton.style.backgroundColor = '#28a745';
        
        setTimeout(() => {
            saveButton.textContent = originalText;
            saveButton.style.backgroundColor = '';
        }, 2000);
    }
    
    alert('Nastavení bylo úspěšně uloženo!');
};

// Načtení uložených nastavení
function loadSavedSettings() {
    const savedSettings = localStorage.getItem('donulandSettings');
    if (savedSettings) {
        try {
            const settings = JSON.parse(savedSettings);
            
            // Aplikace na formuláře
            if (settings.defaultDonutPrice) {
                const priceInput = document.getElementById('defaultDonutPrice');
                if (priceInput) priceInput.value = settings.defaultDonutPrice;
                
                const donutPriceInput = document.getElementById('donutPrice');
                if (donutPriceInput) donutPriceInput.value = settings.defaultDonutPrice;
            }
            
            if (settings.defaultDonutCost) {
                const costInput = document.getElementById('defaultDonutCost');
                if (costInput) costInput.value = settings.defaultDonutCost;
                
                const donutCostInput = document.getElementById('donutCost');
                if (donutCostInput) donutCostInput.value = settings.defaultDonutCost;
            }
            
            if (settings.franchiseDonutPrice) {
                const franchiseInput = document.getElementById('franchiseDonutPrice');
                if (franchiseInput) franchiseInput.value = settings.franchiseDonutPrice;
            }
            
            if (settings.weatherApiKey) {
                const apiKeyInput = document.getElementById('weatherApiKey');
                if (apiKeyInput) apiKeyInput.value = settings.weatherApiKey;
            }
            
            if (settings.googleSheetsUrl) {
                const sheetsInput = document.getElementById('googleSheetsUrl');
                if (sheetsInput) sheetsInput.value = settings.googleSheetsUrl;
            }
            
            console.log('✅ Uložená nastavení aplikována');
        } catch (error) {
            console.warn('⚠️ Chyba při načítání nastavení:', error);
        }
    }
}

// Inicializace při načtení stránky
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        setDefaultValues();
        loadSavedSettings();
    }, 500);
});

console.log('✅ Kompatibilní script.js načten');
