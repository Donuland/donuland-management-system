// Donuland Management System v3.0 - Hlavní script
document.addEventListener('DOMContentLoaded', function() {
    console.log('Donuland Management System načten');
    
    // Skrytí loading screen po 3 sekundách
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        if (mainApp) {
            mainApp.style.display = 'block';
        }
        
        console.log('Aplikace aktivována');
    }, 3000);
    
    // Základní navigace mezi sekcemi
    const navButtons = document.querySelectorAll('.nav-btn');
    const sections = document.querySelectorAll('.section');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const targetSection = this.dataset.section;
            
            // Skrytí všech sekcí
            sections.forEach(section => {
                section.classList.remove('active');
            });
            
            // Zobrazení cílové sekce
            const target = document.getElementById(targetSection);
            if (target) {
                target.classList.add('active');
            }
            
            // Aktivní stav tlačítka
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    console.log('Navigace inicializována');
});
