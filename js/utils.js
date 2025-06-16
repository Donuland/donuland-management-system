// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

const utils = {
    // Safe parsing functions
    parseIntSafe(value) {
        if (!value || value === '') return 0;
        const num = value.toString().replace(/[^\d-]/g, '');
        const parsed = parseInt(num);
        return isNaN(parsed) ? 0 : Math.max(0, parsed);
    },

    parseFloatSafe(value) {
        if (!value || value === '') return 0;
        const num = value.toString().replace(/[^\d.,-]/g, '').replace(',', '.');
        const parsed = parseFloat(num);
        return isNaN(parsed) ? 0 : Math.max(0, parsed);
    },

    // ID generation
    generateEventId(name, date, location) {
        const str = `${name}-${date}-${location}`.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/[^\w-]/g, '');
        return btoa(str).replace(/[^a-zA-Z0-9]/g, '').substring(0, 16);
    },

    // Get category icon
    getCategoryIcon(category) {
        return CONFIG.CATEGORY_ICONS[category] || '💰';
    },

    // Date parsing
    parseDate(dateStr) {
        if (!dateStr) return '';
        
        // Try different date formats
        const formats = [
            /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/, // DD.MM.YYYY
            /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/, // DD/MM/YYYY
            /^(\d{4})-(\d{1,2})-(\d{1,2})$/,   // YYYY-MM-DD
        ];
        
        for (const format of formats) {
            const match = dateStr.match(format);
            if (match) {
                let day, month, year;
                
                if (format === formats[2]) {
                    // YYYY-MM-DD format
                    [, year, month, day] = match;
                } else {
                    // DD.MM.YYYY or DD/MM/YYYY format
                    [, day, month, year] = match;
                }
                
                const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                return date.toISOString().split('T')[0];
            }
        }
        
        // Try to parse as is
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
        
        return '';
    },

    // Calculate duration between dates
    calculateDuration(startDate, endDate) {
        if (!startDate || !endDate) return 1;
        
        const start = new Date(this.parseDate(startDate));
        const end = new Date(this.parseDate(endDate));
        
        if (isNaN(start.getTime()) || isNaN(end.getTime())) return 1;
        
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        return Math.max(1, Math.min(14, diffDays));
    },

    // Transform event data from CSV to internal format
    transformEventData(rawEvent) {
        return {
            id: this.generateEventId(
                rawEvent['Název akce'] || rawEvent['Event Name'] || '',
                rawEvent['Datum od'] || rawEvent['Date From'] || '',
                rawEvent['Lokalita'] || rawEvent['Location'] || ''
            ),
            eventName: rawEvent['Název akce'] || rawEvent['Event Name'] || '',
            location: rawEvent['Lokalita'] || rawEvent['Location'] || '',
            category: rawEvent['Kategorie'] || rawEvent['Category'] || 'ostatní',
            eventType: rawEvent['Kategorie'] || rawEvent['Category'] || 'ostatní',
            date: this.parseDate(rawEvent['Datum od'] || rawEvent['Date From'] || ''),
            endDate: this.parseDate(rawEvent['Datum do'] || rawEvent['Date To'] || ''),
            duration: this.calculateDuration(
                rawEvent['Datum od'] || rawEvent['Date From'] || '',
                rawEvent['Datum do'] || rawEvent['Date To'] || ''
            ),
            attendance: this.parseIntSafe(rawEvent['Návštěvnost'] || rawEvent['Attendance'] || 0),
            expectedVisitors: this.parseIntSafe(rawEvent['Návštěvnost'] || rawEvent['Attendance'] || 0),
            estimatedSales: this.parseIntSafe(rawEvent['Odhad prodeje'] || rawEvent['Estimated Sales'] || 0),
            actualSales: this.parseIntSafe(rawEvent['Skutečný prodej'] || rawEvent['Actual Sales'] || 0),
            rentalCost: this.parseFloatSafe(rawEvent['Cena nájmu'] || rawEvent['Rental Cost'] || 0),
            transportCost: this.parseFloatSafe(rawEvent['Náklady na cestu'] || rawEvent['Transport Cost'] || 0),
            otherCosts: this.parseFloatSafe(rawEvent['Ostatní náklady'] || rawEvent['Other Costs'] || 0),
            weather: rawEvent['Počasí'] || rawEvent['Weather'] || '',
            rating: this.parseIntSafe(rawEvent['Hodnocení'] || rawEvent['Rating'] || 0),
            competition: this.parseIntSafe(rawEvent['Konkurence'] || rawEvent['Competition'] || 1),
            notes: rawEvent['Poznámka'] || rawEvent['Notes'] || '',
            responsiblePerson: rawEvent['Odpovědná osoba'] || rawEvent['Responsible Person'] || '',
            confirmed: rawEvent['Potvrzeno'] || rawEvent['Confirmed'] || 'ANO',
            source: 'sheet',
            color: CONFIG.EVENT_COLORS[Math.floor(Math.random() * CONFIG.EVENT_COLORS.length)]
        };
    },

    // CSV parsing
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
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
    },

    // Format currency
    formatCurrency(amount) {
        return Math.round(amount).toLocaleString('cs-CZ') + ' Kč';
    },

    // Debounce function
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
};
