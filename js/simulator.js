class TrafficManager {
    constructor(mapManager) {
        this.mapManager = mapManager;
        
        this.vehicles = [];
        
        this.maxVehicles = 50;
        this.spawnInterval = 2000;
        this.lastSpawnTime = 0;
        
        this.isRunning = true;
        this.simulationSpeed = 1;
        
        this.filter = 'all';
        
        this.alerts = [];
        this.maxAlerts = 10;
        
        this.stats = {
            totalVehicles: 0,
            slowVehicles: 0,
            avgSpeed: 0,
            alertCount: 0
        };
        
        this.congestionThreshold = 0.7;
        this.warningThreshold = 0.4;
        
        this.lastTime = Date.now();
    }

    start() {
        this.isRunning = true;
    }

    pause() {
        this.isRunning = false;
    }

    togglePlayPause() {
        if (this.isRunning) {
            this.pause();
        } else {
            this.start();
        }
        return this.isRunning;
    }

    setSimulationSpeed(speed) {
        this.simulationSpeed = speed;
    }

    setFilter(filter) {
        this.filter = filter;
    }

    addVehicle(vehicle) {
        if (this.vehicles.length < this.maxVehicles) {
            this.vehicles.push(vehicle);
            return true;
        }
        return false;
    }

    removeVehicle(vehicleId) {
        const index = this.vehicles.findIndex(v => v.id === vehicleId);
        if (index !== -1) {
            this.vehicles.splice(index, 1);
            return true;
        }
        return false;
    }

    spawnVehicle() {
        const roads = this.mapManager.getRoads();
        
        if (roads.length === 0) return;
        
        const vehicle = VehicleFactory.createRandomVehicle(roads);
        
        if (this.addVehicle(vehicle)) {
            this.assignVehicleToRoad(vehicle, roads);
        }
    }

    assignVehicleToRoad(vehicle, roads) {
        const nearbyRoads = roads.filter(road => {
            const distance = Utils.getDistanceFromLine(
                vehicle.x, vehicle.y,
                road.x1, road.y1,
                road.x2, road.y2
            );
            return distance < 50;
        });
        
        if (nearbyRoads.length > 0) {
            const road = Utils.randomChoice(nearbyRoads);
            vehicle.roadId = road.id;
            
            const route = this.generateRouteFromRoad(road, roads);
            vehicle.setRoute(route);
        }
    }

    generateRouteFromRoad(startRoad, allRoads) {
        const route = [];
        let currentRoad = startRoad;
        
        const point1 = {
            x: currentRoad.x1 + (currentRoad.x2 - currentRoad.x1) * Math.random(),
            y: currentRoad.y1 + (currentRoad.y2 - currentRoad.y1) * Math.random()
        };
        route.push(point1);
        
        for (let i = 0; i < 4; i++) {
            const connectedRoads = allRoads.filter(r => {
                if (r.id === currentRoad.id) return false;
                
                const end1 = Utils.distance(r.x1, r.y1, currentRoad.x2, currentRoad.y2) < 40;
                const end2 = Utils.distance(r.x2, r.y2, currentRoad.x2, currentRoad.y2) < 40;
                return end1 || end2;
            });
            
            if (connectedRoads.length === 0) break;
            
            currentRoad = Utils.randomChoice(connectedRoads);
            
            const connectPoint = { x: currentRoad.x1, y: currentRoad.y1 };
            route.push(connectPoint);
            
            const exitPoint = {
                x: currentRoad.x1 + (currentRoad.x2 - currentRoad.x1) * Math.random(),
                y: currentRoad.y1 + (currentRoad.y2 - currentRoad.y1) * Math.random()
            };
            route.push(exitPoint);
        }
        
        return route;
    }

    update(deltaTime) {
        if (!this.isRunning) return;
        
        const adjustedDelta = deltaTime * this.simulationSpeed;
        
        this.updateVehicles(adjustedDelta);
        
        this.updateRoadData();
        
        this.updateStats();
        
        this.checkForAlerts();
        
        this.cleanupVehicles();
    }

    updateVehicles(deltaTime) {
        const roads = this.mapManager.getRoads();
        
        this.vehicles.forEach(vehicle => {
            const roadVehicles = this.vehicles.filter(v => 
                v.id !== vehicle.id && v.roadId === vehicle.roadId
            );
            
            const road = roads.find(r => r.id === vehicle.roadId);
            const trafficDensity = road ? road.density : 0;
            
            vehicle.update(deltaTime, trafficDensity, roadVehicles);
        });
    }

    updateRoadData() {
        const roads = this.mapManager.getRoads();
        
        roads.forEach(road => {
            const roadVehicles = this.vehicles.filter(v => v.roadId === road.id);
            
            const vehicleCount = roadVehicles.length;
            const avgSpeed = Utils.calculateAverageSpeed(roadVehicles);
            
            this.mapManager.updateRoadData(road.id, {
                vehicleCount,
                avgSpeed: avgSpeed || road.avgSpeed,
                density: vehicleCount / road.capacity
            });
        });
    }

    updateStats() {
        const filteredVehicles = this.getFilteredVehicles();
        
        this.stats.totalVehicles = filteredVehicles.length;
        
        this.stats.slowVehicles = filteredVehicles.filter(v => 
            v.currentSpeed / v.maxSpeed < 0.4
        ).length;
        
        this.stats.avgSpeed = Utils.calculateAverageSpeed(filteredVehicles);
        
        this.stats.alertCount = this.alerts.length;
    }

    getFilteredVehicles() {
        if (this.filter === 'all') {
            return this.vehicles;
        }
        return this.vehicles.filter(v => v.type === this.filter);
    }

    checkForAlerts() {
        const roads = this.mapManager.getRoads();
        
        roads.forEach(road => {
            if (road.density >= this.congestionThreshold) {
                this.addAlert({
                    type: 'danger',
                    title: 'Congestionamiento Alto',
                    message: `${road.name} tiene tráfico congestionado`,
                    roadId: road.id
                });
            } else if (road.density >= this.warningThreshold) {
                this.addAlert({
                    type: 'warning',
                    title: 'Tráfico Moderado',
                    message: `${road.name} presenta tráfico moderado`,
                    roadId: road.id
                });
            }
        });
    }

    addAlert(alert) {
        const existingAlert = this.alerts.find(a => 
            a.roadId === alert.roadId && 
            a.type === alert.type
        );
        
        if (existingAlert) return;
        
        const newAlert = {
            id: Utils.generateId(),
            ...alert,
            timestamp: Date.now()
        };
        
        this.alerts.unshift(newAlert);
        
        if (this.alerts.length > this.maxAlerts) {
            this.alerts = this.alerts.slice(0, this.maxAlerts);
        }
    }

    clearOldAlerts() {
        const maxAge = 30000;
        const now = Date.now();
        
        this.alerts = this.alerts.filter(alert => 
            now - alert.timestamp < maxAge
        );
    }

    cleanupVehicles() {
        const canvasWidth = this.mapManager.canvas.width;
        const canvasHeight = this.mapManager.canvas.height;
        
        const margin = 100;
        
        this.vehicles = this.vehicles.filter(vehicle => {
            const screenX = vehicle.x * this.mapManager.zoom + this.mapManager.offsetX;
            const screenY = vehicle.y * this.mapManager.zoom + this.mapManager.offsetY;
            
            return !(screenX < -margin || screenX > canvasWidth + margin ||
                     screenY < -margin || screenY > canvasHeight + margin);
        });
    }

    render(ctx) {
        const filteredVehicles = this.getFilteredVehicles();
        
        filteredVehicles.forEach(vehicle => {
            vehicle.render(ctx);
        });
    }

    getCongestedStreets() {
        const roads = this.mapManager.getRoads();
        
        return roads
            .filter(road => road.density >= 0.3)
            .sort((a, b) => b.density - a.density)
            .slice(0, 10);
    }

    getVehicleCounts() {
        return {
            all: this.vehicles.length,
            car: this.vehicles.filter(v => v.type === VehicleType.CAR).length,
            bus: this.vehicles.filter(v => v.type === VehicleType.BUS).length,
            motorcycle: this.vehicles.filter(v => v.type === VehicleType.MOTORCYCLE).length,
            truck: this.vehicles.filter(v => v.type === VehicleType.TRUCK).length
        };
    }

    reset() {
        this.vehicles = [];
        this.alerts = [];
        this.stats = {
            totalVehicles: 0,
            slowVehicles: 0,
            avgSpeed: 0,
            alertCount: 0
        };
    }

    getStats() {
        return { ...this.stats };
    }

    getAlerts() {
        return [...this.alerts];
    }
}

class TrafficSimulator {
    constructor(canvas) {
        this.mapManager = new MapManager(canvas);
        this.trafficManager = new TrafficManager(this.mapManager);
        
        this.lastTime = Date.now();
        this.animationId = null;
    }

    start() {
        this.loop();
    }

    stop() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    loop() {
        const now = Date.now();
        const deltaTime = (now - this.lastTime) / 1000;
        this.lastTime = now;
        
        this.update(deltaTime);
        this.render();
        
        this.animationId = requestAnimationFrame(() => this.loop());
    }

    update(deltaTime) {
        const now = Date.now();
        if (!this.lastSpawnTime || now - this.lastSpawnTime > this.spawnInterval) {
            this.trafficManager.spawnVehicle();
            this.lastSpawnTime = now;
        }
        
        this.trafficManager.update(deltaTime);
    }

    render() {
        this.mapManager.render();
        
        const ctx = this.mapManager.ctx;
        this.trafficManager.render(ctx);
    }

    getMapManager() {
        return this.mapManager;
    }

    getTrafficManager() {
        return this.trafficManager;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TrafficManager, TrafficSimulator };
}
