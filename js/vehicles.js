const VehicleType = {
    CAR: 'car',
    BUS: 'bus',
    MOTORCYCLE: 'motorcycle',
    TRUCK: 'truck',
    TAXI: 'taxi'
};

const VehicleConfig = {
    [VehicleType.CAR]: {
        maxSpeed: 60,
        minSpeed: 15,
        acceleration: 8,
        deceleration: 12,
        width: 12,
        length: 22,
        color: '#3b82f6',
        emoji: '🚗'
    },
    [VehicleType.BUS]: {
        maxSpeed: 40,
        minSpeed: 10,
        acceleration: 4,
        deceleration: 8,
        width: 14,
        length: 40,
        color: '#f59e0b',
        emoji: '🚌'
    },
    [VehicleType.MOTORCYCLE]: {
        maxSpeed: 70,
        minSpeed: 20,
        acceleration: 15,
        deceleration: 18,
        width: 6,
        length: 12,
        color: '#10b981',
        emoji: '🏍️'
    },
    [VehicleType.TRUCK]: {
        maxSpeed: 35,
        minSpeed: 8,
        acceleration: 3,
        deceleration: 6,
        width: 16,
        length: 50,
        color: '#8b5cf6',
        emoji: '🚛'
    },
    [VehicleType.TAXI]: {
        maxSpeed: 55,
        minSpeed: 15,
        acceleration: 9,
        deceleration: 14,
        width: 12,
        length: 22,
        color: '#f97316',
        emoji: '🚕'
    }
};

class Vehicle {
    constructor(config) {
        this.id = Utils.generateId();
        this.type = config.type || VehicleType.CAR;
        this.config = VehicleConfig[this.type];
        
        this.x = config.x || 0;
        this.y = config.y || 0;
        
        this.targetX = config.targetX || this.x;
        this.targetY = config.targetY || this.y;
        
        this.route = config.route || [];
        this.routeIndex = 0;
        
        this.maxSpeed = config.maxSpeed || this.config.maxSpeed;
        this.minSpeed = config.minSpeed || this.config.minSpeed;
        this.currentSpeed = this.maxSpeed;
        
        this.targetSpeed = this.maxSpeed;
        
        this.angle = config.angle || 0;
        
        this.roadId = config.roadId || null;
        
        this.isMoving = true;
        this.isPaused = false;
        
        this.progress = 0;
        
        this.lastUpdate = Date.now();
    }

    update(deltaTime, trafficDensity = 0, nearbyVehicles = []) {
        if (!this.isMoving || this.isPaused) return;

        const speedMultiplier = 1 - (trafficDensity * 0.8);
        this.targetSpeed = Utils.clamp(
            this.maxSpeed * speedMultiplier,
            this.minSpeed,
            this.maxSpeed
        );

        if (this.currentSpeed < this.targetSpeed) {
            this.currentSpeed += this.config.acceleration * deltaTime;
        } else if (this.currentSpeed > this.targetSpeed) {
            this.currentSpeed -= this.config.deceleration * deltaTime;
        }
        this.currentSpeed = Utils.clamp(this.currentSpeed, this.minSpeed, this.maxSpeed);

        if (this.route && this.route.length > 0) {
            this.followRoute(deltaTime);
        } else {
            this.moveTowardsTarget(deltaTime);
        }

        this.checkNearbyVehicles(nearbyVehicles);
    }

    followRoute(deltaTime) {
        if (this.routeIndex >= this.route.length) {
            this.routeIndex = 0;
            this.route = Utils.shuffleArray(this.route);
        }

        const currentPoint = this.route[this.routeIndex];
        const nextPoint = this.route[(this.routeIndex + 1) % this.route.length];

        if (!nextPoint) {
            this.routeIndex = 0;
            return;
        }

        const dx = nextPoint.x - this.x;
        const dy = nextPoint.y - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        this.angle = Math.atan2(dy, dx);

        const moveSpeed = this.currentSpeed * deltaTime * 0.05;

        if (distance <= moveSpeed) {
            this.x = nextPoint.x;
            this.y = nextPoint.y;
            this.routeIndex = (this.routeIndex + 1) % this.route.length;
        } else {
            this.x += (dx / distance) * moveSpeed;
            this.y += (dy / distance) * moveSpeed;
        }
    }

    moveTowardsTarget(deltaTime) {
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < 5) {
            this.isMoving = false;
            return;
        }

        this.angle = Math.atan2(dy, dx);

        const moveSpeed = this.currentSpeed * deltaTime * 0.05;
        
        if (distance <= moveSpeed) {
            this.x = this.targetX;
            this.y = this.targetY;
        } else {
            this.x += (dx / distance) * moveSpeed;
            this.y += (dy / distance) * moveSpeed;
        }
    }

    checkNearbyVehicles(vehicles) {
        const safeDistance = 40;
        
        for (const other of vehicles) {
            if (other.id === this.id) continue;

            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < safeDistance) {
                const angleToOther = Math.atan2(dy, dx);
                const angleDiff = Math.abs(this.angle - angleToOther);

                if (angleDiff < Math.PI / 2 || angleDiff > 3 * Math.PI / 2) {
                    this.currentSpeed *= 0.95;
                }
            }
        }
    }

    setRoute(route) {
        this.route = route;
        this.routeIndex = 0;
    }

    setPosition(x, y) {
        this.x = x;
        this.y = y;
    }

    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
    }

    stop() {
        this.isMoving = false;
        this.currentSpeed = 0;
    }

    start() {
        this.isMoving = true;
    }

    getBoundingBox() {
        const halfLength = this.config.length / 2;
        const halfWidth = this.config.width / 2;
        
        return {
            x: this.x - halfLength,
            y: this.y - halfWidth,
            width: this.config.length,
            height: this.config.width
        };
    }

    render(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        const speedRatio = this.currentSpeed / this.maxSpeed;
        
        if (speedRatio < 0.3) {
            ctx.shadowColor = '#ef4444';
            ctx.shadowBlur = 8;
        } else if (speedRatio < 0.6) {
            ctx.shadowColor = '#eab308';
            ctx.shadowBlur = 5;
        }

        ctx.fillStyle = this.config.color;
        
        const length = this.config.length;
        const width = this.config.width;
        
        this.drawVehicleShape(ctx, length, width);

        ctx.restore();

        if (this.type === VehicleType.BUS || this.type === VehicleType.TRUCK) {
            this.renderLabel(ctx);
        }
    }

    drawVehicleShape(ctx, length, width) {
        ctx.beginPath();
        
        if (this.type === VehicleType.MOTORCYCLE) {
            ctx.ellipse(0, 0, length / 2, width / 2, 0, 0, Math.PI * 2);
        } else if (this.type === VehicleType.BUS) {
            ctx.roundRect(-length / 2, -width / 2, length, width, 4);
        } else {
            ctx.roundRect(-length / 2, -width / 2, length, width, 3);
        }
        
        ctx.fill();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.fillRect(-length / 4, -width / 3, length / 2, width / 4);
    }

    renderLabel(ctx) {
        ctx.save();
        ctx.font = '10px Arial';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.config.emoji, 0, 0);
        ctx.restore();
    }

    toJSON() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            currentSpeed: this.currentSpeed,
            maxSpeed: this.maxSpeed,
            roadId: this.roadId,
            routeIndex: this.routeIndex
        };
    }
}

class VehicleFactory {
    static createRandomVehicle(roads = []) {
        if (roads.length === 0) {
            return new Vehicle({
                type: Utils.randomChoice(Object.values(VehicleType)),
                x: Utils.randomRange(100, 700),
                y: Utils.randomRange(100, 500)
            });
        }

        const road = Utils.randomChoice(roads);
        const route = VehicleFactory.generateRouteOnRoad(road, roads);
        const startPos = route[0];
        
        const type = Utils.randomChoice([
            VehicleType.CAR,
            VehicleType.CAR,
            VehicleType.CAR,
            VehicleType.BUS,
            VehicleType.MOTORCYCLE,
            VehicleType.MOTORCYCLE,
            VehicleType.TAXI,
            VehicleType.TRUCK
        ]);

        return new Vehicle({
            type,
            x: startPos.x,
            y: startPos.y,
            route,
            roadId: road.id,
            angle: road.angle || 0
        });
    }

    static generateRouteOnRoad(startRoad, allRoads) {
        const route = [];
        let currentRoad = startRoad;
        
        for (let i = 0; i < 5; i++) {
            if (currentRoad) {
                const point = {
                    x: currentRoad.x1 + (currentRoad.x2 - currentRoad.x1) * Math.random(),
                    y: currentRoad.y1 + (currentRoad.y2 - currentRoad.y1) * Math.random()
                };
                route.push(point);
                
                const connectedRoads = allRoads.filter(r => 
                    r.id !== currentRoad.id && 
                    VehicleFactory.areRoadsConnected(currentRoad, r)
                );
                
                if (connectedRoads.length > 0) {
                    currentRoad = Utils.randomChoice(connectedRoads);
                } else {
                    break;
                }
            }
        }
        
        return route;
    }

    static areRoadsConnected(road1, road2) {
        const threshold = 30;
        
        return (
            Utils.distance(road1.x1, road1.y1, road2.x1, road2.y1) < threshold ||
            Utils.distance(road1.x1, road1.y1, road2.x2, road2.y2) < threshold ||
            Utils.distance(road1.x2, road1.y2, road2.x1, road2.y1) < threshold ||
            Utils.distance(road1.x2, road1.y2, road2.x2, road2.y2) < threshold
        );
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Vehicle, VehicleType, VehicleConfig, VehicleFactory };
}
