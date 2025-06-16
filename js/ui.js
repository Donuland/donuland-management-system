// =============================================================================
// UI MANAGEMENT
// =============================================================================

const ui = {
    // Show/hide tabs
    showTab(tabName, event) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Remove active class from all nav tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab
        document.getElementById(tabName).classList.add('active');
        
        // Add active class to clicked nav tab
        if (event && event.target) {
            event.target.classList.add('active');
        }
        
        // Initialize tab-specific content
        switch(tabName) {
            case 'calendar':
                this.initializeCalendar();
                break;
            case 'analytics':
                this.loadAnalytics();
                break;
        }
    },

    // Show messages to user
    showMessage(text, type = 'info') {
        // Remove existing messages
        document.querySelectorAll('.message').forEach(msg => msg.remove());
        
        const message = document.createElement('div');
        message.className = `message ${type}`;
        message.textContent = text;
        message.style.cssText = `
            padding: 15px; 
            border-radius: 8px; 
            margin: 15px 0; 
            position: fixed; 
            top: 20px; 
            right: 20px; 
            z-index: 1001; 
            min-width: 300px; 
            box-shadow: 0 4px 12px rgba(0,0,0,0.15); 
            cursor: pointer; 
            transition: all 0.3s ease;
        `;
        
        // Apply type-specific styles
        switch(type) {
            case 'success':
                message.style.background = '#d4edda';
                message.style.color = '#155724';
                message.style.border = '1px solid #c3e6cb';
                break;
            case 'error':
                message.style.background = '#f8d7da';
                message.style.color = '#721c24';
                message.style.border = '1px solid #f5c6cb';
                break;
            case 'warning':
                message.style.background = '#fff3cd';
                message.style.color = '#856404';
                message.style.border = '1px solid #ffeaa7';
                break;
            default: // info
                message.style.background = '#d1ecf1';
                message.style.color = '#0c5460';
                message.style.border = '1px solid #bee5eb';
        }
        
        document.body.appendChild(message);
        
        // Auto-remove after 4 seconds
        setTimeout(() => {
            if (message.parentNode) {
                message.remove();
            }
        }, 4000);
        
        // Remove on click
        message.onclick = () => message.remove();
    },

    // Update sync status indicator
    updateSyncStatus(status, message) {
        const indicator = document.querySelector('.status-indicator');
        const text = document.getElementById('syncStatusText');
        
        if (!indicator || !text) return;
        
        switch(status) {
            case 'success':
                indicator.style.background = '#27ae60';
                indicator.style.animation = 'none';
                text.textContent = 'Připojeno';
                break;
            case 'error':
                indicator.style.background = '#e74c3c';
                indicator.style.animation = 'none';
                text.textContent = 'Chyba';
                break;
            case 'loading':
                indicator.style.background = '#f39c12';
                indicator.style.animation = 'pulse 2s infinite';
                text.textContent = 'Načítám...';
                break;
        }
        
        if (message) {
            indicator.title = message;
            text.title = message;
        }
    },

    // Initialize calendar (placeholder)
    initializeCalendar() {
        const calendarContent = document.getElementById('calendarContent');
        if (calendarContent) {
            calendarContent.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <h4>📅 Kalendář akcí</h4>
                    <p>Zobrazení uložených predikcí a historických akcí</p>
                    <div style="margin-top: 20px;">
                        ${GLOBAL_STATE.localSavedEvents.length} uložených predikcí<br>
                        ${GLOBAL_STATE.plannedEvents.length} plánovaných akcí<br>
                        ${GLOBAL_STATE.historicalData.length} historických akcí
                    </div>
                </div>
            `;
        }
    },

    // Load analytics (placeholder)
    loadAnalytics() {
        const analyticsContent = document.getElementById('analyticsContent');
        if (analyticsContent) {
            analyticsContent.innerHTML = `
                <div style="text-align: center; padding: 40px;">
                    <h4>📊 Analýza dat</h4>
                    <p>Trendy, statistiky a porovnání výkonnosti</p>
                    <div style="margin-top: 20px;">
                        Celkem historických akcí: ${GLOBAL_STATE.historicalData.length}<br>
                        Průměrná návštěvnost: ${this.calculateAverageAttendance()} osob<br>
                        Nejúspěšnější typ akce: ${this.getMostSuccessfulEventType()}
                    </div>
                </div>
            `;
        }
    },

    // Helper methods for analytics
    calculateAverageAttendance() {
        if (GLOBAL_STATE.historicalData.length === 0) return 0;
        const total = GLOBAL_STATE.historicalData.reduce((sum, event) => sum + (event.expectedVisitors || 0), 0);
        return Math.round(total / GLOBAL_STATE.historicalData.length);
    },

    getMostSuccessfulEventType() {
        if (GLOBAL_STATE.historicalData.length === 0) return 'N/A';
        
        const typeStats = {};
        GLOBAL_STATE.historicalData.forEach(event => {
            const type = event.eventType || 'ostatní';
            if (!typeStats[type]) {
                typeStats[type] = { count: 0, totalSales: 0 };
            }
            typeStats[type].count++;
            typeStats[type].totalSales += event.actualSales || 0;
        });

        let bestType = 'ostatní';
        let bestAverage = 0;
        
        Object.entries(typeStats).forEach(([type, stats]) => {
            const average = stats.totalSales / stats.count;
            if (average > bestAverage) {
                bestAverage = average;
                bestType = type;
            }
        });

        return bestType;
    },

    // Loading spinner
    showLoading(elementId, message = 'Načítám...') {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = `
                <div style="text-align: center; padding: 20px;">
                    <div class="loading-spinner" style="
                        display: inline-block;
                        width: 20px;
                        height: 20px;
                        border: 3px solid #f3f3f3;
                        border-top: 3px solid #3498db;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                    "></div>
                    <div style="margin-top: 10px;">${message}</div>
                </div>
            `;
        }
    },

    // Hide loading
    hideLoading(elementId) {
        const element = document.getElementById(elementId);
        if (element) {
            element.innerHTML = '';
        }
    }
};
