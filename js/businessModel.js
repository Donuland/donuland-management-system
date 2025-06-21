// businessModel.js - Komplexní business model systém
class BusinessModelManager {
    constructor() {
        this.models = {
            owner: {
                id: 'owner',
                icon: '👑',
                title: 'Majitel',
                description: 'Vy jako majitel + 2 brigádníci',
                details: {
                    staff: 'Vy + 2 brigádníci',
                    hourlyRate: 150, // Kč/h pro brigádníka
                    hoursPerDay: 10,
                    ownerSalary: 0, // Majitel nebere mzdu, má zisk
                    benefits: ['100% zisku', 'Plná kontrola', 'Všechny rozhodnutí'],
                    costs: ['Všechny náklady', 'Mzdy brigádníků', 'Materiál a doprava']
                },
                color: '#ff6b6b',
                profitShare: 1.0, // 100% zisku
                efficiency: 1.0   // Základní efektivita
            },
            employee: {
                id: 'employee',
                icon: '👨‍💼',
                title: 'Zaměstnanec',
                description: 'Vy jako zaměstnanec + 1 brigádník',
                details: {
                    staff: 'Vy + 1 brigádník',
                    hourlyRate: 150, // Kč/h pro brigádníka
                    hoursPerDay: 10,
                    ownerSalary: 200, // Vaše hodinová mzda
                    benefits: ['Fixní mzda', 'Méně rizika', 'Méně odpovědnosti'],
                    costs: ['Hradí zaměstnavatel', 'Pouze pracovní výkon']
                },
                color: '#4CAF50',
                profitShare: 0.0, // Žádný zisk, jen mzda
                efficiency: 0.95  // Mírně nižší efektivita
            },
            franchise: {
                id: 'franchise',
                icon: '🤝',
                title: 'Franšízant',
                description: 'Franšízový model s podporou značky',
                details: {
                    staff: 'Vlastní personál dle potřeby',
                    hourlyRate: 150,
                    hoursPerDay: 10,
                    ownerSalary: 0,
                    franchiseFee: 0.15, // 15% z obratu
                    benefits: ['Podpora značky', 'Receptury', 'Marketing', 'Školení'],
                    costs: ['Franšízový poplatek', 'Vlastní náklady', 'Dodržování standardů']
                },
                color: '#2196F3',
                profitShare: 0.85, // 85% zisku (po odečtení poplatku)
                efficiency: 1.1    // Vyšší efektivita díky podpoře
            }
        };
        
        this.currentModel = null;
        this.setupEventListeners();
    }

    // Inicializace event listenerů
    setupEventListeners() {
        // Event listener pro změnu business modelu
        document.addEventListener('DOMContentLoaded', () => {
            const select = document.getElementById('businessModel');
            if (select) {
                select.addEventListener('change', (e) => {
                    this.updateBusinessModelInfo(e.target.value);
                });
            }
        });
    }

    // Aktualizace informací o business modelu
    updateBusinessModelInfo(modelId) {
        const infoDiv = document.getElementById('businessModelInfo');
        if (!infoDiv) return;

        if (!modelId || !this.models[modelId]) {
            infoDiv.style.display = 'none';
            this.currentModel = null;
            return;
        }

        const model = this.models[modelId];
        this.currentModel = model;

        // Výpočet nákladů pro ukázku
        const dailyStaffCost = this.calculateDailyStaffCost(model);
        const monthlyEstimate = dailyStaffCost * 8; // 8 akcí měsíčně

        infoDiv.innerHTML = `
            <div style="border-left: 4px solid ${model.color}; padding-left: 15px;">
                <h5 style="margin: 0 0 10px 0; color: ${model.color};">
                    ${model.icon} ${model.title}
                </h5>
                <p style="margin: 0 0 10px 0; font-weight: 600;">
                    ${model.description}
                </p>
                
                <div class="business-details" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 10px 0;">
                    <div>
                        <h6 style="margin: 0 0 5px 0; color: #333;">💼 Personál & Náklady</h6>
                        <ul style="margin: 0; padding-left: 15px; font-size: 0.9em;">
                            <li><strong>Tým:</strong> ${model.details.staff}</li>
                            <li><strong>Hodinová sazba brigádníka:</strong> ${model.details.hourlyRate} Kč/h</li>
                            <li><strong>Pracovní doba:</strong> ${model.details.hoursPerDay}h/den</li>
                            ${model.details.ownerSalary > 0 ? `<li><strong>Vaše mzda:</strong> ${model.details.ownerSalary} Kč/h</li>` : ''}
                            ${model.details.franchiseFee ? `<li><strong>Franšízový poplatek:</strong> ${(model.details.franchiseFee * 100)}% z obratu</li>` : ''}
                        </ul>
                    </div>
                    
                    <div>
                        <h6 style="margin: 0 0 5px 0; color: #333;">📊 Finanční přehled</h6>
                        <ul style="margin: 0; padding-left: 15px; font-size: 0.9em;">
                            <li><strong>Náklady na personál/den:</strong> ${dailyStaffCost.toLocaleString()} Kč</li>
                            <li><strong>Odhad měsíčně:</strong> ${monthlyEstimate.toLocaleString()} Kč</li>
                            <li><strong>Podíl ze zisku:</strong> ${(model.profitShare * 100)}%</li>
                            <li><strong>Efektivita:</strong> ${(model.efficiency * 100)}%</li>
                        </ul>
                    </div>
                </div>

                <div class="benefits-costs" style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 10px 0;">
                    <div>
                        <h6 style="margin: 0 0 5px 0; color: #27ae60;">✅ Výhody</h6>
                        <ul style="margin: 0; padding-left: 15px; font-size: 0.85em;">
                            ${model.details.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                        </ul>
                    </div>
                    
                    <div>
                        <h6 style="margin: 0 0 5px 0; color: #e74c3c;">💸 Náklady/Povinnosti</h6>
                        <ul style="margin: 0; padding-left: 15px; font-size: 0.85em;">
                            ${model.details.costs.map(cost => `<li>${cost}</li>`).join('')}
                        </ul>
                    </div>
                </div>

                ${this.getModelSpecificAdvice(model)}
            </div>
        `;
        
        infoDiv.style.display = 'block';
        
        console.log('📋 Business model aktualizován:', model.title);
    }

    // Výpočet denních nákladů na personál
    calculateDailyStaffCost(model) {
        let totalCost = 0;
        
        switch (model.id) {
            case 'owner':
                // 2 brigádníci
                totalCost = 2 * model.details.hourlyRate * model.details.hoursPerDay;
                break;
                
            case 'employee':
                // 1 brigádník + vaše mzda
                totalCost = model.details.hourlyRate * model.details.hoursPerDay; // brigádník
                totalCost += model.details.ownerSalary * model.details.hoursPerDay; // vaše mzda
                break;
                
            case 'franchise':
                // Variabilní podle potřeby, základně 1 brigádník
                totalCost = model.details.hourlyRate * model.details.hoursPerDay;
                break;
        }
        
        return totalCost;
    }

    // Specifické rady pro každý model
    getModelSpecificAdvice(model) {
        const advice = {
            owner: [
                "💡 Jako majitel máte plnou kontrolu nad kvalitou a procesem",
                "📈 Investujte zisk zpět do rozvoje (nové vybavení, lokace)",
                "👥 Motivujte brigádníky bonusy za výkon"
            ],
            employee: [
                "💼 Soustřeďte se na maximální výkon během směny",
                "📋 Vedite přesné záznamy o prodeji pro reporty",
                "🎯 Domlouvejte si bonusy za překročení cílů"
            ],
            franchise: [
                "📘 Dodržujte přesně franšízové standardy a postupy",
                "🎓 Využívejte všechna školení a podporu franšízora",
                "📊 Sledujte KPI metriky pro optimalizaci provozu"
            ]
        };
        
        return `
            <div style="margin-top: 15px; padding: 10px; background: ${model.color}15; border-radius: 6px;">
                <h6 style="margin: 0 0 8px 0; color: ${model.color};">💡 Doporučení pro ${model.title.toLowerCase()}a</h6>
                <ul style="margin: 0; padding-left: 15px; font-size: 0.85em;">
                    ${advice[model.id].map(tip => `<li>${tip}</li>`).join('')}
                </ul>
            </div>
        `;
    }

    // Výpočet všech nákladů pro predikci
    calculateAllCosts(eventData, quantity) {
        if (!this.currentModel) {
            console.warn('⚠️ Business model není vybrán');
            return this.getDefaultCosts(eventData, quantity);
        }

        const model = this.currentModel;
        const eventDays = this.calculateEventDuration(eventData.startDate, eventData.endDate);
        
        // Základní náklady
        const productionCosts = quantity * (eventData.costPerDonut || 18);
        const fuelCosts = (eventData.distanceKm || 0) * 2 * (eventData.fuelCostPerKm || 8);
        
        // Personální náklady podle modelu
        let laborCosts = 0;
        let franchiseFee = 0;
        let ownerSalary = 0;
        
        const dailyStaffCost = this.calculateDailyStaffCost(model);
        laborCosts = dailyStaffCost * eventDays;
        
        // Specifické výpočty podle modelu
        if (model.id === 'employee') {
            // U zaměstnance je mzda součástí nákladů
            ownerSalary = model.details.ownerSalary * model.details.hoursPerDay * eventDays;
        } else if (model.id === 'franchise') {
            // Franšízový poplatek z obratu
            const revenue = quantity * (eventData.pricePerDonut || 45);
            franchiseFee = revenue * model.details.franchiseFee;
        }

        // Ostatní náklady (stánek, povolení, atd.)
        const otherCosts = eventDays * 500; // 500 Kč/den za stánek, povolení, atd.

        const total = productionCosts + fuelCosts + laborCosts + franchiseFee + ownerSalary + otherCosts;

        return {
            production: productionCosts,
            fuel: fuelCosts,
            labor: laborCosts,
            franchise: franchiseFee,
            salary: ownerSalary,
            other: otherCosts,
            total: total,
            breakdown: {
                model: model.title,
                eventDays: eventDays,
                dailyStaffCost: dailyStaffCost
            }
        };
    }

    // Výchozí náklady pokud není model vybrán
    getDefaultCosts(eventData, quantity) {
        const productionCosts = quantity * (eventData.costPerDonut || 18);
        const fuelCosts = (eventData.distanceKm || 0) * 2 * (eventData.fuelCostPerKm || 8);
        const laborCosts = 3000; // Základní odhad
        const otherCosts = 500;

        return {
            production: productionCosts,
            fuel: fuelCosts,
            labor: laborCosts,
            franchise: 0,
            salary: 0,
            other: otherCosts,
            total: productionCosts + fuelCosts + laborCosts + otherCosts,
            breakdown: {
                model: 'Nevybráno',
                eventDays: 1,
                dailyStaffCost: laborCosts
            }
        };
    }

    // Aplikace business model faktoru na predikci
    applyBusinessModelAdjustment(prediction) {
        if (!this.currentModel) return prediction;
        
        // Aplikace efektivity modelu
        return prediction * this.currentModel.efficiency;
    }

    // Výpočet čistého zisku po všech poplatcích
    calculateNetProfit(revenue, costs) {
        if (!this.currentModel) {
            return revenue - costs.total;
        }

        let netProfit = revenue - costs.total;
        
        // Pro franšízu je poplatek už zahrnut v costs
        // Pro zaměstnance je zisk nulový (má jen mzdu)
        if (this.currentModel.id === 'employee') {
            return 0; // Zaměstnanec nemá zisk, jen mzdu
        }
        
        return netProfit * this.currentModel.profitShare;
    }

    // Výpočet délky akce
    calculateEventDuration(startDate, endDate) {
        if (!endDate || endDate === startDate) return 1;
        
        const start = new Date(startDate);
        const end = new Date(endDate);
        const diffTime = Math.abs(end - start);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return diffDays;
    }

    // Získání aktuálního modelu
    getCurrentModel() {
        return this.currentModel;
    }

    // Získání všech dostupných modelů
    getAllModels() {
        return Object.values(this.models);
    }

    // Resetování výběru
    reset() {
        this.currentModel = null;
        const infoDiv = document.getElementById('businessModelInfo');
        if (infoDiv) {
            infoDiv.style.display = 'none';
        }
    }

    // Exportní funkce pro reporty
    getModelSummary() {
        if (!this.currentModel) return null;

        return {
            id: this.currentModel.id,
            title: this.currentModel.title,
            description: this.currentModel.description,
            profitShare: this.currentModel.profitShare,
            efficiency: this.currentModel.efficiency,
            dailyCost: this.calculateDailyStaffCost(this.currentModel)
        };
    }
}

// Export pro použití v jiných souborech
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BusinessModelManager;
}

// Globální instance
window.businessModelManager = new BusinessModelManager();

// Globální funkce pro kompatibilitu
function updateBusinessModelInfo() {
    const select = document.getElementById('businessModel');
    if (select && window.businessModelManager) {
        window.businessModelManager.updateBusinessModelInfo(select.value);
    }
}
