# Opening Hours Service

A robust, timezone-aware service to manage business opening hours with automatic validation, time range splitting, timezone conversion, and comprehensive querying capabilities.

## Installation

Install the package via npm:

```bash
npm install @blackorder/opening-hours-service
```

## Features

- **Add, update, remove, and query business opening hours.**
- **Handles timezone conversion, automatically adjusting days and times.**
- **Automatically validates and merges adjacent time ranges.**
- **Supports exporting hours in different timezones.**
- **Comprehensive API for checking if a business is currently open or closed.**
- **Retrieves the next opening or closing time.**
- **Identifies days without any opening hours set.**
- **Calculates total open hours for the week.**
- **Flexible handling of multiple open ranges per day.**
- **Integration with the `opening_hours` library for efficient management.**

## Usage

### Importing the Package

You can import the `OpeningHoursService` in your project:

```typescript
import { OpeningHoursService } from '@blackorder/opening-hours-service';
```

Or if you are using CommonJS:

```typescript
const { OpeningHoursService } = require('@blackorder/opening-hours-service');
```

### Creating a Service Instance

To start using the service, instantiate it with optional initial data and timezone:

```typescript
const service = new OpeningHoursService(initialHours, 'America/New_York');
```

**Parameters:**
- `initialHours` *(optional)*: An array of `OpeningHoursSpecification` objects representing the initial opening hours data.
- `timezone` *(optional)*: A string specifying the timezone of the input data. Defaults to the user's local timezone if not provided.

### Adding Opening Hours

You can add opening hours for specific days using `addOpeningHour`:

```typescript
service.addOpeningHour('Monday', '09:00', '17:00', 'UTC');
```

Or add multiple opening hours in a batch:

```typescript
const additionalHours: OpeningHoursSpecification[] = [
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: 'Tuesday',
    opens: '10:00',
    closes: '14:00',
  },
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: 'Wednesday',
    opens: '11:00',
    closes: '15:00',
  },
];

service.addOpeningHoursBatch(additionalHours, 'America/Los_Angeles');
```

### Removing Opening Hours

You can remove all opening hours for a specific day:

```typescript
service.removeOpeningHoursForDay('Monday', 'UTC');
```

**Parameters:**
- `dayOfWeek`: The day of the week to remove (e.g., "Monday").
- `timezone` *(optional)*: The timezone in which to interpret the day of the week. Defaults to the user's local timezone if not provided.

### Checking If Business is Open

To check if the business is currently open, use:

```typescript
const isOpen = service.isOpenNow();
console.log(`Is open now: ${isOpen}`);
// Outputs: true or false
```

To check if the business is open at a specific date and time:

```typescript
const specificDate = new Date('2024-05-15T14:30:00');
const openAtSpecificTime = service.isOpenAt(specificDate);
console.log(`Is open at ${specificDate}: ${openAtSpecificTime}`);
// Outputs: true or false
```

### Exporting Opening Hours

To export the opening hours for a specific timezone:

```typescript
const hours = service.exportOpeningHours('Asia/Tokyo');
console.log(hours);
// Outputs: Array of OpeningHoursSpecification objects in Asia/Tokyo timezone
```

### Getting the Next Change in Opening Hours

Retrieve the next opening or closing time based on the current time or a specific reference time:

```typescript
const nextChange = service.getNextChange();
console.log(nextChange);
// Output example:
// { date: 2024-04-01T18:00:00.000Z, state: 'close' }

const specificDate = new Date('2024-04-01T10:00:00Z');
const nextChangeFromSpecificDate = service.getNextChange(specificDate);
console.log(nextChangeFromSpecificDate);
// Output example:
// { date: 2024-04-01T18:00:00.000Z, state: 'close' }
```

### Calculating Total Open Hours

Calculate the total number of open hours for the week:

```typescript
const totalHours = service.getTotalOpenHours();
console.log(`Total open hours this week: ${totalHours}`);
// Outputs: Number of total open hours
```

### Example

Here’s a full example demonstrating the basic usage of the `OpeningHoursService`:

```typescript
import { OpeningHoursService } from '@blackorder/opening-hours-service';

// Create an instance of the service
const service = new OpeningHoursService();

// Add opening hours for Monday
service.addOpeningHour('Monday', '09:00', '17:00', 'UTC');

// Check if the business is open right now
const isOpen = service.isOpenNow();
console.log(`Is open now: ${isOpen}`);
// Outputs: true or false

// Export the opening hours in New York timezone
const hours = service.exportOpeningHours('America/New_York');
console.log(hours);

// Get the next change in opening hours
const nextChange = service.getNextChange();
if (nextChange) {
    console.log(`Next change is to ${nextChange.state} at ${nextChange.date}`);
} else {
    console.log('No upcoming changes in opening hours.');
}

// Remove the Monday hours 
service.removeOpeningHoursForDay('Monday'); 
```

### API Reference

### OpeningHoursService

The main service class that manages opening hours.

### Methods

### setOpeningHours(hours: OpeningHoursSpecification[], timezone?: string): void

Sets the opening hours, handling timezone conversions, splitting entries spanning multiple days, sorting, and ensuring data integrity.

**Parameters:**
- `hours`: An array of `OpeningHoursSpecification` objects representing the opening hours to set.
- `timezone` *(optional)*: A string specifying the timezone of the input data. Defaults to the user's local timezone if not provided.

**Usage Example:**
```typescript
const newHours: OpeningHoursSpecification[] = [
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: 'Tuesday',
    opens: '10:00',
    closes: '18:00',
  },
  // Add more entries as needed
];

service.setOpeningHours(newHours, 'Europe/London');
```

### addOpeningHour(dayOfWeek: string, opens: string, closes: string, timezone?: string): void

Adds a new single-day opening hour entry. Converts times to the user's timezone, ensures data integrity, and handles splitting if the entry spans across days due to timezone conversion.

**Parameters:**
- `dayOfWeek`: A string representing the day of the week (e.g., `"Monday"`).
- `opens`: A string representing the opening time in `HH:mm` format (e.g., `"09:00"`).
- `closes`: A string representing the closing time in `HH:mm` format (e.g., `"18:00"`).
- `timezone` *(optional)*: A string specifying the timezone of the input data. Defaults to the user's local timezone if not provided.

**Usage Example:**
```typescript
service.addOpeningHour('Wednesday', '08:00', '16:00', 'Europe/Berlin');
```

### addOpeningHoursBatch(openingHours: OpeningHoursSpecification[], timezone?: string): void

Adds a batch of new opening hours entries. Converts times to the user's timezone, ensures data integrity, and handles splitting if the entries span across days due to timezone conversion.

**Parameters:**
- `openingHours`: An array of `OpeningHoursSpecification` objects representing the opening hours to add.
- `timezone` *(optional)*: A string specifying the timezone of the input data. Defaults to the user's local timezone if not provided.

**Usage Example:**
```typescript
const additionalHours: OpeningHoursSpecification[] = [
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: 'Thursday',
    opens: '10:00',
    closes: '20:00',
  },
  {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: 'Friday',
    opens: '10:00',
    closes: '22:00',
  },
];

service.addOpeningHoursBatch(additionalHours, 'America/Los_Angeles');
```

### removeOpeningHoursForDay(dayOfWeek: string, timezone?: string): void

Removes all opening hours entries for a specific day of the week, considering the provided timezone.

**Parameters:**
- `dayOfWeek`: A string representing the day of the week to remove (e.g., `"Monday"`).
- `timezone` *(optional)*: A string specifying the timezone in which to interpret the day of the week. Defaults to the user's local timezone if not provided.

**Usage Example:**
```typescript
service.removeOpeningHoursForDay('Sunday', 'Asia/Kolkata');
```

### exportOpeningHours(timezone?: string): OpeningHoursSpecification[]

Exports the current opening hours data, converting it to a specified timezone. Handles splitting entries if the conversion causes day changes.

**Parameters:**
- `timezone` *(optional)*: A string specifying the timezone for the exported data. Defaults to the user's local timezone if not provided.

**Returns:**
- An array of `OpeningHoursSpecification` objects representing the opening hours in the specified timezone.

**Usage Example:**
```typescript
const exportedHours = service.exportOpeningHours('Asia/Tokyo');
console.log(exportedHours);
```

### isOpenNow(): boolean

Checks if the business is currently open based on the current local time.

**Returns:**
- `true` if the establishment is open now.
- `false` otherwise.

**Usage Example:**
```typescript
const currentlyOpen = service.isOpenNow();
console.log(`Is open now: ${currentlyOpen}`);
```

### isClosedNow(): boolean

Checks if the business is currently closed based on the current local time.

**Returns:**
- `true` if the establishment is closed now.
- `false` otherwise.

**Usage Example:**
```typescript
const currentlyClosed = service.isClosedNow();
console.log(`Is closed now: ${currentlyClosed}`);
```

### isAlwaysOpen(): boolean

Determines if the establishment is always open without any closing times.

**Returns:**
- `true` if the establishment is always open.
- `false` otherwise.

**Usage Example:**
```typescript
const alwaysOpen = service.isAlwaysOpen();
console.log(`Is always open: ${alwaysOpen}`);
```

### isAlwaysClosed(): boolean

Determines if the establishment is always closed without any opening times.

**Returns:**
- `true` if the establishment is always closed.
- `false` otherwise.

**Usage Example:**
```typescript
const alwaysClosed = service.isAlwaysClosed();
console.log(`Is always closed: ${alwaysClosed}`);
```

### isOpenAt(date: Date): boolean

Checks if the establishment is open at a specific date and time.

**Parameters:**
- `date`: A `Date` object representing the specific date and time to check.

**Returns:**
- `true` if the establishment is open at the specified time.
- `false` otherwise.

**Usage Example:**
```typescript
const specificDate = new Date('2024-05-15T14:30:00');
const openAtSpecificTime = service.isOpenAt(specificDate);
console.log(`Is open at ${specificDate}: ${openAtSpecificTime}`);
```

### isClosedAt(date: Date): boolean

Checks if the establishment is closed at a specific date and time.

**Parameters:**
- `date`: A `Date` object representing the specific date and time to check.

**Returns:**
- `true` if the establishment is closed at the specified time.
- `false` otherwise.

**Usage Example:**
```typescript
const specificDate = new Date('2024-05-15T20:00:00');
const closedAtSpecificTime = service.isClosedAt(specificDate);
console.log(`Is closed at ${specificDate}: ${closedAtSpecificTime}`);
```

### getOpeningHoursInstance(): OpeningHoursInstance

Retrieves the internal `OpeningHoursInstance` used by the service for managing opening hours logic.

**Returns:**
- An `OpeningHoursInstance` object.

**Usage Example:**
```typescript
const openingHoursInstance = service.getOpeningHoursInstance();
// You can now use methods from OpeningHoursInstance if needed
```

### isOpenForDuration(durationInMinutes: number, date?: Date): boolean

Checks if the business will remain open for a specified duration from the given date and time.

**Parameters:**
- `durationInMinutes`: A number representing the duration to check in minutes.
- `date` *(optional)*: A `Date` object representing the reference date and time. Defaults to the current date and time if not provided.

**Returns:**
- `true` if the business will remain open for at least the specified duration.
- `false` otherwise.

**Usage Example:**
```typescript
const duration = 120; // 2 hours
const referenceDate = new Date();
const willRemainOpen = service.isOpenForDuration(duration, referenceDate);
console.log(`Will remain open for ${duration} minutes: ${willRemainOpen}`);
```

### isClosedForDuration(durationInMinutes: number, date?: Date): boolean

Checks if the business will remain closed for a specified duration from the given date and time.

**Parameters:**
- `durationInMinutes`: A number representing the duration to check in minutes.
- `date` *(optional)*: A `Date` object representing the reference date and time. Defaults to the current date and time if not provided.

**Returns:**
- `true` if the business will remain closed for at least the specified duration.
- `false` otherwise.

**Usage Example:**
```typescript
const duration = 60; // 1 hour
const referenceDate = new Date();
const willRemainClosed = service.isClosedForDuration(duration, referenceDate);
console.log(`Will remain closed for ${duration} minutes: ${willRemainClosed}`);
```

### openMinutesWindow(date?: Date): number

Retrieves the number of minutes the business will remain open from the specified date and time.

**Parameters:**
- `date` *(optional)*: A `Date` object representing the reference date and time. Defaults to the current date and time if not provided.

**Returns:**
- A number representing the minutes until the next change in state (closing time). Returns `0` if currently closed.
- Returns a maximum of `10080` minutes (7 days) if always open.

**Usage Example:**
```typescript
const referenceDate = new Date();
const minutesOpen = service.openMinutesWindow(referenceDate);
console.log(`Minutes open from ${referenceDate}: ${minutesOpen}`);
```

### closeMinutesWindow(date?: Date): number

Retrieves the number of minutes the business will remain closed from the specified date and time.

**Parameters:**
- `date` *(optional)*: A `Date` object representing the reference date and time. Defaults to the current date and time if not provided.

**Returns:**
- A number representing the minutes until the next change in state (opening time). Returns `0` if currently open.
- Returns a maximum of `10080` minutes (7 days) if always closed.

**Usage Example:**
```typescript
const referenceDate = new Date();
const minutesClosed = service.closeMinutesWindow(referenceDate);
console.log(`Minutes closed from ${referenceDate}: ${minutesClosed}`);
```

### getNextChange(date?: Date): NextChange | null

Retrieves the next change in the opening hours (either opening or closing) from the specified date and time.

**Parameters:**
- `date` *(optional)*: A `Date` object representing the reference date and time. Defaults to the current date and time if not provided.

**Returns:**
- A `NextChange` object containing the date and the state (`'open'` or `'close'`) after the change.
- `null` if there are no upcoming changes.

**Usage Example:**
```typescript
const referenceDate = new Date();
const nextChange = service.getNextChange(referenceDate);
if (nextChange) {
  console.log(`Next change at ${nextChange.date} to state: ${nextChange.state}`);
} else {
  console.log('No upcoming changes.');
}
```

### getNextOpeningTime(): Date | null

Retrieves the next opening time from the current time.

**Returns:**
- A `Date` object representing the next opening time.
- `null` if there are no upcoming openings.

**Usage Example:**
```typescript
const nextOpening = service.getNextOpeningTime();
if (nextOpening) {
  console.log(`Next opening time: ${nextOpening}`);
} else {
  console.log('The establishment will not open again.');
}
```

### getNextClosingTime(): Date | null

Retrieves the next closing time from the current time.

**Returns:**
- A `Date` object representing the next closing time.
- `null` if there are no upcoming closings.

**Usage Example:**
```typescript
const nextClosing = service.getNextClosingTime();
if (nextClosing) {
  console.log(`Next closing time: ${nextClosing}`);
} else {
  console.log('The establishment will not close again.');
}
```

### getOpenRangePerDay(timezone?: string): OpenRangePerDay[]

Returns an array with openRange for each day of the week, including the opening and closing times, with optional timezone conversion.

**Parameters:**
- `timezone` *(optional)*: The timezone to use for the openRange. Defaults to the user's local timezone if not provided.

**Returns:**
- An array of `OpenRangePerDay` objects, each containing the day of the week and its associated open ranges.

**Usage Example:**
```typescript
const weeklyOpenRanges = service.getOpenRangePerDay('Australia/Sydney');
console.log(weeklyOpenRanges);
```

### getOpenRangeForDay(dayOfWeek: string, timezone?: string): OpenRangePerDay

Returns the openRange for a single day, including the opening and closing times, with optional timezone conversion.

**Parameters:**
- `dayOfWeek`: The day of the week to retrieve the openRange for (e.g., `"Monday"`).
- `timezone` *(optional)*: The timezone to use for the openRange. Defaults to the user's local timezone if not provided.

**Returns:**
- An `OpenRangePerDay` object containing the day of the week and its associated open ranges. Returns an empty `openRange` array if no hours are set for the specified day.

**Usage Example:**
```typescript
const mondayOpenRange = service.getOpenRangeForDay('Monday', 'Europe/Paris');
console.log(mondayOpenRange);
```

### validateOpeningHours(openingHours?: OpeningHoursSpecification[]): boolean

Validates the integrity of the current or provided opening hours. Ensures that opening and closing times are valid, and there are no overlaps or invalid entries.

**Parameters:**
- `openingHours` *(optional)*: An array of `OpeningHoursSpecification` objects to validate. Defaults to the current opening hours if not provided.

**Returns:**
- `true` if all opening hours are valid.
- `false` otherwise.

**Usage Example:**
```typescript
const isValid = service.validateOpeningHours();
console.log(`Opening hours are valid: ${isValid}`);
```

### getTotalOpenHours(): number

Calculates the total number of open hours for the week based on the current opening hours data.

**Returns:**
- A number representing the total open hours for the week.

**Usage Example:**
```typescript
const totalOpenHours = service.getTotalOpenHours();
console.log(`Total open hours this week: ${totalOpenHours}`);
```

### getDaysWithoutOpeningHours(): string[]

Retrieves an array of days that have no opening hours set.

**Returns:**
- An array of strings representing the days of the week with no opening hours (e.g., `["Sunday"]`).

**Usage Example:**
```typescript
const daysClosed = service.getDaysWithoutOpeningHours();
console.log(`Days without opening hours: ${daysClosed.join(', ')}`);
```

## License

This package is released under the MIT License.

## Author

Created by BlackOrder.

## Support

For any issues or feature requests, please open an issue on the GitHub repository.

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository.
2. Create a new branch: `git checkout -b feature/YourFeature`.
3. Commit your changes: `git commit -m 'Add some feature'`.
4. Push to the branch: `git push origin feature/YourFeature`.
5. Open a pull request.

## Changelog

All notable changes to this project will be documented in the `CHANGELOG.md`.

## Acknowledgements

- Inspired by [opening_hours.js](https://github.com/opening-hours/opening_hours.js)
- Powered by [date-fns-tz](https://github.com/marnusw/date-fns-tz)

## Frequently Asked Questions (FAQ)

**Q: Does the service support multiple timezones simultaneously?**

**A:** Yes, the service allows you to specify different timezones when adding or exporting opening hours.

**Q: How does the service handle opening hours that span midnight?**

**A:** The service does not allow opening hours that span midnight. Attempting to add such ranges will throw an error. Instead, split the opening hours into separate entries for each day.

**Q: Can I retrieve the opening hours for all days at once?**

**A:** Yes, you can use the `getOpenRangePerDay` method to retrieve open ranges for each day of the week.

## Conclusion

The Opening Hours Service provides a comprehensive and flexible solution for managing business hours across different timezones, ensuring accurate and reliable operations. Whether you need simple open/close checks or advanced scheduling features, this service has you covered.
