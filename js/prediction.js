// prediction.js - Inteligentní predikční algoritmus podle plánu oprav
class PredictionEngine {
    constructor() {
        this.historicalData = [];
        this.categoryFactors = {
            'festival': 1.4,
            'trh': 1.2,
            'sportovni': 0.8,
            'kulturni': 1.1,
            'firemni': 0.9,
            'svatba': 1.6,
            'jine': 1.0
        };
        
        // Výpočet váhy podobnosti
    calculateSimilarityWeight(eventData, historicalEvent) {
        let weight = 1;
        
        const eventCategory = (historicalEvent['Kategorie'] || historicalEvent['Category'] || '').toLowerCase();
        const eventLocation = historicalEvent['Lokace'] || historicalEvent['Location'] || '';
        const eventAttendees = parseInt(historicalEvent['Počet účastníků'] || historicalEvent['Attendees'] || 0);
        
        // Váha pro kategorii (nejvyšší priorita)
        if (eventCategory === eventData.category.toLowerCase()) {
            weight *= 3;
        }
        
        // Váha pro lokaci
        const targetLocation = eventData.location.split(',')[0].toLowerCase();
        if (eventLocation.toLowerCase().includes(targetLocation)) {
            weight *= 2;
        }
        
        // Váha pro počet účastníků
        if (eventAttendees > 0) {
            const attendeesRatio = Math.min(eventAttendees, eventData.expectedAttendees) / 
                                 Math.max(eventAttendees, eventData.expectedAttendees);
            weight *= attendeesRatio;
        }
        
        return weight;
    }

    // Získání konverzního poměru z události
    getEventConversion(event) {
        const sales = parseInt(event['Skutečný prodej'] || event['Actual Sales'] || 0);
        const attendees = parseInt(event['Počet účastníků'] || event['Attendees'] || 0);
        
        if (!sales || !attendees) return 0;
        return sales / attendees;
    }

    // Celkový průměrný konverzní poměr
    calculateOverallConversion() {
        if (!this.historicalData || this.historicalData.length === 0) {
            return this.baseConversionRate;
        }

        const validEvents = this.historicalData.filter(event => {
            const sales = parseInt(event['Skutečný prodej'] || event['Actual Sales'] || 0);
            const attendees = parseInt(event['Počet účastníků'] || event['Attendees'] || 0);
            return sales > 0 && attendees > 0;
        });

        if (validEvents.length === 0) return this.baseConversionRate;

        const totalConversion = validEvents.reduce((sum, event) => {
            return sum + this.getEventConversion(event);
        }, 0);

        return totalConversion / validEvents.length;
    }

    // Aplikace business model úprav
    applyBusinessModelAdjustment(prediction, businessModel) {
        const adjustments = {
            'owner': 1.0,      // Majitel - bez úpravy
            'employee': 0.95,  // Zaměstnanec - mírně nižší motivace
            'franchise': 1.1   // Franšízant - vyšší motivace díky podpoře
        };
        
        const factor = adjustments[businessModel] || 1.0;
        if (factor !== 1.0) {
            console.log(`👔 Business model (${businessModel}) faktor: ${factor}`);
        }
        
        return prediction * factor;
    }

    // Výpočet nákladů
    calculateCosts(eventData, quantity) {
        // Používáme business model manager pokud je dostupný
        if (window.businessModelManager && window.businessModelManager.getCurrentModel()) {
            return window.businessModelManager.calculateAllCosts(eventData, quantity);
        }
        
        // Fallback výpočet
        const eventDays = this.calculateEventDuration(eventData.startDate, eventData.endDate);
        
        const productionCosts = quantity * (eventData.costPerDonut || 18);
        const fuelCosts = (eventData.distanceKm || 0) * 2 * (eventData.fuelCostPerKm || 8);
        const laborCosts = 3000 * eventDays; // Základní odhad
        const otherCosts = 500 * eventDays;
        
        return {
            production: productionCosts,
            fuel: fuelCosts,
            labor: laborCosts,
            franchise: 0,
            salary: 0,
            other: otherCosts,
            total: productionCosts + fuelCosts + laborCosts + otherCosts
        };
    }

    // Výpočet spolehlivosti predikce
    calculateConfidence(eventData) {
        let confidence = 40; // Základní spolehlivost
        
        // Zvýšení podle historických dat
        if (this.historicalData && this.historicalData.length > 0) {
            const similarEvents = this.findSimilarEvents(eventData);
            confidence += Math.min(similarEvents.length * 8, 30); // Až +30 bodů
            
            // Bonus za kvalitu dat
            const completeEvents = this.historicalData.filter(event => {
                const sales = parseInt(event['Skutečný prodej'] || event['Actual Sales'] || 0);
                const attendees = parseInt(event['Počet účastníků'] || event['Attendees'] || 0);
                return sales > 0 && attendees > 0;
            });
            
            confidence += Math.min(completeEvents.length * 2, 20); // Až +20 bodů
        }
        
        // Snížení pro nestandardní případy
        if (eventData.expectedAttendees > 5000) {
            confidence -= 10; // Velké akce jsou nepředvídatelnější
        }
        
        if (eventData.expectedAttendees < 50) {
            confidence -= 15; // Malé akce také
        }
        
        return Math.max(Math.min(confidence, 95), 20); // Mezi 20-95%
    }

    // Generování doporučení
    generateRecommendations(eventData, weather, costs, profit) {
        const recommendations = [];
        
        // Finanční doporučení
        if (profit <= 0) {
            recommendations.push({
                type: 'danger',
                icon: '💰',
                text: 'Záporný zisk! Urgentně zvyšte cenu nebo snižte náklady'
            });
        } else if (profit < 2000) {
            recommendations.push({
                type: 'warning',
                icon: '⚠️',
                text: 'Nízký zisk. Doporučujeme zvýšit cenu o 5-10 Kč na donut'
            });
        }
        
        // Počasí doporučení
        if (weather) {
            if (weather.temp > 25) {
                recommendations.push({
                    type: 'warning',
                    icon: '🌡️',
                    text: `Vysoké teploty (${Math.round(weather.temp)}°C): Připravte chladící zařízení pro čokoládové polevy`
                });
            }
            
            if (weather.main === 'Rain' || weather.main === 'Drizzle') {
                recommendations.push({
                    type: 'danger',
                    icon: '🌧️',
                    text: 'Déšť: Připravte stan a snižte objednávku o 30-50%'
                });
            }
            
            if (weather.windSpeed > 10) {
                recommendations.push({
                    type: 'warning',
                    icon: '💨',
                    text: `Silný vítr (${Math.round(weather.windSpeed)} m/s): Zajistěte pevné kotvení stánku`
                });
            }
            
            if (weather.temp < 5) {
                recommendations.push({
                    type: 'info',
                    icon: '🥶',
                    text: 'Nízké teploty: Připravte teplé nápoje jako doplněk'
                });
            }
        }
        
        // Business model doporučení
        if (eventData.businessModel === 'employee') {
            recommendations.push({
                type: 'info',
                icon: '👨‍💼',
                text: 'Zaměstnanec: Domluvte si bonus za překročení plánu prodeje'
            });
        } else if (eventData.businessModel === 'franchise') {
            recommendations.push({
                type: 'info',
                icon: '🤝',
                text: 'Franšíza: Zkontrolujte soulad s brand guidelines'
            });
        }
        
        // Dopravní doporučení
        if (costs.fuel > costs.production * 0.15) {
            recommendations.push({
                type: 'warning',
                icon: '🚚',
                text: 'Vysoké dopravní náklady: Zvažte sdílení dopravy nebo více akcí v oblasti'
            });
        }
        
        // Velikost akce doporučení
        const eventDays = this.calculateEventDuration(eventData.startDate, eventData.endDate);
        if (eventDays > 2) {
            recommendations.push({
                type: 'info',
                icon: '📅',
                text: `Vícedenní akce (${eventDays} dní): Objednejte 20% rezervu a zajistěte skladování`
            });
        }
        
        if (eventData.expectedAttendees > 2000) {
            recommendations.push({
                type: 'info',
                icon: '👥',
                text: 'Velká akce: Zvažte druhý stánek nebo dodatečného asistenta'
            });
        }
        
        // Kategorie specifická doporučení
        switch (eventData.category) {
            case 'festival':
                recommendations.push({
                    type: 'success',
                    icon: '🎪',
                    text: 'Festival: Výborná kategorie pro donuts - připravte pestrou nabídku'
                });
                break;
            case 'sportovni':
                recommendations.push({
                    type: 'info',
                    icon: '⚽',
                    text: 'Sport: Zaměřte se na méně sladké varianty a zdravější alternativy'
                });
                break;
            case 'svatba':
                recommendations.push({
                    type: 'success',
                    icon: '💒',
                    text: 'Svatba: Premium kategorie - můžete účtovat vyšší ceny'
                });
                break;
        }
        
        return recommendations;
    }

    // Výpočet délky akce
    calculateEventDuration(startDate, endDate) {
        if (!endDate || endDate === startDate) return 1;
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    }

    // Aktualizace historických dat
    updateHistoricalData(data) {
        this.historicalData = data || [];
        console.log(`📊 Historická data aktualizována: ${this.historicalData.length} záznamů`);
    }

    // Získání statistik o predikci
    getPredictionStats() {
        return {
            historicalEvents: this.historicalData.length,
            baseConversionRate: this.baseConversionRate,
            categoryFactors: this.categoryFactors,
            validEvents: this.historicalData.filter(event => {
                const sales = parseInt(event['Skutečný prodej'] || event['Actual Sales'] || 0);
                const attendees = parseInt(event['Počet účastníků'] || event['Attendees'] || 0);
                return sales > 0 && attendees > 0;
            }).length
        };
    }

    // Debug informace
    getDebugInfo(eventData) {
        const similarEvents = this.findSimilarEvents(eventData);
        const historicalFactor = this.calculateHistoricalFactor(eventData);
        const locationFactor = this.calculateLocationFactor(eventData);
        
        return {
            similarEventsCount: similarEvents.length,
            historicalFactor: historicalFactor,
            locationFactor: locationFactor,
            categoryFactor: this.categoryFactors[eventData.category] || 1.0,
            dayFactor: this.calculateDayFactor(eventData.startDate),
            timeFactor: this.calculateTimeFactor(eventData.time),
            confidence: this.calculateConfidence(eventData),
            overallConversion: this.calculateOverallConversion()
        };
    }

    // Export predikce do formátu pro analýzy
    exportPrediction(predictionResult, eventData) {
        return {
            timestamp: new Date().toISOString(),
            event: {
                name: eventData.name,
                category: eventData.category,
                location: eventData.location,
                expectedAttendees: eventData.expectedAttendees,
                startDate: eventData.startDate,
                endDate: eventData.endDate
            },
            prediction: {
                quantity: predictionResult.quantity,
                revenue: predictionResult.revenue,
                profit: predictionResult.profit,
                confidence: predictionResult.confidence
            },
            factors: predictionResult.factors,
            algorithm: predictionResult.algorithm
        };
    }
}

// Export pro použití v jiných souborech
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PredictionEngine;
}

// Globální instance
window.predictionEngine = new PredictionEngine(); Základní konverzní poměr (25% účastníků koupí donut)
        this.baseConversionRate = 0.25;
        
        console.log('🧠 Predikční engine inicializován');
    }

    // Hlavní predikční algoritmus podle vzorce z plánu
    async calculatePrediction(eventData, weather = null) {
        console.log('🔮 Spouštím inteligentní predikci pro:', eventData.name);
        
        try {
            // 1. Základní predikce podle návštěvnosti
            let basePrediction = eventData.expectedAttendees * this.baseConversionRate;
            console.log(`📊 Základní predikce: ${eventData.expectedAttendees} × ${this.baseConversionRate} = ${basePrediction.toFixed(0)}`);

            // 2. WeatherFactor - podle specifikace z plánu
            const weatherFactor = this.calculateWeatherFactor(weather);
            console.log(`🌤️ Weather faktor: ${weatherFactor.toFixed(2)}`);

            // 3. HistoricalFactor - průměr z podobných akcí
            const historicalFactor = this.calculateHistoricalFactor(eventData);
            console.log(`📈 Historical faktor: ${historicalFactor.toFixed(2)}`);

            // 4. LocationFactor - popularita místa z historických dat
            const locationFactor = this.calculateLocationFactor(eventData);
            console.log(`📍 Location faktor: ${locationFactor.toFixed(2)}`);

            // 5. Kategorie akce faktor
            const categoryFactor = this.categoryFactors[eventData.category] || 1.0;
            console.log(`🏷️ Category faktor: ${categoryFactor}`);

            // 6. Den v týdnu faktor
            const dayFactor = this.calculateDayFactor(eventData.startDate);
            console.log(`📅 Day faktor: ${dayFactor}`);

            // 7. Čas akce faktor
            const timeFactor = this.calculateTimeFactor(eventData.time);
            console.log(`⏰ Time faktor: ${timeFactor}`);

            // FINÁLNÍ VÝPOČET podle vzorce:
            // Návštěvnost = BaseVisitors × WeatherFactor × HistoricalFactor × LocationFactor × CategoryFactor × DayFactor × TimeFactor
            const finalPrediction = basePrediction * weatherFactor * historicalFactor * locationFactor * categoryFactor * dayFactor * timeFactor;
            
            console.log('🧮 Finální výpočet:', {
                base: basePrediction.toFixed(0),
                weather: weatherFactor.toFixed(2),
                historical: historicalFactor.toFixed(2),
                location: locationFactor.toFixed(2),
                category: categoryFactor.toFixed(2),
                day: dayFactor.toFixed(2),
                time: timeFactor.toFixed(2),
                final: finalPrediction.toFixed(0)
            });

            // Aplikace business model úprav
            const businessAdjustedPrediction = this.applyBusinessModelAdjustment(finalPrediction, eventData.businessModel);

            // Úprava podle délky akce
            const eventDays = this.calculateEventDuration(eventData.startDate, eventData.endDate);
            const finalQuantity = Math.round(businessAdjustedPrediction * (1 + (eventDays - 1) * 0.7));
            
            // Aplikace minimálního množství
            const minQuantity = window.settingsManager?.getSetting('minOrderQuantity') || 50;
            const adjustedQuantity = Math.max(finalQuantity, minQuantity);

            // Výpočet finančních údajů
            const costs = this.calculateCosts(eventData, adjustedQuantity);
            const revenue = adjustedQuantity * eventData.pricePerDonut;
            const profit = revenue - costs.total;
            const confidence = this.calculateConfidence(eventData);

            const result = {
                quantity: adjustedQuantity,
                revenue: revenue,
                costs: costs,
                profit: profit,
                profitMargin: ((profit / revenue) * 100).toFixed(1),
                confidence: confidence,
                eventDays: eventDays,
                factors: {
                    weather: weatherFactor,
                    historical: historicalFactor,
                    location: locationFactor,
                    category: categoryFactor,
                    day: dayFactor,
                    time: timeFactor,
                    business: businessAdjustedPrediction / finalPrediction
                },
                recommendations: this.generateRecommendations(eventData, weather, costs, profit),
                algorithm: {
                    baseConversion: this.baseConversionRate,
                    basePrediction: basePrediction,
                    finalPrediction: finalPrediction,
                    adjustedForBusiness: businessAdjustedPrediction,
                    adjustedForDays: finalQuantity,
                    finalWithMinimum: adjustedQuantity
                }
            };

            console.log('✅ Predikce dokončena:', result);
            return result;

        } catch (error) {
            console.error('❌ Chyba v predikčním algoritmu:', error);
            throw new Error(`Chyba při výpočtu predikce: ${error.message}`);
        }
    }

    // WeatherFactor podle specifikace z plánu oprav
    calculateWeatherFactor(weather) {
        if (!weather) {
            console.log('⚠️ Počasí není dostupné, používám neutrální faktor');
            return 1.0;
        }

        let factor = 1.0;
        const temp = weather.temp;
        const condition = weather.main;
        const windSpeed = weather.windSpeed || 0;

        // Teplotní faktor podle plánu
        if (temp >= 20 && temp <= 25) {
            factor = 1.0; // Ideální teplota
        } else if (temp > 25) {
            factor = 0.8; // Donuts se tají
            console.log(`🌡️ Vysoká teplota ${temp}°C - donuts se tají, snížení na 80%`);
        } else if (temp < 15) {
            factor = 0.7; // Méně lidí venku
            console.log(`🌡️ Nízká teplota ${temp}°C - méně lidí venku, snížení na 70%`);
        }

        // Podmínky počasí podle plánu
        switch (condition) {
            case 'Clear':
                factor *= 1.1; // Slunce je dobré
                console.log('☀️ Slunečno - zvýšení o 10%');
                break;
            case 'Rain':
            case 'Drizzle':
                factor *= 0.5; // Déšť = špatné podmínky
                console.log('🌧️ Déšť - snížení na 50%');
                break;
            case 'Snow':
                factor *= 0.4; // Sníh ještě horší
                console.log('❄️ Sníh - snížení na 40%');
                break;
            case 'Thunderstorm':
                factor *= 0.3; // Bouře nejhorší
                console.log('⛈️ Bouře - snížení na 30%');
                break;
            case 'Clouds':
                factor *= 0.9; // Oblačno mírně horší
                console.log('☁️ Oblačno - snížení o 10%');
                break;
        }

        // Vítr podle plánu
        if (windSpeed > 10) {
            factor *= 0.9; // Silný vítr = problém se stánkem
            console.log(`💨 Silný vítr ${windSpeed}m/s - snížení o 10%`);
        }

        return Math.max(factor, 0.2); // Minimálně 20% aby nebyla predikce nulová
    }

    // HistoricalFactor - průměr z podobných akcí
    calculateHistoricalFactor(eventData) {
        if (!this.historicalData || this.historicalData.length === 0) {
            console.log('📊 Žádná historická data, používám základní faktor');
            return 1.0;
        }

        const similarEvents = this.findSimilarEvents(eventData);
        
        if (similarEvents.length === 0) {
            // Použijeme průměr ze všech akcí jako fallback
            const overallAverage = this.calculateOverallConversion();
            const factor = overallAverage / this.baseConversionRate;
            console.log(`📊 Žádné podobné akce, průměr ze všech: ${factor.toFixed(2)}`);
            return factor;
        }

        // Vážený průměr podobných akcí
        let totalWeight = 0;
        let weightedSum = 0;

        similarEvents.forEach(event => {
            const weight = this.calculateSimilarityWeight(eventData, event);
            const conversion = this.getEventConversion(event);
            
            if (conversion > 0) {
                weightedSum += conversion * weight;
                totalWeight += weight;
            }
        });

        if (totalWeight === 0) return 1.0;

        const avgConversion = weightedSum / totalWeight;
        const factor = avgConversion / this.baseConversionRate;
        
        console.log(`📊 Historical faktor z ${similarEvents.length} podobných akcí: ${factor.toFixed(2)}`);
        return Math.max(factor, 0.3); // Minimálně 30%
    }

    // LocationFactor - popularita místa z historických dat
    calculateLocationFactor(eventData) {
        if (!this.historicalData || this.historicalData.length === 0) {
            return 1.0;
        }

        const locationName = eventData.location.split(',')[0].toLowerCase().trim();
        const locationEvents = this.historicalData.filter(event => {
            const eventLocation = (event['Lokace'] || event['Location'] || '').toLowerCase();
            return eventLocation.includes(locationName);
        });

        if (locationEvents.length < 2) {
            console.log(`📍 Málo dat pro lokaci ${locationName}, neutrální faktor`);
            return 1.0;
        }

        // Průměrný výkon v této lokaci
        const locationConversion = locationEvents.reduce((sum, event) => {
            return sum + this.getEventConversion(event);
        }, 0) / locationEvents.length;

        const overallConversion = this.calculateOverallConversion();
        const factor = locationConversion / overallConversion;

        console.log(`📍 Location faktor pro ${locationName}: ${factor.toFixed(2)} (${locationEvents.length} akcí)`);
        return Math.max(factor, 0.5); // Minimálně 50%
    }

    // Den v týdnu faktor
    calculateDayFactor(dateString) {
        const date = new Date(dateString);
        const dayOfWeek = date.getDay(); // 0 = neděle, 6 = sobota
        
        if (dayOfWeek === 0 || dayOfWeek === 6) {
            // Víkend - více lidí
            return 1.3;
        } else if (dayOfWeek === 5) {
            // Pátek - docela dobré
            return 1.1;
        } else {
            // Všední den - méně lidí
            return 0.9;
        }
    }

    // Čas akce faktor
    calculateTimeFactor(timeString) {
        if (!timeString) return 1.0;
        
        const hour = parseInt(timeString.split(':')[0]);
        
        if (hour >= 10 && hour <= 14) {
            // Dopoledne/oběd - ideální čas
            return 1.2;
        } else if (hour >= 15 && hour <= 18) {
            // Odpoledne - dobré
            return 1.1;
        } else if (hour >= 19 && hour <= 21) {
            // Večer - slabší
            return 0.9;
        } else {
            // Ranní nebo pozdní hodiny
            return 0.7;
        }
    }

    // Hledání podobných událostí
    findSimilarEvents(eventData) {
        return this.historicalData.filter(event => {
            const eventSales = parseInt(event['Skutečný prodej'] || event['Actual Sales'] || 0);
            const eventAttendees = parseInt(event['Počet účastníků'] || event['Attendees'] || 0);
            
            // Musí mít validní data
            if (!eventSales || !eventAttendees) return false;
            
            let score = 0;
            
            // Stejná kategorie = +3 body
            const eventCategory = (event['Kategorie'] || event['Category'] || '').toLowerCase();
            if (eventCategory === eventData.category.toLowerCase()) score += 3;
            
            // Podobná lokace = +2 body
            const eventLocation = event['Lokace'] || event['Location'] || '';
            const targetLocation = eventData.location.split(',')[0].toLowerCase();
            if (eventLocation.toLowerCase().includes(targetLocation)) score += 2;
            
            // Podobný počet účastníků (±50%) = +1 bod
            const attendeesRatio = eventAttendees / eventData.expectedAttendees;
            if (attendeesRatio >= 0.5 && attendeesRatio <= 2.0) score += 1;
            
            // Podobné počasí = +1 bod (pokud je k dispozici)
            // TODO: Implementovat porovnání počasí
            
            return score >= 2; // Minimálně 2 body ze 6 možných
        }).sort((a, b) => {
            // Seřadit podle relevance
            const aCategory = (a['Kategorie'] || a['Category'] || '').toLowerCase();
            const bCategory = (b['Kategorie'] || b['Category'] || '').toLowerCase();
            const targetCategory = eventData.category.toLowerCase();
            
            if (aCategory === targetCategory && bCategory !== targetCategory) return -1;
            if (bCategory === targetCategory && aCategory !== targetCategory) return 1;
            return 0;
        });
    }

    //
