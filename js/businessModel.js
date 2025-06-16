// =============================================================================
// BUSINESS MODEL MANAGEMENT
// =============================================================================

const businessModel = {
    // Update business model information display
    updateInfo() {
        const selectedModel = document.querySelector('input[name="businessModel"]:checked').value;
        const info = document.getElementById('businessModelInfo');
        const model = CONFIG.BUSINESS_MODELS[selectedModel];
        
        if (info && model) {
            info.textContent = model.description;
        }
        
        // Update donut cost field based on model
        const donutCostField = document.getElementById('donutCost');
        if (donutCostField && model) {
            donutCostField.value = model.donutCost;
        }
        
        // Update label based on model
        const donutCostLabel = donutCostField?.parentElement?.querySelector('label');
        if (donutCostLabel) {
            if (selectedModel === 'franchisee') {
                donutCostLabel.textContent = 'Prodejní cena franšízantovi (Kč):';
            } else {
                donutCostLabel.textContent = 'Náklady na donut (Kč):';
            }
        }
    },

    // Get current business model configuration
    getCurrentModel() {
        const selectedModelValue = document.querySelector('input[name="businessModel"]:checked')?.value || 'owner';
        return CONFIG.BUSINESS_MODELS[selectedModelValue];
    },

    // Calculate financials based on business model
    calculateFinancials(predictedSales) {
        const selectedModel = document.querySelector('input[name="businessModel"]:checked')?.value || 'owner';
        const model = CONFIG.BUSINESS_MODELS[selectedModel];
        
        const donutCost = parseFloat(document.getElementById('donutCost')?.value) || model.donutCost;
        const sellingPrice = parseFloat(document.getElementById('sellingPrice')?.value) || 110;
        const transportCost = parseFloat(document.getElementById('transportCost')?.value) || 500;
        const otherCosts = parseFloat(document.getElementById('otherCosts')?.value) || 0;
        
        let financials = {};
        
        switch (selectedModel) {
            case 'owner':
                financials = this.calculateOwnerFinancials(predictedSales, donutCost, sellingPrice, transportCost, otherCosts);
                break;
            case 'employee':
                financials = this.calculateEmployeeFinancials(predictedSales, donutCost, sellingPrice, transportCost, otherCosts);
                break;
            case 'franchisee':
                financials = this.calculateFranchiseeFinancials(predictedSales, donutCost, sellingPrice, transportCost, otherCosts);
                break;
        }
        
        // Add common calculations
        financials.revenue = predictedSales * sellingPrice;
        financials.avgSalePerVisitor = financials.revenue / (parseInt(document.getElementById('expectedVisitors')?.value) || 1);
        financials.margin = financials.revenue > 0 ? (financials.profit / financials.revenue) * 100 : 0;
        financials.profitPerDonut = predictedSales > 0 ? financials.profit / predictedSales : 0;
        
        return financials;
    },

    calculateOwnerFinancials(predictedSales, donutCost, sellingPrice, transportCost, otherCosts) {
        const laborCost = CONFIG.BUSINESS_MODELS.owner.laborCost; // 3000 Kč
        const donutsCost = predictedSales * donutCost;
        const revenue = predictedSales * sellingPrice;
        
        // Calculate rental cost
        const rentalCost = rental.calculateRentalCost(revenue);
        
        // Total costs
        const totalCosts = donutsCost + transportCost + otherCosts + laborCost + rentalCost;
        const profit = revenue - totalCosts;
        
        // Break-even calculation
        const fixedCosts = transportCost + otherCosts + laborCost + 
                          (document.getElementById('rentalModel')?.value === 'fixed' ? rentalCost : 0);
        const variableCostPerUnit = donutCost + 
                                   (document.getElementById('rentalModel')?.value === 'percentage' ? 
                                    (sellingPrice * parseFloat(document.getElementById('percentageRental')?.value || 0) / 100) : 0);
        const contributionPerUnit = sellingPrice - variableCostPerUnit;
        const breakEvenUnits = contributionPerUnit > 0 ? Math.ceil(fixedCosts / contributionPerUnit) : 0;
        
        return {
            totalCosts,
            donutsCost,
            laborCost,
            transportCost,
            otherCosts,
            rentalCost,
            profit,
            breakEvenUnits,
            costBreakdown: {
                'Donuty': donutsCost,
                'Práce (2 brigádníci)': laborCost,
                'Doprava': transportCost,
                'Nájem': rentalCost,
                'Ostatní': otherCosts
            }
        };
    },

    calculateEmployeeFinancials(predictedSales, donutCost, sellingPrice, transportCost, otherCosts) {
        const brigadeLabor = 1500; // 1 brigádník
        const ownWage = 1500; // Vlastní mzda
        const revenue = predictedSales * sellingPrice;
        const revenueShare = revenue * 0.05; // 5% z obratu
        
        const totalLaborCost = brigadeLabor + ownWage + revenueShare;
        const donutsCost = predictedSales * donutCost;
        
        // Rental costs
        const rentalCost = rental.calculateRentalCost(revenue);
        
        const totalCosts = donutsCost + transportCost + otherCosts + totalLaborCost + rentalCost;
        const profit = revenue - totalCosts;
        
        // Break-even calculation
        const fixedCosts = transportCost + otherCosts + brigadeLabor + ownWage +
                          (document.getElementById('rentalModel')?.value === 'fixed' ? rentalCost : 0);
        const variablePercentage = 0.05 + // Revenue share
                                  (document.getElementById('rentalModel')?.value === 'percentage' ? 
                                   parseFloat(document.getElementById('percentageRental')?.value || 0) / 100 : 0);
        const variableCostPerUnit = donutCost;
        const netRevenuePerUnit = sellingPrice * (1 - variablePercentage) - variableCostPerUnit;
        const breakEvenUnits = netRevenuePerUnit > 0 ? Math.ceil(fixedCosts / netRevenuePerUnit) : 0;
        
        return {
            totalCosts,
            donutsCost,
            laborCost: totalLaborCost,
            transportCost,
            otherCosts,
            rentalCost,
            profit,
            breakEvenUnits,
            revenueShare,
            costBreakdown: {
                'Donuty': donutsCost,
                'Brigádník': brigadeLabor,
                'Vlastní mzda': ownWage,
                'Podíl z obratu (5%)': revenueShare,
                'Doprava': transportCost,
                'Nájem': rentalCost,
                'Ostatní': otherCosts
            }
        };
    },

    calculateFranchiseeFinancials(predictedSales, donutCost, sellingPrice, transportCost, otherCosts) {
        const franchisePrice = 52; // Cena za kterou prodáváte franšízantovi
        const productionCost = 32; // Vaše náklady na výrobu
        const yourProfit = (franchisePrice - productionCost) * predictedSales;
        
        // Franšízantův pohled
        const franchiseeRevenue = predictedSales * sellingPrice;
        const franchiseeDonutCost = predictedSales * franchisePrice;
        const rentalCost = rental.calculateRentalCost(franchiseeRevenue);
        
        const franchiseeTotalCosts = franchiseeDonutCost + transportCost + otherCosts + rentalCost;
        const franchiseeProfit = franchiseeRevenue - franchiseeTotalCosts;
        
        return {
            // Your data
            yourRevenue: franchisePrice * predictedSales,
            yourCosts: productionCost * predictedSales,
            yourProfit: yourProfit,
            
            // Franchisee data
            totalCosts: franchiseeTotalCosts,
            donutsCost: franchiseeDonutCost,
            laborCost: 0,
            transportCost,
            otherCosts,
            rentalCost,
            profit: franchiseeProfit,
            breakEvenUnits: sellingPrice > franchisePrice ? 
                           Math.ceil((transportCost + otherCosts + rentalCost) / (sellingPrice - franchisePrice)) : 0,
            
            costBreakdown: {
                'Nákup donutů (franšízant)': franchiseeDonutCost,
                'Doprava (franšízant)': transportCost,
                'Nájem (franšízant)': rentalCost,
                'Ostatní (franšízant)': otherCosts,
                'Váš zisk z prodeje': yourProfit
            }
        };
    }
};
