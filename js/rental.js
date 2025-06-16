// =============================================================================
// RENTAL MODEL MANAGEMENT
// =============================================================================

const rental = {
    // Update rental input fields based on selected model
    updateRentalInputs() {
        const model = document.getElementById('rentalModel')?.value;
        const fixedRow = document.getElementById('fixedRentalRow');
        const percentageRow = document.getElementById('percentageRentalRow');
        const mixedFixedRow = document.getElementById('mixedFixedRow');
        const mixedPercentageRow = document.getElementById('mixedPercentageRow');
        
        // Hide all rows first
        if (fixedRow) fixedRow.style.display = 'none';
        if (percentageRow) percentageRow.style.display = 'none';
        if (mixedFixedRow) mixedFixedRow.style.display = 'none';
        if (mixedPercentageRow) mixedPercentageRow.style.display = 'none';
        
        // Show relevant rows based on selection
        switch(model) {
            case 'fixed':
                if (fixedRow) fixedRow.style.display = 'flex';
                break;
            case 'percentage':
                if (percentageRow) percentageRow.style.display = 'flex';
                break;
            case 'mixed':
                if (mixedFixedRow) mixedFixedRow.style.display = 'flex';
                if (mixedPercentageRow) mixedPercentageRow.style.display = 'flex';
                break;
        }
        
        // Update prediction if available
        if (typeof prediction !== 'undefined') {
            prediction.updatePrediction();
        }
    },

    // Calculate rental cost based on selected model and revenue
    calculateRentalCost(revenue) {
        const rentalModel = document.getElementById('rentalModel')?.value || 'fixed';
        let rentalCost = 0;
        
        switch(rentalModel) {
            case 'fixed':
                rentalCost = parseFloat(document.getElementById('fixedRental')?.value) || 0;
                break;
            case 'percentage':
                const percentage = parseFloat(document.getElementById('percentageRental')?.value) || 0;
                rentalCost = revenue * (percentage / 100);
                break;
            case 'mixed':
                const fixedPart = parseFloat(document.getElementById('mixedFixed')?.value) || 0;
                const percentagePart = parseFloat(document.getElementById('mixedPercentage')?.value) || 0;
                rentalCost = fixedPart + (revenue * (percentagePart / 100));
                break;
        }
        
        return Math.round(rentalCost);
    },

    // Get rental model configuration
    getRentalConfig() {
        const model = document.getElementById('rentalModel')?.value || 'fixed';
        
        switch(model) {
            case 'fixed':
                return {
                    type: 'fixed',
                    amount: parseFloat(document.getElementById('fixedRental')?.value) || 0,
                    description: 'Fixní nájem'
                };
            case 'percentage':
                return {
                    type: 'percentage',
                    percentage: parseFloat(document.getElementById('percentageRental')?.value) || 0,
                    description: `${parseFloat(document.getElementById('percentageRental')?.value) || 0}% z obratu`
                };
            case 'mixed':
                return {
                    type: 'mixed',
                    fixedAmount: parseFloat(document.getElementById('mixedFixed')?.value) || 0,
                    percentage: parseFloat(document.getElementById('mixedPercentage')?.value) || 0,
                    description: `${parseFloat(document.getElementById('mixedFixed')?.value) || 0} Kč + ${parseFloat(document.getElementById('mixedPercentage')?.value) || 0}% z obratu`
                };
            default:
                return {
                    type: 'fixed',
                    amount: 0,
                    description: 'Bez nájmu'
                };
        }
    },

    // Validate rental inputs
    validateInputs() {
        const model = document.getElementById('rentalModel')?.value || 'fixed';
        const errors = [];
        
        switch(model) {
            case 'fixed':
                const fixedAmount = parseFloat(document.getElementById('fixedRental')?.value);
                if (isNaN(fixedAmount) || fixedAmount < 0) {
                    errors.push('Fixní nájem musí být nezáporné číslo');
                }
                break;
            case 'percentage':
                const percentage = parseFloat(document.getElementById('percentageRental')?.value);
                if (isNaN(percentage) || percentage < 0 || percentage > 50) {
                    errors.push('Procento z obratu musí být mezi 0 a 50%');
                }
                break;
            case 'mixed':
                const mixedFixed = parseFloat(document.getElementById('mixedFixed')?.value);
                const mixedPercentage = parseFloat(document.getElementById('mixedPercentage')?.value);
                
                if (isNaN(mixedFixed) || mixedFixed < 0) {
                    errors.push('Fixní část nájmu musí být nezáporné číslo');
                }
                if (isNaN(mixedPercentage) || mixedPercentage < 0 || mixedPercentage > 50) {
                    errors.push('Procentní část nájmu musí být mezi 0 a 50%');
                }
                break;
        }
        
        return errors;
    },

    // Calculate break-even point considering rental model
    calculateBreakEven(fixedCosts, sellingPrice, donutCost) {
        const rentalModel = document.getElementById('rentalModel')?.value || 'fixed';
        
        switch(rentalModel) {
            case 'fixed':
                const fixedRental = parseFloat(document.getElementById('fixedRental')?.value) || 0;
                const totalFixedCosts = fixedCosts + fixedRental;
                const contributionPerUnit = sellingPrice - donutCost;
                return contributionPerUnit > 0 ? Math.ceil(totalFixedCosts / contributionPerUnit) : 0;
                
            case 'percentage':
                const percentage = parseFloat(document.getElementById('percentageRental')?.value) || 0;
                const netSellingPrice = sellingPrice * (1 - percentage / 100);
                const contributionPerUnitPercentage = netSellingPrice - donutCost;
                return contributionPerUnitPercentage > 0 ? Math.ceil(fixedCosts / contributionPerUnitPercentage) : 0;
                
            case 'mixed':
                const mixedFixed = parseFloat(document.getElementById('mixedFixed')?.value) || 0;
                const mixedPercentage = parseFloat(document.getElementById('mixedPercentage')?.value) || 0;
                const totalFixedCostsMixed = fixedCosts + mixedFixed;
                const netSellingPriceMixed = sellingPrice * (1 - mixedPercentage / 100);
                const contributionPerUnitMixed = netSellingPriceMixed - donutCost;
                return contributionPerUnitMixed > 0 ? Math.ceil(totalFixedCostsMixed / contributionPerUnitMixed) : 0;
                
            default:
                const contributionPerUnitDefault = sellingPrice - donutCost;
                return contributionPerUnitDefault > 0 ? Math.ceil(fixedCosts / contributionPerUnitDefault) : 0;
        }
    },

    // Get rental cost breakdown for display
    getRentalBreakdown(revenue) {
        const config = this.getRentalConfig();
        const cost = this.calculateRentalCost(revenue);
        
        return {
            model: config.type,
            description: config.description,
            cost: cost,
            details: this.getRentalDetails(revenue, config)
        };
    },

    getRentalDetails(revenue, config) {
        switch(config.type) {
            case 'fixed':
                return `Fixní nájem: ${utils.formatCurrency(config.amount)}`;
            case 'percentage':
                return `${config.percentage}% z obratu ${utils.formatCurrency(revenue)} = ${utils.formatCurrency(revenue * config.percentage / 100)}`;
            case 'mixed':
                const percentagePart = revenue * config.percentage / 100;
                return `Fixní: ${utils.formatCurrency(config.fixedAmount)} + ${config.percentage}% z obratu: ${utils.formatCurrency(percentagePart)} = ${utils.formatCurrency(config.fixedAmount + percentagePart)}`;
            default:
                return 'Bez nájmu';
        }
    }
};
