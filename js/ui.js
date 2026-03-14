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
                                                    const tabName = e.target.textContent.toLowerCase().includes('predikce') ? 'prediction'
                                                                            : e.target.textContent.toLowerCase().includes('kalendář') ? 'calendar'
                                                                            : e.target.textContent.toLowerCase().includes('analýz') ? 'analytics'
                                                                            : 'settings';
                                                    this.showTab(tabName);
                                });
                });
    }

    // Nastavení formulářových listenerů
    setupFormListeners() {
                const predictionForm = document.getElementById('predictionForm');
                if (predictionForm) {
                                predictionForm.addEventListener('submit', (e) => this.handlePredictionSubmit(e));
                }
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

    // Nastavení responsivních handlerů
    setupResponsiveHandlers() {
                window.addEventListener('resize', this.debounce(() => {
                                console.log('📱 Změna velikosti okna');
                }, 300));
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
                const tabs = document.querySelectorAll('.tab-content');
                tabs.forEach(tab => tab.classList.remove('active'));
                const navTabs = document.querySelectorAll('.nav-tab');
                navTabs.forEach(tab => tab.classList.remove('active'));
                const targetTab = document.getElementById(tabName);
                if (targetTab) {
                                targetTab.classList.add('active');
                }
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
                this.loadTabData(tabName);
                console.log(`📋 Přepnuto na tab: ${tabName}`);
    }

    // Načtení dat pro tab
    loadTabData(tabName) {
                switch (tabName) {
                    case 'calendar':
                                        if (window.dataManager) { window.dataManager.loadEvents(); }
                                        break;
                    case 'analytics':
                                        if (window.analyticsManager) { window.analyticsManager.loadAnalytics(); }
                                        break;
                    case 'settings':
                                        if (window.settingsManager) { window.settingsManager.loadSettings(); }
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
                                const eventData = this.getFormData();
                                const validation = this.validateEventData(eventData);
                                if (!validation.isValid) {
                                                    this.showNotification(`Chyba ve formuláři: ${validation.message}`, 'error');
                                                    return;
                                }
                                let weather = null;
                                if (window.weatherManager) {
                                                    try {
                                                                            weather = await window.weatherManager.getWeatherForDate(eventData.location, eventData.startDate);
                                                    } catch (error) {
                                                                            console.warn('⚠️ Nepodařilo se načíst počasí:', error);
                                                    }
                                }
                                if (!window.predictionEngine) {
                                                    throw new Error('Predikční engine není inicializován');
                                }
                                const prediction = await window.predictionEngine.calculatePrediction(eventData, weather);
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
                                category: document.getElementById('eventCategory')?.value || document.getElementById('eventType')?.value || '',
                                startDate: document.getElementById('eventStartDate')?.value || '',
                                endDate: document.getElementById('eventEndDate')?.value || '',
                                time: document.getElementById('eventTime')?.value || '',
                                location: document.getElementById('location')?.value || '',
                                expectedAttendees: parseInt(document.getElementById('expectedAttendees')?.value) || 0,
                                pricePerDonut: parseFloat(document.getElementById('pricePerDonut')?.value || document.getElementById('donutPrice')?.value) || 45,
                                costPerDonut: parseFloat(document.getElementById('costPerDonut')?.value || document.getElementById('donutCost')?.value) || 18,
                                businessModel: document.getElementById('businessModel')?.value || '',
                                distanceKm: parseFloat(document.getElementById('distanceKm')?.value) || 0,
                                fuelCostPerKm: parseFloat(document.getElementById('fuelCostPerKm')?.value) || 8
                };
    }

    // Validace dat z formuláře
    validateEventData(data) {
                if (!data.name.trim()) return { isValid: false, message: 'Název akce je povinný' };
                if (!data.category) return { isValid: false, message: 'Kategorie akce je povinná' };
                if (!data.startDate) return { isValid: false, message: 'Datum začátku je povinné' };
                if (!data.location.trim()) return { isValid: false, message: 'Lokace je povinná' };
                if (data.expectedAttendees <= 0) return { isValid: false, message: 'Počet účastníků musí být větší než 0' };
                if (data.pricePerDonut <= 0) return { isValid: false, message: 'Prodejní cena musí být větší než 0' };
                if (data.costPerDonut <= 0) return { isValid: false, message: 'Náklad na donut musí být větší než 0' };
                if (!data.businessModel) return { isValid: false, message: 'Business model je povinný' };
                const startDate = new Date(data.startDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (startDate < today) return { isValid: false, message: 'Datum akce nemůže být v minulosti' };
                if (data.endDate) {
                                const endDate = new Date(data.endDate);
                                if (endDate < startDate) return { isValid: false, message: 'Datum konce nemůže být před začátkem' };
                }
                return { isValid: true };
    }

    // Zobrazení výsledků predikce
    displayPredictionResults(prediction, weather, eventData) {
                const resultsDiv = document.getElementById('predictionResults') || document.getElementById('predictionDisplay');
                if (!resultsDiv) return;
                const mainResults = this.createMainResultsHTML(prediction, eventData);
                const weatherHTML = this.createWeatherHTML(weather);
                const costsHTML = this.createCostsBreakdownHTML(prediction.costs);
                const factorsHTML = this.createFactorsHTML(prediction.factors);
                const recommendationsHTML = this.createRecommendationsHTML(prediction.recommendations);
                resultsDiv.innerHTML = `${mainResults}${weatherHTML}${costsHTML}${factorsHTML}${recommendationsHTML}`;
                resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // Vytvoření HTML pro hlavní výsledky
    createMainResultsHTML(prediction, eventData) {
                const profitColor = prediction.profit > 0 ? '#4CAF50' : '#f44336';
                const confidenceColor = prediction.confidence > 70 ? '#4CAF50' : prediction.confidence > 50 ? '#ff9800' : '#f44336';
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
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </div>` : ''}
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
                                                        </div>` : '';
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
                if (!costs) return '';
                return `
                            <div class="card" style="margin-top: 20px;">
                                            <h4>💰 Detailní rozpis nákladů</h4>
                                                            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px;">
                                                                                <div>
                                                                                                        <div class="cost-item">
                                                                                                                                    <span>🍩 Výroba donutů:</span>
                                                                                                                                                                <span><strong>${(costs.production || 0).toLocaleString()} Kč</strong></span>
                                                                                                                                                                                        </div>
                                                                                                                                                                                                                <div class="cost-item">
                                                                                                                                                                                                                                            <span>🚚 Doprava:</span>
                                                                                                                                                                                                                                                                        <span><strong>${(costs.fuel || 0).toLocaleString()} Kč</strong></span>
                                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                                                        <div class="cost-item">
                                                                                                                                                                                                                                                                                                                                                    <span>👥 Mzdy/práce:</span>
                                                                                                                                                                                                                                                                                                                                                                                <span><strong>${(costs.labor || 0).toLocaleString()} Kč</strong></span>
                                                                                                                                                                                                                                                                                                                                                                                                        </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                ${costs.franchise > 0 ? `
                                                                                                                                                                                                                                                                                                                                                                                                                                                        <div class="cost-item">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    <span>🤝 Franšízový poplatek:</span>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                <span><strong>${costs.franchise.toLocaleString()} Kč</strong></span>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        </div>` : ''}
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                <div class="cost-item" style="border-top: 2px solid #ff6b6b; margin-top: 10px; padding-top: 10px;">
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            <span><strong>📊 Celkové náklady:</strong></span>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        <span><strong>${(costs.total || 0).toLocaleString()} Kč</strong></span>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                </div>
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        `;
    }

    // Vytvoření HTML pro faktory predikce
    createFactorsHTML(factors) {
                if (!factors) return '';
                const factorItems = [
                    { label: '🌤️ Počasí', value: factors.weather, desc: 'Vliv počasí na prodej' },
                    { label: '📈 Historie', value: factors.historical, desc: 'Vliv historických dat' },
                    { label: '📍 Lokace', value: factors.location, desc: 'Popularita místa' },
                    { label: '🏷️ Kategorie', value: factors.category, desc: 'Typ akce' },
                    { label: '📅 Den v týdnu', value: factors.day, desc: 'Den konání' },
                    { label: '⏰ Čas', value: factors.time, desc: 'Čas konání' }
                            ];
                const factorsHTML = factorItems.map(f => `
                            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #eee;">
                                            <span title="${f.desc}">${f.label}</span>
                                                            <span style="font-weight: bold; color: ${(f.value || 1) >= 1 ? '#4CAF50' : '#f44336'};">
                                                                                ${f.value ? (f.value >= 1 ? '+' : '') + ((f.value - 1) * 100).toFixed(0) + '%' : 'N/A'}
                                                                                                </span>
                                                                                                            </div>
                                                                                                                    `).join('');
                return `
                            <div class="card" style="margin-top: 20px;">
                                            <h4>🧮 Faktory predikce</h4>
                                                            ${factorsHTML}
                                                                        </div>
                                                                                `;
    }

    // Vytvoření HTML pro doporučení
    createRecommendationsHTML(recommendations) {
                if (!recommendations || recommendations.length === 0) return '';
                const colors = { danger: '#f44336', warning: '#ff9800', info: '#2196F3', success: '#4CAF50' };
                const recsHTML = recommendations.map(rec => `
                            <div style="padding: 10px; margin: 8px 0; background: ${colors[rec.type] || '#2196F3'}15; border-left: 4px solid ${colors[rec.type] || '#2196F3'}; border-radius: 4px;">
                                            ${rec.icon} ${rec.text}
                                                        </div>
                                                                `).join('');
                return `
                            <div class="card" style="margin-top: 20px;">
                                            <h4>💡 Doporučení</h4>
                                                            ${recsHTML}
                                                                        </div>
                                                                                `;
    }

    // Helper metody pro business model
    getBusinessModelColor(model) {
                const colors = { owner: '#ff6b6b', employee: '#4ECDC4', franchise: '#45B7D1' };
                return colors[model] || '#ff6b6b';
    }

    getBusinessModelIcon(model) {
                const icons = { owner: '🏪', employee: '👷', franchise: '🤝' };
                return icons[model] || '🏪';
    }

    getBusinessModelName(model) {
                const names = { owner: 'Majitel', employee: 'Zaměstnanec', franchise: 'Franšízant' };
                return names[model] || model;
    }

    // Helper metody pro počasí
    getWeatherIcon(condition) {
                const icons = {
                                'Clear': '☀️', 'Clouds': '☁️', 'Rain': '🌧️',
                                'Drizzle': '🌦️', 'Thunderstorm': '⛈️', 'Snow': '❄️',
                                'Mist': '🌫️', 'Fog': '🌫️'
                };
                return icons[condition] || '🌤️';
    }

    getWeatherWarnings(weather) {
                const warnings = [];
                if (weather.temp > 28) warnings.push('Vysoké teploty - riziko roztékání');
                if (weather.main === 'Rain' || weather.main === 'Drizzle') warnings.push('Déšť - nižší návštěvnost');
                if (weather.windSpeed > 10) warnings.push('Silný vítr - zajistěte kotvení stánku');
                if (weather.temp < 5) warnings.push('Nízké teploty - méně zákazníků');
                return warnings;
    }

    // Zobrazení/skrytí loading stavu
    setLoading(isLoading) {
                this.isLoading = isLoading;
                const loadingEl = document.getElementById('loadingIndicator');
                const submitBtn = document.querySelector('#predictionForm button[type="submit"]');
                if (loadingEl) {
                                loadingEl.style.display = isLoading ? 'block' : 'none';
                }
                if (submitBtn) {
                                submitBtn.disabled = isLoading;
                                submitBtn.textContent = isLoading ? '⏳ Počítám...' : '🔮 Vypočítat predikci';
                }
    }

    // Zobrazení notifikace
    showNotification(message, type = 'info') {
                console.log(`📢 Notifikace [${type}]: ${message}`);
                const container = document.getElementById('notificationContainer') || this.createNotificationContainer();
                const notification = document.createElement('div');
                const colors = { success: '#4CAF50', error: '#f44336', warning: '#ff9800', info: '#2196F3' };
                notification.style.cssText = `
                            padding: 12px 20px; margin: 8px 0; border-radius: 8px;
                                        background: ${colors[type] || colors.info}; color: white;
                                                    font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);
                                                                animation: slideIn 0.3s ease; cursor: pointer;
                                                                        `;
                notification.textContent = message;
                notification.addEventListener('click', () => notification.remove());
                container.appendChild(notification);
                setTimeout(() => {
                                if (notification.parentElement) notification.remove();
                }, 5000);
                return notification;
    }

    // Vytvoření kontejneru pro notifikace
    createNotificationContainer() {
                const container = document.createElement('div');
                container.id = 'notificationContainer';
                container.style.cssText = `
                            position: fixed; top: 20px; right: 20px; z-index: 10000;
                                        max-width: 350px; pointer-events: none;
                                                `;
                document.body.appendChild(container);
                return container;
    }

    // Získání aktuálního stavu
    getCurrentState() {
                return {
                                currentTab: this.currentTab,
                                isLoading: this.isLoading,
                                notificationsCount: this.notifications.length
                };
    }
}

// Globální instance
window.uiManager = new UIManager();
