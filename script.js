document.addEventListener('DOMContentLoaded', function () {
    // --- DATA GENERATION --- 
    const departments = ['Engineering', 'Sales', 'Marketing', 'Human Resources', 'Support'];
    let employees = [];
    let timeEntries = [];

    function generateMockData() {
        employees = [
            { id: 1, firstName: 'John', lastName: 'Doe', type: 'Hourly', department: 'Engineering', status: 'Active' },
            { id: 2, firstName: 'Jane', lastName: 'Smith', type: 'Salary', department: 'Sales', status: 'Active' },
            { id: 3, firstName: 'Peter', lastName: 'Jones', type: 'Hourly', department: 'Marketing', status: 'Active' },
            { id: 4, firstName: 'Mary', lastName: 'Williams', type: 'Salary', department: 'Human Resources', status: 'Active' },
            { id: 5, firstName: 'David', lastName: 'Brown', type: 'Hourly', department: 'Support', status: 'Active' },
            { id: 6, firstName: 'Susan', lastName: 'Miller', type: 'Salary', department: 'Engineering', status: 'Active' },
            { id: 7, firstName: 'Michael', lastName: 'Davis', type: 'Hourly', department: 'Sales', status: 'Archived' },
            { id: 8, firstName: 'Linda', lastName: 'Garcia', type: 'Salary', department: 'Marketing', status: 'Active' },
            { id: 9, firstName: 'Robert', lastName: 'Rodriguez', type: 'Hourly', department: 'Support', status: 'Active' },
            { id: 10, firstName: 'Patricia', lastName: 'Martinez', type: 'Salary', department: 'Human Resources', status: 'Archived' },
        ];
        const dates = ['2025-08-12', '2025-08-13', '2025-08-14'];
        let entryId = 1;
        employees.forEach(emp => {
            dates.forEach(date => {
                if (emp.type === 'Hourly') {
                    timeEntries.push({ id: entryId++, employeeId: emp.id, date, punchIn: '08:00', punchOut: '12:00' });
                    timeEntries.push({ id: entryId++, employeeId: emp.id, date, punchIn: '12:30', punchOut: '13:00' });
                    timeEntries.push({ id: entryId++, employeeId: emp.id, date, punchIn: '13:00', punchOut: '17:00' });
                } else {
                    timeEntries.push({ id: entryId++, employeeId: emp.id, date, punchIn: '09:00', punchOut: '17:00' });
                }
            });
        });
    }

    // --- UTILITY FUNCTIONS --- 
    const formatTime = (timeStr) => { if (!timeStr) return ''; const [hour, minute] = timeStr.split(':'); const h = parseInt(hour); const ampm = h >= 12 ? 'PM' : 'AM'; const formattedHour = h % 12 === 0 ? 12 : h % 12; return `${String(formattedHour).padStart(2, '0')}:${minute} ${ampm}`; };
    const calculateHours = (start, end) => { if (!start || !end) return { hours: 0, minutes: 0 }; const [startH, startM] = start.split(':').map(Number); const [endH, endM] = end.split(':').map(Number); const totalStartMinutes = startH * 60 + startM; const totalEndMinutes = endH * 60 + endM; let diff = totalEndMinutes - totalStartMinutes; if (diff < 0) diff += 24 * 60; return { hours: Math.floor(diff / 60), minutes: diff % 60 }; };
    const formatDuration = ({ hours, minutes }) => `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

    // --- STATE MANAGEMENT --- 
    let selectedDepartments = [];
    let selectedStaff = [];
    let sortState = { by: 'name', direction: 'asc' };

    // --- DOM ELEMENTS --- 
    const tableBody = document.getElementById('attendance-table-body');
    const fromDateEl = document.getElementById('fromDate');
    const toDateEl = document.getElementById('toDate');
    const modalBackdrop = document.getElementById('modal-backdrop');
    // Department Filter Elements 
    const departmentSelector = document.getElementById('department-selector');
    const departmentDropdown = document.getElementById('department-dropdown');
    const departmentSearch = document.getElementById('department-search');
    const departmentList = document.getElementById('department-list');
    const departmentPlaceholder = document.getElementById('department-placeholder');
    // Staff Filter Elements 
    const staffSelector = document.getElementById('staff-selector');
    const staffDropdown = document.getElementById('staff-dropdown');
    const staffSearch = document.getElementById('staff-search');
    const staffList = document.getElementById('staff-list');
    const staffPlaceholder = document.getElementById('staff-placeholder');

    // --- RENDERING FUNCTIONS --- 
    function renderTable(sortedGroupedData) {
        tableBody.innerHTML = '';
        if (sortedGroupedData.length === 0) {
            tableBody.innerHTML = `<tr><td colspan="6" class="text-center p-8 text-gray-500">No matching records found.</td></tr>`;
            return;
        }

        sortedGroupedData.forEach(({ employee, entries }) => {
            let summaryText = '';
            if (employee.type === 'Hourly') {
                let totalWorkingMinutes = 0;
                entries.forEach(entry => {
                    const duration = calculateHours(entry.punchIn, entry.punchOut);
                    totalWorkingMinutes += duration.hours * 60 + duration.minutes;
                });
                const totalHours = formatDuration({ hours: Math.floor(totalWorkingMinutes / 60), minutes: totalWorkingMinutes % 60 });
                summaryText = `Total: <span class="font-bold text-gray-800">${totalHours}</span>`;
            } else { // Salary 
                const presentDays = new Set(entries.map(e => e.date)).size;
                summaryText = `Present: <span class="font-bold text-gray-800">${presentDays} Day${presentDays !== 1 ? 's' : ''}</span>`;
            }

            const headerRow = document.createElement('tr');
            headerRow.className = 'bg-gray-100 font-semibold';
            headerRow.innerHTML = ` 
                 <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-800" colspan="4"> 
                     ${employee.lastName}, ${employee.firstName} (${employee.department}) 
                 </td> 
                 <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-500 text-left"> 
                     ${summaryText} 
                 </td> 
                 <td class="px-6 py-3 whitespace-nowrap text-sm text-gray-500"> 
                     <div class="flex items-center space-x-4"> 
                         <button class="text-blue-600 hover:text-blue-800" title="View Profile" onclick="openProfileModal(${employee.id})"> 
                             <i class="bi bi-person-circle text-lg"></i> 
                         </button> 
                         <button class="text-green-600 hover:text-green-800" title="Add New Time Entry" onclick="openAddTimeModalForEmployee(${employee.id})">
                             <i class="bi bi-calendar-plus text-lg"></i>
                         </button>
                     </div> 
                 </td> 
             `;
            tableBody.appendChild(headerRow);

            entries.sort((a, b) => new Date(a.date) - new Date(b.date) || a.punchIn.localeCompare(b.punchIn));
            entries.forEach(entry => {
                const dataRow = document.createElement('tr');
                if (employee.type === 'Hourly') {
                    const workingHours = formatDuration(calculateHours(entry.punchIn, entry.punchOut));
                    dataRow.innerHTML = `<td class="px-6 py-4"></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(entry.date + 'T00:00:00').toLocaleDateString()}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatTime(entry.punchIn)}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatTime(entry.punchOut)}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${workingHours}</td><td class="px-6 py-4"><div class="flex items-center space-x-4"><button class="text-green-600 hover:text-green-800" title="View Punch Details" onclick="openPunchDetailsModal(${entry.id})"><i class="bi bi-search text-lg"></i></button><button class="text-orange-500 hover:text-orange-700" title="Update Time Clock Entry" onclick="openUpdateTimeModal(${entry.id})"><i class="bi bi-clock-history text-lg"></i></button></div></td>`;
                } else {
                    dataRow.innerHTML = `<td class="px-6 py-4"></td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${new Date(entry.date + 'T00:00:00').toLocaleDateString()}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" colspan="3">Present</td><td class="px-6 py-4"><div class="flex items-center space-x-4"><button class="text-green-600 hover:text-green-800" title="View Punch Details" onclick="openPunchDetailsModal(${entry.id})"><i class="bi bi-search text-lg"></i></button><button class="text-orange-500 hover:text-orange-700" title="Update Time Clock Entry" onclick="openUpdateTimeModal(${entry.id})"><i class="bi bi-clock-history text-lg"></i></button></div></td>`;
                }
                tableBody.appendChild(dataRow);
            });
        });
    }

    // --- MULTI-SELECT FILTER RENDERING --- 
    function createPill(text, onRemove) {
        const pill = document.createElement('span');
        pill.className = 'flex items-center bg-indigo-100 text-indigo-700 text-sm font-medium px-2.5 py-0.5 rounded-full';
        pill.innerHTML = `${text} <button class="ml-1.5 text-indigo-500 hover:text-indigo-700"><i class="bi bi-x-circle-fill text-xs"></i></button>`;
        pill.querySelector('button').onclick = (e) => { e.stopPropagation(); onRemove(); };
        return pill;
    }

    function renderDepartmentPills() {
        departmentSelector.querySelectorAll('.department-pill').forEach(p => p.remove());
        selectedDepartments.forEach(dept => {
            const pill = createPill(dept, () => removeDepartment(dept));
            pill.classList.add('department-pill');
            departmentSelector.insertBefore(pill, departmentPlaceholder);
        });
        departmentPlaceholder.classList.toggle('hidden', selectedDepartments.length > 0);
    }
    function renderDepartmentList(searchTerm = '') {
        departmentList.innerHTML = '';
        departments.filter(d => d.toLowerCase().includes(searchTerm.toLowerCase())).forEach(dept => {
            const li = document.createElement('li');
            li.className = 'p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center';
            li.textContent = dept;
            li.onclick = () => toggleDepartment(dept);
            if (selectedDepartments.includes(dept)) {
                li.innerHTML += '<i class="bi bi-check-lg text-indigo-600"></i>';
                li.classList.add('font-semibold');
            }
            departmentList.appendChild(li);
        });
    }
    function renderStaffPills() {
        staffSelector.querySelectorAll('.staff-pill').forEach(p => p.remove());
        selectedStaff.forEach(staffId => {
            const emp = employees.find(e => e.id == staffId);
            const pill = createPill(`${emp.lastName}, ${emp.firstName}`, () => removeStaff(staffId));
            pill.classList.add('staff-pill');
            staffSelector.insertBefore(pill, staffPlaceholder);
        });
        staffPlaceholder.classList.toggle('hidden', selectedStaff.length > 0);
    }
    function renderStaffList(searchTerm = '') {
        staffList.innerHTML = '';
        employees.filter(e => `${e.firstName} ${e.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())).forEach(emp => {
            const li = document.createElement('li');
            li.className = 'p-2 hover:bg-gray-100 cursor-pointer flex justify-between items-center';
            li.textContent = `${emp.lastName}, ${emp.firstName}`;
            li.onclick = () => toggleStaff(emp.id);
            if (selectedStaff.includes(emp.id)) {
                li.innerHTML += '<i class="bi bi-check-lg text-indigo-600"></i>';
                li.classList.add('font-semibold');
            }
            staffList.appendChild(li);
        });
    }

    // --- FILTERING & SORTING LOGIC --- 
    function sortGroupedData(groupedDataArray) {
        const { by, direction } = sortState;
        groupedDataArray.sort((a, b) => {
            let comparison = 0;
            if (by === 'name') {
                const nameA = `${a.employee.lastName}, ${a.employee.firstName}`.toLowerCase();
                const nameB = `${b.employee.lastName}, ${b.employee.firstName}`.toLowerCase();
                if (nameA < nameB) comparison = -1;
                if (nameA > nameB) comparison = 1;
            } else if (by === 'hours') {
                if (a.employee.type === 'Hourly' && b.employee.type === 'Salary') return -1;
                if (a.employee.type === 'Salary' && b.employee.type === 'Hourly') return 1;
                if (a.employee.type === 'Hourly' && b.employee.type === 'Hourly') {
                    const hoursA = a.entries.reduce((total, entry) => {
                        const duration = calculateHours(entry.punchIn, entry.punchOut);
                        return total + (duration.hours * 60 + duration.minutes);
                    }, 0);
                    const hoursB = b.entries.reduce((total, entry) => {
                        const duration = calculateHours(entry.punchIn, entry.punchOut);
                        return total + (duration.hours * 60 + duration.minutes);
                    }, 0);
                    comparison = hoursA - hoursB;
                }
            }
            return direction === 'asc' ? comparison : -comparison;
        });
        return groupedDataArray;
    }

    function applyFilters() {
        const status = document.getElementById('statusFilter').value;
        const type = document.getElementById('employeeType').value;
        const from = fromDateEl.value;
        const to = toDateEl.value;
        let filtered = timeEntries.filter(entry => {
            const emp = employees.find(e => e.id === entry.employeeId);
            if (status !== 'All' && emp.status !== status) return false;
            if (type !== 'All' && emp.type !== type) return false;
            if (from && entry.date < from) return false;
            if (to && entry.date > to) return false;
            if (selectedStaff.length > 0 && !selectedStaff.includes(emp.id)) return false;
            if (selectedDepartments.length > 0 && !selectedDepartments.includes(emp.department)) return false;
            return true;
        });

        const groupedByEmployee = filtered.reduce((acc, entry) => {
            const emp = employees.find(e => e.id === entry.employeeId);
            if (!acc[emp.id]) acc[emp.id] = { employee: emp, entries: [] };
            acc[emp.id].entries.push(entry);
            return acc;
        }, {});
        let groupedDataArray = Object.values(groupedByEmployee);
        const sortedData = sortGroupedData(groupedDataArray);
        renderTable(sortedData);

        if (window.innerWidth < 640) {
            const collapsibleFilters = document.getElementById('collapsible-filters');
            const toggleFiltersText = document.getElementById('toggle-filters-text');
            collapsibleFilters.classList.add('hidden');
            toggleFiltersText.textContent = 'Show Filters';
        }
    }

    // --- MULTI-SELECT EVENT HANDLING --- 
    window.toggleDepartment = (dept) => { selectedDepartments.includes(dept) ? selectedDepartments = selectedDepartments.filter(d => d !== dept) : selectedDepartments.push(dept); renderDepartmentPills(); renderDepartmentList(departmentSearch.value); };
    window.removeDepartment = (dept) => { selectedDepartments = selectedDepartments.filter(d => d !== dept); renderDepartmentPills(); renderDepartmentList(departmentSearch.value); };
    departmentSelector.addEventListener('click', () => { departmentDropdown.classList.toggle('hidden'); if (!departmentDropdown.classList.contains('hidden')) departmentSearch.focus(); });
    departmentSearch.addEventListener('input', () => renderDepartmentList(departmentSearch.value));

    window.toggleStaff = (id) => { selectedStaff.includes(id) ? selectedStaff = selectedStaff.filter(s => s !== id) : selectedStaff.push(id); renderStaffPills(); renderStaffList(staffSearch.value); };
    window.removeStaff = (id) => { selectedStaff = selectedStaff.filter(s => s !== id); renderStaffPills(); renderStaffList(staffSearch.value); };
    staffSelector.addEventListener('click', () => { staffDropdown.classList.toggle('hidden'); if (!staffDropdown.classList.contains('hidden')) staffSearch.focus(); });
    staffSearch.addEventListener('input', () => renderStaffList(staffSearch.value));

    document.addEventListener('click', (e) => {
        if (!departmentSelector.parentElement.contains(e.target)) departmentDropdown.classList.add('hidden');
        if (!staffSelector.parentElement.contains(e.target)) staffDropdown.classList.add('hidden');
    });

    // --- MODAL LOGIC --- 
    window.openModal = (modalId) => { document.getElementById(modalId).classList.remove('hidden'); modalBackdrop.classList.remove('hidden'); };
    window.closeModal = (modalId) => { document.getElementById(modalId).classList.add('hidden'); modalBackdrop.classList.add('hidden'); };
    modalBackdrop.addEventListener('click', () => { ['profile-modal', 'add-time-modal', 'punch-details-modal', 'update-time-modal'].forEach(closeModal); });
    window.openProfileModal = (employeeId) => openModal('profile-modal');
    window.openPunchDetailsModal = (entryId) => openModal('punch-details-modal');

    function openAddTimeModalForEmployee(employeeId) {
        const body = document.getElementById('add-time-body');
        const footer = document.getElementById('add-time-footer');
        body.innerHTML = ''; 
        footer.innerHTML = '';

        const employee = employees.find(e => e.id == employeeId);
        document.getElementById('add-time-title').textContent = `Add New Time Entry for ${employee.firstName} ${employee.lastName}`;

        const timeFieldsContainer = document.createElement('div');
        timeFieldsContainer.id = 'modal-time-fields-container';
        timeFieldsContainer.className = 'space-y-4 pt-4';
        body.appendChild(timeFieldsContainer);

        renderTimeFieldsForEmployee(employeeId, timeFieldsContainer, footer);
        openModal('add-time-modal');
    }
    window.openAddTimeModalForEmployee = openAddTimeModalForEmployee;

    function updateRemoveButtonsVisibility() {
        const timeSlots = document.querySelectorAll('#modal-time-fields-container .time-period-group');
        const show = timeSlots.length > 1;
        timeSlots.forEach(slot => {
            const removeBtn = slot.querySelector('.remove-time-slot-btn');
            if (removeBtn) removeBtn.classList.toggle('hidden', !show);
        });
    }
    function renderTimeFieldsForEmployee(employeeId, container, footerContainer) {
        container.innerHTML = ''; footerContainer.innerHTML = ''; if (!employeeId) return;
        const employee = employees.find(e => e.id == employeeId);
        const createTimeEntryFields = () => {
            const wrapper = document.createElement('div');
            wrapper.className = 'p-3 border rounded-md bg-gray-50 time-period-group relative';
            if (employee.type === 'Hourly') {
                wrapper.innerHTML = `<button class="remove-time-slot-btn hidden absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600">&times;</button><div class="grid grid-cols-1 sm:grid-cols-3 gap-4"><div><label class="block text-sm font-medium text-gray-700">Date</label><input type="date" class="mt-1 block w-full border-gray-300 rounded-md p-2"></div><div><label class="block text-sm font-medium text-gray-700">Punch In</label><input type="time" class="mt-1 block w-full border-gray-300 rounded-md p-2"></div><div><label class="block text-sm font-medium text-gray-700">Punch Out</label><input type="time" class="mt-1 block w-full border-gray-300 rounded-md p-2"></div></div>`;
                wrapper.querySelector('.remove-time-slot-btn').onclick = function () { this.parentElement.remove(); updateRemoveButtonsVisibility(); };
            } else {
                wrapper.innerHTML = `<div><label class="block text-sm font-medium text-gray-700">Date</label><input type="date" class="mt-1 block w-full border-gray-300 rounded-md p-2"></div>`;
            }
            return wrapper;
        };
        container.appendChild(createTimeEntryFields());
        updateRemoveButtonsVisibility();
        let addPeriodBtnHTML = employee.type === 'Hourly' ? `<button id="add-another-period-btn" class="px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 text-sm flex items-center"><i class="bi bi-plus-lg mr-2"></i>Add another period</button>` : `<div></div>`;
        footerContainer.innerHTML = `${addPeriodBtnHTML}<div><button class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-2" onclick="closeModal('add-time-modal')">Cancel</button><button class="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Save Entry</button></div>`;
        if (employee.type === 'Hourly') {
            footerContainer.querySelector('#add-another-period-btn').onclick = () => { container.appendChild(createTimeEntryFields()); updateRemoveButtonsVisibility(); };
        }
    }

    window.openUpdateTimeModal = (entryId) => {
        const entry = timeEntries.find(e => e.id === entryId);
        const employee = employees.find(e => e.id === entry.employeeId);
        const body = document.getElementById('update-time-body');
        const footer = document.getElementById('update-time-footer');
        const title = document.getElementById('update-time-title');
        title.textContent = `Update Entry for ${employee.firstName} ${employee.lastName} on ${new Date(entry.date + 'T00:00:00').toLocaleDateString()}`;

        const showConfirmationView = () => {
            body.innerHTML = ` 
                 <div id="remove-confirmation" class="text-center"> 
                     <p class="text-gray-700">Are you sure you want to remove this time period?</p> 
                     <p class="text-sm text-gray-500">${formatTime(entry.punchIn)} - ${formatTime(entry.punchOut)}</p> 
                 </div> 
             `;
            footer.innerHTML = ` 
                 <div class="w-full flex justify-end"> 
                     <button id="cancel-remove" class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-2">Cancel</button> 
                     <button id="confirm-remove" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Yes, Remove</button> 
                 </div> 
             `;
            footer.querySelector('#cancel-remove').onclick = showUpdateView;
            footer.querySelector('#confirm-remove').onclick = () => {
                const index = timeEntries.findIndex(e => e.id === entryId);
                if (index > -1) timeEntries.splice(index, 1);
                closeModal('update-time-modal');
                applyFilters();
            };
        };

        const showUpdateView = () => {
            if (employee.type === 'Hourly') {
                body.innerHTML = ` 
                     <div id="update-fields"> 
                         <div class="grid grid-cols-2 gap-4"> 
                             <div><label class="block text-sm font-medium text-gray-700">Punch In</label><input type="time" id="update-punch-in" value="${entry.punchIn}" class="mt-1 block w-full border-gray-300 rounded-md p-2"></div> 
                             <div><label class="block text-sm font-medium text-gray-700">Punch Out</label><input type="time" id="update-punch-out" value="${entry.punchOut}" class="mt-1 block w-full border-gray-300 rounded-md p-2"></div> 
                         </div> 
                     </div> 
                 `;
                footer.innerHTML = ` 
                     <div class="flex justify-between w-full items-center"> 
                         <button id="show-remove-confirmation" class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm">Remove Period</button> 
                         <div> 
                             <button class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-2" onclick="closeModal('update-time-modal')">Cancel</button> 
                             <button id="save-update-changes" class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">Save Changes</button> 
                         </div> 
                     </div> 
                 `;
                footer.querySelector('#show-remove-confirmation').onclick = showConfirmationView;

            } else { // Salary 
                body.innerHTML = `<p>Are you sure you want to remove the "Present" status for this day?</p>`;
                footer.innerHTML = ` 
                     <div class="w-full flex justify-end"> 
                         <button class="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 mr-2" onclick="closeModal('update-time-modal')">Cancel</button> 
                         <button class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700">Remove Entry</button> 
                     </div> 
                 `;
            }
        };

        showUpdateView();
        openModal('update-time-modal');
    };

    // --- INITIALIZATION --- 
    function init() {
        const toggleFiltersBtn = document.getElementById('toggle-filters-btn');
        const collapsibleFilters = document.getElementById('collapsible-filters');
        const toggleFiltersText = document.getElementById('toggle-filters-text');
        const mobileSubmitContainer = document.getElementById('mobile-submit-container');
        const mobileSubmitBtn = document.getElementById('mobile-submit-btn');
        mobileSubmitBtn.addEventListener('click', applyFilters);

        function setInitialFilterVisibility() {
            if (window.innerWidth < 640) { // Tailwind's 'sm' breakpoint
                collapsibleFilters.classList.add('hidden');
                toggleFiltersText.textContent = 'Show Filters';
                mobileSubmitContainer.classList.remove('hidden'); // Ensure mobile submit button is visible
            } else {
                collapsibleFilters.classList.remove('hidden');
                toggleFiltersText.textContent = 'Hide Filters';
                mobileSubmitContainer.classList.add('hidden');
            }
        }

        toggleFiltersBtn.addEventListener('click', () => {
            collapsibleFilters.classList.toggle('hidden');
            const isHidden = collapsibleFilters.classList.contains('hidden');
            toggleFiltersText.textContent = isHidden ? 'Show Filters' : 'Hide Filters';
        });

        window.addEventListener('resize', () => {
            if (window.innerWidth >= 640) {
                collapsibleFilters.classList.remove('hidden');
                toggleFiltersText.textContent = 'Hide Filters';
                mobileSubmitContainer.classList.add('hidden');
            } else {
                // If window is resized to mobile, hide filters by default
                collapsibleFilters.classList.add('hidden');
                toggleFiltersText.textContent = 'Show Filters';
                mobileSubmitContainer.classList.remove('hidden'); // Ensure mobile submit button is visible
            }
        });

        setInitialFilterVisibility();
        
        fromDateEl.value = '2025-08-12';
        toDateEl.value = '2025-08-14';
        generateMockData();

        function updateSortIcons() {
            document.querySelectorAll('[data-sort-icon]').forEach(icon => {
                const key = icon.dataset.sortIcon;
                if (key === sortState.by) {
                    icon.classList.remove('opacity-20');
                    icon.innerHTML = sortState.direction === 'asc' ? '<i class="bi bi-sort-down"></i>' : '<i class="bi bi-sort-up"></i>';
                } else {
                    icon.classList.add('opacity-20');
                    icon.innerHTML = '<i class="bi bi-arrow-down-up"></i>';
                }
            });
        }

        document.querySelectorAll('[data-sort-by]').forEach(header => {
            header.addEventListener('click', () => {
                const newSortBy = header.dataset.sortBy;
                if (sortState.by === newSortBy) {
                    sortState.direction = sortState.direction === 'asc' ? 'desc' : 'asc';
                } else {
                    sortState.by = newSortBy;
                    sortState.direction = 'asc';
                }
                updateSortIcons();
                applyFilters();
            });
        });

        renderDepartmentList();
        renderStaffList();
        updateSortIcons();

        tableBody.innerHTML = `<tr><td colspan="6" class="text-center p-8 text-gray-500">Adjust filters and click 'Submit' to view attendance records.</td></tr>`;

        document.getElementById('submitFilters').addEventListener('click', applyFilters);
    }

    init();
});