// =============================================================================
// PREDICTION ENGINE
// =============================================================================

const prediction = {
    // Main prediction update function
    updatePrediction() {
        const eventType = document.getElementById('eventType')?.value;
        const expectedVisitors = parseInt(document.getElementById('expectedVisitors')?.value) || 0;
        
        if (!eventType || !expectedVisitors) {
            document.getElementById('predictionResults').innerHTML = 
                '<div class="prediction-loading">📍 Vyplňte typ akce a návštěvnost pro načtení predikce</div>';
            return;
        }

        // Calculate prediction
        const predictionResult = this.calculatePrediction();
        this.displayPredictionResults(predictionResult);
    },

    // Calculate sales prediction
    calculatePrediction() {
        const eventType = document.getElementById('eventType')?.value;
        const eventName = document.getElementById('eventName')?.value.trim();
        const eventLocation = document.getElementById('eventLocation')?.value.trim();
        const expectedVisitors = parseInt(document.getElementById('expectedVisitors')?.value) || 0;
        const duration = parseInt(document.getElementById('eventDuration')?.value);
        const environment = document.getElementById('eventEnvironment')?.value;
        
        // Base conversion rates
        const baseRate = CONFIG.CONVERSION_RATES[eventType] || CONFIG.CONVERSION_RATES['ostatni'];
        
        // Calculate base sales
        let baseSales = expectedVisitors * baseRate;
        
        // Apply duration factor
        const durationFactor = CONFIG.DURATION_FACTORS[duration] || 
                              Math.min(4.0, 1 + (duration - 1) * 0.55);
        
        baseSales *= durationFactor;
        
        // Apply weather factor
        let weatherFactor = 1.0;
        if (GLOBAL_STATE.currentWeatherData) {
            weatherFactor = GLOBAL_STATE.currentWeatherData.environmentImpact;
        }
        
        // Apply historical adjustment
        const historicalFactor = dataManager.getHistoricalAdjustment(eventType, expectedVisitors, eventLocation);
        
        // Calculate final sales
        const predictedSales = Math.round(baseSales * weatherFactor * historicalFactor);
        
        // Calculate financials
        const financials = businessModel.calculateFinancials(predictedSales);
        
        // Calculate confidence
        const confidence = this.calculateConfidence(eventType, eventLocation);
        
        // Store prediction
        GLOBAL_STATE.lastPrediction = {
            eventName,
            eventType,
            location: eventLocation,
            date: document.getElementById('eventDate')?.value,
            duration,
            expectedVisitors,
            predictedSales,
            confidence,
            financials,
            weather: GLOBAL_STATE.currentWeatherData,
            businessModel: document.querySelector('input[name="businessModel"]:checked')?.value,
            environment,
            timestamp: new Date().toISOString()
        };
        
        return GLOBAL_STATE.lastPrediction;
    },

    // Calculate prediction confidence
    calculateConfidence(eventType, location) {
        let confidence = 50; // Base confidence
        
        // Add confidence based on historical data
        const typeEvents = GLOBAL_STATE.historicalData.filter(e => e.eventType === eventType);
        confidence += Math.min(30, typeEvents.length * 3);
        
        // Add confidence based on location data
        const locationEvents = GLOBAL_STATE.historicalData.filter(e => e.location === location);
        confidence += Math.min(15, locationEvents.length * 2);
        
        // Add confidence if we have weather data
        if (GLOBAL_STATE.currentWeatherData) {
            confidence += 5;
        }
        
        return Math.min(95, confidence);
    },

    // Display prediction results
    displayPredictionResults(predictionResult) {
        const resultsDiv = document.getElementById('predictionResults');
        const businessModelType = predictionResult.businessModel;
        const financials = predictionResult.financials;
        
        // Determine confidence level
        let confidenceText = 'Nízká';
        let confidenceColor = '#e17055';
        
        if (predictionResult.confidence > 75) {
            confidenceText = 'Vysoká';
            confidenceColor = '#00b894';
        } else if (predictionResult.confidence > 50) {
            confidenceText = 'Střední';
            confidenceColor = '#fdcb6e';
        }
        
        let html = `
            <style>
                .prediction-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                    gap: 15px;
                    margin-bottom: 20px;
                }
                .prediction-metric {
                    text-align: center;
                    background: rgba(255, 255, 255, 0.1);
                    padding: 15px;
                    border-radius: 8px;
                    backdrop-filter: blur(5px);
                }
                .metric-value {
                    font-size: 1.8em;
                    font-weight: bold;
                    line-height: 1.1;
                }
                .metric-label {
                    font-size: 0.85em;
                    opacity: 0.9;
                    margin-top: 5px;
                }
                .confidence-bar {
                    width: 100%;
                    height: 8px;
                    background: rgba(255, 255, 255, 0.3);
                    border-radius: 4px;
                    overflow: hidden;
                    margin-top: 8px;
                }
                .confidence-fill {
                    height: 100%;
                    transition: width 0.5s ease;
                    background: ${confidenceColor};
                }
            </style>
        `;
        
        // Summary metrics
        html += '<div class="prediction-summary">';
        
        if (businessModelType === 'franchisee') {
            html += `
                <div class="prediction-metric">
                    <div class="metric-value">${predictionResult.predictedSales.toLocaleString('cs-CZ')}</div>
                    <div class="metric-label">Predikce prodeje (ks)</div>
                </div>
                <div class="prediction-metric">
                    <div class="metric-value">${Math.round(financials.yourRevenue).toLocaleString('cs-CZ')} Kč</div>
                    <div class="metric-label">Váš obrat</div>
                </div>
                <div class="prediction-metric">
                    <div class="metric-value" style="color: #00b894">
                        ${Math.round(financials.yourProfit).toLocaleString('cs-CZ')} Kč
                    </div>
                    <div class="metric-label">Váš čistý zisk</div>
                </div>
                <div class="prediction-metric">
                    <div class="metric-value" style="color: ${financials.profit >= 0 ? '#00b894' : '#e17055'}">
                        ${Math.round(financials.profit).toLocaleString('cs-CZ')} Kč
                    </div>
                    <div class="metric-label">Zisk franšízanta</div>
                </div>
            `;
        } else {
            html += `
                <div class="prediction-metric">
                    <div class="metric-value">${predictionResult.predictedSales.toLocaleString('cs-CZ')}</div>
                    <div class="metric-label">Predikce prodeje (ks)</div>
                </div>
                <div class="prediction-metric">
                    <div class="metric-value">${Math.round(financials.revenue).toLocaleString('cs-CZ')} Kč</div>
                    <div class="metric-label">Očekávaný obrat</div>
                </div>
                <div class="prediction-metric">
                    <div class="metric-value" style="color: ${financials.profit >= 0 ? '#00b894' : '#e17055'}">
                        ${Math.round(financials.profit).toLocaleString('cs-CZ')} Kč
                    </div>
                    <div class="metric-label">Očekávaný zisk</div>
                </div>
                <div class="prediction-metric">
                    <div class="metric-value">${financials.margin.toFixed(1)}%</div>
                    <div class="metric-label">Zisková marže</div>
                </div>
            `;
        }
        
        html += '</div>';
        
        // Confidence bar
        html += `
            <div style="margin: 20px 0;">
                <strong>Spolehlivost predikce: ${confidenceText} (${predictionResult.confidence}%)</strong>
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${predictionResult.confidence}%"></div>
                </div>
            </div>
        `;
        
        // Financial details
        if (businessModelType === 'franchisee') {
            html += `
                <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 8px; margin-bottom: 15px;">
                    <h5 style="margin: 0 0 10px 0; color: #00b894;">💰 Váš zisk (Donuland):</h5>
                    <div style="display: grid; gap: 8px; font-size: 0.95em;">
                        <div>📦 Prodej donutů franšízantovi: ${Math.round(financials.yourRevenue).toLocaleString('cs-CZ')} Kč</div>
                        <div>🏭 Náklady výroby: ${Math.round(financials.yourCosts).toLocaleString('cs-CZ')} Kč</div>
                        <div style="border-top: 1px solid rgba(255,255,255,0.3); padding-top: 5px; margin-top: 5px;">
                            <strong style="color: #00b894;">💎 Váš čistý zisk: ${Math.round(financials.yourProfit).toLocaleString('cs-CZ')} Kč</strong>
                        </div>
                    </div>
                </div>
            `;
        }
        
        html += `
            <div style="background: rgba(255, 255, 255, 0.1); padding: 15px; border-radius: 8px;">
                <h5 style="margin: 0 0 10px 0;">💰 Detailní rozpis nákladů:</h5>
                <div style="display: grid; gap: 8px; font-size: 0.95em;">
        `;
        
        Object.entries(financials.costBreakdown).forEach(([category, cost]) => {
            html += `<div>${utils.getCategoryIcon(category)} ${category}: ${Math.round(cost).toLocaleString('cs-CZ')} Kč</div>`;
        });
        
        html += `
                    <div style="border-top: 1px solid rgba(255,255,255,0.3); padding-top: 5px; margin-top: 5px;">
                        <strong>💸 Celkové náklady: ${Math.round(financials.totalCosts).toLocaleString('cs-CZ')} Kč</strong>
                    </div>
                    <div>📊 Break-even bod: ${financials.breakEvenUnits} ks</div>
                    <div>👥 Průměrný prodej/návštěvník: ${financials.avgSalePerVisitor.toFixed(2)} Kč</div>
                    <div>🍩 Zisk na donut: ${financials.profitPerDonut.toFixed(1)} Kč</div>
                </div>
            </div>
        `;
        
        // Save button
        html += `
            <div style="margin-top: 20px; text-align: center;">
                <button class="btn btn-success btn-large" onclick="prediction.saveCurrentPrediction()">
                    📅 Uložit do kalendáře
                </button>
            </div>
        `;
        
        resultsDiv.innerHTML = html;
    },

    // Handle environment change
    handleEnvironmentChange() {
        const environment = document.getElementById('eventEnvironment')?.value;
        const weatherSection = document.getElementById('weatherSection');
        const qualityWarning = document.getElementById('qualityWarning');
        
        if (environment === 'indoor') {
            if (weatherSection) weatherSection.style.opacity = '0.7';
            if (qualityWarning) qualityWarning.style.display = 'none';
            ui.showMessage('Vnitřní akce - snížený vliv počasí na kvalitu donutů', 'info');
        } else {
            if (weatherSection) weatherSection.style.opacity = '1';
            // Re-check weather if data exists
            if (GLOBAL_STATE.currentWeatherData && GLOBAL_STATE.currentWeatherData.qualityRisk) {
                if (qualityWarning) qualityWarning.style.display = 'block';
            }
        }
        
        this.updatePrediction();
    },

    // Save current prediction
    saveCurrentPrediction() {
        if (!GLOBAL_STATE.lastPrediction) {
            ui.showMessage('Nejprve vytvořte predikci', 'error');
            return;
        }
        
        dataManager.saveLocalEvent(GLOBAL_STATE.lastPrediction);
    }
};
