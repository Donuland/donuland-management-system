// autocomplete.js - Inteligentní autocomplete systém
class AutocompleteManager {
    constructor() {
        this.eventNames = [];
        this.locations = [];
        this.czechCities = [
            'Praha', 'Brno', 'Ostrava', 'Plzeň', 'Liberec', 'Olomouc', 'Budějovice', 
            'Hradec Králové', 'Ústí nad Labem', 'Pardubice', 'Zlín', 'Havířov', 
            'Kladno', 'Most', 'Karviná', 'Opava', 'Frýdek-Místek', 'Děčín', 
            'Teplice', 'Chomutov', 'Jihlava', 'Mladá Boleslav', 'Prostějov', 
            'Přerov', 'Jablonec nad Nisou', 'Třebíč', 'Karlovy Vary', 'Česká Lípa', 
            'Třinec', 'Tábor', 'Kolín', 'Příbram', 'Cheb', 'Trutnov', 'Třeboň',
            'Ústí nad Orlicí', 'Vsetín', 'Valašské Meziříčí', 'Uherské Hradiště'
        ];
        this.initialized = false;
    }

    // Inicializace autocomplete po načtení dat
    async initialize(googleSheetsData = []) {
        console.log('🔄 Inicializuji autocomplete systém...');
        
        try {
            // Načtení dat z Google Sheets
            if (googleSheetsData && googleSheetsData.length > 0) {
                this.loadFromGoogleSheets(googleSheetsData);
            } else {
                this.loadDefaultData();
            }
            
            // Nastavení autocomplete pro všechna pole
            this.setupEventNameAutocomplete();
            this.setupLocationAutocomplete();
            
            this.initialized = true;
            console.log('✅ Autocomplete systém inicializován', {
                eventNames: this.eventNames.length,
                locations: this.locations.length
            });
            
        } catch (error) {
            console.error('❌ Chyba při inicializaci autocomplete:', error);
            this.loadDefaultData();
        }
    }

    // Načtení dat z Google Sheets
    loadFromGoogleSheets(data) {
        // Extrakce názvů akcí
        const eventNamesFromSheets = data
            .map(row => row['Název akce'] || row['Event Name'] || '')
            .filter(name => name && name.trim())
            .map(name => name.trim());
        
        // Extrakce lokací
        const locationsFromSheets = data
            .map(row => row['Lokace'] || row['Location'] || '')
            .filter(loc => loc && loc.trim())
            .map(loc => loc.trim());
        
        // Kombinace s výchozími daty
        this.eventNames = [...new Set([
            ...eventNamesFromSheets,
            'Letní festival', 'Farmářské trhy', 'Food festival', 
            'Sportovní den', 'Městské slavnosti', 'Vánoční trhy',
            'Čokoládový festival', 'Street food festival', 'Rodinný festival'
        ])].sort();
        
        this.locations = [...new Set([
            ...this.czechCities,
            ...locationsFromSheets
        ])].sort();
        
        console.log('📊 Data načtena z Google Sheets:', {
            fromSheets: { events: eventNamesFromSheets.length, locations: locationsFromSheets.length },
            total: { events: this.eventNames.length, locations: this.locations.length }
        });
    }

    // Výchozí data pokud nejsou dostupná Sheets data
    loadDefaultData() {
        this.eventNames = [
            'Letní festival', 'Farmářské trhy', 'Food festival', 
            'Sportovní den', 'Městské slavnosti', 'Vánoční trhy',
            'Čokoládový festival', 'Street food festival', 'Rodinný festival',
            'Hudební festival', 'Pivní festival', 'Gastro festival'
        ].sort();
        
        this.locations = [...this.czechCities].sort();
        
        console.log('📝 Načtena výchozí autocomplete data');
    }

    // Nastavení autocomplete pro názvy akcí
    setupEventNameAutocomplete() {
        const eventNameInput = document.getElementById('eventName') || document.getElementById('newEventName');
        if (!eventNameInput) return;

        // Vytvoření datalist pokud neexistuje
        let datalist = document.getElementById('eventNameSuggestions');
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'eventNameSuggestions';
            eventNameInput.parentNode.appendChild(datalist);
            eventNameInput.setAttribute('list', 'eventNameSuggestions');
        }

        // Naplnění suggestions
        datalist.innerHTML = this.eventNames
            .map(name => `<option value="${name}">`)
            .join('');

        // Inteligentní filtrování při psaní
        eventNameInput.addEventListener('input', (e) => {
            this.handleSmartFiltering(e.target, this.eventNames, 'eventNameSuggestions');
        });

        console.log('✅ Event name autocomplete nastaven');
    }

    // Nastavení autocomplete pro lokace
    setupLocationAutocomplete() {
        const locationInput = document.getElementById('location') || document.getElementById('newEventLocation');
        if (!locationInput) return;

        // Vytvoření datalist pokud neexistuje
        let datalist = document.getElementById('locationSuggestions');
        if (!datalist) {
            datalist = document.createElement('datalist');
            datalist.id = 'locationSuggestions';
            locationInput.parentNode.appendChild(datalist);
            locationInput.setAttribute('list', 'locationSuggestions');
        }

        // Naplnění suggestions
        datalist.innerHTML = this.locations
            .map(location => `<option value="${location}">`)
            .join('');

        // Inteligentní filtrování při psaní
        locationInput.addEventListener('input', (e) => {
            this.handleSmartFiltering(e.target, this.locations, 'locationSuggestions');
        });

        console.log('✅ Location autocomplete nastaven');
    }

    // Inteligentní filtrování suggestions
    handleSmartFiltering(input, dataArray, datalistId) {
        const value = input.value.toLowerCase();
        if (value.length < 2) return; // Začni filtrovat až od 2 znaků

        const filtered = dataArray.filter(item => 
            item.toLowerCase().includes(value) ||
            this.removeAccents(item.toLowerCase()).includes(this.removeAccents(value))
        ).slice(0, 10); // Maximálně 10 suggestions

        const datalist = document.getElementById(datalistId);
        if (datalist) {
            datalist.innerHTML = filtered
                .map(item => `<option value="${item}">`)
                .join('');
        }
    }

    // Odebrání diakritiky pro lepší vyhledávání
    removeAccents(str) {
        return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    }

    // Přidání nové položky do autocomplete
    addEventName(name) {
        if (name && !this.eventNames.includes(name)) {
            this.eventNames.push(name);
            this.eventNames.sort();
            this.setupEventNameAutocomplete();
        }
    }

    addLocation(location) {
        if (location && !this.locations.includes(location)) {
            this.locations.push(location);
            this.locations.sort();
            this.setupLocationAutocomplete();
        }
    }

    // Aktualizace dat z nového Google Sheets loadu
    updateFromGoogleSheets(newData) {
        if (newData && newData.length > 0) {
            this.loadFromGoogleSheets(newData);
            this.setupEventNameAutocomplete();
            this.setupLocationAutocomplete();
            console.log('🔄 Autocomplete data aktualizována z Google Sheets');
        }
    }

    // Získání všech dostupných názvů akcí
    getEventNames() {
        return [...this.eventNames];
    }

    // Získání všech dostupných lokací
    getLocations() {
        return [...this.locations];
    }

    // Kontrola zda je systém inicializován
    isInitialized() {
        return this.initialized;
    }
}

// Export pro použití v jiných souborech
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutocompleteManager;
}

// Globální instance pro přímé použití
window.autocompleteManager = new AutocompleteManager();
