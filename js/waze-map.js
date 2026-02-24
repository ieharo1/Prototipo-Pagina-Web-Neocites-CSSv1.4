class WazeMap {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        this.zoom = 14;
        this.centerX = -78.4678;
        this.centerY = -0.1807;
        
        this.offsetX = 0;
        this.offsetY = 0;
        
        this.isDragging = false;
        this.lastX = 0;
        this.lastY = 0;
        
        this.routePath = [];
        this.vehicles = [];
        this.markers = [];
        
        this.useRealTiles = true;
        this.tileLoadFailed = false;
        
        this.streets = this.getQuitoStreets();
        
        this.init();
    }

    getQuitoStreets() {
        return [
            { name: 'Av. Amazonas', x1: 100, y1: 180, x2: 700, y2: 180, type: 'main', width: 12 },
            { name: 'Av. República', x1: 100, y1: 240, x2: 700, y2: 240, type: 'main', width: 10 },
            { name: 'Av. 10 de Agosto', x1: 100, y1: 300, x2: 700, y2: 300, type: 'main', width: 12 },
            { name: 'Av. Patria', x1: 100, y1: 360, x2: 700, y2: 360, type: 'main', width: 10 },
            { name: 'Av. Naciones Unidas', x1: 100, y1: 210, x2: 700, y2: 210, type: 'main', width: 8 },
            { name: 'Av. 6 de Diciembre', x1: 150, y1: 330, x2: 650, y2: 270, type: 'secondary', width: 8 },
            { name: 'Calle García Moreno', x1: 180, y1: 100, x2: 180, y2: 500, type: 'main', width: 10 },
            { name: 'Calle Flores', x1: 260, y1: 100, x2: 260, y2: 500, type: 'main', width: 8 },
            { name: 'Calle Manuel Larrea', x1: 340, y1: 100, x2: 340, y2: 500, type: 'secondary', width: 8 },
            { name: 'Calle Veintimilla', x1: 420, y1: 100, x2: 420, y2: 500, type: 'main', width: 8 },
            { name: 'Calle J. Montalvo', x1: 500, y1: 100, x2: 500, y2: 500, type: 'secondary', width: 8 },
            { name: 'Autopista Norte', x1: 80, y1: 130, x2: 720, y2: 130, type: 'highway', width: 14 },
            { name: 'Autopista Sur', x1: 80, y1: 420, x2: 720, y2: 420, type: 'highway', width: 14 },
            { name: 'Calle Bolívar', x1: 120, y1: 280, x2: 200, y2: 380, type: 'secondary', width: 6 },
            { name: 'Calle Colombia', x1: 600, y1: 280, x2: 680, y2: 380, type: 'secondary', width: 6 },
        ];
    }

    init() {
        this.createContainer();
        this.bindEvents();
        this.render();
    }

    createContainer() {
        this.canvas = document.createElement('canvas');
        this.canvas.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;';
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
        
        this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        this.svg.classList.add('route-svg');
        this.svg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:10;';
        this.container.appendChild(this.svg);
        
        this.markerContainer = document.createElement('div');
        this.markerContainer.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:20;';
        this.container.appendChild(this.markerContainer);
        
        this.resize();
    }

    resize() {
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;
        this.render();
    }

    bindEvents() {
        this.container.addEventListener('mousedown', (e) => this.onDragStart(e));
        this.container.addEventListener('mousemove', (e) => this.onDrag(e));
        this.container.addEventListener('mouseup', () => this.onDragEnd());
        this.container.addEventListener('mouseleave', () => this.onDragEnd());
        
        this.container.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.container.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.container.addEventListener('touchend', () => this.onDragEnd());
        
        this.container.addEventListener('wheel', (e) => this.onWheel(e));
        
        window.addEventListener('resize', () => this.resize());
    }

    onDragStart(e) {
        this.isDragging = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
    }

    onDrag(e) {
        if (!this.isDragging) return;
        
        const dx = e.clientX - this.lastX;
        const dy = e.clientY - this.lastY;
        
        this.offsetX += dx;
        this.offsetY += dy;
        
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        
        this.render();
    }

    onDragEnd() {
        this.isDragging = false;
    }

    onTouchStart(e) {
        if (e.touches.length === 1) {
            this.isDragging = true;
            this.lastX = e.touches[0].clientX;
            this.lastY = e.touches[0].clientY;
        }
    }

    onTouchMove(e) {
        e.preventDefault();
        if (!this.isDragging || e.touches.length !== 1) return;
        
        const dx = e.touches[0].clientX - this.lastX;
        const dy = e.touches[0].clientY - this.lastY;
        
        this.offsetX += dx;
        this.offsetY += dy;
        
        this.lastX = e.touches[0].clientX;
        this.lastY = e.touches[0].clientY;
        
        this.render();
    }

    onWheel(e) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.5 : 0.5;
        this.setZoom(this.zoom + delta);
    }

    setZoom(level) {
        const centerX = this.canvas.width / 2 - this.offsetX;
        const centerY = this.canvas.height / 2 - this.offsetY;
        
        const scale = Math.pow(1.5, level - this.zoom);
        
        this.offsetX = this.canvas.width / 2 - centerX * scale;
        this.offsetY = this.canvas.height / 2 - centerY * scale;
        
        this.zoom = Math.max(8, Math.min(16, level));
        
        this.render();
    }

    zoomIn() {
        this.setZoom(this.zoom + 1);
    }

    zoomOut() {
        this.setZoom(this.zoom - 1);
    }

    centerOn(lat, lon) {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        
        this.offsetX = centerX;
        this.offsetY = centerY;
        
        this.render();
    }

    getCenter() {
        return { lat: this.centerY, lon: this.centerX };
    }

    worldToScreen(x, y) {
        const centerX = 400;
        const centerY = 300;
        
        const scale = Math.pow(1.5, this.zoom - 10);
        
        return {
            x: (x - centerX) * scale + this.canvas.width / 2 + this.offsetX,
            y: (y - centerY) * scale + this.canvas.height / 2 + this.offsetY
        };
    }

    render() {
        this.drawBackground();
        this.drawStreets();
        this.drawLandmarks();
        this.renderRoute();
        this.renderMarkers();
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.strokeStyle = 'rgba(255,255,255,0.03)';
        this.ctx.lineWidth = 1;
        const gridSize = 50 * Math.pow(1.5, this.zoom - 10);
        
        for (let x = 0; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }

    drawStreets() {
        this.streets.forEach(street => {
            const start = this.worldToScreen(street.x1, street.y1);
            const end = this.worldToScreen(street.x2, street.y2);
            
            const scale = Math.pow(1.5, this.zoom - 10);
            const width = Math.max(2, street.width * scale * 0.3);
            
            if (street.type === 'highway') {
                this.ctx.strokeStyle = '#ff6b35';
            } else if (street.type === 'main') {
                this.ctx.strokeStyle = '#4ecdc4';
            } else {
                this.ctx.strokeStyle = '#95a5a6';
            }
            
            this.ctx.lineWidth = width + 4;
            this.ctx.lineCap = 'round';
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();
            
            this.ctx.strokeStyle = 'rgba(255,255,255,0.8)';
            this.ctx.lineWidth = width;
            this.ctx.setLineDash([15 * scale, 10 * scale]);
            this.ctx.beginPath();
            this.ctx.moveTo(start.x, start.y);
            this.ctx.lineTo(end.x, end.y);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
            
            if (this.zoom > 11) {
                const midX = (start.x + end.x) / 2;
                const midY = (start.y + end.y) / 2;
                this.ctx.font = `${Math.max(8, 10 * scale)}px Arial`;
                this.ctx.fillStyle = 'rgba(255,255,255,0.7)';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(street.name, midX, midY - width - 5);
            }
        });
    }

    drawLandmarks() {
        const landmarks = [
            { name: 'Parque La Carolina', x: 200, y: 170, emoji: '🌳' },
            { name: 'Plaza Grande', x: 180, y: 300, emoji: '⛲' },
            { name: 'CC El Ejido', x: 350, y: 250, emoji: '🏬' },
            { name: 'Estadio', x: 250, y: 130, emoji: '🏟️' },
            { name: 'Universidad', x: 300, y: 400, emoji: '🎓' },
            { name: 'Terminal', x: 600, y: 400, emoji: '🚌' },
        ];
        
        const scale = Math.pow(1.5, this.zoom - 10);
        
        landmarks.forEach(landmark => {
            const pos = this.worldToScreen(landmark.x, landmark.y);
            const size = Math.max(16, 24 * scale);
            
            this.ctx.font = `${size}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(landmark.emoji, pos.x, pos.y);
            
            if (this.zoom > 10) {
                this.ctx.font = `${Math.max(7, 9 * scale)}px Arial`;
                this.ctx.fillStyle = '#ffffff';
                this.ctx.fillText(landmark.name, pos.x, pos.y + size * 0.7);
            }
        });
    }

    setRoute(path) {
        this.routePath = path;
        this.renderRoute();
    }

    renderRoute() {
        while (this.svg.firstChild) {
            this.svg.removeChild(this.svg.firstChild);
        }
        
        if (this.routePath.length < 2) return;
        
        const pathData = this.routePath.map((point, i) => {
            const screen = this.worldToScreen(point.x, point.y);
            return `${i === 0 ? 'M' : 'L'} ${screen.x} ${screen.y}`;
        }).join(' ');
        
        const altPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        altPath.classList.add('route-path-alt');
        altPath.setAttribute('d', pathData);
        this.svg.appendChild(altPath);
        
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.classList.add('route-path');
        path.setAttribute('d', pathData);
        this.svg.appendChild(path);
    }

    addMarker(x, y, type, label = '') {
        const marker = document.createElement('div');
        marker.className = type === 'destination' ? 'destination-marker' : 'vehicle-marker';
        
        if (type === 'destination') {
            marker.innerHTML = `
                <span class="destination-icon">🚩</span>
                ${label ? `<div class="destination-label">${label}</div>` : ''}
            `;
        } else {
            const icons = { car: '🚗', bus: '🚌', motorcycle: '🏍️', truck: '🚛' };
            marker.innerHTML = `<span class="vehicle-icon">${icons[type] || '🚗'}</span>`;
        }
        
        this.markerContainer.appendChild(marker);
        
        const markerData = { element: marker, x, y, type };
        this.markers.push(markerData);
        
        this.updateMarkerPosition(markerData);
        
        return markerData;
    }

    updateMarkerPosition(marker) {
        const screen = this.worldToScreen(marker.x, marker.y);
        marker.element.style.left = `${screen.x}px`;
        marker.element.style.top = `${screen.y}px`;
    }

    updateMarkerPositions() {
        this.markers.forEach(marker => this.updateMarkerPosition(marker));
    }

    renderMarkers() {
        this.markers.forEach(marker => this.updateMarkerPosition(marker));
    }

    addVehicle(x, y, type, speed) {
        const marker = this.addMarker(x, y, type);
        this.vehicles.push(marker);
        
        if (speed < 20) {
            marker.element.classList.add('slow');
        }
        
        return marker;
    }

    removeMarker(marker) {
        const index = this.markers.indexOf(marker);
        if (index > -1) this.markers.splice(index, 1);
        if (marker.element?.parentNode) marker.element.parentNode.removeChild(marker.element);
        
        const vIndex = this.vehicles.indexOf(marker);
        if (vIndex > -1) this.vehicles.splice(vIndex, 1);
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = WazeMap;
}
