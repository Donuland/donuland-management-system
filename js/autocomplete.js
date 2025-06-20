// js/autocomplete.js - Reálné Google Maps API + automatický výpočet dopravy
// ✅ Jakékoliv město světa + automatický výpočet vzdálenosti a dopravy

class AutocompleteManager {
    constructor() {
        // Váš Google Maps API klíč
        this.googleMapsApiKey = 'AIzaSyBTTA_MKa6FrxKpkcd7c5-d3FnC6FBLVTc';
        this.sheetsId = '1LclCz9hb0hlb1D92OyVqk6Cbam7PRK6KgAzGgiGs6iE';
        
        // Dopravní nastavení
        this.baseLocation = 'Praha, Česká republika';
        this.transportCostPerKm = 15; // 15 Kč/km tam i zpět
        
        // Cache a služby
        this.eventsCache = [];
        this.distanceCache = new Map();
        this.autocompleteService = null;
        this.distanceService = null;
        this.currentSuggestionIndex = -1;
        
        // Podporované země
        this.supportedCountries = ['cz', 'sk', 'pl', 'de', 'at'];
        
        this.init();
    }

    async init() {
        console.log('🗺️ Inicializuji Autocomplete s Google Maps API...');
        
        try {
            // Zkontroluj, zda je Google Maps API dostupné
            await this.waitForGoogleMaps();
            
            // Inicializuj Google služby
            this.initializeGoogleServices();
            
            // Načti události ze Sheets
            await this.loadEventsFromSheets();
            
            // Nastav autocomplete
            this.setupCityAutocomplete();
            this.setupEventAutocomplete();
            this.setupKeyboardNavigation();
            
            console.log('✅ Autocomplete s Google Maps API inicializován');
            
        } catch (error) {
            console.error('❌ Chyba při inicializaci Google Maps:', error);
            console.warn('⚠️ Přepínám na fallback režim');
            this.initFallbackMode();
        }
    }

    async waitForGoogleMaps() {
        // Počkej na načtení Google Maps API
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50;
            
            const checkGoogle = () => {
                attempts++;
                
                if (window.google && window.google.maps && window.google.maps.places) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Google Maps API se nepodařilo načíst'));
                } else {
                    setTimeout(checkGoogle, 100);
                }
            };
            
            checkGoogle();
        });
    }

    initializeGoogleServices() {
        // Inicializuj Google Places Autocomplete Service
        this.autocompleteService = new google.maps.places.AutocompleteService();
        
        // Inicializuj Distance Matrix Service
        this.distanceService = new google.maps.DistanceMatrixService();
        
        console.log('✅ Google služby inicializovány');
    }

    initFallbackMode() {
        // Fallback na statický seznam pokud Google API není dostupné
        this.loadFallbackData();
        this.setupCityAutocompleteFallback();
        this.setupEventAutocomplete();
        this.setupKeyboardNavigation();
    }

    // =================== GOOGLE SHEETS NAČÍTÁNÍ ===================
    async loadEventsFromSheets() {
        try {
            console.log('📊 Načítám události z Google Sheets...');
            
            const sheetUrl = `https://docs.google.com/spreadsheets/d/${this.sheetsId}/gviz/tq?tqx=out:csv&sheet=Sheet1`;
            
            const response = await fetch(sheetUrl);
            const csvText = await response.text();
            
            this.eventsCache = this.parseCSVData(csvText);
            console.log(`✅ Načteno ${this.eventsCache.length} událostí ze Sheets`);
            
        } catch (error) {
            console.error('❌ Chyba při načítání ze Sheets:', error);
            this.eventsCache = this.getFallbackEvents();
        }
    }

    parseCSVData(csvText) {
        const lines = csvText.split('\n');
        const events = [];
        
        if (lines.length < 2) return events;
        
        const headers = lines[0].split(',').map(h => h.replace(/"/g, '').trim());
        
        const dateIndex = this.findColumnIndex(headers, ['datum']);
        const cityIndex = this.findColumnIndex(headers, ['lokalita', 'město']);
        const nameIndex = this.findColumnIndex(headers, ['název', 'akce']);
        const categoryIndex = this.findColumnIndex(headers, ['kategorie', 'typ']);
        const confirmedIndex = this.findColumnIndex(headers, ['potvrzeno']);
        
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            
            const row = this.parseCSVRow(lines[i]);
            if (row.length < 3) continue;
            
            const event = {
                name: row[nameIndex] || '',
                city: row[cityIndex] || '',
                category: row[categoryIndex] || '',
                confirmed: row[confirmedIndex] === 'ANO',
                popularity: this.calculatePopularity(row[nameIndex], row[cityIndex]),
                date: row[dateIndex] || ''
            };
            
            if (event.name && event.city && event.confirmed) {
                events.push(event);
            }
        }
        
        return events;
    }

    findColumnIndex(headers, possibleNames) {
        for (const name of possibleNames) {
            const index = headers.findIndex(h => 
                h.toLowerCase().includes(name.toLowerCase())
            );
            if (index !== -1) return index;
        }
        return -1;
    }

    parseCSVRow(row) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < row.length; i++) {
            const char = row[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    calculatePopularity(eventName, city) {
        if (!eventName || !city) return 1;
        
        const count = this.eventsCache.filter(e => 
            e.name === eventName && e.city === city
        ).length;
        
        return Math.min(5, Math.max(1, count));
    }

    // =================== GOOGLE PLACES AUTOCOMPLETE ===================
    setupCityAutocomplete() {
        const cityInput = document.querySelector('input[placeholder*="město"], input[placeholder*="Město"], input[placeholder*="lokalita"], input[placeholder*="Lokalita"]');
        
        if (!cityInput) {
            console.warn('❌ City input nenalezen');
            return;
        }

        console.log('✅ Nastavuji Google Places Autocomplete');
        
        const suggestionsContainer = this.createSuggestionsContainer(cityInput, 'city-suggestions');
        let searchTimeout;

        cityInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            clearTimeout(searchTimeout);
            
            if (query.length < 2) {
                this.hideSuggestions(suggestionsContainer);
                return;
            }

            // Debounce vyhledávání
            searchTimeout = setTimeout(() => {
                this.searchPlacesWithGoogle(query, suggestionsContainer, cityInput);
            }, 300);
        });

        this.addInputEventListeners(cityInput, suggestionsContainer);
    }

    async searchPlacesWithGoogle(query, container, input) {
        try {
            this.showLoading(container);
            
            // Google Places Autocomplete request
            const request = {
                input: query,
                types: ['(cities)'], // Pouze města
                componentRestrictions: {
                    country: this.supportedCountries // Omez na podporované země
                }
            };

            this.autocompleteService.getPlacePredictions(request, (predictions, status) => {
                if (status === google.maps.places.PlacesServiceStatus.OK && predictions) {
                    const places = predictions.map(prediction => ({
                        description: prediction.description,
                        place_id: prediction.place_id,
                        country: this.extractCountryFromDescription(prediction.description)
                    }));
                    
                    this.showCitySuggestions(places, container, input);
                } else {
                    console.warn('❌ Google Places API chyba:', status);
                    // Fallback na statický seznam
                    const fallbackPlaces = this.searchPlacesFallback(query);
                    this.showCitySuggestions(fallbackPlaces, container, input);
                }
            });
            
        } catch (error) {
            console.error('❌ Chyba při vyhledávání míst:', error);
            // Fallback na statický seznam
            const fallbackPlaces = this.searchPlacesFallback(query);
            this.showCitySuggestions(fallbackPlaces, container, input);
        }
    }

    extractCountryFromDescription(description) {
        if (description.includes('Česká republika') || description.includes('Czech Republic')) return 'CZ';
        if (description.includes('Slovensko') || description.includes('Slovakia')) return 'SK';
        if (description.includes('Německo') || description.includes('Germany')) return 'DE';
        if (description.includes('Rakousko') || description.includes('Austria')) return 'AT';
        if (description.includes('Polsko') || description.includes('Poland')) return 'PL';
        return 'EU';
    }

    // =================== VÝPOČET VZDÁLENOSTI A DOPRAVY ===================
    async calculateDistanceAndTransport(destinationCity) {
        const cacheKey = `${this.baseLocation}_${destinationCity}`;
        
        // Zkontroluj cache
        if (this.distanceCache.has(cacheKey)) {
            const cachedData = this.distanceCache.get(cacheKey);
            this.updateTransportCost(cachedData.distance, destinationCity);
            return cachedData;
        }

        try {
            console.log(`🗺️ Počítám vzdálenost: ${this.baseLocation} → ${destinationCity}`);
            
            return new Promise((resolve, reject) => {
                this.distanceService.getDistanceMatrix({
                    origins: [this.baseLocation],
                    destinations: [destinationCity],
                    travelMode: google.maps.TravelMode.DRIVING,
                    unitSystem: google.maps.UnitSystem.METRIC
                }, (response, status) => {
                    if (status === google.maps.DistanceMatrixStatus.OK) {
                        const element = response.rows[0].elements[0];
                        
                        if (element.status === 'OK') {
                            const distanceKm = Math.round(element.distance.value / 1000);
                            const durationText = element.duration.text;
                            
                            const data = {
                                distance: distanceKm,
                                duration: durationText,
                                city: destinationCity
                            };
                            
                            // Ulož do cache
                            this.distanceCache.set(cacheKey, data);
                            
                            // Aktualizuj UI
                            this.updateTransportCost(distanceKm, destinationCity, durationText);
                            
                            console.log(`✅ Vzdálenost: ${distanceKm} km, čas: ${durationText}`);
                            resolve(data);
                        } else {
                            // Fallback na odhad
                            const estimatedDistance = this.estimateDistance(destinationCity);
                            this.updateTransportCost(estimatedDistance, destinationCity, null, true);
                            resolve({ distance: estimatedDistance, city: destinationCity, estimated: true });
                        }
                    } else {
                        console.warn('❌ Distance Matrix API chyba:', status);
                        // Fallback na odhad
                        const estimatedDistance = this.estimateDistance(destinationCity);
                        this.updateTransportCost(estimatedDistance, destinationCity, null, true);
                        resolve({ distance: estimatedDistance, city: destinationCity, estimated: true });
                    }
                });
            });
            
        } catch (error) {
            console.error('❌ Chyba při výpočtu vzdálenosti:', error);
            // Fallback na odhad
            const estimatedDistance = this.estimateDistance(destinationCity);
            this.updateTransportCost(estimatedDistance, destinationCity, null, true);
            return { distance: estimatedDistance, city: destinationCity, estimated: true };
        }
    }

    updateTransportCost(distanceKm, city, duration = null, isEstimate = false) {
        // Vypočítej náklady na dopravu (tam i zpět)
        const transportCost = distanceKm * 2 * this.transportCostPerKm;
        
        // Aktualizuj transport cost input
        const transportInput = document.getElementById('transport-cost');
        if (transportInput) {
            transportInput.value = Math.round(transportCost);
            // Trigger change event pro business calculator
            transportInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
        
        // Aktualizuj info o dopravě
        this.updateTransportInfo(city, distanceKm, transportCost, duration, isEstimate);
        
        console.log(`💰 Doprava do ${city}: ${distanceKm} km = ${this.formatCurrency(transportCost)}`);
    }

    updateTransportInfo(city, distance, cost, duration, isEstimate) {
        const infoContainer = document.getElementById('transport-info') || 
                             this.createTransportInfoContainer();
        
        if (infoContainer) {
            const estimateText = isEstimate ? ' (odhad)' : '';
            const durationText = duration ? ` • ${duration}` : '';
            
            infoContainer.innerHTML = `
                <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea;">
                    <h4 style="margin: 0 0 10px 0; color: #667eea; display: flex; align-items: center; gap: 8px;">
                        🚗 Doprava z ${this.baseLocation.split(',')[0]}
                        ${isEstimate ? '<span style="font-size: 12px; background: #ffeaa7; color: #e17055; padding: 2px 6px; border-radius: 4px;">ODHAD</span>' : '<span style="font-size: 12px; background: #d1ecf1; color: #0c5460; padding: 2px 6px; border-radius: 4px;">GOOGLE MAPS</span>'}
                    </h4>
                    <div style="font-size: 14px; color: #666; line-height: 1.5;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 10px;">
                            <div>
                                <strong>Cíl:</strong><br>
                                <span style="color: #333;">${city}</span>
                            </div>
                            <div>
                                <strong>Vzdálenost:</strong><br>
                                <span style="color: #333;">${distance} km${estimateText}</span>
                            </div>
                        </div>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                            <div>
                                <strong>Celkem (tam+zpět):</strong><br>
                                <span style="color: #333;">${distance * 2} km${durationText}</span>
                            </div>
                            <div>
                                <strong>Náklady:</strong><br>
                                <span style="color: #667eea; font-weight: 600;">${this.formatCurrency(cost)}</span>
                            </div>
                        </div>
                        <div style="margin-top: 8px; font-size: 12px; opacity: 0.8;">
                            Sazba: ${this.transportCostPerKm} Kč/km • Zdroj: ${isEstimate ? 'Odhad' : 'Google Maps'}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    createTransportInfoContainer() {
        const transportInput = document.getElementById('transport-cost');
        if (transportInput && transportInput.parentElement) {
            let container = document.getElementById('transport-info');
            if (!container) {
                container = document.createElement('div');
                container.id = 'transport-info';
                transportInput.parentElement.appendChild(container);
            }
            return container;
        }
        return null;
    }

    estimateDistance(city) {
        // Fallback odhady vzdáleností z Prahy
        const cityLower = city.toLowerCase();
        
        // Česká města
        if (cityLower.includes('brno')) return 206;
        if (cityLower.includes('ostrava')) return 356;
        if (cityLower.includes('plzeň') || cityLower.includes('plzen')) return 90;
        if (cityLower.includes('liberec')) return 104;
        if (cityLower.includes('olomouc')) return 276;
        if (cityLower.includes('budějovic')) return 150;
        if (cityLower.includes('hradec')) return 114;
        if (cityLower.includes('pardubice')) return 108;
        
        // Slovensko
        if (cityLower.includes('bratislav')) return 330;
        if (cityLower.includes('košice')) return 450;
        
        // Rakousko
        if (cityLower.includes('wien') || cityLower.includes('vídeň')) return 290;
        if (cityLower.includes('salzburg')) return 380;
        if (cityLower.includes('linz')) return 280;
        
        // Německo
        if (cityLower.includes('berlin')) return 350;
        if (cityLower.includes('münchen') || cityLower.includes('munich')) return 390;
        if (cityLower.includes('dresden')) return 150;
        
        // Polsko
        if (cityLower.includes('warszaw') || cityLower.includes('warsaw')) return 680;
        if (cityLower.includes('kraków') || cityLower.includes('krakow')) return 540;
        if (cityLower.includes('wrocław') || cityLower.includes('wroclaw')) return 350;
        
        // Výchozí odhad pro neznámá města
        return 200;
    }

    // =================== UDÁLOSTI AUTOCOMPLETE ===================
    setupEventAutocomplete() {
        const eventInput = document.querySelector('input[placeholder*="akc"], input[placeholder*="Akc"], input[placeholder*="název"], input[placeholder*="Název"]');
        
        if (!eventInput) {
            console.warn('❌ Event input nenalezen');
            return;
        }

        console.log('✅ Nastavuji autocomplete pro události');
        
        const suggestionsContainer = this.createSuggestionsContainer(eventInput, 'event-suggestions');

        eventInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            if (query.length < 1) {
                this.hideSuggestions(suggestionsContainer);
                return;
            }

            const cityInput = document.querySelector('input[placeholder*="město"], input[placeholder*="Město"]');
            const selectedCity = cityInput ? this.extractCityName(cityInput.value) : '';
            
            const matchingEvents = this.searchEvents(query, selectedCity);
            this.showEventSuggestions(matchingEvents, suggestionsContainer, eventInput);
        });

        this.addInputEventListeners(eventInput, suggestionsContainer);
    }

    searchEvents(query, selectedCity = '') {
        const queryLower = query.toLowerCase();
        
        let results = this.eventsCache.filter(event => {
            const nameMatch = event.name.toLowerCase().includes(queryLower);
            const cityMatch = !selectedCity || 
                            event.city.toLowerCase().includes(selectedCity.toLowerCase());
            return nameMatch && cityMatch && event.confirmed;
        });

        results.sort((a, b) => {
            const aStartsWithQuery = a.name.toLowerCase().startsWith(queryLower) ? 1 : 0;
            const bStartsWithQuery = b.name.toLowerCase().startsWith(queryLower) ? 1 : 0;
            
            if (aStartsWithQuery !== bStartsWithQuery) {
                return bStartsWithQuery - aStartsWithQuery;
            }
            
            return b.popularity - a.popularity;
        });

        const uniqueResults = [];
        const seen = new Set();
        
        for (const result of results) {
            const key = `${result.name}_${result.city}`;
            if (!seen.has(key)) {
                seen.add(key);
                uniqueResults.push(result);
            }
            if (uniqueResults.length >= 6) break;
        }

        return uniqueResults;
    }

    extractCityName(fullName) {
        if (!fullName) return '';
        return fullName.split(',')[0].trim();
    }

    // =================== UI RENDERING ===================
    createSuggestionsContainer(input, id) {
        let container = document.getElementById(id);
        
        if (!container) {
            container = document.createElement('div');
            container.id = id;
            container.className = 'autocomplete-suggestions';
            container.style.cssText = `
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: white;
                border: 2px solid #e0e6ed;
                border-top: none;
                border-radius: 0 0 8px 8px;
                max-height: 250px;
                overflow-y: auto;
                z-index: 1000;
                box-shadow: 0 4px 15px rgba(0,0,0,0.15);
                display: none;
            `;
            
            const parent = input.parentElement;
            if (parent.style.position !== 'relative' && parent.style.position !== 'absolute') {
                parent.style.position = 'relative';
            }
            parent.appendChild(container);
        }
        
        return container;
    }

    showLoading(container) {
        container.innerHTML = `
            <div style="padding: 20px; text-align: center; color: #666;">
                <div style="font-size: 14px;">🔍 Hledám ve světě...</div>
            </div>
        `;
        container.style.display = 'block';
    }

    showCitySuggestions(places, container, input) {
        if (!places || places.length === 0) {
            container.innerHTML = `
                <div style="padding: 15px; color: #999; text-align: center;">
                    Žádná města nenalezena
                </div>
            `;
            container.style.display = 'block';
            return;
        }

        container.innerHTML = '';
        this.currentSuggestionIndex = -1;
        this.activeSuggestions = places.map(p => p.description);

        places.forEach((place, index) => {
            const suggestion = document.createElement('div');
            suggestion.className = 'autocomplete-suggestion';
            suggestion.style.cssText = `
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                transition: background 0.2s ease;
                display: flex;
                align-items: center;
                gap: 10px;
            `;
            
            const flag = this.getCountryFlag(place.country);
            suggestion.innerHTML = `
                <span style="font-size: 18px;">${flag}</span>
                <span>${place.description}</span>
            `;
            
            suggestion.addEventListener('mouseenter', () => {
                this.highlightSuggestion(index, container);
            });
            
            suggestion.addEventListener('click', async () => {
                input.value = place.description;
                this.hideSuggestions(container);
                input.focus();
                
                // Automaticky vypočítej vzdálenost a dopravu
                const cityName = this.extractCityName(place.description);
                if (cityName) {
                    await this.calculateDistanceAndTransport(place.description);
                }
                
                // Trigger change event
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
            
            container.appendChild(suggestion);
        });

        container.style.display = 'block';
    }

    showEventSuggestions(events, container, input) {
        if (!events || events.length === 0) {
            container.innerHTML = `
                <div style="padding: 15px; color: #999; text-align: center;">
                    Žádné události nenalezeny
                </div>
            `;
            container.style.display = 'block';
            return;
        }

        container.innerHTML = '';
        this.currentSuggestionIndex = -1;
        this.activeSuggestions = events.map(e => e.name);

        events.forEach((event, index) => {
            const suggestion = document.createElement('div');
            suggestion.className = 'autocomplete-suggestion';
            suggestion.style.cssText = `
                padding: 12px 16px;
                cursor: pointer;
                border-bottom: 1px solid #f0f0f0;
                transition: background 0.2s ease;
            `;
            
            const stars = '★'.repeat(event.popularity);
            const categoryIcon = this.getCategoryIcon(event.category);
            
            suggestion.innerHTML = `
                <div style="font-weight: 500; margin-bottom: 4px; display: flex; align-items: center; gap: 8px;">
                    <span>${categoryIcon}</span>
                    <span>${event.name}</span>
                </div>
                <div style="font-size: 12px; color: #666; display: flex; justify-content: space-between;">
                    <span>${event.city} • ${event.category}</span>
                    <span style="color: #f39c12;">${stars}</span>
                </div>
            `;
            
            suggestion.addEventListener('mouseenter', () => {
                this.highlightSuggestion(index, container);
            });
            
            suggestion.addEventListener('click', () => {
                input.value = event.name;
                this.hideSuggestions(container);
                input.focus();
                
                input.dispatchEvent(new Event('change', { bubbles: true }));
                input.dispatchEvent(new Event('input', { bubbles: true }));
            });
            
            container.appendChild(suggestion);
        });

        container.style.display = 'block';
    }

    getCountryFlag(countryCode) {
        const flags = {
            'CZ': '🇨🇿',
            'SK': '🇸🇰',
            'PL': '🇵🇱',
            'DE': '🇩🇪',
            'AT': '🇦🇹',
            'EU': '🇪🇺'
        };
        return flags[countryCode] || '🌍';
    }

    getCategoryIcon(category) {
        const icons = {
            'food festival': '🍔',
            'veletrh': '🏢',
            'koncert': '🎵',
            'Sportovní akce (dospělí)': '🏃',
            'kulturní akce (rodinná)': '👨‍👩‍👧‍👦',
            'rodinný festival': '🎪',
            'ostatní': '📅'
        };
        return icons[category] || '📅';
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('cs-CZ', {
            style: 'currency',
            currency: 'CZK',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    }

    // =================== EVENT HANDLERS ===================
    addInputEventListeners(input, container) {
        input.addEventListener('blur', () => {
            setTimeout(() => {
                this.hideSuggestions(container);
            }, 200);
        });

        input.addEventListener('focus', () => {
            if (input.value.trim().length > 1) {
                input.dispatchEvent(new Event('input'));
            }
        });
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            const activeContainer = document.querySelector('.autocomplete-suggestions[style*="block"]');
            if (!activeContainer) return;

            const suggestions = activeContainer.querySelectorAll('.autocomplete-suggestion');
            if (suggestions.length === 0) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    this.navigateSuggestions(1, activeContainer);
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    this.navigateSuggestions(-1, activeContainer);
