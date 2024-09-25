/**
 * Type definition for OpeningHoursSpecification.
 * Represents a single opening hours entry for a specific day, including the opening and closing times.
 */
export type OpeningHoursSpecification = {
    '@type': string;
    dayOfWeek: string;
    opens: string;
    closes: string;
};
/**
 * Type definition for OpenRange.
 * Represents a single OpenRange with an opening and closing time.
 */
export type OpenRange = {
    open: string;
    closes: string;
};
/**
 * Type definition for OpenRangePerDay.
 * Represents the OpenRange for a single day, including the day of the week and an array of OpenRange.
 */
export type OpenRangePerDay = {
    '@type': string;
    dayOfWeek: string;
    openRange: OpenRange[];
};
/**
 * Interface representing the next change in opening hours.
 */
export interface NextChange {
    date: Date;
    state: 'open' | 'close';
}
export interface OpeningHoursInstance {
    getState(date: Date): boolean;
    getNextChange(date: Date): Date | undefined;
}
/**
 * A service class for managing opening hours for a business.
 * Handles adding, removing, querying, and validating opening hours, along with timezone conversion.
 */
export declare class OpeningHoursService {
    private openingHours;
    private userTimezone;
    private openingHoursInstance;
    /**
     * Initializes the OpeningHoursService.
     * Stores opening hours, handles timezone conversion, and manages operations like adding/removing hours.
     *
     * @param {OpeningHoursSpecification[]} [initialHours] - Optional initial opening hours data.
     * @param {string} [timezone] - The timezone of the input data (default is the user's local timezone).
     */
    constructor(initialHours?: OpeningHoursSpecification[], timezone?: string);
    /** Public Methods **/
    /**
     * Sets the opening hours, handling splitting of entries that span multiple days.
     * Converts times from the input timezone to the user's timezone, sorts them, and ensures data integrity.
     *
     * @param {OpeningHoursSpecification[]} hours - Array of opening hours specifications.
     * @param {string} [timezone=this.userTimezone] - The timezone of the input data (default is the user's timezone).
     */
    setOpeningHours(hours: OpeningHoursSpecification[], timezone?: string): void;
    /**
     * Exports the current opening hours data, converting it to a specified timezone.
     * Handles splitting entries if the conversion causes day changes.
     *
     * @param {string} [timezone=this.userTimezone] - The timezone of the exported data (default is the user's timezone).
     * @returns {OpeningHoursSpecification[]} - Array of opening hours in the specified timezone.
     */
    exportOpeningHours(timezone?: string): OpeningHoursSpecification[];
    /**
     * Checks if the establishment is currently open based on the current time.
     *
     * @returns {boolean} - True if the establishment is open, false otherwise.
     */
    isOpenNow(): boolean;
    /**
     * Checks if the business is currently closed.
     *
     * @returns {boolean} - True if the business is currently closed, false otherwise.
     */
    isClosedNow(): boolean;
    /**
     * Checks if the establishment is always open.
     *
     * @returns {boolean} - True if the establishment is always open, false otherwise.
     */
    isAlwaysOpen(): boolean;
    /**
     * Checks if the establishment is always closed.
     *
     * @returns {boolean} - True if the establishment is always closed, false otherwise.
     */
    isAlwaysClosed(): boolean;
    /**
     * Checks if the establishment is open at a specific date and time.
     *
     * @param {Date} date - The specific date and time to check.
     * @returns {boolean} - True if the establishment is open, false otherwise.
     */
    isOpenAt(date: Date): boolean;
    /**
     * Checks if the establishment is closed at a specific date and time.
     *
     * @param {Date} date - The specific date and time to check.
     * @returns {boolean} - True if the establishment is closed, false otherwise.
     */
    isClosedAt(date: Date): boolean;
    getOpeningHoursInstance(): OpeningHoursInstance;
    /**
     * Checks if the business will remain open for the specified duration from the current time.
     *
     * @param {number} durationInMinutes - The duration to check in minutes.
     * @param {Date} [date=new Date()] - The reference date and time to check from.
     * @returns {boolean} - True if the business will remain open for the specified duration, false otherwise.
     */
    isOpenForDuration(durationInMinutes: number, date?: Date): boolean;
    /**
     * Checks if the business will remain closed for the specified duration from the current time.
     *
     * @param {number} durationInMinutes - The duration to check in minutes.
     * @param {Date} [date=new Date()] - The reference date and time to check from.
     * @returns {boolean} - True if the business will remain closed for the specified duration, false otherwise.
     */
    isClosedForDuration(durationInMinutes: number, date?: Date): boolean;
    /**
     * Gets the number of minutes the business will remain open from the specified date and time.
     *
     * @param {Date} [date=new Date()] - The reference date and time to check from.
     * @returns {number} - The number of minutes until the next opening time.
     */
    openMinutesWindow(date?: Date): number;
    /**
     * Gets the number of minutes the business will remain closed from the specified date and time.
     *
     * @param {Date} [date=new Date()] - The reference date and time to check from.
     * @returns {number} - The number of minutes until the next closing time.
     */
    closeMinutesWindow(date?: Date): number;
    /**
     * Retrieves the next change in the opening hours (either opening or closing).
     *
     * @param {Date} [date=new Date()] - The reference date and time to check from.
     * @returns {NextChange | null} - The next change in opening hours or null if none exists.
     */
    getNextChange(date?: Date): NextChange | null;
    /**
     * Returns the next opening time from the current time.
     *
     * @returns {Date | null} - The next opening time, or null if no upcoming openings.
     */
    getNextOpeningTime(): Date | null;
    /**
     * Returns the next closing time from the current time.
     *
     * @returns {Date | null} - The next closing time, or null if no upcoming closings.
     */
    getNextClosingTime(): Date | null;
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
    addOpeningHour(dayOfWeek: string, opens: string, closes: string, timezone?: string): void;
    /**
     * Adds a batch of new opening hours entries.
     * Converts times to the user's timezone and ensures data integrity before adding the entries.
     * Handles splitting if the entries span across days due to timezone conversion.
     *
     * @param {OpeningHoursSpecification[]} openingHours // The opening hours to add
     * @param {string} [timezone=this.userTimezone] // The timezone of the input data (default is the user's timezone).
     */
    addOpeningHoursBatch(openingHours: OpeningHoursSpecification[], timezone?: string): void;
    /**
     * Removes all opening hours for a specific day of the week, considering the timezone.
     *
     * @param {string} dayOfWeek - The day of the week to remove (e.g., "Monday").
     * @param {string} [timezone=this.userTimezone] - The timezone in which to interpret the day of the week (default is the user's timezone).
     */
    removeOpeningHoursForDay(dayOfWeek: string, timezone?: string): void;
    /**
     * Returns an array with openRange for each day of the week, including the opening and closing times, with optional timezone conversion.
     *
     * @param {string} [timezone=this.userTimezone] - The timezone to use for the openRange because the days of the week are in the user's timezone (default is the user's timezone).
     * @returns {OpenRangePerDay[]} - Array of objects where each object contains the day of the week and its openRange.
     */
    getOpenRangePerDay(timezone?: string): OpenRangePerDay[];
    /**
     * Returns the openRange for a single day, including the opening and closing times, with optional timezone conversion.
     *
     * @param {string} dayOfWeek - The day of the week to retrieve the openRange for (e.g., "Monday").
     * @param {string} [timezone=this.userTimezone] - The timezone to use for the openRange because the days of the week are in the user's timezone (default is the user's timezone).
     * @returns {OpenRangePerDay} - Object containing the day of the week and its openRange.
     */
    getOpenRangeForDay(dayOfWeek: string, timezone?: string): OpenRangePerDay;
    /**
     * Validates the integrity of the current opening hours stored in the service.
     * Ensures that opening and closing times are valid, and there are no overlaps or invalid entries.
     *
     * @param {OpeningHoursSpecification[]} [openingHours=this.openingHours] - Array of opening hours to validate.
     * @returns {boolean} - True if all opening hours are valid, false otherwise.
     */
    validateOpeningHours(openingHours?: OpeningHoursSpecification[]): boolean;
    /**
     * Calculates the total number of open hours for the week.
     *
     * @returns {number} - Total number of open hours.
     */
    getTotalOpenHours(): number;
    /**
     * Returns an array of days that have no opening hours set.
     *
     * @returns {string[]} - Array of day names with no opening hours.
     */
    getDaysWithoutOpeningHours(): string[];
    /** Private Methods **/
    /**
     * Preprocesses the opening hours by normalizing and splitting entries that exceed the day.
     *
     * @param {OpeningHoursSpecification[]} hours - Array of opening hours specifications.
     * @returns {OpeningHoursSpecification[]} - Array of preprocessed opening hours.
     */
    private preprocessOpeningHours;
    /**
     * Converts an entry from one timezone to another, adjusting days if necessary, and splits if the converted times span multiple days.
     *
     * @param {OpeningHoursSpecification} spec - The opening hours specification to convert.
     * @param {string} fromTimezone - The original timezone.
     * @param {string} toTimezone - The target timezone.
     * @returns {OpeningHoursSpecification[]} - Array of converted and possibly split entries.
     */
    private convertAndSplitEntry;
    /**
     * Converts a time from one timezone to another, accounting for day changes.
     *
     * @param {string} time - The time in HH:mm format.
     * @param {string} dayOfWeek - The day of the week for the time.
     * @param {string} fromTimezone - The original timezone.
     * @param {string} toTimezone - The target timezone.
     * @returns {{ time: string, changedDay: number }} - The converted time and the day change indicator (-1, 0, 1).
     */
    private convertTimeWithDayChange;
    /**
     * Adjusts the day of the week based on a day change value (-1, 0, 1).
     *
     * @param {string} dayOfWeek - The original day of the week.
     * @param {number} dayChange - The change in days (-1, 0, 1).
     * @returns {string} - The adjusted day of the week.
     */
    private adjustDayOfWeek;
    /**
     * Combines adjacent time ranges and checks for data integrity.
     * Ensures there are no overlapping or invalid time ranges.
     *
     * @param {OpeningHoursSpecification[]} hours - Array of opening hours.
     * @returns {OpeningHoursSpecification[]} - Combined and validated opening hours.
     */
    private combineAndCheckIntegrity;
    /**
     * Combines adjacent time ranges (e.g., "14:00-15:00" and "15:00-16:00") into a single range.
     * Prevents merging ranges across different days.
     *
     * @param {OpeningHoursSpecification[]} hours - Array of opening hours.
     * @returns {OpeningHoursSpecification[]} - Array with combined adjacent time ranges on the same day.
     */
    private combineAdjacentRanges;
    /**
     * Validates the integrity of the opening hours to ensure there are no overlaps or invalid entries.
     * Throws an error if invalid time ranges are detected.
     *
     * @param {OpeningHoursSpecification[]} hours - Array of opening hours to validate.
     */
    private checkIntegrity;
    /**
     * Converts a time string (HH:mm) to the number of minutes since the start of the day.
     *
     * @param {string} time - Time in HH:mm format.
     * @returns {number} - The number of minutes since the start of the day.
     */
    private convertTimeToMinutes;
    /**
     * Checks if two times are adjacent (e.g., "14:00" and "14:01" with a 1-minute gap).
     *
     * @param {string} time1 - First time in HH:mm format.
     * @param {string} time2 - Second time in HH:mm format.
     * @returns {boolean} - True if times are adjacent (gap no more than 1 minute), false otherwise.
     */
    private areTimesAdjacent;
    /**
     * Determines if time1 is before time2.
     *
     * @param {string} time1 - First time in HH:mm format.
     * @param {string} time2 - Second time in HH:mm format.
     * @returns {boolean} - True if time1 is before time2, false otherwise.
     */
    private timeIsBefore;
    /**
     * Helper function to get the next day of the week.
     * If the current day is "Sunday", it will return "Monday".
     *
     * @param {string} dayOfWeek - The current day of the week (e.g., "Monday").
     * @returns {string} - The next day of the week (e.g., "Tuesday").
     */
    private getNextDay;
    /**
     * Normalizes schema.org URLs (e.g., "https://schema.org/Monday") to simple day names (e.g., "Monday").
     *
     * @param {string} day - The day of the week or a schema.org URL representing the day.
     * @returns {string} - The normalized day of the week (e.g., "Monday").
     */
    private normalizeDayOfWeek;
    /**
     * Splits any multi-day entries into individual single-day entries and normalizes schema.org day URIs.
     * For example, if "dayOfWeek" is an array, this function splits it into multiple entries, one per day.
     *
     * @param {OpeningHoursSpecification[]} hours - Array of opening hours.
     * @returns {OpeningHoursSpecification[]} - Array of normalized single-day opening hours.
     */
    private normalizeAndSplitDays;
    /**
     * Regenerates the internal `opening_hours` instance with the current opening hours data.
     * This method is used internally to update the opening_hours instance whenever the opening hours are modified.
     */
    private generateOpeningHoursInstance;
    /**
     * Converts a day of the week (e.g., "Monday") into the short form used by the `opening_hours` library (e.g., "Mo").
     *
     * @param {string} day - The day of the week in full form (e.g., "Monday").
     * @returns {string} - The short form of the day (e.g., "Mo").
     */
    private convertDayOfWeekToShortForm;
    /**
     * Compares two opening hours entries by day and time.
     * Used to sort opening hours for processing.
     *
     * @param {OpeningHoursSpecification} a - First opening hours entry.
     * @param {OpeningHoursSpecification} b - Second opening hours entry.
     * @returns {number} - Sorting order (-1, 0, 1).
     */
    private compareOpeningHours;
    /**
     * Converts a day of the week (e.g., "Monday") into a number (e.g., 1 for Monday, 7 for Sunday).
     *
     * @param {string} day - Day of the week.
     * @returns {number} - Number representing the day of the week (1-7).
     */
    private convertDayStringToNumber;
    /**
     * Converts a day index (0-6) into the corresponding day string ("Sunday" - "Saturday").
     *
     * @param {number} index - Day index (0 for Sunday, 6 for Saturday).
     * @returns {string} - Corresponding day of the week.
     */
    private convertNumberToDayString;
}
