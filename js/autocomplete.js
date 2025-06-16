// =============================================================================
// AUTOCOMPLETE MODULE
// =============================================================================

const autocomplete = {
    // Initialize autocomplete data
    initialize() {
        console.log('🔍 Initializing autocomplete...');
        this.updateData();
        this.setupEventListeners();
    },

    // Update autocomplete data from various sources
    updateData() {
        // Extract unique event names and locations
        const eventNames = new Set();
        const locations = new Set();
        
        [...GLOBAL_STATE.historicalData, ...GLOBAL_STATE.plannedEvents, ...GLOBAL_STATE.localSavedEvents].forEach(event => {
            if (event.eventName) eventNames.add(event.eventName);
            if (event.location) locations.add(event.location);
        });
        
        GLOBAL_STATE.autocompleteData.eventNames = Array.from(eventNames).sort();
        GLOBAL_STATE.autocompleteData.locations = Array.from(locations).sort();
        
        console.log(`📋 Autocomplete data: ${GLOBAL_STATE.autocompleteData.eventNames.length} events, ${GLOBAL_STATE.autocompleteData.locations.length} locations`);
    },

    // Handle event name input
    handleEventNameInput() {
        const input = document.getElementById('eventName');
        if (!input) return;
        
        const value = input.value.trim().toLowerCase();
        
        if (value.length < 2) {
            this.hideAutocomplete(input);
            return;
        }
        
        const matches = GLOBAL_STATE.autocompleteData.eventNames
            .filter(name => name.toLowerCase().includes(value))
            .slice(0, 8);
        
        if (matches.length > 0) {
            this.showAutocomplete(input, matches, (selectedValue) => {
                input.value = selectedValue;
                this.hideAutocomplete(input);
                this.autoFillEventData(selectedValue);
                if (typeof prediction !== 'undefined') {
                    prediction.updatePrediction();
                }
            });
        } else {
            this.hideAutocomplete(input);
        }
    },

    // Handle location input
    handleLocationInput() {
        const input = document.getElementById('eventLocation');
        if (!input) return;
        
        const value = input.value.trim().toLowerCase();
        
        if (value.length < 2) {
            this.hideAutocomplete(input);
            return;
        }
        
        const matches = GLOBAL_STATE.autocompleteData.locations
            .filter(location => location.toLowerCase().includes(value))
            .slice(0, 8);
        
        if (matches.length > 0) {
            this.showAutocomplete(input, matches, (selectedValue) => {
                input.value = selectedValue;
                this.hideAutocomplete(input);
                if (typeof weather !== 'undefined') {
                    weather.loadWeather();
                }
            });
        } else {
            this.hideAutocomplete(input);
        }
    },

    // Show autocomplete dropdown
    showAutocomplete(input, suggestions, onSelect) {
        this.hideAutocomplete(input);
        
        const dropdown = document.createElement('div');
        dropdown.className = 'autocomplete-dropdown';
        dropdown.style.position = 'absolute';
        dropdown.style.zIndex = '1000';
        
        suggestions.forEach((suggestion, index) => {
            const item = document.createElement('div');
            item.className = 'autocomplete-item';
            item.textContent = suggestion;
            item.onclick = () => onSelect(suggestion);
            
            item.onmouseenter = () => {
                dropdown.querySelectorAll('.autocomplete-item').forEach(i => i.classList.remove('selected'));
                item.classList.add('selected');
            };
            
            dropdown.appendChild(item);
        });
        
        input.parentNode.style.position = 'relative';
        input.parentNode.appendChild(dropdown);
        
        // Keyboard navigation
        input.onkeydown = (e) => {
            const items = dropdown.querySelectorAll('.autocomplete-item');
            let selected = dropdown.querySelector('.autocomplete-item.selected');
            
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                if (!selected) {
                    items[0]?.classList.add('selected');
                } else {
                    selected.classList.remove('selected');
                    const nextIndex = Array.from(items).indexOf(selected) + 1;
                    items[nextIndex % items.length]?.classList.add('selected');
                }
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                if (!selected) {
                    items[items.length - 1]?.classList.add('selected');
                } else {
                    selected.classList.remove('selected');
                    const prevIndex = Array.from(items).indexOf(selected) - 1;
                    items[prevIndex < 0 ? items.length - 1 : prevIndex]?.classList.add('selected');
                }
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (selected) {
                    onSelect(selected.textContent);
                }
            } else if (e.key === 'Escape') {
                this.hideAutocomplete(input);
            }
        };
    },

    // Hide autocomplete dropdown
    hideAutocomplete(input) {
        const existing = input.parentNode.querySelector('.autocomplete-dropdown');
        if (existing) {
            existing.remove();
        }
        input.onkeydown = null;
    },

    // Auto-fill event data based on similar events
    autoFillEventData(eventName) {
        const similarEvent = dataManager.findSimilarEvents(eventName);
        
        if (similarEvent) {
            // Auto-fill fields
            const locationField = document.getElementById('eventLocation');
            if (similarEvent.location && (!locationField.value || locationField.value.trim() === '')) {
                locationField.value = similarEvent.location;
            }
            
            const eventTypeField = document.getElementById('eventType');
            if (similarEvent.eventType && (!eventTypeField.value || eventTypeField.value === '')) {
                eventTypeField.value = similarEvent.eventType;
            }
            
            const visitorsField = document.getElementById('expectedVisitors');
            if (similarEvent.expectedVisitors && (!visitorsField.value || visitorsField.value === '2000')) {
                visitorsField.value = similarEvent.expectedVisitors;
            }
            
            // Count similar events for message
            const allSimilar = [...GLOBAL_STATE.historicalData, ...GLOBAL_STATE.plannedEvents].filter(event => 
                event.eventName && event.eventName.toLowerCase() === eventName.toLowerCase()
            );
            
            ui.showMessage(`Auto-vyplnění z ${allSimilar.length} podobných akcí`, 'info');
        }
    },

    // Setup global event listeners
    setupEventListeners() {
        // Click outside to hide autocomplete
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.form-group')) {
                document.querySelectorAll('.autocomplete-dropdown').forEach(dropdown => {
                    dropdown.remove();
                });
            }
        });

        // ESC key to hide autocomplete globally
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                document.querySelectorAll('.autocomplete-dropdown').forEach(dropdown => {
                    dropdown.remove();
                });
            }
        });
    },

    // Add common Czech cities to autocomplete
    addCommonCities() {
        const commonCities = [
            'Praha', 'Brno', 'Ostrava', 'Plzeň', 'Liberec', 'Olomouc', 
            'České Budějovice', 'Hradec Králové', 'Ústí nad Labem', 'Pardubice',
            'Zlín', 'Havířov', 'Kladno', 'Most', 'Opava', 'Frýdek-Místek',
            'Karviná', 'Jihlava', 'Teplice', 'Děčín', 'Karlovy Vary', 'Jablonec nad Nisou'
        ];

        commonCities.forEach(city => {
            if (!GLOBAL_STATE.autocompleteData.locations.includes(city)) {
                GLOBAL_STATE.autocompleteData.locations.push(city);
            }
        });

        GLOBAL_STATE.autocompleteData.locations.sort();
    },

    // Add common event types to suggestions
    addCommonEventTypes() {
        const commonEvents = [
            'Food Festival Praha', 'Burger Fest', 'Street Food Market',
            'Rodinný den', 'Dětský festival', 'Čokoládový festival',
            'Farmářské trhy', 'Vánoční trhy', 'Velikonoční trhy',
            'Festival chutí', 'Gastronomický festival', 'Pivní festival'
        ];

        commonEvents.forEach(event => {
            if (!GLOBAL_STATE.autocompleteData.eventNames.includes(event)) {
                GLOBAL_STATE.autocompleteData.eventNames.push(event);
            }
        });

        GLOBAL_STATE.autocompleteData.eventNames.sort();
    },

    // Get suggestion statistics
    getStats() {
        return {
            eventNames: GLOBAL_STATE.autocompleteData.eventNames.length,
            locations: GLOBAL_STATE.autocompleteData.locations.length,
            historicalEvents: GLOBAL_STATE.historicalData.length,
            plannedEvents: GLOBAL_STATE.plannedEvents.length,
            localEvents: GLOBAL_STATE.localSavedEvents.length
        };
    }
};
