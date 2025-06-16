// =============================================================================
// DATA MANAGER - Google Sheets Integration
// =============================================================================

const dataManager = {
    async loadData() {
        try {
            ui.updateSyncStatus('loading', 'Načítám data ze Sheetu...');
            
            const response = await fetch(CONFIG.SHEET_CSV_URL);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const csvText = await response.text();
            
            if (!csvText || csvText.trim().length < 10) {
                throw new Error('Prázdná nebo neplatná CSV data');
            }
            
            // Parse CSV data
            const parsedData = this.parseCSVData(csvText);
            GLOBAL_STATE.allSheetData = parsedData;
            
            // Separate historical and planned events
            this.separateEventsByDate(parsedData);
            
            // Load local saved events
            this.loadLocalSavedEvents();
            
            // Update autocomplete data
            if (typeof autocomplete !== 'undefined') {
                autocomplete.updateData();
            }
            
            ui.updateSyncStatus('success', `Načteno: ${GLOBAL_STATE.historicalData.length} historických, ${GLOBAL_STATE.plannedEvents.length} plánovaných akcí`);
            ui.showMessage('Data byla úspěšně načtena', 'success');
            
            console.log('✅ Data loaded:', {
                total: GLOBAL_STATE.allSheetData.length,
                historical: GLOBAL_STATE.historicalData.length,
                planned: GLOBAL_STATE.plannedEvents.length
            });
            
        } catch (error) {
            console.error('Error loading data:', error);
            ui.updateSyncStatus('error', 'Chyba při načítání dat');
            ui.showMessage('Chyba při načítání dat: ' + error.message, 'error');
            
            // Load demo data as fallback
            this.loadDemoData();
        }
    },

    parseCSVData(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim() !== '');
        if (lines.length < 2) return [];
        
        // Parse headers
        const headers = utils.parseCSVLine(lines[0]);
        const data = [];
        
        // Parse data rows
        for (let i = 1; i < lines.length; i++) {
            const values = utils.parseCSVLine(lines[i]);
            if (values.length < headers.length) continue;
            
            const event = {};
            headers.forEach((header, index) => {
                event[header.trim()] = values[index] ? values[index].trim() : '';
            });
            
            // Transform to our format
            const transformedEvent = utils.transformEventData(event);
            if (transformedEvent.eventName) {
                data.push(transformedEvent);
            }
        }
        
        return data;
    },

    separateEventsByDate(parsedData) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        GLOBAL_STATE.historicalData = [];
        GLOBAL_STATE.plannedEvents = [];
        
        parsedData.forEach(event => {
            const eventDate = new Date(event.date);
            if (eventDate < today) {
                GLOBAL_STATE.historicalData.push(event);
            } else {
                GLOBAL_STATE.plannedEvents.push(event);
            }
        });
    },

    loadLocalSavedEvents() {
        const saved = localStorage.getItem('donulandEvents');
        if (saved) {
            try {
                GLOBAL_STATE.localSavedEvents = JSON.parse(saved);
                console.log(`📱 Loaded ${GLOBAL_STATE.localSavedEvents.length} local events`);
            } catch (e) {
                console.error('Error loading local events:', e);
                GLOBAL_STATE.localSavedEvents = [];
            }
        }
    },

    saveLocalEvent(eventData) {
        const eventToSave = {
            ...eventData,
            id: utils.generateEventId(eventData.eventName, eventData.date, eventData.location),
            savedAt: new Date().toISOString(),
            source: 'local'
        };
        
        // Check if event already exists
        const existingIndex = GLOBAL_STATE.localSavedEvents.findIndex(e => e.id === eventToSave.id);
        
        if (existingIndex >= 0) {
            GLOBAL_STATE.localSavedEvents[existingIndex] = eventToSave;
            ui.showMessage('Predikce byla aktualizována', 'success');
        } else {
            GLOBAL_STATE.localSavedEvents.push(eventToSave);
            ui.showMessage('Predikce byla uložena do kalendáře', 'success');
        }
        
        // Save to localStorage
        localStorage.setItem('donulandEvents', JSON.stringify(GLOBAL_STATE.localSavedEvents));
        
        // Update autocomplete data
        if (typeof autocomplete !== 'undefined') {
            autocomplete.updateData();
        }
        
        return eventToSave;
    },

    loadDemoData() {
        console.log('📄 Loading demo data...');
        
        GLOBAL_STATE.historicalData = [
            {
                id: 'demo1',
                eventName: 'Demo Food Festival Praha',
                location: 'Praha',
                category: 'food festival',
                eventType: 'food festival',
                date: '2024-05-15',
                endDate: '2024-05-16',
                duration: 2,
                actualSales: 850,
                estimatedSales: 800,
                attendance: 4500,
                expectedVisitors: 4500,
                rating: 4,
                weather: 'slunečno',
                source: 'demo',
                color: '#3498db'
            },
            {
                id: 'demo2',
                eventName: 'Demo Rodinný festival Brno',
                location: 'Brno',
                category: 'rodinny festival',
                eventType: 'rodinny festival',
                date: '2024-04-20',
                endDate: '2024-04-21',
                duration: 2,
                actualSales: 650,
                estimatedSales: 700,
                attendance: 3200,
                expectedVisitors: 3200,
                rating: 5,
                weather: 'polojasno',
                source: 'demo',
                color: '#27ae60'
            }
        ];
        
        GLOBAL_STATE.plannedEvents = [];
        ui.showMessage('Načtena demo data pro testování', 'info');
        ui.updateSyncStatus('success', 'Demo data načtena');
    },

    // Get historical adjustment factor for predictions
    getHistoricalAdjustment(eventType, visitors, location) {
        if (GLOBAL_STATE.historicalData.length === 0) return 1.0;
        
        const similarEvents = GLOBAL_STATE.historicalData.filter(event => {
            const typeMatch = event.eventType === eventType;
            const sizeMatch = Math.abs(event.expectedVisitors - visitors) / visitors < 0.5;
            return typeMatch || sizeMatch;
        });
        
        if (similarEvents.length === 0) return 1.0;
        
        // Calculate average performance ratio
        let totalRatio = 0;
        let count = 0;
        
        similarEvents.forEach(event => {
            if (event.estimatedSales > 0 && event.actualSales > 0) {
                totalRatio += event.actualSales / event.estimatedSales;
                count++;
            }
        });
        
        if (count === 0) return 1.0;
        
        const avgRatio = totalRatio / count;
        return Math.max(0.7, Math.min(1.3, avgRatio));
    },

    // Find similar events for auto-fill
    findSimilarEvents(eventName) {
        const similarEvents = [...GLOBAL_STATE.historicalData, ...GLOBAL_STATE.plannedEvents].filter(event => 
            event.eventName && event.eventName.toLowerCase() === eventName.toLowerCase()
        );
        
        if (similarEvents.length > 0) {
            return similarEvents.sort((a, b) => 
                new Date(b.date) - new Date(a.date)
            )[0];
        }
        
        return null;
    }
};
