// js/app.js - Integración de UI, almacenamiento y cálculo

document.addEventListener('DOMContentLoaded', () => {
    // Referencias al DOM
    const addPeriodForm = document.getElementById('add-period-form');
    const newPeriodInput = document.getElementById('new-period-date');
    const historyList = document.getElementById('history-list');
    const mensajeNotificacion = document.getElementById('mensajeNotificacion');
    
    const cycleForm = document.getElementById('cycle-form');
    const isIrregularCheckbox = document.getElementById('is-irregular');
    const irregularOptions = document.getElementById('irregular-options');
    const minCycleInput = document.getElementById('min-cycle');
    const maxCycleInput = document.getElementById('max-cycle');
    const checkDateInput = document.getElementById('check-date');
    
    const statusCard = document.getElementById('status-card');
    const statusText = document.getElementById('status-text');

    // Función auxiliar segura para obtener "YYYY-MM-DD" local
    function getTodayString() {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Inicializar fecha de consulta a HOY de forma predeterminada
    const todayStr = getTodayString();
    if (checkDateInput) {
        checkDateInput.value = todayStr;
    }

    // Cargar datos por primera vez si el historial está vacío
    initDefaultData();

    // Renderizar historial y actualizar interfaz
    refreshUI();

    // Mostrar / ocultar opciones de ciclo irregular
    if (isIrregularCheckbox) {
        isIrregularCheckbox.addEventListener('change', (e) => {
            irregularOptions.style.display = e.target.checked ? 'block' : 'none';
        });
    }

    // Evento: Agregar nueva fecha al historial
    if (addPeriodForm) {
        addPeriodForm.addEventListener('submit', (e) => {
            e.preventDefault(); // Detiene recarga de página obligatoriamente
            
            const dateVal = newPeriodInput.value;
            if (!dateVal) {
                mostrarNotificacion('Por favor selecciona una fecha válida.', 'error');
                return;
            }

            const guardado = Storage.addPeriod(dateVal);
            
            if (guardado) {
                newPeriodInput.value = '';
                mostrarNotificacion('¡Fecha agregada correctamente al historial!', 'exito');
                refreshUI();
                calculateAndDisplay();
            } else {
                mostrarNotificacion('Error: Esta fecha ya está registrada en el historial.', 'error');
            }
        });
    }

    // Evento: Calcular estado de la fecha seleccionada
    if (cycleForm) {
        cycleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            calculateAndDisplay();
        });
    }

    // Muestra notificaciones visuales en el div #mensajeNotificacion
    function mostrarNotificacion(texto, tipo) {
        if (!mensajeNotificacion) return;

        mensajeNotificacion.textContent = texto;
        mensajeNotificacion.style.display = 'block';

        if (tipo === 'exito') {
            mensajeNotificacion.style.backgroundColor = '#d4edda';
            mensajeNotificacion.style.color = '#155724';
            mensajeNotificacion.style.border = '1px solid #c3e6cb';
        } else {
            mensajeNotificacion.style.backgroundColor = '#f8d7da';
            mensajeNotificacion.style.color = '#721c24';
            mensajeNotificacion.style.border = '1px solid #f5c6cb';
        }

        // Ocultar mensaje después de 3.5 segundos
        setTimeout(() => {
            mensajeNotificacion.style.display = 'none';
        }, 3500);
    }

    function initDefaultData() {
        const existing = Storage.getPeriods();
        if (existing.length === 0) {
            const initialDates = ['2026-03-27', '2026-04-25', '2026-05-26', '2026-06-21', '2026-07-21'];
            initialDates.forEach(date => Storage.addPeriod(date));
        }
    }

    function refreshUI() {
        const periods = Storage.getPeriods();
        historyList.innerHTML = '';

        if (periods.length === 0) {
            historyList.innerHTML = '<li>No hay registros aún.</li>';
            return;
        }

        periods.forEach(dateStr => {
            const li = document.createElement('li');
            li.className = 'history-item';
            li.innerHTML = `
                <span>📅 ${dateStr}</span>
                <button type="button" class="btn-delete" data-date="${dateStr}">Eliminar</button>
            `;
            historyList.appendChild(li);
        });

        // Listeners para botones eliminar
        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dateToDelete = e.target.getAttribute('data-date');
                Storage.removePeriod(dateToDelete);
                mostrarNotificacion('Fecha eliminada del historial.', 'exito');
                refreshUI();
                calculateAndDisplay();
            });
        });

        const stats = Storage.calculateCycleLengths();
        if (stats.hasEnoughData) {
            minCycleInput.value = stats.minCycle;
            maxCycleInput.value = stats.maxCycle;
        }
    }

    function calculateAndDisplay() {
        const periods = Storage.getPeriods();
        
        if (periods.length === 0) {
            statusCard.className = 'status-card';
            statusText.textContent = 'Por favor registra al menos una fecha de inicio de período.';
            return;
        }

        const lastPeriodDate = periods[0];
        const isIrregular = isIrregularCheckbox ? isIrregularCheckbox.checked : true;
        const minCycle = parseInt(minCycleInput.value, 10) || 26;
        const maxCycle = parseInt(maxCycleInput.value, 10) || 31;
        const targetDate = checkDateInput.value || todayStr;

        const ranges = Calculator.calculateRanges(lastPeriodDate, isIrregular, minCycle, maxCycle);
        const currentStatus = Calculator.getDayStatus(targetDate, ranges);

        const fertileStartStr = Calculator.toISOStringLocal(ranges.firstFertileDay);
        const fertileEndStr = Calculator.toISOStringLocal(ranges.lastFertileDay);
        const nextPeriodStr = Calculator.toISOStringLocal(ranges.nextPeriodDay);

        statusCard.className = `status-card status-${currentStatus.color}`;
        statusText.innerHTML = `
            <strong>Estado para el ${targetDate}:</strong><br>
            <span class="status-title">${currentStatus.label}</span><br><br>
            <small>
                Último período: <strong>${lastPeriodDate}</strong><br>
                Ventana de riesgo (fértil): <strong>${fertileStartStr} al ${fertileEndStr}</strong><br>
                Próximo período estimado: <strong>${nextPeriodStr}</strong>
            </small>
        `;
    }
});