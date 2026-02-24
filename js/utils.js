const Utils = {
    DEGREES_TO_RADIANS: Math.PI / 180,
    RADIANS_TO_DEGREES: 180 / Math.PI,

    getTrafficColor(density, alpha = 1) {
        if (density >= 0.7) {
            return `rgba(239, 68, 68, ${alpha})`;
        } else if (density >= 0.4) {
            return `rgba(234, 179, 8, ${alpha})`;
        } else {
            return `rgba(34, 197, 94, ${alpha})`;
        }
    },

    getTrafficStatus(density) {
        if (density >= 0.7) return 'congestionado';
        if (density >= 0.4) return 'moderado';
        return 'libre';
    },

    getTrafficLabel(density) {
        if (density >= 0.7) return 'Tráfico Congestionado';
        if (density >= 0.4) return 'Tráfico Moderado';
        return 'Tráfico Libre';
    },

    lerp(start, end, t) {
        return start + (end - start) * t;
    },

    distance(x1, y1, x2, y2) {
        return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
    },

    normalize(value, min, max) {
        if (max === min) return 0;
        return (value - min) / (max - min);
    },

    clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    },

    randomRange(min, max) {
        return Math.random() * (max - min) + min;
    },

    randomInt(min, max) {
        return Math.floor(this.randomRange(min, max + 1));
    },

    randomChoice(array) {
        return array[Math.floor(Math.random() * array.length)];
    },

    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    },

    formatNumber(num) {
        return num.toLocaleString('es-EC');
    },

    formatSpeed(speedKmh) {
        return `${Math.round(speedKmh)} km/h`;
    },

    formatPercentage(value) {
        return `${Math.round(value * 100)}%`;
    },

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    getCurrentTime() {
        const now = new Date();
        return now.toLocaleTimeString('es-EC', { 
            hour: '2-digit', 
            minute: '2-digit' 
        });
    },

    getStreetCapacity(vehicleCount, maxCapacity = 15) {
        return vehicleCount / maxCapacity;
    },

    calculateAverageSpeed(vehicles) {
        if (vehicles.length === 0) return 0;
        const totalSpeed = vehicles.reduce((sum, v) => sum + v.currentSpeed, 0);
        return totalSpeed / vehicles.length;
    },

    getVehicleEmoji(type) {
        const emojis = {
            car: '🚗',
            bus: '🚌',
            motorcycle: '🏍️',
            truck: '🚛',
            taxi: '🚕'
        };
        return emojis[type] || '🚗';
    },

    easeInOutCubic(t) {
        return t < 0.5 
            ? 4 * t * t * t 
            : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },

    easeOutElastic(t) {
        const c4 = (2 * Math.PI) / 3;
        return t === 0 
            ? 0 
            : t === 1 
                ? 1 
                : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
    },

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    saveToLocalStorage(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.warn('LocalStorage not available:', e);
            return false;
        }
    },

    loadFromLocalStorage(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (e) {
            console.warn('LocalStorage not available:', e);
            return defaultValue;
        }
    },

    generateId() {
        return Math.random().toString(36).substr(2, 9);
    },

    isPointInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    },

    getDistanceFromLine(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) param = dot / lenSq;
        
        let xx, yy;
        
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        return this.distance(px, py, xx, yy);
    },

    getPointOnLine(x1, y1, x2, y2, t) {
        return {
            x: this.lerp(x1, x2, t),
            y: this.lerp(y1, y2, t)
        };
    },

    getAngle(x1, y1, x2, y2) {
        return Math.atan2(y2 - y1, x2 - x1);
    },

    rotatePoint(x, y, cx, cy, angle) {
        const cos = Math.cos(angle);
        const sin = Math.sin(angle);
        const nx = cos * (x - cx) - sin * (y - cy) + cx;
        const ny = sin * (x - cx) + cos * (y - cy) + cy;
        return { x: nx, y: ny };
    }
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}
