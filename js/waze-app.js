class WazeApp {
    constructor() {
        this.map = new WazeMap('map');
        this.traffic = new WazeTraffic(this.map);
        this.elements = this.cacheElements();
        this.init();
    }

    cacheElements() {
        return {
            searchInput: document.getElementById('searchInput'),
            zoomIn: document.getElementById('zoomIn'),
            zoomOut: document.getElementById('zoomOut'),
            centerLocation: document.getElementById('centerLocation'),
            bottomSheet: document.getElementById('bottomSheet'),
            etaTime: document.getElementById('etaTime'),
            etaDistance: document.getElementById('etaDistance'),
        };
    }

    init() {
        this.bindEvents();
        this.setInitialRoute();
        
        setInterval(() => {
            this.traffic.renderAlerts();
            this.traffic.renderReports();
            this.updateETA();
        }, 2000);
        
        this.map.centerOn(-0.1807, -78.4678);
    }

    bindEvents() {
        this.elements.zoomIn?.addEventListener('click', () => this.map.zoomIn());
        this.elements.zoomOut?.addEventListener('click', () => this.map.zoomOut());
        
        this.elements.centerLocation?.addEventListener('click', () => {
            this.map.centerOn(-0.1807, -78.4678);
        });

        this.elements.bottomSheet?.querySelector('.sheet-handle')?.addEventListener('click', () => {
            this.elements.bottomSheet.classList.toggle('collapsed');
        });

        this.elements.searchInput?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch(this.elements.searchInput.value);
            }
        });

        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
                e.currentTarget.classList.add('active');
            });
        });
    }

    setInitialRoute() {
        const route = [
            { x: 180, y: 180 },
            { x: 250, y: 180 },
            { x: 320, y: 200 },
            { x: 380, y: 240 },
            { x: 420, y: 300 },
            { x: 450, y: 360 },
            { x: 520, y: 380 },
            { x: 600, y: 400 },
        ];
        
        this.map.setRoute(route);
        
        this.map.addMarker(180, 180, 'destination', 'Av. Amazonas');
        this.map.addMarker(600, 400, 'destination', 'Terminal');
    }

    handleSearch(query) {
        if (!query?.trim()) return;
        
        const destinations = {
            'carolina': { x: 200, y: 170, name: 'Parque La Carolina' },
            'plaza': { x: 180, y: 300, name: 'Plaza Grande' },
            'ejido': { x: 350, y: 250, name: 'CC El Ejido' },
            'festival': { x: 280, y: 280, name: 'Parque El Ejido' },
            'casa': { x: 320, y: 350, name: 'Casa de Cultura' },
            'estadio': { x: 250, y: 130, name: 'Estadio Atahualpa' },
            'terminal': { x: 600, y: 400, name: 'Terminal Quitumbe' },
        };
        
        const key = Object.keys(destinations).find(k => 
            query.toLowerCase().includes(k)
        );
        
        if (key) {
            const dest = destinations[key];
            this.map.addMarker(dest.x, dest.y, 'destination', dest.name);
            
            this.map.setRoute([
                { x: 400, y: 300 },
                { x: dest.x, y: dest.y }
            ]);
            
            this.updateETA();
        }
    }

    updateETA() {
        const baseTime = 8 + Math.random() * 10;
        const baseDist = 5 + Math.random() * 8;
        
        if (this.elements.etaTime) this.elements.etaTime.textContent = `${Math.round(baseTime)} min`;
        if (this.elements.etaDistance) this.elements.etaDistance.textContent = `${baseDist.toFixed(1)} km`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new WazeApp();
});
