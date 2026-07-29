// js/storage.js - Gestión de almacenamiento local (localStorage)

const Storage = {
    KEY: 'cycle_periods_history',

    // Auxiliar local para evitar desfases al parsear
    _parseLocalDate(dateStr) {
        if (typeof Calculator !== 'undefined' && Calculator.parseLocalDate) {
            return Calculator.parseLocalDate(dateStr);
        }
        const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
        return new Date(year, month - 1, day);
    },

    // Obtener todas las fechas guardadas (ordenadas de más reciente a más antigua)
    getPeriods() {
        const data = localStorage.getItem(this.KEY);
        const periods = data ? JSON.parse(data) : [];
        return periods.sort((a, b) => this._parseLocalDate(b) - this._parseLocalDate(a));
    },

    // Guardar una nueva fecha de inicio de período
    addPeriod(dateString) {
        if (!dateString) return false;
        
        const periods = this.getPeriods();
        
        // Evitar duplicados
        if (!periods.includes(dateString)) {
            periods.push(dateString);
            localStorage.setItem(this.KEY, JSON.stringify(periods));
            return true;
        }
        return false;
    },

    // Eliminar una fecha específica del historial
    removePeriod(dateString) {
        let periods = this.getPeriods();
        periods = periods.filter(date => date !== dateString);
        localStorage.setItem(this.KEY, JSON.stringify(periods));
    },

    // Calcular automáticamente la duración mínima y máxima del ciclo según el historial
    calculateCycleLengths() {
        // Ordenamos cronológicamente (de más antigua a más reciente)
        const periods = this.getPeriods().sort((a, b) => this._parseLocalDate(a) - this._parseLocalDate(b));
        
        if (periods.length < 2) {
            return { minCycle: 26, maxCycle: 31, avgCycle: 28, hasEnoughData: false };
        }

        const cycleLengths = [];
        for (let i = 0; i < periods.length - 1; i++) {
            const start = this._parseLocalDate(periods[i]);
            const end = this._parseLocalDate(periods[i + 1]);
            const diffTime = Math.abs(end - start);
            const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
            cycleLengths.push(diffDays);
        }

        const minCycle = Math.min(...cycleLengths);
        const maxCycle = Math.max(...cycleLengths);
        const avgCycle = Math.round(cycleLengths.reduce((a, b) => a + b, 0) / cycleLengths.length);

        return { minCycle, maxCycle, avgCycle, hasEnoughData: true };
    }
};