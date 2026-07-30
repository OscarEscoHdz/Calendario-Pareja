// js/app.js - Integración del Calendario Visual, UI y Almacenamiento

document.addEventListener('DOMContentLoaded', () => {
    // Referencias al DOM
    const addPeriodForm = document.getElementById('add-period-form');
    const newPeriodInput = document.getElementById('new-period-date');
    const historyList = document.getElementById('history-list');
    const mensajeNotificacion = document.getElementById('mensajeNotificacion');
    
    const isIrregularCheckbox = document.getElementById('is-irregular');
    const irregularOptions = document.getElementById('irregular-options');
    const minCycleInput = document.getElementById('min-cycle');
    const maxCycleInput = document.getElementById('max-cycle');

    const monthYearLabel = document.getElementById('calendar-month-year');
    const calendarDays = document.getElementById('calendar-days');
    const btnPrev = document.getElementById('prev-month');
    const btnNext = document.getElementById('next-month');
    
    const statusCard = document.getElementById('status-card');
    const statusText = document.getElementById('status-text');

    // Estado del mes visualizado (Inicia en el mes y año actual)
    let currentDate = new Date();

    // Inicializar datos predeterminados y renderizar
    initDefaultData();
    refreshUI();
    renderCalendar();

    // Eventos para cambiar de mes
    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() - 1);
            renderCalendar();
        });
    }

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            currentDate.setMonth(currentDate.getMonth() + 1);
            renderCalendar();
        });
    }

    // Reactividad a cambios en parámetros de ciclo
    if (isIrregularCheckbox) {
        isIrregularCheckbox.addEventListener('change', (e) => {
            if (irregularOptions) {
                irregularOptions.style.display = e.target.checked ? 'block' : 'none';
            }
            renderCalendar();
        });
    }

    if (minCycleInput) minCycleInput.addEventListener('input', () => renderCalendar());
    if (maxCycleInput) maxCycleInput.addEventListener('input', () => renderCalendar());

    // Evento: Agregar nueva fecha al historial
    if (addPeriodForm) {
        addPeriodForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const dateVal = newPeriodInput.value;
            
            if (!dateVal) {
                mostrarNotificacion('Por favor selecciona una fecha válida.', 'error');
                return;
            }

            if (Storage.addPeriod(dateVal)) {
                newPeriodInput.value = '';
                mostrarNotificacion('¡Fecha agregada correctamente!', 'exito');
                refreshUI();
                renderCalendar();
            } else {
                mostrarNotificacion('Esta fecha ya está registrada en el historial.', 'error');
            }
        });
    }

    // Notificaciones de usuario
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

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const dateToDelete = e.target.getAttribute('data-date');
                Storage.removePeriod(dateToDelete);
                mostrarNotificacion('Fecha eliminada del historial.', 'exito');
                refreshUI();
                renderCalendar();
            });
        });

        const stats = Storage.calculateCycleLengths();
        if (stats.hasEnoughData) {
            if (minCycleInput) minCycleInput.value = stats.minCycle;
            if (maxCycleInput) maxCycleInput.value = stats.maxCycle;
        }
    }

    // Renderiza el mes completo en la cuadrícula
    function renderCalendar() {
        const periods = Storage.getPeriods();
        calendarDays.innerHTML = '';

        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const monthNames = [
            'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
        ];
        
        if (monthYearLabel) {
            monthYearLabel.textContent = `${monthNames[month]} ${year}`;
        }

        if (periods.length === 0) {
            statusCard.className = 'status-card';
            statusText.textContent = 'Registra al menos un período para construir el calendario.';
            return;
        }

        const lastPeriodDate = periods[0];
        const isIrregular = isIrregularCheckbox ? isIrregularCheckbox.checked : true;
        const minCycle = parseInt(minCycleInput.value, 10) || 26;
        const maxCycle = parseInt(maxCycleInput.value, 10) || 31;

        const ranges = Calculator.calculateRanges(lastPeriodDate, isIrregular, minCycle, maxCycle);

        // Primer día del mes (0 = Domingo) y total de días
        const firstDayIndex = new Date(year, month, 1).getDay();
        const totalDays = new Date(year, month + 1, 0).getDate();

        // Celdas vacías al inicio para cuadrar los días de la semana
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'day-cell empty';
            calendarDays.appendChild(emptyCell);
        }

        // Celdas por cada día del mes
        for (let day = 1; day <= totalDays; day++) {
            const cell = document.createElement('div');
            cell.className = 'day-cell';
            cell.textContent = day;

            const formattedMonth = String(month + 1).padStart(2, '0');
            const formattedDay = String(day).padStart(2, '0');
            const dateStr = `${year}-${formattedMonth}-${formattedDay}`;

            const dayStatus = Calculator.getDayStatus(dateStr, ranges);
            cell.classList.add(`status-${dayStatus.status}`);

            // Clic sobre el día para ver la descripción
            cell.addEventListener('click', () => {
                document.querySelectorAll('.day-cell').forEach(c => c.classList.remove('selected'));
                cell.classList.add('selected');

                statusCard.className = `status-card status-${dayStatus.color}`;
                statusText.innerHTML = `
                    <strong>Fecha seleccionada: ${dateStr}</strong><br>
                    <span class="status-title">${dayStatus.label}</span>
                `;
            });

            calendarDays.appendChild(cell);
        }
    }
});