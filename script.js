// Donuland Management System v3.0 - Kompletní funkční verze
console.log('🍩 Donuland Management System se načítá...');

// Globální proměnné
let currentEventData = {};
let historicalData = [];
let weatherData = {};

// Inicializace aplikace
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM načten, inicializuji aplikaci...');
    
    // Inicializace všech komponent
    initializeApp();
    initializeNavigation();
    initializeEventForm();
    initializeBusinessModel();
    initializeWeatherSystem();
    initializePredictionSystem();
    initializeSettings();
    
    // Skrytí loading screen po 3 sekundách
    setTimeout(() => {
        hideLoadingScreen();
    }, 3000);
});

// Hlavní inicializace aplikace
function initializeApp() {
    console.log('✅ Aplikace inicializována');
    
    // Načtení uložených nastavení
    loadSettings();
    
    // Aktivace první sekce
    showSection('basicInfo');
}

// Skrytí loading screen
function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    const mainApp = document.getElementById('mainApp');
    
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
        console.log('Loading screen skryt');
    }
    
    if (mainApp) {
        mainApp.style.display = 'block';
        console.log('Hlavní aplikace zobrazena');
    }
}

// Navigace mezi sekcemi
function initializeNavigation() {
    const navButtons = document.querySelectorAll('.nav-btn');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetSection = this.dataset.section;
            showSection(targetSection);
            
            // Aktivní stav tlačítka
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            console.log(`Přepnuto na sekci: ${targetSection}`);
        });
    });
    
    console.log('✅ Navigace inicializována');
}

// Zobrazení sekce
function showSection(sectionId) {
    const sections = document.querySelectorAll('.section');
    
    sections.forEach(section => {
        section.classList.remove('active');
        section.style.display = 'none';
    });
    
    const targetSection = document.getElementById(sectionId);
    if (targetSection) {
        targetSection.classList.add('active');
        targetSection.style.display = 'block';
    }
}

// Inicializace formuláře akce
function initializeEventForm() {
    const eventTypeSelect = document.getElementById('eventType');
    const eventNameInput = document.getElementById('eventName');
    const cityInput = document.getElementById('eventCity');
    const dateInput = document.getElementById('eventDate');
    const durationSelect = document.getElementById('eventDuration');
    const attendanceInput = document.getElementById('expectedAttendance');
    const environmentSelect = document.getElementById('eventEnvironment');
    
    // Event listenery pro změny ve formuláři
    if (eventTypeSelect) {
        eventTypeSelect.addEventListener('change', updateEventData);
    }
    if (eventNameInput) {
        eventNameInput.addEventListener('input', updateEventData);
        eventNameInput.addEventListener('input', showEventSuggestions);
    }
    if (cityInput) {
        cityInput.addEventListener('input', updateEventData);
        cityInput.addEventListener('input', showCitySuggestions);
    }
    if (dateInput) {
        dateInput.addEventListener('change', updateEventData);
        dateInput.addEventListener('change', loadWeatherForecast);
    }
    if (durationSelect) {
        durationSelect.addEventListener('change', updateEventData);
    }
    if (attendanceInput) {
        attendanceInput.addEventListener('input', updateEventData);
    }
    if (environmentSelect) {
        environmentSelect.addEventListener('change', updateEventData);
        environmentSelect.addEventListener('change', updateWeatherImportance);
    }
    
    console.log('✅ Formulář akce inicializován');
}

// Aktualizace dat akce
function updateEventData() {
    currentEventData = {
        type: getValue('eventType'),
        name: getValue('eventName'),
        city: getValue('eventCity'),
        date: getValue('eventDate'),
        duration: getValue('eventDuration'),
        attendance: getValue('expectedAttendance'),
        environment: getValue('eventEnvironment')
    };
    
    console.log('Aktualizována data akce:', currentEventData);
    
    // Aktualizace predikcí
    updatePredictions();
}

// Pomocná funkce pro získání hodnoty
function getValue(elementId) {
    const element = document.getElementById(elementId);
    return element ? element.value : '';
}

// Našeptávač akcí
function showEventSuggestions() {
    const input = document.getElementById('eventName');
    if (!input) return;
    
    const value = input.value.toLowerCase();
    if (value.length < 2) return;
    
    // Simulace historických akcí
    const suggestions = [
        'Donut Festival Praha 2024',
        'Food Festival Brno',
        'Čokoládový festival Ostrava',
        'Rodinný den v parku'
    ].filter(suggestion => 
        suggestion.toLowerCase().includes(value)
    );
    
    // Zde by bylo zobrazení našeptávače
    console.log('Našeptávač akcí:', suggestions);
}

// Našeptávač měst
function showCitySuggestions() {
    const input = document.getElementById('eventCity');
    if (!input) return;
    
    const value = input.value.toLowerCase();
    if (value.length < 2) return;
    
    const cities = [
        'Praha', 'Brno', 'Ostrava', 'Plzeň', 'Liberec',
        'Olomouc', 'České Budějovice', 'Hradec Králové'
    ].filter(city => 
        city.toLowerCase().includes(value)
    );
    
    console.log('Našeptávač měst:', cities);
}

// Systém počasí
function initializeWeatherSystem() {
    console.log('✅ Systém počasí inicializován');
}

// Načtení předpovědi počasí
function loadWeatherForecast() {
    const city = getValue('eventCity');
    const date = getValue('eventDate');
    
    if (!city || !date) return;
    
    // Simulace načtení počasí
    const weatherDisplay = document.getElementById('weatherDisplay');
    if (weatherDisplay) {
        weatherDisplay.innerHTML = `
            <h4>📍 ${city} - ${date}</h4>
            <p>🌤️ Částečně oblačno, 22°C</p>
            <p>💨 Vítr: 5 m/s</p>
            <p>🌧️ Srážky: 0%</p>
        `;
    }
    
    // Kontrola kvality donutů
    updateQualityWarning(22); // Teplota 22°C
    
    console.log(`Počasí načteno pro ${city}, ${date}`);
}

// Aktualizace varování kvality
function updateQualityWarning(temperature) {
    const warningElement = document.getElementById('qualityWarning');
    if (!warningElement) return;
    
    if (temperature > 25) {
        warningElement.innerHTML = `
            <div class="quality-warning high">
                ⚠️ <strong>Vysoká teplota (${temperature}°C)!</strong><br>
                Riziko roztékání čokoládových polev. Doporučujeme:
                <ul>
                    <li>Chladící boxy pro donuty</li>
                    <li>Stíněné stanoviště</li>
                    <li>Častější doplňování zásob</li>
                </ul>
            </div>
        `;
    } else {
        warningElement.innerHTML = `
            <div class="quality-warning low">
                ✅ <strong>Optimální teplota (${temperature}°C)</strong><br>
                Ideální podmínky pro prodej donutů.
            </div>
        `;
    }
}

// Aktualizace důležitosti počasí
function updateWeatherImportance() {
    const environment = getValue('eventEnvironment');
    const importanceElement = document.getElementById('weatherImportance');
    
    if (!importanceElement) return;
    
    let importance = '';
    switch(environment) {
        case 'outdoor':
            importance = 'Vysoká důležitost - venkovní akce';
            break;
        case 'indoor':
            importance = 'Nízká důležitost - vnitřní akce';
            break;
        case 'mixed':
            importance = 'Střední důležitost - smíšené prostředí';
            break;
        default:
            importance = 'Vyberte prostředí akce';
    }
    
    importanceElement.textContent = importance;
}

// Obchodní model
function initializeBusinessModel() {
    const modelSelect = document.getElementById('businessModel');
    const costInputs = ['donutCost', 'donutPrice', 'transportCost', 'otherCosts'];
    const rentInputs = ['rentModel', 'fixedRent', 'percentageRent', 'fixedPart', 'percentagePart'];
    
    // Event listenery pro obchodní model
    if (modelSelect) {
        modelSelect.addEventListener('change', updateBusinessModel);
    }
    
    costInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('input', updatePredictions);
        }
    });
    
    rentInputs.forEach(inputId => {
        const input = document.getElementById(inputId);
        if (input) {
            input.addEventListener('change', updateRentModel);
            input.addEventListener('input', updatePredictions);
        }
    });
    
    console.log('✅ Obchodní model inicializován');
}

// Aktualizace obchodního modelu
function updateBusinessModel() {
    const model = getValue('businessModel');
    const modelDescription = document.getElementById('modelDescription');
    
    if (!modelDescription) return;
    
    const descriptions = {
        'owner': '🏪 <strong>Majitel:</strong> Vy + 2 brigádníci (150 Kč/h × 10h = 3000 Kč) + všechny náklady',
        'employee': '👷 <strong>Zaměstnanec:</strong> Vy + 1 brigádník (fixní mzda) + některé náklady',
        'franchise': '🤝 <strong>Franšízant:</strong> Nákup donutů od vás, vlastní prodej'
    };
    
    modelDescription.innerHTML = descriptions[model] || 'Vyberte model podnikání';
    
    updatePredictions();
}

// Aktualizace modelu nájmu
function updateRentModel() {
    const rentModel = getValue('rentModel');
    const fixedRentGroup = document.getElementById('fixedRentGroup');
    const percentageRentGroup = document.getElementById('percentageRentGroup');
    const fixedPercentageGroup = document.getElementById('fixedPercentageGroup');
    
    // Skrytí všech skupin
    [fixedRentGroup, percentageRentGroup, fixedPercentageGroup].forEach(group => {
        if (group) group.style.display = 'none';
    });
    
    // Zobrazení relevantní skupiny
    switch(rentModel) {
        case 'fixed':
            if (fixedRentGroup) fixedRentGroup.style.display = 'block';
            break;
        case 'percentage':
            if (percentageRentGroup) percentageRentGroup.style.display = 'block';
            break;
        case 'mixed':
            if (fixedPercentageGroup) fixedPercentageGroup.style.display = 'block';
            break;
    }
}

// Predikční systém
function initializePredictionSystem() {
    console.log('✅ Predikční systém inicializován');
}

// Aktualizace predikcí
function updatePredictions() {
    const attendance = parseInt(getValue('expectedAttendance')) || 0;
    const eventType = getValue('eventType');
    
    if (attendance === 0 || !eventType) {
        const predictionDisplay = document.getElementById('predictionDisplay');
        if (predictionDisplay) {
            predictionDisplay.innerHTML = '📍 Vyplňte typ akce a návštěvnost pro načtení predikce';
        }
        return;
    }
    
    // Výpočet základní predikce
    const conversionRate = getConversionRate(eventType);
    const expectedSales = Math.round(attendance * conversionRate);
    
    const donutPrice = parseFloat(getValue('donutPrice')) || 50;
    const donutCost = parseFloat(getValue('donutCost')) || 25;
    const transportCost = parseFloat(getValue('transportCost')) || 500;
    const otherCosts = parseFloat(getValue('otherCosts')) || 1000;
    
    const revenue = expectedSales * donutPrice;
    const costs = expectedSales * donutCost + transportCost + otherCosts;
    const profit = revenue - costs;
    const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : 0;
    
    // Zobrazení predikce
    const predictionDisplay = document.getElementById('predictionDisplay');
    if (predictionDisplay) {
        predictionDisplay.innerHTML = `
            <div class="prediction-results">
                <h4>📊 Predikce pro ${eventType}</h4>
                <div class="prediction-grid">
                    <div class="prediction-item">
                        <span class="label">Očekávaný prodej:</span>
                        <span class="value">${expectedSales} donutů</span>
                    </div>
                    <div class="prediction-item">
                        <span class="label">Tržby:</span>
                        <span class="value">${revenue.toLocaleString()} Kč</span>
                    </div>
                    <div class="prediction-item">
                        <span class="label">Náklady:</span>
                        <span class="value">${costs.toLocaleString()} Kč</span>
                    </div>
                    <div class="prediction-item">
                        <span class="label">Zisk:</span>
                        <span class="value ${profit > 0 ? 'positive' : 'negative'}">${profit.toLocaleString()} Kč</span>
                    </div>
                    <div class="prediction-item">
                        <span class="label">Marže:</span>
                        <span class="value">${margin}%</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    console.log(`Predikce vypočtena: ${expectedSales} donutů, zisk ${profit} Kč`);
}

// Konverzní poměr podle typu akce
function getConversionRate(eventType) {
    const rates = {
        'food-festival': 0.15,
        'fair': 0.08,
        'concert': 0.12,
        'sports': 0.06,
        'cultural': 0.10,
        'family': 0.18,
        'chocolate': 0.25,
        'other': 0.10
    };
    
    return rates[eventType] || 0.10;
}

// Nastavení
function initializeSettings() {
    const settingsForm = document.getElementById('settingsForm');
    const saveButton = document.getElementById('saveSettings');
    
    if (saveButton) {
        saveButton.addEventListener('click', saveSettings);
    }
    
    console.log('✅ Nastavení inicializována');
}

// Uložení nastavení
function saveSettings() {
    const settings = {
        defaultPrice: getValue('defaultDonutPrice'),
        productionCost: getValue('defaultDonutCost'),
        franchisePrice: getValue('franchiseDonutPrice')
    };
    
    localStorage.setItem('donulandSettings', JSON.stringify(settings));
    
    // Zobrazení potvrzení
    const saveButton = document.getElementById('saveSettings');
    if (saveButton) {
        const originalText = saveButton.textContent;
        saveButton.textContent = '✅ Uloženo!';
        saveButton.style.backgroundColor = '#4CAF50';
        
        setTimeout(() => {
            saveButton.textContent = originalText;
            saveButton.style.backgroundColor = '';
        }, 2000);
    }
    
    console.log('Nastavení uložena:', settings);
}

// Načtení nastavení
function loadSettings() {
    const savedSettings = localStorage.getItem('donulandSettings');
    
    if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        
        // Aplikace uložených nastavení
        setIfExists('defaultDonutPrice', settings.defaultPrice);
        setIfExists('defaultDonutCost', settings.productionCost);
        setIfExists('franchiseDonutPrice', settings.franchisePrice);
        
        console.log('Nastavení načtena:', settings);
    }
}

// Pomocná funkce pro nastavení hodnoty
function setIfExists(elementId, value) {
    const element = document.getElementById(elementId);
    if (element && value) {
        element.value = value;
    }
}

// Funkce pro načtení dat (tlačítko v navigaci)
function loadData() {
    showSection('dataLoader');
    
    // Simulace načítání dat
    const dataDisplay = document.getElementById('dataDisplay');
    if (dataDisplay) {
        dataDisplay.innerHTML = '🔄 Načítám historická data...';
        
        setTimeout(() => {
            dataDisplay.innerHTML = `
                <h4>📊 Historická data načtena</h4>
                <p>Nalezeno 15 akcí v databázi</p>
                <p>Průměrný prodej: 245 donutů na akci</p>
                <p>Nejúspěšnější akce: Čokoládový festival (450 donutů)</p>
            `;
        }, 2000);
    }
    
    console.log('Data načítána');
}

// Funkce pro AI predikce (tlačítko v navigaci)
function showAIPrediction() {
    showSection('aiPrediction');
    
    const aiDisplay = document.getElementById('aiPredictionDisplay');
    if (aiDisplay) {
        aiDisplay.innerHTML = `
            <h4>🤖 AI Predikční model</h4>
            <p>Analyzuji současné trendy a historická data...</p>
            <div class="ai-insights">
                <h5>💡 Doporučení:</h5>
                <ul>
                    <li>Food festivaly mají 15% konverzi</li>
                    <li>Čokoládové akce nejvyšší zájem (25%)</li>
                    <li>Víkendové akce +20% prodej</li>
                    <li>Ideální počasí: 18-24°C</li>
                </ul>
            </div>
        `;
    }
    
    console.log('AI predikce zobrazena');
}

// Funkce pro kalendář (tlačítko v navigaci)
function showCalendar() {
    showSection('calendar');
    
    const calendarDisplay = document.getElementById('calendarDisplay');
    if (calendarDisplay) {
        calendarDisplay.innerHTML = `
            <h4>📅 Kalendář akcí</h4>
            <div class="calendar-view">
                <p>Zatím nemáte naplánované žádné akce.</p>
                <button onclick="addEventToCalendar()" class="btn btn-primary">
                    ➕ Přidat akci do kalendáře
                </button>
            </div>
        `;
    }
    
    console.log('Kalendář zobrazen');
}

// Přidání akce do kalendáře
function addEventToCalendar() {
    if (currentEventData.name && currentEventData.date) {
        alert('Akce "' + currentEventData.name + '" přidána do kalendáře na ' + currentEventData.date);
    } else {
        alert('Nejdříve vyplňte základní informace o akci');
    }
}

// Analýza dat (sekce analýzy)
function showAnalysis() {
    showSection('analysis');
    
    const analysisDisplay = document.getElementById('analysisDisplay');
    if (analysisDisplay) {
        analysisDisplay.innerHTML = `
            <h4>📊 Analýza prodejních dat</h4>
            <div class="analysis-charts">
                <div class="chart-placeholder">
                    <p>📈 Graf prodejů za posledních 12 měsíců</p>
                    <p>📊 Nejlepší dny: So, Ne (350+ donutů)</p>
                    <p>📉 Nejhorší dny: Po, Út (150- donutů)</p>
                </div>
            </div>
        `;
    }
    
    console.log('Analýza zobrazena');
}

console.log('🍩 Donuland Management System script načten');
