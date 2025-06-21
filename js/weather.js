// weather.js - Pokročilý weather systém s reálnými dny
class WeatherManager {
    constructor() {
        this.apiKey = '';
        this.cache = new Map();
        this.cacheTimeout = 10 * 60 * 1000; // 10 minut cache
    }

    // Nastavení API klíče
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        console.log('🔑 Weather API klíč nastaven');
    }

    // Hlavní funkce pro aktualizaci předpovědi počasí
    async updateWeatherForecast() {
        const locationInput = document.getElementById('location');
        const startDateInput = document.getElementById('eventStartDate');
        const endDateInput = document.getElementById('eventEndDate');
        const forecastDiv = document.getElementById('weatherForecast');
        
        if (!locationInput || !startDateInput || !forecastDiv) {
            console.warn('⚠️ Weather forecast elementy nenalezeny');
            return;
        }

        const location = locationInput.value.trim();
        const startDate = startDateInput.value;
        const endDate = endDateInput?.value || startDate;
        
        if (!location || !startDate) {
            forecastDiv.innerHTML = '<p>📍 Vyberte město a datum pro načtení počasí</p>';
            return;
        }
        
        forecastDiv.innerHTML = '<p>🔄 Načítám předpověď počasí...</p>';
        
        try {
            const eventDays = this.calculateEventDuration(startDate, endDate);
            const weatherForecasts = await this.getWeatherForDays(location, startDate, Math.min(eventDays, 5));
            
            if (weatherForecasts.length > 0) {
                this.displayWeatherForecast(weatherForecasts, forecastDiv);
                console.log('✅ Počasí úspěšně načteno pro', weatherForecasts.length, 'dní');
            } else {
                forecastDiv.innerHTML = '<p class="error">❌ Nepodařilo se načíst předpověď počasí</p>';
            }
        } catch (error) {
            console.error('❌ Chyba při načítání počasí:', error);
            forecastDiv.innerHTML = `<p class="error">❌ Chyba při načítání počasí: ${error.message}</p>`;
        }
    }

    // Získání počasí pro více dní
    async getWeatherForDays(location, startDate, dayCount) {
        const forecasts = [];
        
        for (let day = 0; day < dayCount; day++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(currentDate.getDate() + day);
            
            try {
                const weather = await this.getWeatherForDate(location, currentDate);
                if (weather) {
                    forecasts.push({
                        date: new Date(currentDate),
                        weather: weather,
                        dayName: currentDate.toLocaleDateString('cs-CZ', { weekday: 'long' }),
                        dayDate: currentDate.toLocaleDateString('cs-CZ', { day: 'numeric', month: 'short' }),
                        dayIndex: day
                    });
                }
            } catch (error) {
                console.warn(`⚠️ Nepodařilo se načíst počasí pro den ${day + 1}:`, error);
            }
        }
        
        return forecasts;
    }

    // Získání počasí pro konkrétní datum
    async getWeatherForDate(location, date) {
        if (!this.apiKey) {
            throw new Error('Weather API klíč není nastaven');
        }

        const cacheKey = `${location}-${date.toISOString().split('T')[0]}`;
        
        // Kontrola cache
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            // Získání souřadnic
            const coordinates = await this.getCoordinates(location);
            if (!coordinates) {
                throw new Error(`Místo "${location}" nebylo nalezeno`);
            }

            const { lat, lon } = coordinates;
            
            // Výpočet rozdílu dnů
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const targetDate = new Date(date);
            targetDate.setHours(0, 0, 0, 0);
            const daysDiff = Math.ceil((targetDate - today) / (1000 * 60 * 60 * 24));

            let weatherData;
            
            if (daysDiff <= 0) {
                // Aktuální počasí
                weatherData = await this.getCurrentWeather(lat, lon);
            } else if (daysDiff <= 5) {
                // 5denní předpověď
                weatherData = await this.getForecastWeather(lat, lon, targetDate);
            } else {
                // Pro vzdálenější data - použijeme aktuální jako odhad
                weatherData = await this.getCurrentWeather(lat, lon);
                weatherData.description += ' (odhad)';
            }
            
            // Uložení do cache
            this.cache.set(cacheKey, {
                data: weatherData,
                timestamp: Date.now()
            });
            
            return weatherData;
            
        } catch (error) {
            console.error('Chyba při získávání počasí:', error);
            throw error;
        }
    }

    // Získání souřadnic místa
    async getCoordinates(location) {
        const cacheKey = `coords-${location}`;
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout * 6) { // Delší cache pro souřadnice
                return cached.data;
            }
        }

        try {
            const response = await fetch(
                `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)}&limit=1&appid=${this.apiKey}`
            );
            
            if (!response.ok) {
                throw new Error(`Geocoding API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.length === 0) {
                return null;
            }

            const coords = { lat: data[0].lat, lon: data[0].lon };
            
            // Cache souřadnice
            this.cache.set(cacheKey, {
                data: coords,
                timestamp: Date.now()
            });
            
            return coords;
        } catch (error) {
            console.error('Chyba při získávání souřadnic:', error);
            throw error;
        }
    }

    // Aktuální počasí
    async getCurrentWeather(lat, lon) {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=cs`
        );
        
        if (!response.ok) {
            throw new Error(`Weather API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
            main: data.weather[0].main,
            description: data.weather[0].description,
            temp: data.main.temp,
            humidity: data.main.humidity,
            windSpeed: data.wind?.speed || 0,
            pressure: data.main.pressure
        };
    }

    // Předpověď počasí
    async getForecastWeather(lat, lon, targetDate) {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=cs`
        );
        
        if (!response.ok) {
            throw new Error(`Forecast API error: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Najdeme nejbližší předpověď k cílovému dni
        const targetTime = targetDate.getTime();
        let closestForecast = data.list[0];
        let minDiff = Math.abs(new Date(closestForecast.dt * 1000) - targetTime);
        
        for (const forecast of data.list) {
            const forecastTime = new Date(forecast.dt * 1000);
            const diff = Math.abs(forecastTime - targetTime);
            if (diff < minDiff) {
                minDiff = diff;
                closestForecast = forecast;
            }
        }
        
        return {
            main: closestForecast.weather[0].main,
            description: closestForecast.weather[0].description,
            temp: closestForecast.main.temp,
            humidity: closestForecast.main.humidity,
            windSpeed: closestForecast.wind?.speed || 0,
            pressure: closestForecast.main.pressure
        };
    }

    // Zobrazení předpovědi počasí
    displayWeatherForecast(forecasts, container) {
        const weatherHtml = forecasts.map((forecast, index) => {
            const warnings = this.getWeatherWarnings(forecast.weather);
            const warningClass = warnings.length > 0 ? 'warning' : '';
            
            return `
                <div class="weather-day ${warningClass}" style="display: inline-block; margin: 10px; padding: 15px; background: ${this.getWeatherColor(forecast.weather.main)}; border-radius: 10px; text-align: center; min-width: 140px; color: white; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                    <div style="font-size: 2.5em; margin-bottom: 5px;">${this.getWeatherIcon(forecast.weather.main)}</div>
                    <div style="font-weight: bold; font-size: 1.1em;">${forecast.dayName}</div>
                    <div style="font-size: 0.9em; margin-bottom: 8px; opacity: 0.9;">${forecast.dayDate}</div>
                    <div style="font-size: 1.3em; font-weight: bold; margin-bottom: 5px;">${Math.round(forecast.weather.temp)}°C</div>
                    <div style="font-size: 0.8em; margin-bottom: 5px;">${forecast.weather.description}</div>
                    <div style="font-size: 0.7em; opacity: 0.8;">
                        💨 ${Math.round(forecast.weather.windSpeed)} m/s<br>
                        💧 ${forecast.weather.humidity}%
                    </div>
                    ${warnings.length > 0 ? `<div style="margin-top: 8px; font-size: 0.7em; background: rgba(255,255,255,0.2); padding: 4px; border-radius: 4px;">⚠️ ${warnings[0]}</div>` : ''}
                </div>
            `;
        }).join('');
        
        // Souhrnná varování
        const allWarnings = this.getAllWarnings(forecasts);
        const warningsHtml = allWarnings.length > 0 ? `
            <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; color: #856404;">
                <strong>⚠️ Varování pro akci:</strong><br>
                ${allWarnings.map(w => `• ${w}`).join('<br>')}
            </div>
        ` : '';
        
        container.innerHTML = `
            <div style="text-align: center;">
                <h4 style="margin: 0 0 15px 0; color: #ff6b6b;">📅 Předpověď počasí</h4>
                <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 5px;">
                    ${weatherHtml}
                </div>
                ${warningsHtml}
            </div>
        `;
    }

    // Varování pro jednotlivé dny
    getWeatherWarnings(weather) {
        const warnings = [];
        
        if (weather.temp > 25) {
            warnings.push('Vysoké teploty - čokoláda se tají');
        }
        if (weather.temp < 5) {
            warnings.push('Nízké teploty - málo lidí');
        }
        if (weather.main === 'Rain' || weather.main === 'Drizzle') {
            warnings.push('Déšť - snížení návštěvnosti');
        }
        if (weather.windSpeed > 10) {
            warnings.push('Silný vítr - problémy se stánkem');
        }
        
        return warnings;
    }

    // Souhrnná varování pro celou akci
    getAllWarnings(forecasts) {
        const warnings = [];
        const temps = forecasts.map(f => f.weather.temp);
        const conditions = forecasts.map(f => f.weather.main);
        const winds = forecasts.map(f => f.weather.windSpeed);
        
        const maxTemp = Math.max(...temps);
        const minTemp = Math.min(...temps);
        const maxWind = Math.max(...winds);
        const rainDays = conditions.filter(c => c === 'Rain' || c === 'Drizzle').length;
        
        if (maxTemp > 25) {
            warnings.push(`Vysoké teploty až ${Math.round(maxTemp)}°C - připravte chladící zařízení`);
        }
        if (minTemp < 5) {
            warnings.push(`Nízké teploty až ${Math.round(minTemp)}°C - očekávejte nižší návštěvnost`);
        }
        if (rainDays > 0) {
            warnings.push(`Déšť ${rainDays} ${rainDays === 1 ? 'den' : 'dny'} - připravte krytí a snižte objednávku o 30-50%`);
        }
        if (maxWind > 10) {
            warnings.push(`Silný vítr až ${Math.round(maxWind)} m/s - zajistěte pevné kotvení stánku`);
        }
        
        return warnings;
    }

    // Ikony počasí
    getWeatherIcon(weatherMain) {
        const icons = {
            'Clear': '☀️',
            'Clouds': '☁️',
            'Rain': '🌧️',
            'Snow': '❄️',
            'Thunderstorm': '⛈️',
            'Drizzle': '🌦️',
            'Mist': '🌫️',
            'Fog': '🌫️',
            'Haze': '🌫️'
        };
        return icons[weatherMain] || '🌤️';
    }

    // Barvy pozadí podle počasí
    getWeatherColor(weatherMain) {
        const colors = {
            'Clear': '#f39c12',      // oranžová
            'Clouds': '#7f8c8d',     // šedá
            'Rain': '#3498db',       // modrá
            'Snow': '#bdc3c7',       // světle šedá
            'Thunderstorm': '#9b59b6', // fialová
            'Drizzle': '#5dade2',    // světle modrá
            'Mist': '#95a5a6',       // šedá
            'Fog': '#95a5a6',        // šedá
            'Haze': '#95a5a6'        // šedá
        };
        return colors[weatherMain] || '#34495e';
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

    // Test API připojení
    async testConnection() {
        if (!this.apiKey) {
            return { success: false, message: 'API klíč není nastaven' };
        }

        try {
            const response = await fetch(
                `https://api.openweathermap.org/data/2.5/weather?q=Prague&appid=${this.apiKey}&units=metric`
            );
            
            if (response.ok) {
                const data = await response.json();
                return { 
                    success: true, 
                    message: `OK (Praha: ${Math.round(data.main.temp)}°C)` 
                };
            } else {
                return { 
                    success: false, 
                    message: `API chyba: ${response.status}` 
                };
            }
        } catch (error) {
            return { 
                success: false, 
                message: `Chyba připojení: ${error.message}` 
            };
        }
    }

    // Vyčištění cache
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Weather cache vyčištěna');
    }
}

// Export pro použití v jiných souborech
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WeatherManager;
}

// Globální instance
window.weatherManager = new WeatherManager();
