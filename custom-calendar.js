(function($) {
    $.fn.customCalendar = function(options) {
        // Default settings with basic styles for the highlighted date
        const settings = $.extend({
            year: new Date().getFullYear(),
            month: new Date().getMonth() + 1, // JavaScript months are 0-based
            startDay: 0, // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
            highlightToday: true, // Option to highlight today's date
            highlightStyle: {
                color: 'white',
                fontSize: options.fontSize,
                backgroundColor: '#0d6efd'
            },
			color: 'black',
            fontSize: '16px',
            backgroundColor: 'white',
            navigation_prev: true, // Option to show/hide the previous navigation button
            navigation_next: true,  // Option to show/hide the next navigation button
			classname: '',
			tableBorder: false,
			events: [], // List of events with day and color
			width: '400px', // Width setting for the calendar
            changeYear: false, // Option to show/hide the year dropdown
            changeMonth: false, // Option to show/hide the month dropdown
			disabledDates: [],
			datepicker: false, // for datepicker mode
            onSelect: null,    // Callback function for date selection
			dateFormat: 'YYYY-MM-DD',
        }, options);
		
		let selectedDate = null;  // Store the selected date globally
		
		const formatDate = (date, format) => {
			// Ensure the date is parsed correctly
			const d = new Date(date);
			if (isNaN(d)) {
				console.error('Invalid date:', date);
				return '';
			}

			// Define the mapping for formatting
			const map = {
				YYYY: d.getFullYear(),
				MM: String(d.getMonth() + 1).padStart(2, '0'), // Months are zero-based
				DD: String(d.getDate()).padStart(2, '0'),
			};

			// Replace placeholders in the format string
			return format.replace(/YYYY|MM|DD/g, (key) => map[key]);
		};

		
		
		if (options.width) {
			const updateCalendarWidth = () => {
				const windowWidth = $(window).width();
				const newWidth = windowWidth < 768 ? '100%' : options.width;
				$('.custom-calendar').css('width', newWidth);
			};
			
			//$('.custom-calendar').css('width', options.width);
			
			$(window).on('resize', updateCalendarWidth);
			updateCalendarWidth();
		}
		
		var styleTag = '';
		if(settings.color)
		{
			styleTag += `color: ${settings.color};`;
			$('.custom-calendar').css('color', settings.color);
		}
		if(settings.fontSize)
		{
			styleTag += `font-size: ${settings.fontSize};`;
			$('.custom-calendar').css('font-ize', settings.fontSize);
		}
		if(settings.backgroundColor)
		{
			styleTag += `background-color: ${settings.backgroundColor};`;
			$('.custom-calendar').css('background-color', settings.backgroundColor);
		}
		
		

        // Days of the week
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Adjust the days of the week based on startDay
        const adjustedDaysOfWeek = daysOfWeek.slice(settings.startDay).concat(daysOfWeek.slice(0, settings.startDay));

        // Render the calendar
        const renderCalendar = ($calendar, year, month) => {
            $calendar.empty(); // Clear previous content

            // Create table structure
            let table = `<table class="calendar ${settings.tableBorder ? 'calendar-border' : ''}" style="${styleTag}">
                <thead>
                    <tr class="navigation">`;
					
			// Conditionally render previous button
            if (settings.navigation_prev) {
                table += `<td class="navigation_prev">«</td>`;
            }
			else {
				table += `<td></td>`;
			}
			
			if (settings.changeMonth) {
				var monthChange = `<select class="month-selector">${generateMonthOptions(month)}</select>`;
			}
			else {
				var monthChange = `${new Date(year, month - 1).toLocaleString('default', { month: 'long' })}`;
			}
			
			if (settings.changeYear) {
				var yearChange = `<select class="year-selector">${generateYearOptions(year)}</select>`;
			}
			else {
				var yearChange = `${year}`;
			}
			
			// Render the month/year title
            table += `<td class="navigation_header" colspan="5">
                        <span class="navigation_title">
							${monthChange}
							${yearChange}
						</span>
                    </td>`;
			
					
			// Conditionally render next button
            if (settings.navigation_next) {
                table += `<td class="navigation_next">»</td>`;
            }
			else {
				table += `<td></td>`;
			}

            table += `</tr>
                    <tr>`;

            // Add adjusted day headers
            for (const day of adjustedDaysOfWeek) {
                table += `<th class="${settings.classname ? settings.classname : ''}">${day}</th>`;
            }

            table += `</tr>
                </thead>
                <tbody>
                    <tr>`;

            // Get the first day and number of days in the month
            const firstDay = new Date(year, month - 1, 1).getDay();
            const daysInMonth = new Date(year, month, 0).getDate();

            // Calculate the starting position based on startDay
            const adjustedFirstDay = (firstDay - settings.startDay + 7) % 7;

            // Add empty cells for days before the 1st
            for (let i = 0; i < adjustedFirstDay; i++) {
                table += `<td class="empty"></td>`;
            }
			
			
            let dayCount = 1;
			const eventMap = groupEventsByDate(settings.events);
			
			for (let i = adjustedFirstDay; i < 7; i++) {
                if (dayCount <= daysInMonth) {
                    table += renderDayCell(year, month, dayCount++, eventMap, settings.disabledDates);
                }
            }
			
			/* for (let i = adjustedFirstDay; i < 7; i++) {
				const isToday = settings.highlightToday && year === new Date().getFullYear() && month === new Date().getMonth() + 1 && dayCount === new Date().getDate();
				const style = isToday ? `style="color: ${settings.color}; font-size: ${settings.fontSize}; background-color: ${settings.backgroundColor};"`: '';
				const highlightStyle = isToday ? `style="color: ${settings.highlightStyle.color}; font-size: ${settings.highlightStyle.fontSize}; background-color: ${settings.highlightStyle.backgroundColor};"`: '';
				
				const weekendClass = (i === 6) && settings.classname ? `${settings.classname}` : '';
                //table += `<td ${style}>${dayCount++}</td>`;
				
				// Format the full date in YYYY-MM-DD format
                const currentDate = `${year}-${month.toString().padStart(2, '0')}-${dayCount.toString().padStart(2, '0')}`;
                const eventsForDay = eventMap[currentDate] || [];
				
				// Check for events on this day
                /* const event = settings.events.find(event => event.date === currentDate);
                const eventDot = event ? `<div class="event-dot" style="background-color: ${event.color};"></div>` : '';
				const eventName = event ? event.name : '';
				const eventClass = event && event.name ? 'calendar-day' : ''; */
				
                //table += `<td class="${weekendClass} ${eventClass}" data-event-name="${eventName}"><span class="${isToday ? 'today' : ''}">${dayCount++}</span>${eventDot}</td>`;
				
				/* table += `<td class="${weekendClass} calendar-day" data-date="${currentDate}"><span class="${isToday ? 'today' : ''}" ${highlightStyle} >${dayCount++}</span><div class="multievent">`;

                // Display event dots or names if there are events for the day
                if (eventsForDay.length > 0) {
                    eventsForDay.forEach(event => {
                        table += `<div class="event-dot" style="background-color: ${event.color};" data-events="${eventsForDay.map(e => e.name).join(', ')}"></div>`;
                    });
                }

                table += `</div></td>`;
            } */

            table += `</tr>`;

            // Add the remaining rows
            while (dayCount <= daysInMonth) {
                table += `<tr>`;
                for (let i = 0; i < 7; i++) {
                    if (dayCount > daysInMonth) {
                        table += `<td class="empty"></td>`;
                    } else {
						
						table += renderDayCell(year, month, dayCount++, eventMap, settings.disabledDates);
						
						/* const isToday = settings.highlightToday && year === new Date().getFullYear() && month === new Date().getMonth() + 1 && dayCount === new Date().getDate();
						const style = isToday ? `style="color: ${settings.color}; font-size: ${settings.fontSize}; background-color: ${settings.backgroundColor};"`: '';
						const highlightStyle = isToday ? `style="color: ${settings.highlightStyle.color}; font-size: ${settings.highlightStyle.fontSize}; background-color: ${settings.highlightStyle.backgroundColor};"`: '';
						
						const weekendClass = (i === 6) && settings.classname ? `${settings.classname}` : '';
						
						// Format the full date in YYYY-MM-DD format
                        const currentDate = `${year}-${month.toString().padStart(2, '0')}-${dayCount.toString().padStart(2, '0')}`;
						const eventsForDay = eventMap[currentDate] || [];

                        // Check for events on this date
                        /* const event = settings.events.find(event => event.date === currentDate);
                        const eventDot = event ? `<div class="event-dot" style="background-color: ${event.color};"></div>` : '';
						const eventName = event ? event.name : '';
						const eventClass = event && event.name ? 'calendar-day' : ''; */
						
						//table += `<td class="${weekendClass} ${eventClass}" data-event-name="${eventName}" ><span class="${isToday ? 'today' : ''}">${dayCount++}</span>${eventDot}</td>`;
						
						/* table += `<td class="${weekendClass} calendar-day" data-date="${currentDate}"><span class="${isToday ? 'today' : ''}" ${highlightStyle} >${dayCount++}</span><div class="multievent">`;

						// Display event dots or names if there are events for the day
						if (eventsForDay.length > 0) {
							eventsForDay.forEach(event => {
								table += `<div class="event-dot" style="background-color: ${event.color};" data-events="${eventsForDay.map(e => e.name).join(', ')}"></div>`;
							});
						}

						table += `</div></td>`; */
                    }
                }
                table += `</tr>`;
            }

            table += `</tbody>
                </table>`;

            // Append the table to the calendar container
            $calendar.append(table);

            // Add navigation button functionality (only if they are enabled)
            if (settings.navigation_prev) {
                $calendar.find('.navigation_prev').click(() => {
                    if (month === 1) {
                        renderCalendar($calendar, year - 1, 12);
                    } else {
                        renderCalendar($calendar, year, month - 1);
                    }
                });
            }

            if (settings.navigation_next) {
                $calendar.find('.navigation_next').click(() => {
                    if (month === 12) {
                        renderCalendar($calendar, year + 1, 1);
                    } else {
                        renderCalendar($calendar, year, month + 1);
                    }
                });
            }
			
			// Add event listeners for the dropdown and buttons
            $calendar.find('.month-selector').val(month - 1).change(function() {
                const selectedMonth = parseInt($(this).val()) + 1;
                renderCalendar($calendar, year, selectedMonth);
            });

            $calendar.find('.year-selector').val(year).change(function() {
                const selectedYear = $(this).val();
                renderCalendar($calendar, selectedYear, month);
            });

            
			// Display event name on hover
            /* $calendar.find('.calendar-day').hover(function() {
                const eventName = $(this).data('event-name');
                if (eventName) {
                    // Display event name in tooltip
                    $(this).attr('title', eventName);
                }
            }, function() {
                // Remove the tooltip on mouse leave
                $(this).removeAttr('title');
            }); */
			
			// Show events on hover over dots
            $calendar.find('.event-dot').hover(function() {
                const events = $(this).data('events');
                $(this).attr('title', events);
            }, function() {
                $(this).removeAttr('title');
            });
			
			// Handle day click for datepicker mode
            $calendar.find('td[data-date]').click(function () {
                if (settings.datepicker && !$(this).hasClass('disabled-date')) {
                    selectedDate = $(this).data('date');
					const formattedDate = formatDate(selectedDate, settings.dateFormat);
                    if (typeof settings.onSelect === 'function') {
                        settings.onSelect(formattedDate);
                    }
                }
            });

			// Add event listeners for date selection
            $calendar.find('.calendar-day').on('click', function () {
				if (!$(this).hasClass('disabled-date')) {
                    selectedDate = $(this).data('date');
                    const formattedDate = formatDate(selectedDate, settings.dateFormat);
					//selectedDate = selectedDate;
					$calendar.data('selectedDate', selectedDate);
                    $calendar.find('.calendar-day').removeClass('selected-date');
                    $(this).addClass('selected-date');
					/* if (settings.datepicker) {
                        $input.val(formattedDate); // Set the selected date in the input field
                    } */
                }
            });
        };
		
		const groupEventsByDate = (events) => {
            const eventMap = {};
            events.forEach(event => {
                if (!eventMap[event.date]) {
                    eventMap[event.date] = [];
                }
                eventMap[event.date].push(event);
            });
            return eventMap;
        };
		
		const renderDayCell = (year, month, day, eventMap, disabledDates) => {
			
			const isToday = settings.highlightToday && year === new Date().getFullYear() && month === new Date().getMonth() + 1 && day === new Date().getDate();
			const style = isToday ? `style="color: ${settings.color}; font-size: ${settings.fontSize}; background-color: ${settings.backgroundColor};"`: '';
			const highlightStyle = isToday ? `style="color: ${settings.highlightStyle.color}; font-size: ${settings.highlightStyle.fontSize}; background-color: ${settings.highlightStyle.backgroundColor};"`: '';
			
			// Format the full date in YYYY-MM-DD format
            const currentDate = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
			
			const isSelected = currentDate === selectedDate;  // Check if the date is selected
			
			const weekendClass = settings.classname && isWeekend(currentDate) ? `${settings.classname}` : '';
			
            const isDisabled = disabledDates.includes(currentDate);
            const eventsForDay = eventMap[currentDate] || [];
            
			const styleClass = isDisabled ? `disabled-date` : isToday ? `today` : '';
			const styleHighlightClass = isDisabled && isToday ? `style="font-weight: bold;"` : `${highlightStyle}`;

            let cell = `<td class="${weekendClass} calendar-day ${isDisabled ? 'disabled-date' : ''} ${isSelected ? ' selected-date' : ''} " data-date="${currentDate}" ${isDisabled ? 'disabled' : ''} >`;
            cell += `<span class="${styleClass} date-number" ${styleHighlightClass} >${day}</span><div class="multievent">`;
			
			// Display event dots or names if there are events for the day
            if (eventsForDay.length > 0) {
                eventsForDay.forEach(event => {
                    cell += `<div class="event-dot" style="background-color: ${event.color};" data-events="${eventsForDay.map(e => e.name).join(', ')}"></div>`;
                });
            }

            return cell + `</div></td>`;
        };
		
		const isWeekend = (dateString) => {
            const date = new Date(dateString);
            //return date.getDay() === 0 || date.getDay() === 6;
            return date.getDay() === 0;
        };
		
		// Helper function to generate month options
        const generateMonthOptions = (selectedMonth) => {
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            return months.map((month, index) => 
                `<option value="${index}" ${index === selectedMonth - 1 ? 'selected' : ''}>${month}</option>`
            ).join('');
        };
		
		// Helper function to generate year options
        const generateYearOptions = (selectedYear) => {
            const currentYear = new Date().getFullYear();
            const years = [];
            //for (let i = currentYear - 100; i <= currentYear + 100; i++) {
            for (let i = 1900; i <= currentYear + 10; i++) {
                years.push(`<option value="${i}" ${i === selectedYear ? 'selected' : ''}>${i}</option>`);
            }
            return years.join('');
        };

        // Render the initial calendar
        return this.each(function() {
            
			const $calendar = $(this);
			let $input = $calendar;
			
			if (settings.datepicker) {
				$input = $calendar;
                const $dropdown = $('<div class="datepicker-dropdown" style="position: absolute; display: none; z-index: 1000;"></div>');

                $('body').append($dropdown);
				
				const positionDropdown = () => {
                    const inputOffset = $input.offset();
                    const inputHeight = $input.outerHeight();
					const inputWidth = $input.outerWidth();
                    const calendarWidth = $dropdown.outerWidth();
					
					const windowWidth = $(window).width();
					
					const dropdownWidth = windowWidth < 768 ? windowWidth * 0.9 : 350;
					
					const dropdownLeft = windowWidth < 768 ? (windowWidth - dropdownWidth) / 2 : inputOffset.left;
					
                    $dropdown.css({
                        top: inputOffset.top + inputHeight,
                        left: dropdownLeft,
                        //minWidth: inputWidth > calendarWidth ? inputWidth : calendarWidth,
						//width: $input.outerWidth(),
						width: dropdownWidth,
                    });
                };
				
				// Set the input to readonly so typing is disabled
                $input.attr('readonly', true);
				
                $input.on('focus', function () {
                    positionDropdown();
                    $dropdown.show();
                    renderCalendar($dropdown, settings.year, settings.month);
                });
				
				$(window).on('resize scroll', function () {
                    if ($dropdown.is(':visible')) {
                        positionDropdown();
                    }
                });

                $(document).on('click', function (e) {
                    if (!$(e.target).closest($dropdown).length && !$(e.target).is($input)) {
                        $dropdown.hide();
                    }
                });
				
				$dropdown.on('click', 'td[data-date]', function () {
                    if (!$(this).hasClass('disabled-date')) {
                        selectedDate = $(this).data('date');
						const formattedDate = formatDate(selectedDate, settings.dateFormat);
						
						$dropdown.find('.calendar-day').removeClass('selected-date');
						$(this).addClass('selected-date');
					
					
                        $input.val(formattedDate);
						//selectedDate = selectedDate; // Store the selected date
						console.log('Selected date:', formattedDate);
                        $dropdown.hide();

                        if (typeof settings.onSelect === 'function') {
                            settings.onSelect(formattedDate);
                        }
                    }
                });
				
				// Disable cut, copy, and paste in input field when datepicker is true
                $input.on('cut copy paste', function (e) {
                    e.preventDefault(); // Prevent the default action
                });
				
				// Disable keypress, keydown, and keyup to prevent typing
                $input.on('keydown keypress keyup', function (e) {
                    e.preventDefault(); // Prevent any keyboard input
                });
				
            } else {
                renderCalendar($calendar, settings.year, settings.month);
            }
        });
    };
})(jQuery);
