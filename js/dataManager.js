// dataManager.js - Správa dat a Google Sheets připojení
class DataManager {
    constructor() {
        this.googleSheetsData = [];
        this.localEvents = [];
        this.config = {
            googleSheetUrl: '',
            sheetId: '',
            lastSync: null,
            cacheTimeout: 5 * 60 * 1000 // 5 minut cache
        };
        
        this.isLoading = false;
        this.loadConfiguration();
        
        console.log('📊 DataManager inicializován');
    }

    // Načtení konfigurace z localStorage
    loadConfiguration() {
        try {
            const saved = localStorage.getItem('donulandDataConfig');
            if (saved) {
                this.config = { ...this.config, ...JSON.parse(saved) };
                console.log('📋 Data konfigurace načtena');
            }
            
            // Načtení událostí z localStorage
            const savedEvents = localStorage.getItem('donulandEvents');
            if (savedEvents) {
                this.localEvents = JSON.parse(savedEvents);
                console.log(`📅 Načteno ${this.localEvents.length} lokálních událostí`);
            }
        } catch (error) {
            console.warn('⚠️ Chyba při načítání konfigurace:', error);
        }
    }

    // Uložení konfigurace
    saveConfiguration() {
        try {
            localStorage.setItem('donulandDataConfig', JSON.stringify(this.config));
            localStorage.setItem('donulandEvents', JSON.stringify(this.localEvents));
            console.log('💾 Data konfigurace uložena');
        } catch (error) {
            console.error('❌ Chyba při ukládání konfigurace:', error);
        }
    }

    // Nastavení URL Google Sheets
    setGoogleSheetUrl(url) {
        if (!url) {
            console.warn('⚠️ Prázdné URL Google Sheets');
            return false;
        }

        const sheetId = this.extractSheetId(url);
        if (!sheetId) {
            console.error('❌ Neplatné URL Google Sheets');
            return false;
        }

        this.config.googleSheetUrl = url;
        this.config.sheetId = sheetId;
        this.saveConfiguration();
        
        console.log('🔗 Google Sheets URL nastaveno:', sheetId);
        return true;
    }

    // Extrakce Sheet ID z URL
    extractSheetId(url) {
        if (!url) return null;
        
        // Různé formáty Google Sheets URL
        const patterns = [
            /\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
            /spreadsheets\/d\/([a-zA-Z0-9-_]+)/,
            /docs\.google\.com.*[\/=]([a-zA-Z0-9-_]{44})/
        ];
        
        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) return match[1];
        }
        
        return null;
    }

    // Hlavní funkce pro načtení dat z Google Sheets
    async loadGoogleSheetsData(forceRefresh = false) {
        if (this.isLoading) {
            console.log('⏳ Načítání již probíhá...');
            return this.googleSheetsData;
        }

        // Kontrola cache
        if (!forceRefresh && this.isCacheValid()) {
            console.log('📋 Používám cached data');
            return this.googleSheetsData;
        }

        if (!this.config.sheetId) {
            throw new Error('Google Sheets URL není nastaveno');
        }

        this.isLoading = true;
        console.log('📥 Načítám data z Google Sheets...');

        try {
            // Vytvoření CSV export URL
            const csvUrl = `https://docs.google.com/spreadsheets/d/${this.config.sheetId}/export?format=csv&gid=0`;
            
            console.log('🌐 Načítám z URL:', csvUrl);

            // Fetch s timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

            const response = await fetch(csvUrl, {
                signal: controller.signal,
                headers: {
                    'Accept': 'text/csv',
                }
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const csvData = await response.text();
            
            if (!csvData || csvData.trim().length === 0) {
                throw new Error('Prázdný response z Google Sheets');
            }

            // Parsování CSV dat
            this.googleSheetsData = this.parseCSV(csvData);
            this.config.lastSync = Date.now();
            this.saveConfiguration();

            console.log(`✅ Úspěšně načteno ${this.googleSheetsData.length} záznamů z Google Sheets`);

            // Trigger events pro ostatní komponenty
            this.triggerDataUpdateEvent();

            return this.googleSheetsData;

        } catch (error) {
            console.error('❌ Chyba při načítání Google Sheets:', error);
            
            // Rozšířené error handling
            if (error.name === 'AbortError') {
                throw new Error('Timeout při načítání dat (více než 10s)');
            } else if (error.message.includes('403')) {
                throw new Error('Přístup odepřen - zkontrolujte oprávnění Google Sheets');
            } else if (error.message.includes('404')) {
                throw new Error('Google Sheets nenalezen - zkontrolujte URL');
            } else if (error.message.includes('CORS')) {
                throw new Error('CORS chyba - zajistěte veřejný přístup k Google Sheets');
            } else {
                throw new Error(`Chyba načítání: ${error.message}`);
            }
        } finally {
            this.isLoading = false;
        }
    }

    // Kontrola platnosti cache
    isCacheValid() {
        if (!this.config.lastSync || this.googleSheetsData.length === 0) {
            return false;
        }
        
        const now = Date.now();
        const timeDiff = now - this.config.lastSync;
        return timeDiff < this.cacheTimeout;
    }

    // Pokročilé parsování CSV
    parseCSV(csvText) {
        if (!csvText || csvText.trim().length === 0) {
            throw new Error('Prázdný CSV soubor');
        }

        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            throw new Error('CSV musí obsahovat alespoň hlavičku a jeden řádek dat');
        }

        // Parsování hlavičky
        const headers = this.parseCSVLine(lines[0]);
        console.log('📋 CSV hlavičky:', headers);

        const data = [];
        
        // Parsování dat
        for (let i = 1; i < lines.length; i++) {
            try {
                const values = this.parseCSVLine(lines[i]);
                
                // Vytvoření objektu
                const row = {};
                headers.forEach((header, index) => {
                    const value = values[index] || '';
                    row[header.trim()] = value.trim();
                });
                
                // Kontrola, že řádek obsahuje data
                if (Object.values(row).some(value => value && value.length > 0)) {
                    // Normalizace číselných hodnot
                    this.normalizeRowData(row);
                    data.push(row);
                }
                
            } catch (error) {
                console.warn(`⚠️ Chyba při parsování řádku ${i + 1}:`, error);
            }
        }

        if (data.length === 0) {
            throw new Error('Žádná validní data nenalezena v CSV');
        }

        console.log(`📊 Zparsováno ${data.length} řádků dat`);
        return data;
    }

    // Parsování jednoho řádku CSV (podporuje uvozovky a escapy)
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        let i = 0;

        while (i < line.length) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    // Escaped quote
                    current += '"';
                    i += 2;
                } else {
                    // Toggle quote state
                    inQuotes = !inQuotes;
                    i++;
                }
            } else if (char === ',' && !inQuotes) {
                // End of field
                result.push(current);
                current = '';
                i++;
            } else {
                current += char;
                i++;
            }
        }

        // Add last field
        result.push(current);
        
        return result;
    }

    // Normalizace dat v řádku
    normalizeRowData(row) {
        // Standardní názvy sloupců
        const columnMappings = {
            // Čeština -> Angličtina
            'Název akce': 'eventName',
            'Kategorie': 'category', 
            'Datum': 'date',
            'Lokace': 'location',
            'Počet účastníků': 'attendees',
            'Skutečný prodej': 'actualSales',
            'Tržby': 'revenue',
            'Náklady': 'costs',
            'Počasí': 'weather',
            'Business model': 'businessModel',
            
            // Angličtina -> normalizovaná forma
            'Event Name': 'eventName',
            'Category': 'category',
            'Date': 'date',
            'Location': 'location',
            'Attendees': 'attendees',
            'Actual Sales': 'actualSales',
            'Revenue': 'revenue',
            'Costs': 'costs',
            'Weather': 'weather',
            'Business Model': 'businessModel'
        };

        // Aplikace mapování
        for (const [oldKey, newKey] of Object.entries(columnMappings)) {
            if (row[oldKey] !== undefined) {
                row[newKey] = row[oldKey];
            }
        }

        // Konverze číselných hodnot
        const numericFields = ['attendees', 'actualSales', 'revenue', 'costs'];
        numericFields.forEach(field => {
            if (row[field]) {
                const numValue = this.parseNumber(row[field]);
                if (!isNaN(numValue)) {
                    row[field] = numValue;
                }
            }
        });

        // Normalizace data
        if (row.date) {
            row.date = this.normalizeDate(row.date);
        }

        // Normalizace kategorie
        if (row.category) {
            row.category = row.category.toLowerCase().trim();
        }
    }

    // Parsování čísel s českým formátováním
    parseNumber(value) {
        if (typeof value === 'number') return value;
        if (!value) return 0;
        
        // Odstranění mezer a nahrazení čárky tečkou
        const cleaned = value.toString()
            .replace(/\s/g, '')
            .replace(',', '.')
            .replace(/[^\d.-]/g, '');
            
        return parseFloat(cleaned);
    }

    // Normalizace data do formátu YYYY-MM-DD
    normalizeDate(dateStr) {
        if (!dateStr) return '';
        
        try {
            // Různé formáty data
            const formats = [
                /^(\d{4})-(\d{1,2})-(\d{1,2})$/, // YYYY-MM-DD
                /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // DD.MM.YYYY
                /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
                /^(\d{1,2})-(\d{1,2})-(\d{4})$/, // DD-MM-YYYY
            ];

            for (let i = 0; i < formats.length; i++) {
                const match = dateStr.match(formats[i]);
                if (match) {
                    if (i === 0) {
                        // Already in correct format
                        return dateStr;
                    } else {
                        // Convert to YYYY-MM-DD
                        const day = match[1].padStart(2, '0');
                        const month = match[2].padStart(2, '0');
                        const year = match[3];
                        return `${year}-${month}-${day}`;
                    }
                }
            }
            
            // Pokus o parsování pomocí Date objektu
            const date = new Date(dateStr);
            if (!isNaN(date.getTime())) {
                return date.toISOString().split('T')[0];
            }
            
        } catch (error) {
            console.warn('⚠️ Nelze parsovat datum:', dateStr);
        }
        
        return dateStr; // Vrátíme původní hodnotu
    }

    // Trigger události pro ostatní komponenty
    triggerDataUpdateEvent() {
        const event = new CustomEvent('donulandDataUpdate', {
            detail: {
                data: this.googleSheetsData,
                timestamp: Date.now(),
                source: 'googleSheets'
            }
        });
        
        document.dispatchEvent(event);
        console.log('📡 Triggered data update event');
    }

    // Test připojení k Google Sheets
    async testConnection() {
        if (!this.config.sheetId) {
            return {
                success: false,
                message: 'Google Sheets URL není nastaveno'
            };
        }

        try {
            const testUrl = `https://docs.google.com/spreadsheets/d/${this.config.sheetId}/export?format=csv&gid=0`;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);

            const response = await fetch(testUrl, {
                signal: controller.signal,
                method: 'HEAD' // Jen test dostupnosti
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                return {
                    success: true,
                    message: 'Připojení k Google Sheets úspěšné'
                };
            } else {
                return {
                    success: false,
                    message: `HTTP ${response.status}: ${response.statusText}`
                };
            }

        } catch (error) {
            if (error.name === 'AbortError') {
                return {
                    success: false,
                    message: 'Timeout (více než 5s)'
                };
            }
            
            return {
                success: false,
                message: error.message
            };
        }
    }

    // Získání filtrovaných dat
    getFilteredData(filters = {}) {
        let data = [...this.googleSheetsData];

        // Filtr podle kategorie
        if (filters.category) {
            data = data.filter(row => 
                (row.category || '').toLowerCase().includes(filters.category.toLowerCase())
            );
        }

        // Filtr podle lokace
        if (filters.location) {
            data = data.filter(row => 
                (row.location || '').toLowerCase().includes(filters.location.toLowerCase())
            );
        }

        // Filtr podle data
        if (filters.dateFrom) {
            data = data.filter(row => 
                row.date && row.date >= filters.dateFrom
            );
        }

        if (filters.dateTo) {
            data = data.filter(row => 
                row.date && row.date <= filters.dateTo
            );
        }

        // Filtr pouze kompletní záznamy
        if (filters.completeOnly) {
            data = data.filter(row => 
                row.actualSales && row.attendees && 
                !isNaN(row.actualSales) && !isNaN(row.attendees) &&
                row.actualSales > 0 && row.attendees > 0
            );
        }

        return data;
    }

    // Získání unikátních hodnot pro autocomplete
    getUniqueValues(field) {
        const values = this.googleSheetsData
            .map(row => row[field])
            .filter(value => value && value.trim && value.trim().length > 0)
            .map(value => value.trim());
            
        return [...new Set(values)].sort();
    }

    // Získání statistik dat
    getDataStats() {
        const total = this.googleSheetsData.length;
        const complete = this.getFilteredData({ completeOnly: true }).length;
        const categories = this.getUniqueValues('category');
        const locations = this.getUniqueValues('location');

        return {
            totalRecords: total,
            completeRecords: complete,
            completionRate: total > 0 ? ((complete / total) * 100).toFixed(1) : 0,
            uniqueCategories: categories.length,
            uniqueLocations: locations.length,
            categories: categories,
            locations: locations,
            lastSync: this.config.lastSync,
            cacheValid: this.isCacheValid()
        };
    }

    // Přidání/úprava lokální události
    addLocalEvent(event) {
        const eventWithId = {
            ...event,
            id: event.id || Date.now(),
            source: 'local',
            created: new Date().toISOString()
        };

        const existingIndex = this.localEvents.findIndex(e => e.id === eventWithId.id);
        
        if (existingIndex >= 0) {
            this.localEvents[existingIndex] = eventWithId;
        } else {
            this.localEvents.push(eventWithId);
        }

        this.saveConfiguration();
        console.log('📝 Lokální událost uložena:', eventWithId.id);
        
        return eventWithId;
    }

    // Odstranění lokální události
    removeLocalEvent(eventId) {
        const initialLength = this.localEvents.length;
        this.localEvents = this.localEvents.filter(event => event.id !== eventId);
        
        if (this.localEvents.length < initialLength) {
            this.saveConfiguration();
            console.log('🗑️ Lokální událost odstraněna:', eventId);
            return true;
        }
        
        return false;
    }

    // Získání všech událostí (Google Sheets + lokální)
    getAllEvents() {
        const googleEvents = this.googleSheetsData.map(row => ({
            ...row,
            source: 'googleSheets',
            id: `gs_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }));

        return [...googleEvents, ...this.localEvents].sort((a, b) => {
            const dateA = new Date(a.date || '1970-01-01');
            const dateB = new Date(b.date || '1970-01-01');
            return dateB - dateA; // Nejnovější první
        });
    }

    // Vyčištění cache
    clearCache() {
        this.googleSheetsData = [];
        this.config.lastSync = null;
        this.saveConfiguration();
        console.log('🗑️ Cache vyčištěna');
    }

    // Export dat
    exportData(format = 'json') {
        const exportData = {
            googleSheetsData: this.googleSheetsData,
            localEvents: this.localEvents,
            config: { ...this.config, sheetId: '***' }, // Bez citlivých dat
            stats: this.getDataStats(),
            exportDate: new Date().toISOString()
        };

        if (format === 'csv') {
            return this.convertToCSV(this.getAllEvents());
        }

        return JSON.stringify(exportData, null, 2);
    }

    convertToCSV(data) {
        if (data.length === 0) return '';

        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => {
                    const value = row[header] || '';
                    return typeof value === 'string' && value.includes(',') 
                        ? `"${value}"` 
                        : value;
                }).join(',')
            )
        ].join('\n');

        return csvContent;
    }
}

// Globální instance
window.dataManager = new DataManager();

// Export pro testování
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataManager;
}

console.log('📊 DataManager načten a připraven k použití');
