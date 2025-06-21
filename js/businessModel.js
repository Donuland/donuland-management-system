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
                profitShare: 0.0, // Žádný zisk, jen
