const __months__ = {'gennaio': 0,'febbraio': 1,'marzo': 2,'aprile': 3,'maggio': 4,'giugno': 5,'luglio': 6,'agosto': 7,'settembre': 8,'ottobre': 9,'novembre': 10,'dicembre': 11};

document.addEventListener('DOMContentLoaded', function() {
    initializeCalendar(); 
});

function initializeCalendar() {
    const calendarDates = document.getElementById('calendarDates');
    const monthYear = document.getElementById('monthYear');
    const prevMonth = document.getElementById('prevMonth');
    const nextMonth = document.getElementById('nextMonth');
    let currentDate = new Date();
    let selectedDayElement = null;

    function renderCalendar(date) {
        const year = date.getFullYear();
        const month = date.getMonth();
        const today = new Date();
        const firstDay = new Date(year, month, 1).getDay();
        const lastDate = new Date(year, month + 1, 0).getDate();
        const prevLastDate = new Date(year, month, 0).getDate();
        const days = [];

        for (let i = firstDay; i > 0; i--) {
            days.push(`<div class="prev-date">${prevLastDate - i + 1}</div>`);
        }

        for (let i = 1; i <= lastDate; i++) {
            const dayOfWeek = new Date(year, month, i).getDay();
            const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);
            const dayClass = isWeekend ? 'weekend-date' : 'current-date';
            const isSelected = (today.getFullYear() === year && today.getMonth() === month && today.getDate() === i) ? 'selected-date' : '';
            days.push(`<div class="${dayClass} ${isSelected}">${i}</div>`);
        }

        calendarDates.innerHTML = days.join('');
        monthYear.textContent = `${date.toLocaleString('default', { month: 'long' })} ${year}`;

        document.querySelectorAll('.current-date').forEach(day => {
            day.addEventListener('click', function() {
                const selectedDate = new Date(year, month, parseInt(this.textContent));
                
                // Show form for entering work hours
                showWorkHoursForm(selectedDate);

                // Highlight the selected date
                if (selectedDayElement) {
                    selectedDayElement.classList.remove('selected-date');
                }
                this.classList.add('selected-date');
                selectedDayElement = this;
            });
        });

        // Preselect the current day
        if (today.getFullYear() === year && today.getMonth() === month) {
            const todayElement = document.querySelector(`.current-date.selected-date`);
            if (todayElement) {
                selectedDayElement = todayElement;
                showWorkHoursForm(today);
            }
        }
    }

    prevMonth.addEventListener('click', function() {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar(currentDate);
    });

    nextMonth.addEventListener('click', function() {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar(currentDate);
    });

    renderCalendar(currentDate);
}

function showWorkHoursForm(date) {
    const workHoursForm = document.getElementById('workHoursForm');
    workHoursForm.style.display = 'block';
    document.getElementById('selectedDate').textContent = date.toLocaleDateString();

    const workData = JSON.parse(localStorage.getItem(date.toLocaleDateString()));
    if (workData) {
        document.getElementById('workHours').value = workData.hours;
        document.getElementById('workMinutes').value = workData.minutes;
    } else {
        document.getElementById('workHours').value = '';
        document.getElementById('workMinutes').value = '';
    }
}

function setWorkHours(hours, minutes) {
    document.getElementById('workHours').value = hours;
    document.getElementById('workMinutes').value = minutes;
    document.getElementById('save-button').classList.add('save-btn');
    setInterval(()=>{ document.getElementById('save-button').classList.remove('save-btn'); }, 4000);
}

function saveWorkHours() {

    document.getElementById('save-button').classList.remove('save-btn');

    const workHours = document.getElementById('workHours').value;
    const workMinutes = document.getElementById('workMinutes').value;
    const selectedDate = document.getElementById('selectedDate').textContent;

    if (workHours === '' || workMinutes === '' || workHours < 0 || workHours > 23 || workMinutes < 0 || workMinutes > 59) {
        alert('Inserisci valori validi per ore e minuti lavorati.');
        return;
    }

    const workData = {
        hours: workHours,
        minutes: workMinutes
    };

    localStorage.setItem(selectedDate, JSON.stringify(workData));
}

function exportToCSV() {
    const currentMonthYear = document.getElementById('monthYear').textContent;
    const [monthName, year] = currentMonthYear.split(' ');
    const month = __months__[monthName.toLowerCase()];

    let csvContent = "data:text/csv;charset=utf-8,Date,Ore,Minuti\n";
    let totalHours = 0;
    let totalMinutes = 0;
    let workDays = 0;

    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let day = 1; day <= daysInMonth; day++) {
        const dateKey = new Date(year, month, day).toLocaleDateString();
        const dayOfWeek = new Date(year, month, day).getDay();
        const isWeekend = (dayOfWeek === 0 || dayOfWeek === 6);

        let hours = '';
        let minutes = '';

        if (isWeekend) {
            hours = 'Riposo';
            minutes = 'settimanale';
        } else {
            const workData = JSON.parse(localStorage.getItem(dateKey));
            hours = workData ? workData.hours : '';
            minutes = workData ? workData.minutes : '';

            if (workData) {
                totalHours += parseInt(workData.hours);
                totalMinutes += parseInt(workData.minutes);
            }
            workDays++;
        }

        csvContent += `${dateKey},${hours},${minutes}\n`;
    }

    // Calculate total worked time
    totalHours += Math.floor(totalMinutes / 60);
    totalMinutes = totalMinutes % 60;

    csvContent += `Totale,${totalHours},${totalMinutes}\n`;
    csvContent += `Totale da lavorare,${workDays * 8},0\n`;

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "timbrature_"+monthName+".csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

document.querySelector('form').addEventListener('submit', function(event) {
    event.preventDefault();
    const oraEntrata = document.getElementById('oraEntrata').value;
    const oraUscitaPausa = document.getElementById('oraUscitaPausa').value;
    const oraEntrataPausa = document.getElementById('oraEntrataPausa').value;
    const oraUscita = document.getElementById('oraUscita').value;

    if (!oraEntrata || !oraUscitaPausa || !oraEntrataPausa || !oraUscita) {
        document.getElementById('error').textContent = 'Tutti i campi devono essere valorizzati';
        document.getElementById('result').textContent = '';
        document.getElementById('overtime').textContent = '';
        document.getElementById('remaining').textContent = '';
        return;
    }

    const [entrataOre, entrataMinuti] = oraEntrata.split(':').map(Number);
    const [uscitaPausaOre, uscitaPausaMinuti] = oraUscitaPausa.split(':').map(Number);
    const [entrataPausaOre, entrataPausaMinuti] = oraEntrataPausa.split(':').map(Number);
    const [uscitaOre, uscitaMinuti] = oraUscita.split(':').map(Number);

    const entrata = new Date(0, 0, 0, entrataOre, entrataMinuti);
    const uscitaPausa = new Date(0, 0, 0, uscitaPausaOre, uscitaPausaMinuti);
    const entrataPausa = new Date(0, 0, 0, entrataPausaOre, entrataPausaMinuti);
    const uscita = new Date(0, 0, 0, uscitaOre, uscitaMinuti);

    if (entrata >= uscitaPausa || entrataPausa >= uscita || uscitaPausa >= entrataPausa) {
        document.getElementById('error').textContent = 'Gli orari inseriti non sono validi. Assicurati che l\'orario di entrata sia precedente all\'orario di uscita.';
        document.getElementById('result').textContent = '';
        document.getElementById('overtime').textContent = '';
        document.getElementById('remaining').textContent = '';
        return;
    }

    document.getElementById('error').textContent = '';

    const mattinaLavorata = (uscitaPausa - entrata) / 1000 / 60; // in minutes
    const pomeriggioLavorato = (uscita - entrataPausa) / 1000 / 60; // in minutes
    const totaleLavorato = mattinaLavorata + pomeriggioLavorato;

    const oreLavorate = Math.floor(totaleLavorato / 60);
    const minutiLavorati = totaleLavorato % 60;

    document.getElementById('result').textContent = `Hai lavorato ${oreLavorate} ore e ${minutiLavorati} minuti`;
    setWorkHours(oreLavorate, minutiLavorati);

    const totalMinutesWorked = oreLavorate * 60 + minutiLavorati;
    const standardWorkMinutes = 480; //8 * 60

    if (totalMinutesWorked > standardWorkMinutes) {
        const overtimeMinutes = totalMinutesWorked - standardWorkMinutes;
        const overtimeHours = Math.floor(overtimeMinutes / 60);
        const overtimeRemainingMinutes = overtimeMinutes % 60;
        document.getElementById('overtime').textContent = `Straordinari: ${overtimeHours} ore e ${overtimeRemainingMinutes} minuti`;
        document.getElementById('remaining').textContent = '';
    } else if(totalMinutesWorked < standardWorkMinutes){
        const remainingMinutes = standardWorkMinutes - totalMinutesWorked;
        const remainingHours = Math.floor(remainingMinutes / 60);
        const remainingRemainingMinutes = remainingMinutes % 60;
        document.getElementById('remaining').textContent = `Rimanenti da lavorare: ${remainingHours} ore e ${remainingRemainingMinutes} minuti`;
        document.getElementById('overtime').textContent = '';
    }else{
        document.getElementById('overtime').textContent = '';
        document.getElementById('remaining').textContent = '';
    }
});

document.querySelector('form').addEventListener('reset', function() {
    document.getElementById('result').textContent = '';
    document.getElementById('overtime').textContent = '';
    document.getElementById('remaining').textContent = '';
    document.getElementById('error').textContent = '';
});