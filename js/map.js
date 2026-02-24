class MapManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        
        this.zoom = 1;
        this.minZoom = 0.5;
        this.maxZoom = 3;
        this.zoomSpeed = 0.1;
        
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.isDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;
        
        this.roads = [];
        this.buildings = [];
        this.landmarks = [];
        
        this.hoveredRoad = null;
        
        this.initEventListeners();
        this.generateQuitoMap();
    }

    initEventListeners() {
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('mouseleave', this.onMouseLeave.bind(this));
        
        this.canvas.addEventListener('wheel', this.onWheel.bind(this));
        
        this.canvas.addEventListener('touchstart', this.onTouchStart.bind(this));
        this.canvas.addEventListener('touchmove', this.onTouchMove.bind(this));
        this.canvas.addEventListener('touchend', this.onTouchEnd.bind(this));
    }

    onMouseDown(e) {
        this.isDragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
        this.canvas.style.cursor = 'grabbing';
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        if (this.isDragging) {
            const dx = e.clientX - this.lastMouseX;
            const dy = e.clientY - this.lastMouseY;
            
            this.offsetX += dx;
            this.offsetY += dy;
            
            this.lastMouseX = e.clientX;
            this.lastMouseY = e.clientY;
        } else {
            this.checkRoadHover(mouseX, mouseY);
        }
    }

    onMouseUp() {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
    }

    onMouseLeave() {
        this.isDragging = false;
        this.hoveredRoad = null;
        this.canvas.style.cursor = 'grab';
    }

    onWheel(e) {
        e.preventDefault();
        
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        const worldX = (mouseX - this.offsetX) / this.zoom;
        const worldY = (mouseY - this.offsetY) / this.zoom;
        
        const delta = e.deltaY > 0 ? -this.zoomSpeed : this.zoomSpeed;
        const newZoom = Utils.clamp(this.zoom + delta, this.minZoom, this.maxZoom);
        
        const zoomRatio = newZoom / this.zoom;
        
        this.offsetX = mouseX - worldX * newZoom;
        this.offsetY = mouseY - worldY * newZoom;
        
        this.zoom = newZoom;
    }

    onTouchStart(e) {
        if (e.touches.length === 1) {
            this.isDragging = true;
            this.lastMouseX = e.touches[0].clientX;
            this.lastMouseY = e.touches[0].clientY;
        }
    }

    onTouchMove(e) {
        e.preventDefault();
        
        if (e.touches.length === 1 && this.isDragging) {
            const dx = e.touches[0].clientX - this.lastMouseX;
            const dy = e.touches[0].clientY - this.lastMouseY;
            
            this.offsetX += dx;
            this.offsetY += dy;
            
            this.lastMouseX = e.touches[0].clientX;
            this.lastMouseY = e.touches[0].clientY;
        }
    }

    onTouchEnd() {
        this.isDragging = false;
    }

    zoomIn() {
        this.setZoom(this.zoom + this.zoomSpeed);
    }

    zoomOut() {
        this.setZoom(this.zoom - this.zoomSpeed);
    }

    setZoom(value) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        const worldX = (centerX - this.offsetX) / this.zoom;
        const worldY = (centerY - this.offsetY) / this.zoom;
        
        this.zoom = Utils.clamp(value, this.minZoom, this.maxZoom);
        
        this.offsetX = centerX - worldX * this.zoom;
        this.offsetY = centerY - worldY * this.zoom;
    }

    resetView() {
        this.zoom = 1;
        this.offsetX = 0;
        this.offsetY = 0;
    }

    centerOn(x, y) {
        this.offsetX = this.canvas.width / 2 - x * this.zoom;
        this.offsetY = this.canvas.height / 2 - y * this.zoom;
    }

    checkRoadHover(mouseX, mouseY) {
        const worldX = (mouseX - this.offsetX) / this.zoom;
        const worldY = (mouseY - this.offsetY) / this.zoom;
        
        this.hoveredRoad = null;
        
        for (const road of this.roads) {
            const distance = Utils.getDistanceFromLine(
                worldX, worldY,
                road.x1, road.y1,
                road.x2, road.y2
            );
            
            if (distance < 15 / this.zoom) {
                this.hoveredRoad = road;
                break;
            }
        }
    }

    generateQuitoMap() {
        const centerX = 400;
        const centerY = 300;
        
        this.roads = [
            { id: 'avenida-amazonas', name: 'Av. Amazonas', x1: 50, y1: 150, x2: 750, y2: 150, capacity: 20, vehicleCount: 0, avgSpeed: 50 },
            { id: 'avenida-republica', name: 'Av. República', x1: 50, y1: 250, x2: 750, y2: 250, capacity: 18, vehicleCount: 0, avgSpeed: 45 },
            { id: 'avenida-10-agosto', name: 'Av. 10 de Agosto', x1: 50, y1: 350, x2: 750, y2: 350, capacity: 22, vehicleCount: 0, avgSpeed: 55 },
            { id: 'avenida-patria', name: 'Av. Patria', x1: 50, y1: 450, x2: 750, y2: 450, capacity: 20, vehicleCount: 0, avgSpeed: 48 },
            { id: 'calle-garcia-moreno', name: 'Calle García Moreno', x1: 150, y1: 50, x2: 150, y2: 550, capacity: 15, vehicleCount: 0, avgSpeed: 35 },
            { id: 'calle-flores', name: 'Calle Flores', x1: 250, y1: 50, x2: 250, y2: 550, capacity: 12, vehicleCount: 0, avgSpeed: 30 },
            { id: 'calle-manuel-larrea', name: 'Calle Manuel Larrea', x1: 350, y1: 50, x2: 350, y2: 550, capacity: 14, vehicleCount: 0, avgSpeed: 32 },
            { id: 'calle-veintimilla', name: 'Calle Veintimilla', x1: 450, y1: 50, x2: 450, y2: 550, capacity: 14, vehicleCount: 0, avgSpeed: 33 },
            { id: 'calle-perez-guerrero', name: 'Calle Pérez Guerrero', x1: 550, y1: 50, x2: 550, y2: 550, capacity: 13, vehicleCount: 0, avgSpeed: 31 },
            { id: 'calle-ju Montufar', name: 'Calle Juan Montalvo', x1: 650, y1: 50, x2: 650, y2: 550, capacity: 12, vehicleCount: 0, avgSpeed: 30 },
            
            { id: 'autopista-norte', name: 'Autopista Norte', x1: 100, y1: 100, x2: 700, y2: 100, capacity: 25, vehicleCount: 0, avgSpeed: 70 },
            { id: 'autopista-sur', name: 'Autopista Sur', x1: 100, y1: 500, x2: 700, y2: 500, capacity: 25, vehicleCount: 0, avgSpeed: 70 },
            
            { id: 'avenida-eugenio-escobar', name: 'Av. Eugenio Escobar', x1: 200, y1: 180, x2: 600, y2: 320, capacity: 16, vehicleCount: 0, avgSpeed: 40 },
            { id: 'avenida-naciones-unidas', name: 'Av. Naciones Unidas', x1: 100, y1: 200, x2: 700, y2: 200, capacity: 18, vehicleCount: 0, avgSpeed: 45 },
            { id: 'avenida-6-diciembre', name: 'Av. 6 de Diciembre', x1: 180, y1: 280, x2: 620, y2: 420, capacity: 17, vehicleCount: 0, avgSpeed: 42 },
            
            { id: 'calle-bolivia', name: 'Calle Bolivia', x1: 80, y1: 300, x2: 180, y2: 400, capacity: 10, vehicleCount: 0, avgSpeed: 28 },
            { id: 'calle-colombia', name: 'Calle Colombia', x1: 620, y1: 300, x2: 720, y2: 400, capacity: 10, vehicleCount: 0, avgSpeed: 28 },
        ];
        
        this.roads.forEach(road => {
            road.angle = Math.atan2(road.y2 - road.y1, road.x2 - road.x1);
            road.baseColor = '#475569';
            road.density = 0;
        });

        this.landmarks = [
            { x: 150, y: 150, name: 'Parque La Carolina', type: 'park', size: 60 },
            { x: 350, y: 250, name: 'Plaza Grande', type: 'plaza', size: 40 },
            { x: 450, y: 350, name: 'CC El Ejido', type: 'mall', size: 35 },
            { x: 550, y: 150, name: 'Estadio Atahualpa', type: 'stadium', size: 45 },
            { x: 250, y: 450, name: 'Universidad Central', type: 'university', size: 50 },
            { x: 650, y: 450, name: 'Terminal Quitumbe', type: 'terminal', size: 40 },
            { x: 100, y: 300, name: 'Terminal Carrión', type: 'terminal', size: 35 },
        ];
    }

    updateRoadData(roadId, data) {
        const road = this.roads.find(r => r.id === roadId);
        if (road) {
            Object.assign(road, data);
            road.density = road.capacity > 0 ? road.vehicleCount / road.capacity : 0;
        }
    }

    getRoads() {
        return this.roads;
    }

    getRoadAtPosition(x, y) {
        for (const road of this.roads) {
            const distance = Utils.getDistanceFromLine(x, y, road.x1, road.y1, road.x2, road.y2);
            if (distance < 20) {
                return road;
            }
        }
        return null;
    }

    resize() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth;
        this.canvas.height = container.clientHeight;
    }

    clear() {
        this.ctx.fillStyle = '#0a0f1a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    render() {
        this.clear();
        
        this.ctx.save();
        this.ctx.translate(this.offsetX, this.offsetY);
        this.ctx.scale(this.zoom, this.zoom);
        
        this.drawGrid();
        this.drawBuildings();
        this.drawRoads();
        this.drawLandmarks();
        
        this.ctx.restore();
    }

    drawGrid() {
        this.ctx.strokeStyle = 'rgba(71, 85, 105, 0.15)';
        this.ctx.lineWidth = 1 / this.zoom;
        
        const gridSize = 50;
        const startX = -500;
        const endX = 1300;
        const startY = -200;
        const endY = 800;
        
        for (let x = startX; x <= endX; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY);
            this.ctx.lineTo(x, endY);
            this.ctx.stroke();
        }
        
        for (let y = startY; y <= endY; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(startX, y);
            this.ctx.lineTo(endX, y);
            this.ctx.stroke();
        }
    }

    drawBuildings() {
        const buildingZones = [
            { x: 80, y: 80, w: 60, h: 50 },
            { x: 200, y: 60, w: 40, h: 70 },
            { x: 300, y: 80, w: 50, h: 40 },
            { x: 500, y: 60, w: 70, h: 60 },
            { x: 620, y: 80, w: 50, h: 45 },
            
            { x: 80, y: 380, w: 55, h: 50 },
            { x: 200, y: 400, w: 45, h: 60 },
            { x: 350, y: 380, w: 60, h: 55 },
            { x: 500, y: 420, w: 50, h: 45 },
            { x: 620, y: 380, w: 55, h: 60 },
            
            { x: 80, y: 200, w: 40, h: 35 },
            { x: 160, y: 200, w: 35, h: 40 },
            { x: 500, y: 220, w: 45, h: 35 },
            { x: 580, y: 200, w: 40, h: 45 },
        ];

        buildingZones.forEach(zone => {
            this.ctx.fillStyle = '#1e293b';
            this.ctx.strokeStyle = '#334155';
            this.ctx.lineWidth = 1 / this.zoom;
            
            this.ctx.beginPath();
            this.ctx.rect(zone.x, zone.y, zone.w, zone.h);
            this.ctx.fill();
            this.ctx.stroke();
            
            this.ctx.fillStyle = '#334155';
            const windowRows = Math.floor(zone.h / 12);
            const windowCols = Math.floor(zone.w / 10);
            
            for (let row = 0; row < windowRows; row++) {
                for (let col = 0; col < windowCols; col++) {
                    if (Math.random() > 0.3) {
                        const wx = zone.x + 5 + col * 10;
                        const wy = zone.y + 5 + row * 12;
                        this.ctx.fillRect(wx, wy, 5, 7);
                    }
                }
            }
        });
    }

    drawRoads() {
        this.roads.forEach(road => {
            const isHovered = this.hoveredRoad && this.hoveredRoad.id === road.id;
            
            const baseWidth = 8;
            const width = isHovered ? baseWidth + 4 : baseWidth;
            
            this.ctx.strokeStyle = isHovered ? '#64748b' : road.baseColor;
            this.ctx.lineWidth = width;
            this.ctx.lineCap = 'round';
            
            this.ctx.beginPath();
            this.ctx.moveTo(road.x1, road.y1);
            this.ctx.lineTo(road.x2, road.y2);
            this.ctx.stroke();
            
            const color = Utils.getTrafficColor(road.density, 0.6);
            this.ctx.strokeStyle = color;
            this.ctx.lineWidth = width * 0.6;
            
            this.ctx.beginPath();
            this.ctx.moveTo(road.x1, road.y1);
            this.ctx.lineTo(road.x2, road.y2);
            this.ctx.stroke();
            
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            this.ctx.lineWidth = 1 / this.zoom;
            this.ctx.setLineDash([10 / this.zoom, 15 / this.zoom]);
            
            this.ctx.beginPath();
            this.ctx.moveTo(road.x1, road.y1);
            this.ctx.lineTo(road.x2, road.y2);
            this.ctx.stroke();
            
            this.ctx.setLineDash([]);
            
            if (isHovered) {
                this.ctx.strokeStyle = '#ffffff';
                this.ctx.lineWidth = 2 / this.zoom;
                
                this.ctx.beginPath();
                this.ctx.moveTo(road.x1, road.y1);
                this.ctx.lineTo(road.x2, road.y2);
                this.ctx.stroke();
            }
        });
    }

    drawLandmarks() {
        this.landmarks.forEach(landmark => {
            const emoji = this.getLandmarkEmoji(landmark.type);
            
            this.ctx.font = `${landmark.size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            
            this.ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
            this.ctx.shadowBlur = 10;
            this.ctx.fillText(emoji, landmark.x, landmark.y);
            this.ctx.shadowBlur = 0;
            
            this.ctx.font = `${10}px 'Segoe UI'`;
            this.ctx.fillStyle = '#94a3b8';
            this.ctx.fillText(landmark.name, landmark.x, landmark.y + landmark.size / 2 + 12);
        });
    }

    getLandmarkEmoji(type) {
        const emojis = {
            park: '🌳',
            plaza: '⛲',
            mall: '🏬',
            stadium: '🏟️',
            university: '🎓',
            terminal: '🚌'
        };
        return emojis[type] || '📍';
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapManager;
}
