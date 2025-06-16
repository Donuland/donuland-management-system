// =============================================================================
// WEATHER MODULE
// =============================================================================

const weather = {
    async loadWeather() {
        const location = document.getElementById('eventLocation').value.trim();
        const date = document.getElementById('eventDate').value;
        const duration = parseInt(document.getElementById('eventDuration').value);
        const environment = document.getElementById('eventEnvironment').value;
        
        if (!location || !date) {
            document.getElementById('weatherDisplay').innerHTML = 
                '<div class="weather-loading">📍 Vyberte město a datum pro načtení počasí</div>';
            return;
        }

        const weatherDisplay = document.getElementById('weatherDisplay');
        const weatherDays = document.getElementById('weatherDays');
        const qualityWarning = document.getElementById('qualityWarning');
        
        ui.showLoading('weatherDisplay', 'Načítám předpověď počasí...');
        weatherDays.innerHTML = '';
        qualityWarning.style.display = 'none';

        try {
            // Get coordinates for the location
            const geoUrl = `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(location)},CZ&limit=1&appid=${CONFIG.WEATHER_API_KEY}`;
            const geoResponse = await fetch(geoUrl);
            const geoData = await geoResponse.json();
            
            if (!geoData || geoData.length === 0) {
                throw new Error('Město nenalezeno');
            }

            const lat = geoData[0].lat;
            const lon = geoData[0].lon;

            // Get weather forecast
            const weatherUrl = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${CONFIG.WEATHER_API_KEY}&units=metric&lang=cs`;
            const weatherResponse = await fetch(weatherUrl);
            
            if (!weatherResponse.ok) {
                throw new Error(`Weather API error: ${weatherResponse.status}`);
            }
            
            const weatherData = await weatherResponse.json();

            // Process weather data
            const eventDate = new Date(date);
            const weatherSummary = this.processWeatherData(weatherData, eventDate, duration, environment);
            
            // Display results
            this.displayWeatherResults(weatherSummary, location, duration, environment);
            
            // Store weather data for prediction
            GLOBAL_STATE.currentWeatherData = weatherSummary;
            
            // Update prediction
            if (typeof prediction !== 'undefined') {
                prediction.updatePrediction();
            }

        } catch (error) {
            console.error('Weather error:', error);
            weatherDisplay.innerHTML = `
                <div style="color: #e74c3c;">
                    ⚠️ Nepodařilo se načíst počasí pro ${location}
                    <br><small>${error.message}</small>
                </div>
            `;
            GLOBAL_STATE.currentWeatherData = null;
        }
    },

    processWeatherData(weatherData, eventDate, duration, environment) {
        let totalTemp = 0;
        let totalRain = 0;
        let maxTemp = -Infinity;
        let minTemp = Infinity;
        let weatherSummary = {
            avgTemp: 0,
            maxTemp: 0,
            minTemp: 0,
            totalRain: 0,
            weatherConditions: [],
            dayDetails: [],
            qualityRisk: false,
            environmentImpact: 1.0
        };

        for (let day = 0; day < duration; day++) {
            const currentDate = new Date(eventDate);
            currentDate.setDate(eventDate.getDate() + day);
            
            // Filter weather data for this day
            const dayData = weatherData.list.filter(item => {
                const itemDate = new Date(item.dt * 1000);
                return itemDate.toDateString() === currentDate.toDateString();
            });

            if (dayData.length > 0) {
                const dayTemp = dayData.reduce((sum, item) => sum + item.main.temp, 0) / dayData.length;
                const dayMaxTemp = Math.max(...dayData.map(item => item.main.temp_max));
                const dayMinTemp = Math.min(...dayData.map(item => item.main.temp_min));
                const dayRain = dayData.reduce((sum, item) => sum + (item.rain?.['3h'] || 0), 0);
                const dayWeather = dayData[Math.floor(dayData.length / 2)].weather[0];

                totalTemp += dayTemp;
                totalRain += dayRain;
                maxTemp = Math.max(maxTemp, dayMaxTemp);
                minTemp = Math.min(minTemp, dayMinTemp);
                
                // Check for quality risk
                const hasQualityRisk = dayMaxTemp > CONFIG.WEATHER.TEMP_THRESHOLD && environment !== 'indoor';
                if (hasQualityRisk) {
                    weatherSummary.qualityRisk = true;
                }

                weatherSummary.weatherConditions.push(dayWeather.description);
                weatherSummary.dayDetails.push({
                    day: day + 1,
                    date: currentDate,
                    temp: Math.round(dayTemp),
                    maxTemp: Math.round(dayMaxTemp),
                    minTemp: Math.round(dayMinTemp),
                    rain: Math.round(dayRain * 10) / 10,
                    description: dayWeather.description,
                    icon: dayWeather.icon,
                    qualityRisk: hasQualityRisk
                });
            }
        }

        weatherSummary.avgTemp = Math.round(totalTemp / duration);
        weatherSummary.maxTemp = Math.round(maxTemp);
        weatherSummary.minTemp = Math.round(minTemp);
        weatherSummary.totalRain = Math.round(totalRain * 10) / 10;

        // Calculate environment impact
        weatherSummary.environmentImpact = this.calculateEnvironmentImpact(weatherSummary, environment);

        return weatherSummary;
    },

    calculateEnvironmentImpact(weatherSummary, environment) {
        let impact = 1.0;
        
        if (environment === 'indoor') {
            return Math.max(0.9, Math.min(1.1, 1.0 + (weatherSummary.totalRain > 10 ? 0.1 : 0)));
        }
        
        // Temperature impact
        if (weatherSummary.avgTemp < 10) {
            impact *= 0.8;
        } else if (weatherSummary.avgTemp > 30) {
            impact *= 0.85;
        } else if (weatherSummary.avgTemp >= 18 && weatherSummary.avgTemp <= 25) {
            impact *= 1.1;
        }
        
        // Rain impact
        if (weatherSummary.totalRain > 15) {
            impact *= 0.6;
        } else if (weatherSummary.totalRain > 5) {
            impact *= 0.8;
        } else if (weatherSummary.totalRain < 2) {
            impact *= 1.05;
        }
        
        // Quality risk impact
        if (weatherSummary.qualityRisk) {
            impact *= 0.9;
        }
        
        return Math.max(0.5, Math.min(1.3, impact));
    },

    displayWeatherResults(weatherSummary, location, duration, environment) {
        const weatherDisplay = document.getElementById('weatherDisplay');
        const weatherDays = document.getElementById('weatherDays');
        const qualityWarning = document.getElementById('qualityWarning');
        
        // Main weather summary
        const impactText = this.getWeatherImpactText(weatherSummary.environmentImpact);
        
        weatherDisplay.innerHTML = `
            <h5>📍 ${location} - Předpověď na ${duration} ${duration === 1 ? 'den' : duration < 5 ? 'dny' : 'dní'}</h5>
            <p><strong>Teploty:</strong> ${weatherSummary.minTemp}°C - ${weatherSummary.maxTemp}°C (ø ${weatherSummary.avgTemp}°C)</p>
            <p><strong>Celkové srážky:</strong> ${weatherSummary.totalRain} mm</p>
            <p><strong>Dopad na prodej:</strong> <span style="color: ${impactText.color}">${impactText.text}</span></p>
            ${environment === 'indoor' ? '<p style="opacity: 0.8;"><em>Vnitřní akce - snížený vliv počasí</em></p>' : ''}
        `;
        
        // Daily weather breakdown
        let weatherDaysHtml = '';
        weatherSummary.dayDetails.forEach(day => {
            let impactClass = 'positive';
            if (day.rain > 8 || day.maxTemp < 12 || day.qualityRisk) {
                impactClass = 'negative';
            } else if (day.rain > 3 || day.maxTemp < 16 || day.maxTemp > 28) {
                impactClass = 'warning';
            }
            
            if (day.qualityRisk) {
                impactClass += ' quality-risk';
            }

            weatherDaysHtml += `
                <div class="weather-day ${impactClass}">
                    <strong>Den ${day.day}</strong>
                    <div>${day.date.toLocaleDateString('cs-CZ', { weekday: 'short', day: 'numeric', month: 'numeric' })}</div>
                    <div>🌡️ ${day.minTemp}° - ${day.maxTemp}°C</div>
                    <div>💧 ${day.rain} mm</div>
                    <div style="font-size: 0.85em; margin-top: 5px;">${day.description}</div>
                    ${day.qualityRisk ? '<div style="font-size: 0.8em; color: #e74c3c; font-weight: bold;">⚠️ Riziko roztékání</div>' : ''}
                </div>
            `;
        });
        
        weatherDays.innerHTML = weatherDaysHtml;
        
        // Quality warning
        if (weatherSummary.qualityRisk && environment !== 'indoor') {
            qualityWarning.style.display = 'block';
        }
    },

    getWeatherImpactText(impact) {
        if (impact > 1.15) {
            return { text: '☀️ Vynikající podmínky (+15% až +30%)', color: '#00b894' };
        } else if (impact > 1.05) {
            return { text: '🌤️ Dobré podmínky (+5% až +15%)', color: '#00b894' };
        } else if (impact > 0.95) {
            return { text: '⛅ Neutrální podmínky', color: '#74b9ff' };
        } else if (impact > 0.8) {
            return { text: '🌧️ Méně příznivé (-5% až -20%)', color: '#fdcb6e' };
        } else {
            return { text: '⛈️ Nepříznivé podmínky (-20% až -40%)', color: '#e17055' };
        }
    }
};
