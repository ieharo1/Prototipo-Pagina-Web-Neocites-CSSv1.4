class WazeTraffic {
    constructor(wazeMap) {
        this.map = wazeMap;
        
        this.alerts = [];
        this.reports = [];
        
        this.trafficLevel = 'light';
        this.heavyRoads = new Set();
        
        this.QuitoRoads = this.map.streets;
        
        this.lastRender = 0;
        this.renderInterval = 100;
        
        this.init();
    }

    init() {
        this.generateInitialAlerts();
        this.generateInitialReports();
        this.spawnVehicles();
        this.startTrafficSimulation();
    }

    generateInitialAlerts() {
        const alertTypes = [
            { type: 'accident', icon: '💥', title: 'Accidente', severity: 'danger' },
            { type: 'police', icon: '🚔', title: 'Control policial', severity: 'warning' },
            { type: 'hazard', icon: '⚠️', title: 'Peligro en la vía', severity: 'warning' },
            { type: 'roadwork', icon: '🚧', title: 'Obras en la vía', severity: 'warning' },
            { type: 'closure', icon: '🚫', title: 'Vía cerrada', severity: 'danger' },
        ];

        for (let i = 0; i < 5; i++) {
            const road = this.QuitoRoads[Math.floor(Math.random() * this.QuitoRoads.length)];
            const t = Math.random();
            
            const alert = {
                id: Utils.generateId(),
                type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
                x: road.x1 + (road.x2 - road.x1) * t,
                y: road.y1 + (road.y2 - road.y1) * t,
                road: road.name,
                time: Date.now() - Math.random() * 3600000,
            };
            
            this.alerts.push(alert);
        }
    }

    generateInitialReports() {
        const reportTypes = [
            { type: 'speed_cam', icon: '📸', title: 'Cámara', distance: '200m' },
            { type: 'speed_trap', icon: '🚦', title: 'Radar', distance: '500m' },
            { type: 'accident', icon: '💥', title: 'Accidente', distance: '800m' },
            { type: 'police', icon: '🚔', title: 'Policía', distance: '300m' },
            { type: 'hazard', icon: '⚠️', title: 'Obstáculo', distance: '150m' },
        ];

        for (let i = 0; i < 6; i++) {
            const road = this.QuitoRoads[Math.floor(Math.random() * this.QuitoRoads.length)];
            const t = Math.random();
            
            const report = {
                id: Utils.generateId(),
                ...reportTypes[Math.floor(Math.random() * reportTypes.length)],
                x: road.x1 + (road.x2 - road.x1) * t,
                y: road.y1 + (road.y2 - road.y1) * t,
            };
            
            this.reports.push(report);
        }
    }

    spawnVehicles() {
        const vehicleTypes = ['car', 'car', 'car', 'bus', 'motorcycle', 'motorcycle', 'truck'];
        
        for (let i = 0; i < 20; i++) {
            const road = this.QuitoRoads[Math.floor(Math.random() * this.QuitoRoads.length)];
            const t = Math.random();
            
            const x = road.x1 + (road.x2 - road.x1) * t;
            const y = road.y1 + (road.y2 - road.y1) * t;
            
            const type = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
            const speed = Math.random() * 60 + 20;
            
            this.map.addVehicle(x, y, type, speed);
        }
    }

    startTrafficSimulation() {
        setInterval(() => {
            this.updateTraffic();
        }, 5000);

        setInterval(() => {
            if (Math.random() > 0.7) this.addRandomAlert();
        }, 15000);

        setInterval(() => {
            this.updateVehicles();
        }, 500);
    }

    updateTraffic() {
        const random = Math.random();
        
        if (random < 0.2) {
            this.trafficLevel = 'heavy';
            document.querySelector('.traffic-dot')?.classList.add('heavy');
        } else if (random < 0.5) {
            this.trafficLevel = 'moderate';
            document.querySelector('.traffic-dot')?.classList.add('moderate');
        } else {
            this.trafficLevel = 'light';
            const dot = document.querySelector('.traffic-dot');
            if (dot) dot.className = 'traffic-dot';
        }
        
        const numHeavyRoads = Math.floor(Math.random() * 4);
        this.heavyRoads.clear();
        
        for (let i = 0; i < numHeavyRoads; i++) {
            const roadIndex = Math.floor(Math.random() * this.QuitoRoads.length);
            this.heavyRoads.add(this.QuitoRoads[roadIndex].name);
        }
    }

    updateVehicles() {
        this.map.vehicles.forEach(vehicle => {
            const road = this.QuitoRoads.find(r => {
                const dist = this.getDistanceFromRoad(vehicle.x, vehicle.y, r);
                return dist < 30;
            });
            
            const speed = this.trafficLevel === 'heavy' ? 2 : 5;
            
            if (road) {
                if (this.heavyRoads.has(road.name)) {
                    vehicle.x += (Math.random() - 0.5) * speed * 0.3;
                    vehicle.y += (Math.random() - 0.5) * speed * 0.3;
                    vehicle.element?.classList.add('slow');
                } else {
                    const dirX = road.x2 - road.x1;
                    const dirY = road.y2 - road.y1;
                    const len = Math.sqrt(dirX*dirX + dirY*dirY);
                    
                    vehicle.x += (dirX / len) * speed * 0.5;
                    vehicle.y += (dirY / len) * speed * 0.5;
                    
                    if (vehicle.x < 50 || vehicle.x > 750 || vehicle.y < 80 || vehicle.y > 520) {
                        vehicle.x = 100 + Math.random() * 600;
                        vehicle.y = 150 + Math.random() * 300;
                    }
                }
            }
            
            this.map.updateMarkerPosition(vehicle);
        });
    }

    getDistanceFromRoad(x, y, road) {
        const t = Math.max(0, Math.min(1,
            ((x - road.x1) * (road.x2 - road.x1) + (y - road.y1) * (road.y2 - road.y1)) /
            ((road.x2 - road.x1) ** 2 + (road.y2 - road.y1) ** 2 || 1)
        ));
        
        const nearestX = road.x1 + t * (road.x2 - road.x1);
        const nearestY = road.y1 + t * (road.y2 - road.y1);
        
        return Math.sqrt((x - nearestX) ** 2 + (y - nearestY) ** 2);
    }

    addRandomAlert() {
        if (this.alerts.length >= 8) this.alerts.shift();
        
        const alertTypes = [
            { type: 'accident', icon: '💥', title: 'Accidente', severity: 'danger' },
            { type: 'police', icon: '🚔', title: 'Control policial', severity: 'warning' },
        ];
        
        const road = this.QuitoRoads[Math.floor(Math.random() * this.QuitoRoads.length)];
        
        const alert = {
            id: Utils.generateId(),
            type: alertTypes[Math.floor(Math.random() * alertTypes.length)],
            x: road.x1 + Math.random() * (road.x2 - road.x1),
            y: road.y1 + Math.random() * (road.y2 - road.y1),
            road: road.name,
            time: Date.now(),
        };
        
        this.alerts.push(alert);
        this.renderAlerts();
    }

    renderAlerts() {
        const container = document.getElementById('alertsList');
        if (!container) return;
        
        container.innerHTML = this.alerts.slice(0, 4).map(alert => `
            <div class="alert-item ${alert.type.severity}">
                <span class="alert-icon">${alert.type.icon}</span>
                <div class="alert-content">
                    <div class="alert-title">${alert.type.title}</div>
                    <div class="alert-location">${alert.road}</div>
                    <div class="alert-time">${this.formatTime(alert.time)}</div>
                </div>
            </div>
        `).join('');
    }

    renderReports() {
        const container = document.getElementById('reportsContainer');
        if (!container) return;
        
        container.innerHTML = this.reports.slice(0, 5).map(report => `
            <div class="report-item">
                <div class="report-icon">${report.icon}</div>
                <div class="report-info">
                    <div class="report-type">${report.title}</div>
                    <div class="report-distance">${report.distance}</div>
                </div>
            </div>
        `).join('');
    }

    formatTime(timestamp) {
        const diff = Date.now() - timestamp;
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Ahora';
        if (mins < 60) return `Hace ${mins} min`;
        return `Hace ${Math.floor(mins / 60)}h`;
    }

    getAlerts() { return this.alerts; }
    getReports() { return this.reports; }
    getTrafficLevel() { return this.trafficLevel; }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WazeTraffic;
}
