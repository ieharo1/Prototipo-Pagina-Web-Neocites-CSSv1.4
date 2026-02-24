class DashboardApp {
    constructor() {
        this.canvas = document.getElementById('trafficCanvas');
        
        this.simulator = new TrafficSimulator(this.canvas);
        
        this.elements = this.cacheElements();
        
        this.savedSettings = this.loadSettings();
        
        this.init();
    }

    cacheElements() {
        return {
            speedRange: document.getElementById('speedRange'),
            speedValue: document.getElementById('speedValue'),
            playPauseBtn: document.getElementById('playPauseBtn'),
            resetBtn: document.getElementById('resetBtn'),
            zoomInBtn: document.getElementById('zoomInBtn'),
            zoomOutBtn: document.getElementById('zoomOutBtn'),
            
            totalVehicles: document.getElementById('totalVehicles'),
            slowVehicles: document.getElementById('slowVehicles'),
            avgSpeed: document.getElementById('avgSpeed'),
            alertCount: document.getElementById('alertCount'),
            
            filterAll: document.getElementById('filterAll'),
            filterCar: document.getElementById('filterCar'),
            filterBus: document.getElementById('filterBus'),
            filterMotorcycle: document.getElementById('filterMotorcycle'),
            filterTruck: document.getElementById('filterTruck'),
            
            streetsList: document.getElementById('streetsList'),
            alertsContainer: document.getElementById('alertsContainer'),
            
            tooltip: document.getElementById('tooltip'),
            tooltipDensity: document.getElementById('tooltipDensity'),
            tooltipSpeed: document.getElementById('tooltipSpeed'),
            tooltipVehicles: document.getElementById('tooltipVehicles'),
            
            filterButtons: document.querySelectorAll('.filter-btn')
        };
    }

    init() {
        this.resizeCanvas();
        this.bindEvents();
        this.applySettings();
        
        this.simulator.start();
        
        this.startUpdateLoop();
        
        window.addEventListener('resize', Utils.debounce(() => this.resizeCanvas(), 200));
    }

    resizeCanvas() {
        this.simulator.getMapManager().resize();
    }

    bindEvents() {
        this.elements.speedRange.addEventListener('input', (e) => {
            const speed = parseFloat(e.target.value);
            this.elements.speedValue.textContent = `${speed}x`;
            this.simulator.getTrafficManager().setSimulationSpeed(speed);
            this.saveSettings({ speed });
        });

        this.elements.playPauseBtn.addEventListener('click', () => {
            const isRunning = this.simulator.getTrafficManager().togglePlayPause();
            this.updatePlayPauseButton(isRunning);
        });

        this.elements.resetBtn.addEventListener('click', () => {
            this.simulator.getTrafficManager().reset();
            this.simulator.getMapManager().resetView();
        });

        this.elements.zoomInBtn.addEventListener('click', () => {
            this.simulator.getMapManager().zoomIn();
        });

        this.elements.zoomOutBtn.addEventListener('click', () => {
            this.simulator.getMapManager().zoomOut();
        });

        this.elements.filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.currentTarget.dataset.filter;
                this.setActiveFilter(filter);
                this.simulator.getTrafficManager().setFilter(filter);
            });
        });

        this.canvas.addEventListener('mousemove', Utils.throttle((e) => {
            this.handleTooltip(e);
        }, 50));

        this.canvas.addEventListener('mouseleave', () => {
            this.hideTooltip();
        });
    }

    applySettings() {
        if (this.savedSettings.speed) {
            this.elements.speedRange.value = this.savedSettings.speed;
            this.elements.speedValue.textContent = `${this.savedSettings.speed}x`;
            this.simulator.getTrafficManager().setSimulationSpeed(this.savedSettings.speed);
        }
    }

    loadSettings() {
        return Utils.loadFromLocalStorage('trafficSimulatorSettings', {});
    }

    saveSettings(settings) {
        const current = this.loadSettings();
        Utils.saveToLocalStorage('trafficSimulatorSettings', { ...current, ...settings });
    }

    updatePlayPauseButton(isRunning) {
        const icon = this.elements.playPauseBtn.querySelector('.btn-icon');
        const text = this.elements.playPauseBtn.querySelector('.btn-text');
        
        if (isRunning) {
            icon.textContent = '⏸️';
            text.textContent = 'Pausar';
        } else {
            icon.textContent = '▶️';
            text.textContent = 'Iniciar';
        }
    }

    setActiveFilter(filter) {
        this.elements.filterButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.filter === filter);
        });
    }

    handleTooltip(e) {
        const mapManager = this.simulator.getMapManager();
        
        if (mapManager.hoveredRoad) {
            this.showTooltip(e, mapManager.hoveredRoad);
        } else {
            this.hideTooltip();
        }
    }

    showTooltip(e, road) {
        const tooltip = this.elements.tooltip;
        
        const density = Utils.getTrafficColor(road.density);
        const status = Utils.getTrafficStatus(road.density);
        
        this.elements.tooltipDensity.innerHTML = `<span style="color: ${density}">${status}</span>`;
        this.elements.tooltipSpeed.textContent = Utils.formatSpeed(road.avgSpeed);
        this.elements.tooltipVehicles.textContent = `${road.vehicleCount} / ${road.capacity}`;
        
        const rect = this.canvas.getBoundingClientRect();
        let x = e.clientX - rect.left + 15;
        let y = e.clientY - rect.top + 15;
        
        if (x + 220 > rect.width) {
            x = e.clientX - rect.left - 220;
        }
        if (y + 150 > rect.height) {
            y = e.clientY - rect.top - 150;
        }
        
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y}px`;
        tooltip.classList.add('visible');
    }

    hideTooltip() {
        this.elements.tooltip.classList.remove('visible');
    }

    startUpdateLoop() {
        setInterval(() => {
            this.updateStats();
            this.updateStreetsList();
            this.updateAlerts();
            this.updateFilterCounts();
        }, 500);
    }

    updateStats() {
        const stats = this.simulator.getTrafficManager().getStats();
        
        this.elements.totalVehicles.textContent = Utils.formatNumber(stats.totalVehicles);
        this.elements.slowVehicles.textContent = Utils.formatNumber(stats.slowVehicles);
        this.elements.avgSpeed.textContent = Utils.formatSpeed(stats.avgSpeed);
        this.elements.alertCount.textContent = stats.alertCount;
    }

    updateStreetsList() {
        const streets = this.simulator.getTrafficManager().getCongestedStreets();
        
        if (streets.length === 0) {
            this.elements.streetsList.innerHTML = '<div class="no-data">Sin datos de congestión</div>';
            return;
        }
        
        this.elements.streetsList.innerHTML = streets.map(street => {
            const densityClass = street.density >= 0.7 ? 'high' : 
                                street.density >= 0.4 ? 'medium' : 'low';
            const statusClass = street.density >= 0.7 ? 'congestioned' :
                               street.density >= 0.4 ? 'moderate' : 'free';
            
            return `
                <div class="street-item ${statusClass}">
                    <span class="street-name">${street.name}</span>
                    <div class="street-stats">
                        <span class="street-density ${densityClass}">
                            ${Utils.formatPercentage(street.density)}
                        </span>
                        <span class="street-vehicles">
                            ${street.vehicleCount} vehículos
                        </span>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateAlerts() {
        const alerts = this.simulator.getTrafficManager().getAlerts();
        
        if (alerts.length === 0) {
            this.elements.alertsContainer.innerHTML = '<div class="no-data">Sin alertas activas</div>';
            return;
        }
        
        this.elements.alertsContainer.innerHTML = alerts.slice(0, 5).map(alert => `
            <div class="alert-item ${alert.type}">
                <span class="alert-icon">${alert.type === 'danger' ? '🚨' : '⚠️'}</span>
                <div class="alert-content">
                    <div class="alert-title">${alert.title}</div>
                    <div class="alert-message">${alert.message}</div>
                    <div class="alert-time">${Utils.getCurrentTime()}</div>
                </div>
            </div>
        `).join('');
    }

    updateFilterCounts() {
        const counts = this.simulator.getTrafficManager().getVehicleCounts();
        
        this.elements.filterAll.textContent = counts.all;
        this.elements.filterCar.textContent = counts.car;
        this.elements.filterBus.textContent = counts.bus;
        this.elements.filterMotorcycle.textContent = counts.motorcycle;
        this.elements.filterTruck.textContent = counts.truck;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.app = new DashboardApp();
});
