// calculator.js - Lógica pura de cálculo de fechas y riesgo

const Calculator = {
    // Convierte "YYYY-MM-DD" o Date a un objeto Date local estandarizado a medianoche
    parseLocalDate(dateInput) {
        if (!dateInput) return null;
        if (dateInput instanceof Date) {
            return new Date(dateInput.getFullYear(), dateInput.getMonth(), dateInput.getDate());
        }
        if (typeof dateInput === 'string') {
            const cleanStr = dateInput.split('T')[0];
            const [year, month, day] = cleanStr.split('-').map(Number);
            return new Date(year, month - 1, day);
        }
        return new Date(dateInput);
    },

    // Formatea una fecha a la representación local ISO "YYYY-MM-DD"
    toISOStringLocal(date) {
        const d = this.parseLocalDate(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    // Añade días a una fecha sin mutar la original
    addDays(date, days) {
        const result = this.parseLocalDate(date);
        result.setDate(result.getDate() + days);
        return result;
    },

    // Calcula los rangos según si es regular o irregular
    calculateRanges(lastPeriodDate, isIrregular, minCycle = 26, maxCycle = 31, avgCycle = 28) {
        const startDate = this.parseLocalDate(lastPeriodDate);
        
        let firstFertileDay, lastFertileDay, nextPeriodDay;

        if (isIrregular) {
            // Regla de Knaus-Ogino para irregulares
            firstFertileDay = this.addDays(startDate, minCycle - 18);
            lastFertileDay = this.addDays(startDate, maxCycle - 11);
            nextPeriodDay = this.addDays(startDate, Math.round((minCycle + maxCycle) / 2));
        } else {
            // Cálculo estándar regular
            firstFertileDay = this.addDays(startDate, avgCycle - 18);
            lastFertileDay = this.addDays(startDate, avgCycle - 11);
            nextPeriodDay = this.addDays(startDate, avgCycle);
        }

        return {
            startDate,
            firstFertileDay,
            lastFertileDay,
            nextPeriodDay
        };
    },

    // Evalúa una fecha específica frente a los rangos
    getDayStatus(targetDate, ranges) {
        const target = this.parseLocalDate(targetDate);
        const start = this.parseLocalDate(ranges.startDate);
        const fertileStart = this.parseLocalDate(ranges.firstFertileDay);
        const fertileEnd = this.parseLocalDate(ranges.lastFertileDay);
        const nextPeriod = this.parseLocalDate(ranges.nextPeriodDay);

        // Período (asumiendo 5 días promedio de duración de regla)
        const periodEnd = this.addDays(start, 4);
        if (target >= start && target <= periodEnd) {
            return { status: 'PERIOD', label: 'Día de Período Menstrual', color: 'red' };
        }

        // Ventana Fértil / Riesgo
        if (target >= fertileStart && target <= fertileEnd) {
            return { status: 'RISK', label: 'Día de RIESGO (Ventana Fértil)', color: 'orange' };
        }

        // Próximo Período estimado
        if (target >= nextPeriod) {
            return { status: 'NEXT_PERIOD', label: 'Fecha estimada de próximo período', color: 'red' };
        }

        // Resto del ciclo
        return { status: 'SAFE', label: 'Día Seguro / Bajo Riesgo', color: 'green' };
    },

    calculateMinMaxCycles(datesArray) {
        if (!datesArray || datesArray.length < 2) {
            return null;
        }

        const sortedDates = [...datesArray]
            .map(d => this.parseLocalDate(d))
            .sort((a, b) => a - b);
            
        const durations = [];

        for (let i = 0; i < sortedDates.length - 1; i++) {
            const date1 = sortedDates[i];
            const date2 = sortedDates[i + 1];
            const diffDays = Math.round((date2 - date1) / (1000 * 60 * 60 * 24));
            durations.push(diffDays);
        }

        return {
            minCycle: Math.min(...durations),
            maxCycle: Math.max(...durations)
        };
    }
};