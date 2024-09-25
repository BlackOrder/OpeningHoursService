import opening_hours from 'opening_hours';
import { fromZonedTime, toZonedTime, format } from 'date-fns-tz';
/**
 * A service class for managing opening hours for a business.
 * Handles adding, removing, querying, and validating opening hours, along with timezone conversion.
 */
export class OpeningHoursService {
    openingHours = [];
    userTimezone; // Timezone of the user (default is the user's local timezone)
    openingHoursInstance = new opening_hours('Mo-Su closed'); // Default: closed all days
    /**
     * Initializes the OpeningHoursService.
     * Stores opening hours, handles timezone conversion, and manages operations like adding/removing hours.
     *
     * @param {OpeningHoursSpecification[]} [initialHours] - Optional initial opening hours data.
     * @param {string} [timezone] - The timezone of the input data (default is the user's local timezone).
     */
    constructor(initialHours, timezone) {
        // Default to the user's local timezone if none is provided
        this.userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        const inputTimezone = timezone || this.userTimezone;
        if (initialHours && initialHours.length > 0) {
            this.setOpeningHours(initialHours, inputTimezone);
        }
    }
    /** Public Methods **/
    /**
     * Sets the opening hours, handling splitting of entries that span multiple days.
     * Converts times from the input timezone to the user's timezone, sorts them, and ensures data integrity.
     *
     * @param {OpeningHoursSpecification[]} hours - Array of opening hours specifications.
     * @param {string} [timezone=this.userTimezone] - The timezone of the input data (default is the user's timezone).
     */
    setOpeningHours(hours, timezone = this.userTimezone) {
        // Step 1: Normalize and check if closes is before opens, throwing an error if invalid
        const preprocessedHours = this.preprocessOpeningHours(hours);
        // Step 2: Convert times to user's timezone, adjusting days if necessary
        const convertedHours = preprocessedHours.flatMap(spec => {
            return this.convertAndSplitEntry(spec, timezone, this.userTimezone);
        });
        // Step 3: Combine adjacent times on the same day
        const combinedHours = this.combineAndCheckIntegrity(convertedHours);
        // Update internal data
        this.openingHours = combinedHours;
        // Regenerate the opening_hours instance
        this.generateOpeningHoursInstance();
    }
    /**
     * Exports the current opening hours data, converting it to a specified timezone.
     * Handles splitting entries if the conversion causes day changes.
     *
     * @param {string} [timezone=this.userTimezone] - The timezone of the exported data (default is the user's timezone).
     * @returns {OpeningHoursSpecification[]} - Array of opening hours in the specified timezone.
     */
    exportOpeningHours(timezone = this.userTimezone) {
        // Step 1: Convert times to the requested timezone, adjusting days if necessary
        const convertedHours = this.openingHours.flatMap(spec => {
            return this.convertAndSplitEntry(spec, this.userTimezone, timezone);
        });
        // Step 2: Combine adjacent times on the same day
        const combinedHours = this.combineAndCheckIntegrity(convertedHours);
        return combinedHours;
    }
    /**
     * Checks if the establishment is currently open based on the current time.
     *
     * @returns {boolean} - True if the establishment is open, false otherwise.
     */
    isOpenNow() {
        const localNow = new Date();
        return this.openingHoursInstance.getState(localNow);
    }
    /**
     * Checks if the business is currently closed.
     *
     * @returns {boolean} - True if the business is currently closed, false otherwise.
     */
    isClosedNow() {
        return !this.isOpenNow();
    }
    /**
     * Checks if the establishment is always open.
     *
     * @returns {boolean} - True if the establishment is always open, false otherwise.
     */
    isAlwaysOpen() {
        return this.isOpenNow() && this.getNextChange() === null;
    }
    /**
     * Checks if the establishment is always closed.
     *
     * @returns {boolean} - True if the establishment is always closed, false otherwise.
     */
    isAlwaysClosed() {
        return this.isClosedNow() && this.getNextChange() === null;
    }
    /**
     * Checks if the establishment is open at a specific date and time.
     *
     * @param {Date} date - The specific date and time to check.
     * @returns {boolean} - True if the establishment is open, false otherwise.
     */
    isOpenAt(date) {
        return this.openingHoursInstance.getState(date);
    }
    /**
     * Checks if the establishment is closed at a specific date and time.
     *
     * @param {Date} date - The specific date and time to check.
     * @returns {boolean} - True if the establishment is closed, false otherwise.
     */
    isClosedAt(date) {
        return !this.isOpenAt(date);
    }
    getOpeningHoursInstance() {
        return this.openingHoursInstance;
    }
    /**
     * Checks if the business will remain open for the specified duration from the current time.
     *
     * @param {number} durationInMinutes - The duration to check in minutes.
     * @param {Date} [date=new Date()] - The reference date and time to check from.
     * @returns {boolean} - True if the business will remain open for the specified duration, false otherwise.
     */
    isOpenForDuration(durationInMinutes, date = new Date()) {
        const openWindow = this.openMinutesWindow(date);
        return openWindow >= durationInMinutes;
    }
    /**
     * Checks if the business will remain closed for the specified duration from the current time.
     *
     * @param {number} durationInMinutes - The duration to check in minutes.
     * @param {Date} [date=new Date()] - The reference date and time to check from.
     * @returns {boolean} - True if the business will remain closed for the specified duration, false otherwise.
     */
    isClosedForDuration(durationInMinutes, date = new Date()) {
        const closeWindow = this.closeMinutesWindow(date);
        return closeWindow >= durationInMinutes;
    }
    /**
     * Gets the number of minutes the business will remain open from the specified date and time.
     *
     * @param {Date} [date=new Date()] - The reference date and time to check from.
     * @returns {number} - The number of minutes until the next opening time.
     */
    openMinutesWindow(date = new Date()) {
        const maxTime = 7 * 24 * 60;
        if (this.isClosedAt(date))
            return 0;
        let nextChange = this.getNextChange(date);
        if (!nextChange || this.isAlwaysOpen())
            return maxTime;
        const nextChangeDate = nextChange.date;
        const now = date;
        const timeUntilNextChange = nextChangeDate.getTime() - now.getTime();
        return Math.floor(timeUntilNextChange / (60 * 1000));
    }
    /**
     * Gets the number of minutes the business will remain closed from the specified date and time.
     *
     * @param {Date} [date=new Date()] - The reference date and time to check from.
     * @returns {number} - The number of minutes until the next closing time.
     */
    closeMinutesWindow(date = new Date()) {
        const maxTime = 7 * 24 * 60;
        if (this.isOpenAt(date))
            return 0;
        let nextChange = this.getNextChange(date);
        if (!nextChange || this.isAlwaysClosed())
            return maxTime;
        const nextChangeDate = nextChange.date;
        const now = date;
        const timeUntilNextChange = nextChangeDate.getTime() - now.getTime();
        return Math.floor(timeUntilNextChange / (60 * 1000));
    }
    /**
     * Retrieves the next change in the opening hours (either opening or closing).
     *
     * @param {Date} [date=new Date()] - The reference date and time to check from.
     * @returns {NextChange | null} - The next change in opening hours or null if none exists.
     */
    getNextChange(date = new Date()) {
        // Step 1: Use the opening_hours instance to get the next change
        const nextChangeRaw = this.openingHoursInstance.getNextChange(date);
        // Step 2: If there's no next change, return null
        if (!nextChangeRaw) {
            return null;
        }
        const nextChangeDate = new Date(nextChangeRaw);
        const dateState = this.openingHoursInstance.getState(date);
        // Step 4: Return the formatted NextChange object
        return {
            date: nextChangeDate,
            state: dateState ? 'close' : 'open'
        };
    }
    /**
     * Returns the next opening time from the current time.
     *
     * @returns {Date | null} - The next opening time, or null if no upcoming openings.
     */
    getNextOpeningTime() {
        let nextChange = this.getNextChange();
        while (nextChange && nextChange.state === 'close') {
            nextChange = this.getNextChange(nextChange.date);
        }
        return nextChange ? nextChange.date : null;
    }
    /**
     * Returns the next closing time from the current time.
     *
     * @returns {Date | null} - The next closing time, or null if no upcoming closings.
     */
    getNextClosingTime() {
        let nextChange = this.getNextChange();
        while (nextChange && nextChange.state === 'open') {
            nextChange = this.getNextChange(nextChange.date);
        }
        return nextChange ? nextChange.date : null;
    }
    /**
     * Adds a new single-day opening hour entry.
     * Converts times to the user's timezone and ensures data integrity before adding the entry.
     * Handles splitting if the entry spans across days due to timezone conversion.
     *
     * @param {string} dayOfWeek - The day of the week (e.g., "Monday").
     * @param {string} opens - Opening time in HH:mm format.
     * @param {string} closes - Closing time in HH:mm format.
     * @param {string} [timezone=this.userTimezone] - The timezone of the input data (default is the user's timezone).
     */
    addOpeningHour(dayOfWeek, opens, closes, timezone = this.userTimezone) {
        return this.addOpeningHoursBatch([
            {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek,
                opens,
                closes
            }
        ], timezone);
    }
    /**
     * Adds a batch of new opening hours entries.
     * Converts times to the user's timezone and ensures data integrity before adding the entries.
     * Handles splitting if the entries span across days due to timezone conversion.
     *
     * @param {OpeningHoursSpecification[]} openingHours // The opening hours to add
     * @param {string} [timezone=this.userTimezone] // The timezone of the input data (default is the user's timezone).
     */
    addOpeningHoursBatch(openingHours, timezone = this.userTimezone) {
        // Normalize and check if closes is before opens, throwing an error if invalid
        const preprocessedEntry = this.preprocessOpeningHours(openingHours);
        // Convert and split entry
        const convertedEntries = preprocessedEntry.flatMap(spec => {
            return this.convertAndSplitEntry(spec, timezone, this.userTimezone);
        });
        // Combine new hours with existing ones and check integrity
        const combinedHours = this.combineAndCheckIntegrity([
            ...this.openingHours,
            ...convertedEntries
        ]);
        // Update internal data
        this.openingHours = combinedHours;
        // Regenerate the opening_hours instance
        this.generateOpeningHoursInstance();
    }
    /**
     * Removes all opening hours for a specific day of the week, considering the timezone.
     *
     * @param {string} dayOfWeek - The day of the week to remove (e.g., "Monday").
     * @param {string} [timezone=this.userTimezone] - The timezone in which to interpret the day of the week (default is the user's timezone).
     */
    removeOpeningHoursForDay(dayOfWeek, timezone = this.userTimezone) {
        let openingHours = [...this.openingHours];
        // Convert the day of the week to the user's timezone if necessary
        if (timezone !== this.userTimezone) {
            // Step 1: Convert times to the requested timezone, adjusting days if necessary
            const convertedHours = this.openingHours.flatMap(spec => {
                return this.convertAndSplitEntry(spec, this.userTimezone, timezone);
            });
            // Step 2: Combine adjacent times on the same day
            openingHours = this.combineAndCheckIntegrity(convertedHours);
        }
        // Remove entries for the specified day
        const updatedHours = openingHours.filter(spec => spec.dayOfWeek !== dayOfWeek);
        // Validate and update the hours
        const combinedHours = this.combineAndCheckIntegrity(updatedHours);
        // set the opening hours
        this.setOpeningHours(combinedHours, timezone);
    }
    /**
     * Returns an array with openRange for each day of the week, including the opening and closing times, with optional timezone conversion.
     *
     * @param {string} [timezone=this.userTimezone] - The timezone to use for the openRange because the days of the week are in the user's timezone (default is the user's timezone).
     * @returns {OpenRangePerDay[]} - Array of objects where each object contains the day of the week and its openRange.
     */
    getOpenRangePerDay(timezone = this.userTimezone) {
        let openingHours = [...this.openingHours];
        // Convert the day of the week to the user's timezone if necessary
        if (timezone !== this.userTimezone) {
            // Step 1: Convert times to the requested timezone, adjusting days if necessary
            const convertedHours = this.openingHours.flatMap(spec => {
                return this.convertAndSplitEntry(spec, this.userTimezone, timezone);
            });
            // Step 2: Combine adjacent times on the same day
            openingHours = this.combineAndCheckIntegrity(convertedHours);
        }
        // Group opening hours by day of the week
        const OpenRangePerDay = {
            Monday: [],
            Tuesday: [],
            Wednesday: [],
            Thursday: [],
            Friday: [],
            Saturday: [],
            Sunday: []
        };
        openingHours.forEach(spec => {
            if (!OpenRangePerDay[spec.dayOfWeek]) {
                OpenRangePerDay[spec.dayOfWeek] = [];
            }
            OpenRangePerDay[spec.dayOfWeek].push({
                open: spec.opens,
                closes: spec.closes
            });
        });
        // Convert the OpenRangePerDay object into an array format
        return Object.keys(OpenRangePerDay).map(day => {
            return {
                '@type': 'OpenRangePerDay',
                dayOfWeek: day,
                openRange: OpenRangePerDay[day]
            };
        });
    }
    /**
     * Returns the openRange for a single day, including the opening and closing times, with optional timezone conversion.
     *
     * @param {string} dayOfWeek - The day of the week to retrieve the openRange for (e.g., "Monday").
     * @param {string} [timezone=this.userTimezone] - The timezone to use for the openRange because the days of the week are in the user's timezone (default is the user's timezone).
     * @returns {OpenRangePerDay} - Object containing the day of the week and its openRange.
     */
    getOpenRangeForDay(dayOfWeek, timezone = this.userTimezone) {
        const openRange = this.getOpenRangePerDay(timezone);
        return (openRange.find(openRange => openRange.dayOfWeek === dayOfWeek) || {
            '@type': 'OpenRangePerDay',
            dayOfWeek,
            openRange: []
        });
    }
    /**
     * Validates the integrity of the current opening hours stored in the service.
     * Ensures that opening and closing times are valid, and there are no overlaps or invalid entries.
     *
     * @param {OpeningHoursSpecification[]} [openingHours=this.openingHours] - Array of opening hours to validate.
     * @returns {boolean} - True if all opening hours are valid, false otherwise.
     */
    validateOpeningHours(openingHours = this.openingHours) {
        try {
            const preprocessOpeningHours = this.preprocessOpeningHours(openingHours);
            this.checkIntegrity(preprocessOpeningHours);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    /**
     * Calculates the total number of open hours for the week.
     *
     * @returns {number} - Total number of open hours.
     */
    getTotalOpenHours() {
        return this.openingHours.reduce((total, spec) => {
            const opensMinutes = this.convertTimeToMinutes(spec.opens);
            const closesMinutes = this.convertTimeToMinutes(spec.closes);
            return total + (closesMinutes - opensMinutes) / 60; // Convert minutes to hours
        }, 0);
    }
    /**
     * Returns an array of days that have no opening hours set.
     *
     * @returns {string[]} - Array of day names with no opening hours.
     */
    getDaysWithoutOpeningHours() {
        const allDays = [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday'
        ];
        const daysWithHours = new Set(this.openingHours.map(spec => spec.dayOfWeek));
        return allDays.filter(day => !daysWithHours.has(day));
    }
    /** Private Methods **/
    /**
     * Preprocesses the opening hours by normalizing and splitting entries that exceed the day.
     *
     * @param {OpeningHoursSpecification[]} hours - Array of opening hours specifications.
     * @returns {OpeningHoursSpecification[]} - Array of preprocessed opening hours.
     */
    preprocessOpeningHours(hours) {
        // Normalize and split multi-day entries into individual single-day entries
        const normalizedHours = this.normalizeAndSplitDays(hours);
        // Split entries that exceed the day (closes is before opens)
        const preprocessedHours = normalizedHours.flatMap(spec => {
            if (this.timeIsBefore(spec.closes, spec.opens) ||
                spec.closes === spec.opens) {
                throw new Error(`Invalid time range on ${spec.dayOfWeek}: opens at ${spec.opens} but closes at ${spec.closes}`);
            }
            else {
                return [spec];
            }
        });
        return preprocessedHours;
    }
    /**
     * Converts an entry from one timezone to another, adjusting days if necessary, and splits if the converted times span multiple days.
     *
     * @param {OpeningHoursSpecification} spec - The opening hours specification to convert.
     * @param {string} fromTimezone - The original timezone.
     * @param {string} toTimezone - The target timezone.
     * @returns {OpeningHoursSpecification[]} - Array of converted and possibly split entries.
     */
    convertAndSplitEntry(spec, fromTimezone, toTimezone) {
        // Convert opens and closes times
        const opensConversion = this.convertTimeWithDayChange(spec.opens, spec.dayOfWeek, fromTimezone, toTimezone);
        const closesConversion = this.convertTimeWithDayChange(spec.closes, spec.dayOfWeek, fromTimezone, toTimezone);
        // Adjust days based on day changes
        let opensDayOfWeek = this.adjustDayOfWeek(spec.dayOfWeek, opensConversion.changedDay);
        let closesDayOfWeek = this.adjustDayOfWeek(spec.dayOfWeek, closesConversion.changedDay);
        // If days are the same, return a single entry
        if (opensDayOfWeek === closesDayOfWeek) {
            return [
                {
                    '@type': 'OpeningHoursSpecification',
                    dayOfWeek: opensDayOfWeek,
                    opens: opensConversion.time,
                    closes: closesConversion.time
                }
            ];
        }
        else {
            // Days are different; split into two entries
            const firstEntry = {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: opensDayOfWeek,
                opens: opensConversion.time,
                closes: '24:00' // End of the day
            };
            const secondEntry = {
                '@type': 'OpeningHoursSpecification',
                dayOfWeek: closesDayOfWeek,
                opens: '00:00',
                closes: closesConversion.time
            };
            if (opensConversion.time !== '24:00' &&
                closesConversion.time !== '00:00') {
                return [firstEntry, secondEntry];
            }
            else if (opensConversion.time === '24:00' &&
                closesConversion.time === '00:00') {
                return [];
            }
            else if (opensConversion.time === '24:00') {
                return [secondEntry];
            }
            else {
                return [firstEntry];
            }
        }
    }
    /**
     * Converts a time from one timezone to another, accounting for day changes.
     *
     * @param {string} time - The time in HH:mm format.
     * @param {string} dayOfWeek - The day of the week for the time.
     * @param {string} fromTimezone - The original timezone.
     * @param {string} toTimezone - The target timezone.
     * @returns {{ time: string, changedDay: number }} - The converted time and the day change indicator (-1, 0, 1).
     */
    convertTimeWithDayChange(time, dayOfWeek, fromTimezone, toTimezone) {
        const [hours, minutes] = time.split(':').map(Number);
        // Create a date object in the fromTimezone
        const dateInFromZone = new Date();
        const dayIndex = this.convertDayStringToNumber(dayOfWeek) - 1; // 0-based index
        dateInFromZone.setUTCDate(dateInFromZone.getUTCDate() - dateInFromZone.getUTCDay() + dayIndex);
        dateInFromZone.setHours(hours % 24, minutes, 0, 0);
        const localDate = fromZonedTime(dateInFromZone, fromTimezone);
        const dateInToZone = toZonedTime(localDate, toTimezone);
        const convertedTime = format(dateInToZone, 'HH:mm');
        let dayDifference = dateInToZone.getDate() - dateInFromZone.getDate(); // -1, 0, or +1
        // If closing time was 24:00, ensure no day change
        if (time === '24:00') {
            dayDifference += 1;
        }
        return { time: convertedTime, changedDay: dayDifference };
    }
    /**
     * Adjusts the day of the week based on a day change value (-1, 0, 1).
     *
     * @param {string} dayOfWeek - The original day of the week.
     * @param {number} dayChange - The change in days (-1, 0, 1).
     * @returns {string} - The adjusted day of the week.
     */
    adjustDayOfWeek(dayOfWeek, dayChange) {
        const days = [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday'
        ];
        const currentIndex = days.indexOf(dayOfWeek);
        let newIndex = (currentIndex + dayChange) % 7;
        if (newIndex < 0)
            newIndex += 7; // Adjust for negative modulo
        return days[newIndex];
    }
    /**
     * Combines adjacent time ranges and checks for data integrity.
     * Ensures there are no overlapping or invalid time ranges.
     *
     * @param {OpeningHoursSpecification[]} hours - Array of opening hours.
     * @returns {OpeningHoursSpecification[]} - Combined and validated opening hours.
     */
    combineAndCheckIntegrity(hours) {
        // Sort hours before combining
        const sortedHours = hours.sort(this.compareOpeningHours.bind(this));
        const combinedHours = this.combineAdjacentRanges(sortedHours);
        this.checkIntegrity(combinedHours); // Check integrity
        return combinedHours; // Return valid data if no errors, otherwise throw Exception
    }
    /**
     * Combines adjacent time ranges (e.g., "14:00-15:00" and "15:00-16:00") into a single range.
     * Prevents merging ranges across different days.
     *
     * @param {OpeningHoursSpecification[]} hours - Array of opening hours.
     * @returns {OpeningHoursSpecification[]} - Array with combined adjacent time ranges on the same day.
     */
    combineAdjacentRanges(hours) {
        const combinedHours = [];
        for (let i = 0; i < hours.length; i++) {
            let currentRange = { ...hours[i] };
            let nextRange = hours[i + 1];
            while (nextRange &&
                currentRange.dayOfWeek === nextRange.dayOfWeek && // Same day
                this.areTimesAdjacent(currentRange.closes, nextRange.opens) // Adjacent times
            ) {
                let updatedClosingTime = nextRange.closes;
                // Ensure the closing time is the latest
                if (this.timeIsBefore(updatedClosingTime, currentRange.closes)) {
                    updatedClosingTime = currentRange.closes;
                }
                // Update the current range's closing time
                currentRange.closes = updatedClosingTime;
                i++; // Move to the next range as it's now merged
                nextRange = hours[i + 1];
            }
            combinedHours.push(currentRange);
        }
        return combinedHours;
    }
    /**
     * Validates the integrity of the opening hours to ensure there are no overlaps or invalid entries.
     * Throws an error if invalid time ranges are detected.
     *
     * @param {OpeningHoursSpecification[]} hours - Array of opening hours to validate.
     */
    checkIntegrity(hours) {
        hours.forEach((current, i) => {
            const opensTime = this.convertTimeToMinutes(current.opens);
            const closesTime = this.convertTimeToMinutes(current.closes);
            if (current.opens === '24:00') {
                throw new Error(`Invalid opening time on ${current.dayOfWeek}: opens at 24:00`);
            }
            if (closesTime <= opensTime) {
                throw new Error(`Invalid time range on ${current.dayOfWeek}: opens at ${current.opens} but closes at ${current.closes}`);
            }
            if (closesTime > 1440) {
                throw new Error(`Invalid closing time on ${current.dayOfWeek}: closes at ${current.closes}`);
            }
            const next = hours[i + 1];
            if (next && current.dayOfWeek === next.dayOfWeek) {
                const nextOpensTime = this.convertTimeToMinutes(next.opens);
                if (closesTime > nextOpensTime) {
                    throw new Error(`Invalid time ranges: ${current.dayOfWeek} [${current.opens}-${current.closes}] overlaps with ${current.dayOfWeek} [${next.opens}-${next.closes}]`);
                }
            }
        });
    }
    /**
     * Converts a time string (HH:mm) to the number of minutes since the start of the day.
     *
     * @param {string} time - Time in HH:mm format.
     * @returns {number} - The number of minutes since the start of the day.
     */
    convertTimeToMinutes(time) {
        const [hours, minutes] = time.split(':').map(Number);
        if (hours === 24 && minutes === 0) {
            return 1440; // Represents 24:00 as the end of the day
        }
        return hours * 60 + minutes;
    }
    /**
     * Checks if two times are adjacent (e.g., "14:00" and "14:01" with a 1-minute gap).
     *
     * @param {string} time1 - First time in HH:mm format.
     * @param {string} time2 - Second time in HH:mm format.
     * @returns {boolean} - True if times are adjacent (gap no more than 1 minute), false otherwise.
     */
    areTimesAdjacent(time1, time2) {
        return (Math.abs(this.convertTimeToMinutes(time1) - this.convertTimeToMinutes(time2)) <= 1);
    }
    /**
     * Determines if time1 is before time2.
     *
     * @param {string} time1 - First time in HH:mm format.
     * @param {string} time2 - Second time in HH:mm format.
     * @returns {boolean} - True if time1 is before time2, false otherwise.
     */
    timeIsBefore(time1, time2) {
        return this.convertTimeToMinutes(time1) < this.convertTimeToMinutes(time2);
    }
    /**
     * Helper function to get the next day of the week.
     * If the current day is "Sunday", it will return "Monday".
     *
     * @param {string} dayOfWeek - The current day of the week (e.g., "Monday").
     * @returns {string} - The next day of the week (e.g., "Tuesday").
     */
    getNextDay(dayOfWeek) {
        const days = [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday'
        ];
        const currentIndex = days.indexOf(dayOfWeek);
        return days[(currentIndex + 1) % 7]; // Get the next day, wrapping around to Monday
    }
    /**
     * Normalizes schema.org URLs (e.g., "https://schema.org/Monday") to simple day names (e.g., "Monday").
     *
     * @param {string} day - The day of the week or a schema.org URL representing the day.
     * @returns {string} - The normalized day of the week (e.g., "Monday").
     */
    normalizeDayOfWeek(day) {
        return day.startsWith('https://schema.org/')
            ? day.split('/').pop() || day
            : day;
    }
    /**
     * Splits any multi-day entries into individual single-day entries and normalizes schema.org day URIs.
     * For example, if "dayOfWeek" is an array, this function splits it into multiple entries, one per day.
     *
     * @param {OpeningHoursSpecification[]} hours - Array of opening hours.
     * @returns {OpeningHoursSpecification[]} - Array of normalized single-day opening hours.
     */
    normalizeAndSplitDays(hours) {
        const normalizedEntries = [];
        hours.forEach(spec => {
            const days = Array.isArray(spec.dayOfWeek)
                ? spec.dayOfWeek
                : [spec.dayOfWeek];
            days.forEach(day => {
                normalizedEntries.push({
                    '@type': spec['@type'],
                    dayOfWeek: this.normalizeDayOfWeek(day), // Normalize each day
                    opens: spec.opens,
                    closes: spec.closes
                });
            });
        });
        return normalizedEntries;
    }
    /**
     * Regenerates the internal `opening_hours` instance with the current opening hours data.
     * This method is used internally to update the opening_hours instance whenever the opening hours are modified.
     */
    generateOpeningHoursInstance() {
        const hoursString = this.getOpenRangePerDay()
            .map(spec => `${this.convertDayOfWeekToShortForm(spec.dayOfWeek)} ${spec.openRange.length === 0
            ? 'off'
            : spec.openRange
                .map(range => `${range.open}-${range.closes}`)
                .join(',')}`)
            .join('; ');
        if (hoursString === '') {
            this.openingHoursInstance = new opening_hours('Mo-Su closed');
        }
        else {
            // Recreate the opening_hours instance with the updated string
            this.openingHoursInstance = new opening_hours(hoursString);
        }
    }
    /**
     * Converts a day of the week (e.g., "Monday") into the short form used by the `opening_hours` library (e.g., "Mo").
     *
     * @param {string} day - The day of the week in full form (e.g., "Monday").
     * @returns {string} - The short form of the day (e.g., "Mo").
     */
    convertDayOfWeekToShortForm(day) {
        const dayMap = {
            Monday: 'Mo',
            Tuesday: 'Tu',
            Wednesday: 'We',
            Thursday: 'Th',
            Friday: 'Fr',
            Saturday: 'Sa',
            Sunday: 'Su'
        };
        return dayMap[day];
    }
    /**
     * Compares two opening hours entries by day and time.
     * Used to sort opening hours for processing.
     *
     * @param {OpeningHoursSpecification} a - First opening hours entry.
     * @param {OpeningHoursSpecification} b - Second opening hours entry.
     * @returns {number} - Sorting order (-1, 0, 1).
     */
    compareOpeningHours(a, b) {
        // First compare by day of the week
        const dayA = this.convertDayStringToNumber(a.dayOfWeek);
        const dayB = this.convertDayStringToNumber(b.dayOfWeek);
        if (dayA !== dayB) {
            return dayA - dayB; // Sort by day of the week
        }
        // If days are the same, sort by opening time
        return (this.convertTimeToMinutes(a.opens) - this.convertTimeToMinutes(b.opens));
    }
    /**
     * Converts a day of the week (e.g., "Monday") into a number (e.g., 1 for Monday, 7 for Sunday).
     *
     * @param {string} day - Day of the week.
     * @returns {number} - Number representing the day of the week (1-7).
     */
    convertDayStringToNumber(day) {
        const dayMap = {
            Monday: 1,
            Tuesday: 2,
            Wednesday: 3,
            Thursday: 4,
            Friday: 5,
            Saturday: 6,
            Sunday: 7
        };
        const dayNumber = dayMap[day];
        if (dayNumber === undefined) {
            throw new Error(`Invalid dayOfWeek: "${day}"`);
        }
        return dayNumber;
    }
    /**
     * Converts a day index (0-6) into the corresponding day string ("Sunday" - "Saturday").
     *
     * @param {number} index - Day index (0 for Sunday, 6 for Saturday).
     * @returns {string} - Corresponding day of the week.
     */
    convertNumberToDayString(index) {
        const days = [
            'Sunday',
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday'
        ];
        return days[index];
    }
}
//# sourceMappingURL=OpeningHoursService.js.map