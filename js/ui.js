// ui.js - UI management a zobrazení výsledků predikce
class UIManager {
    constructor() {
        this.currentTab = 'prediction';
        this.isLoading = false;
        this.notifications = [];
        
        this.setupEventListeners();
        console.log('🖥️ UI Manager inicializován');
    }

    // Nastavení event listenerů
    setupEventListeners() {
        document.addEventListener('DOMContentLoaded', () => {
            this.initializeTabs();
            this.setupFormListeners();
            this.setupResponsiveHandlers();
        });
    }

    // Inicializace tabů
    initializeTabs() {
        const tabButtons = document.querySelectorAll('.nav-tab');
        tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const tabName = e.target.textContent.toLowerCase().includes('predikce') ? 'prediction' :
                              e.target.textContent.toLowerCase().includes('kalendář') ? 'calendar' :
                              e.target.textContent.toLowerCase().includes('analýz') ? 'analytics' : 'settings';
                this.showTab(tabName);
            });
        });
    }

    // Nastavení formulářových listenerů
    setupFormListeners() {
        // Predikční formulář
        const predictionForm = document.getElementById('predictionForm');
        if (predictionForm) {
            predictionForm.addEventListener('submit', (e) => this.handlePredictionSubmit(e));
        }

        // Real-time aktualizace počasí
        const locationInput = document.getElementById('location');
        const dateInput = document.getElementById('eventStartDate');
        
        if (locationInput && dateInput) {
            locationInput.addEventListener('input', this.debounce(() => {
                if (window.weatherManager) {
                    window.weatherManager.updateWeatherForecast();
                }
            }, 1000));
            
            dateInput.addEventListener('change', () => {
                if (window.weatherManager) {
                    window.weatherManager.updateWeatherForecast();
                }
            });
        }
    }

    // Debounce funkce
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

    // Přepínání tabů
    showTab(tabName) {
        // Skrytí všech tabů
        const tabs = document.querySelectorAll('.tab-content');
        tabs.forEach(tab => tab.classList.remove('active'));
        
        // Odebrání active třídy ze všech tlačítek
        const navTabs = document.querySelectorAll('.nav-tab');
        navTabs.forEach(tab => tab.classList.remove('active'));
        
        // Zobrazení vybraného tabu
        const targetTab = document.getElementById(tabName);
        if (targetTab) {
            targetTab.classList.add('active');
        }
        
        // Aktivace odpovídajícího tlačítka
        const activeButton = Array.from(navTabs).find(button => {
            const text = button.textContent.toLowerCase();
            return (tabName === 'prediction' && text.includes('predikce')) ||
                   (tabName === 'calendar' && text.includes('kalendář')) ||
                   (tabName === 'analytics' && text.includes('analýz')) ||
                   (tabName === 'settings' && text.includes('nastavení'));
        });
        
        if (activeButton) {
            activeButton.classList.add('active');
        }
        
        this.currentTab = tabName;
        
        // Načtení dat pro konkrétní tab
        this.loadTabData(tabName);
        
        console.log(`📋 Přepnuto na tab: ${tabName}`);
    }

    // Načtení dat pro tab
    loadTabData(tabName) {
        switch (tabName) {
            case 'calendar':
                if (window.dataManager) {
                    window.dataManager.loadEvents();
                }
                break;
            case 'analytics':
                if (window.analyticsManager) {
                    window.analyticsManager.loadAnalytics();
                }
                break;
            case 'settings':
                if (window.settingsManager) {
                    window.settingsManager.loadSettings();
                }
                break;
        }
    }

    // Zpracování predikčního formuláře
    async handlePredictionSubmit(e) {
        e.preventDefault();
        
        if (this.isLoading) {
            this.showNotification('Predikce se již zpracovává...', 'warning');
            return;
        }
        
        try {
            this.setLoading(true);
            
            // Získání dat z formuláře
            const eventData = this.getFormData();
            
            // Validace dat
            const validation = this.validateEventData(eventData);
            if (!validation.isValid) {
                this.showNotification(`Chyba ve formuláři: ${validation.message}`, 'error');
                return;
            }
            
            // Získání počasí
            let weather = null;
            if (window.weatherManager) {
                try {
                    weather = await window.weatherManager.getWeatherForDate(eventData.location, eventData.startDate);
                } catch (error) {
                    console.warn('⚠️ Nepodařilo se načíst počasí:', error);
                }
            }
            
            // Výpočet predikce
            if (!window.predictionEngine) {
                throw new Error('Predikční engine není inicializován');
            }
            
            const prediction = await window.predictionEngine.calculatePrediction(eventData, weather);
            
            // Zobrazení výsledků
            this.displayPredictionResults(prediction, weather, eventData);
            
            this.showNotification('Predikce úspěšně vypočítána!', 'success');
            
        } catch (error) {
            console.error('❌ Chyba při zpracování predikce:', error);
            this.showNotification(`Chyba při výpočtu predikce: ${error.message}`, 'error');
        } finally {
            this.setLoading(false);
        }
    }

    // Získání dat z formuláře
    getFormData() {
        return {
            name: document.getElementById('eventName')?.value || '',
            category: document.getElementById('eventCategory')?.value || '',
            startDate: document.getElementById('eventStartDate')?.value || '',
            endDate: document.getElementById('eventEndDate')?.value || '',
            time: document.getElementById('eventTime')?.value || '',
            location: document.getElementById('location')?.value || '',
            expectedAttendees: parseInt(document.getElementById('expectedAttendees')?.value) || 0,
            pricePerDonut: parseInt(document.getElementById('pricePerDonut')?.value) || 45,
            costPerDonut: parseInt(document.getElementById('costPerDonut')?.value) || 18,
            businessModel: document.getElementById('businessModel')?.value || '',
            distanceKm: parseFloat(document.getElementById('distanceKm')?.value) || 0,
            fuelCostPerKm: parseFloat(document.getElementById('fuelCostPerKm')?.value) || 8
        };
    }

    // Validace dat z formuláře
    validateEventData(data) {
        if (!data.name.trim()) {
            return { isValid: false, message: 'Název akce je povinný' };
        }
        
        if (!data.category) {
            return { isValid: false, message: 'Kategorie akce je povinná' };
        }
        
        if (!data.startDate) {
            return { isValid: false, message: 'Datum začátku je povinné' };
        }
        
        if (!data.location.trim()) {
            return { isValid: false, message: 'Lokace je povinná' };
        }
        
        if (data.expectedAttendees <= 0) {
            return { isValid: false, message: 'Počet účastníků musí být větší než 0' };
        }
        
        if (data.pricePerDonut <= 0) {
            return { isValid: false, message: 'Prodejní cena musí být větší než 0' };
        }
        
        if (data.costPerDonut <= 0) {
            return { isValid: false, message: 'Náklad na donut musí být větší než 0' };
        }
        
        if (!data.businessModel) {
            return { isValid: false, message: 'Business model je povinný' };
        }
        
        // Kontrola dat
        const startDate = new Date(data.startDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (startDate < today) {
            return { isValid: false, message: 'Datum akce nemůže být v minulosti' };
        }
        
        if (data.endDate) {
            const endDate = new Date(data.endDate);
            if (endDate < startDate) {
                return { isValid: false, message: 'Datum konce nemůže být před začátkem' };
            }
        }
        
        return { isValid: true };
    }

    // Zobrazení výsledků predikce
    displayPredictionResults(prediction, weather, eventData) {
        const resultsDiv = document.getElementById('predictionResults');
        if (!resultsDiv) return;

        // Hlavní výsledky
        const mainResults = this.createMainResultsHTML(prediction, eventData);
        
        // Počasí
        const weatherHTML = this.createWeatherHTML(weather);
        
        // Rozpis nákladů
        const costsHTML = this.createCostsBreakdownHTML(prediction.costs);
        
        // Faktory predikce
        const factorsHTML = this.createFactorsHTML(prediction.factors);
        
        // Doporučení
        const recommendationsHTML = this.createRecommendationsHTML(prediction.recommendations);
        
        // Sestavení celého HTML
        resultsDiv.innerHTML = `
            ${mainResults}
            ${weatherHTML}
            ${costsHTML}
            ${factorsHTML}
            ${recommendationsHTML}
        `;
        
        // Scroll k výsledkům
        resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Vytvoření HTML pro hlavní výsledky
    createMainResultsHTML(prediction, eventData) {
        const profitColor = prediction.profit > 0 ? '#4CAF50' : '#f44336';
        const confidenceColor = prediction.confidence > 70 ? '#4CAF50' : 
                              prediction.confidence > 50 ? '#ff9800' : '#f44336';
        
        return `
            <div class="prediction-result">
                <h4>🎯 Predikce prodeje pro "${eventData.name}"</h4>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-top: 20px;">
                    <div class="result-card">
                        <div class="result-icon">📦</div>
                        <div class="result-label">Doporučené množství</div>
                        <div class="result-value">${prediction.quantity.toLocaleString()}</div>
                        <div class="result-unit">donutů</div>
                    </div>
                    
                    <div class="result-card">
                        <div class="result-icon">💰</div>
                        <div class="result-label">Očekávané tržby</div>
                        <div class="result-value">${prediction.revenue.toLocaleString()}</div>
                        <div class="result-unit">Kč</div>
                    </div>
                    
                    <div class="result-card">
                        <div class="result-icon">📊</div>
                        <div class="result-label">Čistý zisk</div>
                        <div class="result-value" style="color: ${profitColor}">${prediction.profit.toLocaleString()}</div>
                        <div class="result-unit">Kč (${prediction.profitMargin}%)</div>
                    </div>
                    
                    <div class="result-card">
                        <div class="result-icon">🎯</div>
                        <div class="result-label">Spolehlivost</div>
                        <div class="result-value" style="color: ${confidenceColor}">${prediction.confidence}</div>
                        <div class="result-unit">%</div>
                    </div>
                    
                    ${prediction.eventDays > 1 ? `
                        <div class="result-card">
                            <div class="result-icon">📅</div>
                            <div class="result-label">Doba akce</div>
                            <div class="result-value">${prediction.eventDays}</div>
                            <div class="result-unit">${prediction.eventDays === 1 ? 'den' : prediction.eventDays < 5 ? 'dny' : 'dní'}</div>
                        </div>
                    ` : ''}
                </div>
                
                <div style="margin-top: 20px; padding: 15px; background: ${this.getBusinessModelColor(eventData.businessModel)}20; border-radius: 10px; border-left: 4px solid ${this.getBusinessModelColor(eventData.businessModel)};">
                    <strong>${this.getBusinessModelIcon(eventData.businessModel)} Business model: ${this.getBusinessModelName(eventData.businessModel)}</strong>
                </div>
            </div>
        `;
    }

    // Vytvoření HTML pro počasí
    createWeatherHTML(weather) {
        if (!weather) {
            return '<div class="error">❌ Předpověď počasí není k dispozici</div>';
        }
        
        const warnings = this.getWeatherWarnings(weather);
        const warningsHTML = warnings.length > 0 ? `
            <div style="margin-top: 10px; padding: 10px; background: #fff3cd; border-radius: 6px; border-left: 4px solid #ffc107;">
                <strong>⚠️ Varování:</strong> ${warnings.join(', ')}
            </div>
        ` : '';
        
        return `
            <div class="weather-info" style="margin-top: 20px;">
                <div class="weather-icon" style="font-size: 3em;">${this.getWeatherIcon(weather.main)}</div>
                <div>
                    <h4 style="margin: 0; color: #ff6b6b;">📊 Predikované počasí</h4>
                    <p style="margin: 5px 0;"><strong>Podmínky:</strong> ${weather.description}</p>
                    <p style="margin: 5px 0;"><strong>Teplota:</strong> ${Math.round(weather.temp)}°C</p>
                    <p style="margin: 5px 0;"><strong>Vlhkost:</strong> ${weather.humidity}%</p>
                    <p style="margin: 5px 0;"><strong>Vítr:</strong> ${Math.round(weather.windSpeed || 0)} m/s</p>
                    ${warningsHTML}
                </div>
            </div>
        `;
    }

    // Vytvoření HTML pro rozpis nákladů
    createCostsBreakdownHTML(costs) {
        return `
            <div class="card" style="margin-top: 20px;">
                <h4>💰 Detailní rozpis nákladů</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                    <div>
                        <div class="cost-item">
                            <span>🍩 Výroba donutů:</span>
                            <span><strong>${costs.production.toLocaleString()} Kč</strong></span>
                        </div>
                        <div class="cost-item">
                            <span>🚚 Doprava:</span>
                            <span><strong>${costs.fuel.toLocaleString()} Kč</strong></span>
                        </div>
                        <div class="cost-item">
                            <span>👥 Mzdy/práce:</span
