// activator.js - Aktivační skript pro propojení UI s novými funkcemi
(function() {
    'use strict';
    
    console.log('🚀 Donuland Activator v1.0 se spouští...');
    
    // Čekání na načtení DOM a všech skriptů
    function waitForDependencies() {
        return new Promise((resolve) => {
            const checkDependencies = () => {
                if (document.readyState === 'complete' && window.dataManager) {
                    resolve();
                } else {
                    setTimeout(checkDependencies, 100);
                }
            };
            checkDependencies();
        });
    }
    
    // Hlavní inicializace
    async function initialize() {
        await waitForDependencies();
        console.log('✅ Závislosti načteny, aktivuji funkce...');
        
        // 1. Aktivace tlačítka "Načíst data"
        activateLoadDataButton();
        
        // 2. Přidání notifikačního systému
        addNotificationSystem();
        
        // 3. Aktivace základních funkcí
        activateBasicFunctions();
        
        // 4. Nastavení demo URL (pokud není nastaveno)
        setupDemoConfiguration();
        
        // 5. Auto-načtení dat při startu
        setTimeout(() => {
            autoLoadDataOnStart();
        }, 1000);
        
        console.log('🎉 Donuland Activator dokončen!');
    }
    
    // 1. AKTIVACE TLAČÍTKA "NAČÍST DATA"
    function activateLoadDataButton() {
        console.log('🔄 Aktivuji tlačítko "Načíst data"...');
        
        // Najdeme tlačítko podle textu
        const buttons = document.querySelectorAll('button, a, span');
        let loadButton = null;
        
        for (const button of buttons) {
            if (button.textContent.includes('Načíst data')) {
                loadButton = button;
                break;
            }
        }
        
        if (!loadButton) {
            console.warn('⚠️ Tlačítko "Načíst data" nenalezeno');
            return;
        }
        
        // Odebereme staré event listenery
        const newButton = loadButton.cloneNode(true);
        loadButton.parentNode.replaceChild(newButton, loadButton);
        
        // Upravíme vzhled tlačítka
        newButton.style.cssText = `
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
            transition: all 0.3s ease;
            font-size: 14px;
        `;
        
        // Přidáme hover efekt
        newButton.addEventListener('mouseenter', () => {
            newButton.style.transform = 'translateY(-2px)';
            newButton.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
        });
        
        newButton.addEventListener('mouseleave', () => {
            newButton.style.transform = 'translateY(0)';
            newButton.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
        });
        
        // Přidáme funkční event listener
        newButton.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            await handleLoadDataClick(newButton);
        });
        
        console.log('✅ Tlačítko "Načíst data" aktivováno');
        
        // Přidáme status indikátor
        addDataStatusIndicator();
    }
    
    async function handleLoadDataClick(button) {
        console.log('📥 Spouštím načítání dat...');
        
        // Loading state
        const originalText = button.textContent;
        button.textContent = '🔄 Načítám...';
        button.disabled = true;
        
        updateDataStatus('loading');
        showNotification('🔄 Načítám data z Google Sheets...', 'info');
        
        try {
            // Pokusíme se načíst data
            const data = await window.dataManager.loadGoogleSheetsData(true); // force refresh
            
            console.log(`✅ Načteno ${data.length} záznamů`);
            
            // Úspěch
            showNotification(`✅ Úspěšně načteno ${data.length} záznamů z Google Sheets!`, 'success');
            updateDataStatus('success', data.length);
            
            // Aktualizace UI komponent
            updateUIComponents(data);
            
        } catch (error) {
            console.error('❌ Chyba při načítání:', error);
            showNotification(`❌ Chyba: ${error.message}`, 'error');
            updateDataStatus('error');
            
            // Pokud není nastaveno URL, nabídneme demo
            if (error.message.includes('není nastaveno')) {
                setTimeout(() => {
                    if (confirm('Chcete použít demo Google Sheets pro testování?')) {
                        setupDemoSheets();
                    }
                }, 1000);
            }
        } finally {
            // Restore button
            button.textContent = originalText;
            button.disabled = false;
        }
    }
    
    // 2. NOTIFIKAČNÍ SYSTÉM
    function addNotificationSystem() {
        // Kontrola, jestli už neexistuje
        if (document.getElementById('notifications-container')) {
            return;
        }
        
        const container = document.createElement('div');
        container.id = 'notifications-container';
        container.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            max-width: 400px;
            pointer-events: none;
        `;
        document.body.appendChild(container);
        
        // CSS animace
        const style = document.createElement('style');
        style.textContent = `
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOutRight {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
            .notification {
                pointer-events: auto;
                animation: slideInRight 0.3s ease-out;
            }
            .notification.removing {
                animation: slideOutRight 0.3s ease-in;
            }
        `;
        document.head.appendChild(style);
        
        console.log('📢 Notifikační systém aktivován');
    }
    
    window.showNotification = function(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notifications-container');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.style.cssText = `
            background: ${getNotificationColor(type)};
            color: white;
            padding: 15px 20px;
            margin-bottom: 10px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
        `;
        
        notification.innerHTML = `
            <span style="font-size: 1.2em;">${getNotificationIcon(type)}</span>
            <span style="flex: 1;">${message}</span>
            <span style="opacity: 0.7;">✕</span>
        `;
        
        notification.addEventListener('click', () => removeNotification(notification));
        container.appendChild(notification);
        
        // Auto remove
        setTimeout(() => {
            if (notification.parentNode) {
                removeNotification(notification);
            }
        }, duration);
    };
    
    function removeNotification(notification) {
        notification.classList.add('removing');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }
    
    function getNotificationColor(type) {
        const colors = {
            'success': '#4CAF50',
            'error': '#f44336',
            'warning': '#ff9800',
            'info': '#2196F3'
        };
        return colors[type] || colors.info;
    }
    
    function getNotificationIcon(type) {
        const icons = {
            'success': '✅',
            'error': '❌',
            'warning': '⚠️',
            'info': 'ℹ️'
        };
        return icons[type] || icons.info;
    }
    
    // 3. DATA STATUS INDIKÁTOR
    function addDataStatusIndicator() {
        if (document.getElementById('data-status-indicator')) {
            return;
        }
        
        const indicator = document.createElement('div');
        indicator.id = 'data-status-indicator';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: bold;
            z-index: 9999;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        `;
        
        document.body.appendChild(indicator);
        updateDataStatus('waiting');
    }
    
    function updateDataStatus(status, count = 0) {
        const indicator = document.getElementById('data-status-indicator');
        if (!indicator) return;
        
        const statuses = {
            waiting: {
                text: '⏳ Připraven k načtení dat',
                color: '#ffffff',
                bg: '#ff9800',
                border: '#f57c00'
            },
            loading: {
                text: '🔄 Načítám data...',
                color: '#ffffff',
                bg: '#2196f3',
                border: '#1976d2'
            },
            success: {
                text: `✅ ${count} záznamů načteno`,
                color: '#ffffff',
                bg: '#4caf50',
                border: '#388e3c'
            },
            error: {
                text: '❌ Chyba při načítání',
                color: '#ffffff',
                bg: '#f44336',
                border: '#d32f2f'
            }
        };
        
        const statusInfo = statuses[status];
        indicator.textContent = statusInfo.text;
        indicator.style.color = statusInfo.color;
        indicator.style.backgroundColor = statusInfo.bg;
        indicator.style.border = `2px solid ${statusInfo.border}`;
        
        // Auto hide při úspěchu
        if (status === 'success') {
            setTimeout(() => {
                indicator.style.opacity = '0';
                setTimeout(() => {
                    indicator.style.display = 'none';
                }, 2000);
            }, 3000);
        } else {
            indicator.style.opacity = '1';
            indicator.style.display = 'block';
        }
    }
    
    // 4. AKTIVACE ZÁKLADNÍCH FUNKCÍ
    function activateBasicFunctions() {
        console.log('⚙️ Aktivuji základní funkce...');
        
        // Aktivace tabů
        activateTabs();
        
        // Aktivace formulářů
        activateForms();
        
        // Nastavení výchozích hodnot
        setDefaultValues();
    }
    
    function activateTabs() {
        const tabButtons = document.querySelectorAll('button, div, span');
        
        tabButtons.forEach(button => {
            const text = button.textContent.toLowerCase();
            if (text.includes('predikce') || text.includes('kalendář') || 
                text.includes('analýz') || text.includes('nastavení')) {
                
                button.style.cursor = 'pointer';
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    console.log('📋 Tab clicked:', text);
                });
            }
        });
    }
    
    function activateForms() {
        // Nastavení výchozích hodnot pro date inputy
        const dateInputs = document.querySelectorAll('input[type="date"]');
        dateInputs.forEach(input => {
            if (!input.value) {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                input.value = tomorrow.toISOString().split('T')[0];
            }
        });
        
        // Aktivace number inputů
        const numberInputs = document.querySelectorAll('input[type="number"]');
        numberInputs.forEach(input => {
            input.addEventListener('input', function() {
                if (this.value < 0) this.value = 0;
            });
        });
    }
    
    function setDefaultValues() {
        // Nastavení výchozích cen
        const priceInputs = document.querySelectorAll('input[placeholder*="cena"], input[placeholder*="Cena"]');
        priceInputs.forEach(input => {
            if (!input.value && input.placeholder.includes('Prodejní')) {
                input.value = 45;
            } else if (!input.value && input.placeholder.includes('Náklad')) {
                input.value = 18;
            }
        });
    }
    
    // 5. DEMO KONFIGURACE
    function setupDemoConfiguration() {
        if (!window.dataManager.config.googleSheetUrl) {
            console.log('📋 Nastavuji demo konfiguraci...');
            
            // Demo Google Sheets URL
            const demoUrl = 'https://docs.google.com/spreadsheets/d/1BxhMU_XELnT4KyTQOWHODHpU0pZhB9gQD1L6F3V2E8Y/edit#gid=0';
            window.dataManager.setGoogleSheetUrl(demoUrl);
            
            console.log('✅ Demo konfigurace nastavena');
        }
    }
    
    function setupDemoSheets() {
        const demoUrl = 'https://docs.google.com/spreadsheets/d/1BxhMU_XELnT4KyTQOWHODHpU0pZhB9gQD1L6F3V2E8Y/edit#gid=0';
        
        if (window.dataManager.setGoogleSheetUrl(demoUrl)) {
            showNotification('📊 Demo Google Sheets nastaveny', 'success');
            
            // Automatické načtení
            setTimeout(() => {
                const loadButton = document.querySelector('button');
                if (loadButton && loadButton.textContent.includes('Načíst')) {
                    loadButton.click();
                }
            }, 1000);
        }
    }
    
    // 6. AUTO-NAČTENÍ DAT
    async function autoLoadDataOnStart() {
        if (window.dataManager.config.googleSheetUrl && 
            !window.dataManager.isCacheValid()) {
            
            console.log('🔄 Auto-načítání dat při startu...');
            showNotification('🔄 Automaticky načítám data...', 'info', 2000);
            
            try {
                const data = await window.dataManager.loadGoogleSheetsData();
                if (data.length > 0) {
                    updateDataStatus('success', data.length);
                    updateUIComponents(data);
                }
            } catch (error) {
                console.warn('⚠️ Auto-načtení se nezdařilo:', error.message);
                updateDataStatus('waiting');
            }
        }
    }
    
    // 7. AKTUALIZACE UI KOMPONENT
    function updateUIComponents(data) {
        console.log('🔄 Aktualizuji UI komponenty s novými daty...');
        
        // Trigger custom event pro ostatní komponenty
        const event = new CustomEvent('donulandDataLoaded', {
            detail: { data: data, count: data.length }
        });
        document.dispatchEvent(event);
        
        // Aktualizace autocomplete (pokud existuje)
        if (window.autocompleteManager && window.autocompleteManager.updateFromGoogleSheets) {
            window.autocompleteManager.updateFromGoogleSheets(data);
        }
        
        // Aktualizace predikčního enginu (pokud existuje)
        if (window.predictionEngine && window.predictionEngine.updateHistoricalData) {
            window.predictionEngine.updateHistoricalData(data);
        }
        
        console.log('✅ UI komponenty aktualizovány');
    }
    
    // Globální přístup k funkcím
    window.updateDataStatus = updateDataStatus;
    window.updateUIComponents = updateUIComponents;
    
    // Spuštění inicializace
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initialize);
    } else {
        initialize();
    }
    
})();
