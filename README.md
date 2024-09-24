# Opening Hours Service

A flexible, timezone-aware service to manage business opening hours with automatic validation, time range splitting, and timezone conversion.

## Installation

Install the package via npm:

```bash
npm install @blackorder/opening-hours-service
```

## Features

- Add, update, remove, and query business opening hours.
- Handles timezone conversion, automatically adjusting days and times.
- Automatically validates and merges adjacent time ranges.
- Supports exporting hours in different timezones.
- Simple API for checking if a business is currently open.
- Allows custom time zone configurations.
- Retrieves the next opening or closing time.
- Identifies days without any opening hours set.
- Calculates total open hours for the week.

## Usage

### Importing the package

You can import the `OpeningHoursService` in your project:

```bash
import { OpeningHoursService } from '@blackorder/opening-hours-service';
```

Or if you are using CommonJS:

```bash
const { OpeningHoursService } = require('@blackorder/opening-hours-service');
```

### Creating a Service Instance

To start using the service, instantiate it with optional initial data and timezone:

```bash
const service = new OpeningHoursService();
```

### Adding Opening Hours

You can add opening hours for specific days using `addOpeningHour`:

```bash
service.addOpeningHour('Monday', '09:00', '17:00', 'UTC');
```

### Removing Opening Hours

You can remove all opening hours for a specific day:

```bash
service.removeOpeningHoursForDay('Monday');
```

### Checking If Business is Open

To check if the business is currently open, use:

```bash
const isOpen = service.isOpenNow();
console.log(isOpen);
// true or false
```

### Exporting Opening Hours

To export the opening hours for a specific timezone:

```bash
const hours = service.exportOpeningHours('America/New_York');
console.log(hours);
```

### Getting the Next Change in Opening Hours

Retrieve the next opening or closing time based on the current time or a specific reference time:

```bash
const nextChange = service.getNextChange();
// Uses current time and user timezone
console.log(nextChange);
// Output example:
// { date: 2024-04-01T18:00:00.000Z, state: 'close' }

const specificDate = new Date('2024-04-01T10:00:00Z');
const nextChangeFromSpecificDate = service.getNextChange(specificDate, 'UTC');
console.log(nextChangeFromSpecificDate);
// Output example:
// { date: 2024-04-01T18:00:00.000Z, state: 'close' }
```

### Calculating Total Open Hours

Calculate the total number of open hours for the week:

```bash
const totalHours = service.getTotalOpenHours();
console.log("Total open hours this week: ${totalHours}");
```

### Example

Here’s a full example demonstrating the basic usage of the `OpeningHoursService`:

```bash
import { OpeningHoursService } from '@blackorder/opening-hours-service';

// Create an instance of the service
const service = new OpeningHoursService();

// Add opening hours for Monday
service.addOpeningHour('Monday', '09:00', '17:00', 'UTC');

// Check if the business is open right now
const isOpen = service.isOpenNow();
console.log(isOpen);
// true or false

// Export the opening hours in New York timezone
const hours = service.exportOpeningHours('America/New_York');
console.log(hours);

// Get the next change in opening hours
const nextChange = service.getNextChange();
if (nextChange) {
    console.log("Next change is to ${nextChange.state} at ${nextChange.date}");
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

### setOpeningHours(hours: OpeningHoursSpecification[], timezone?: string)

Sets the opening hours, handling time zone conversions and validations.

hours: Array of `OpeningHoursSpecification` objects.
timezone (optional): Time zone of the input data.
### addOpeningHour(dayOfWeek: string, opens: string, closes: string, timezone?: string)

Adds a new opening hour for a specific day.

dayOfWeek: The day of the week (e.g., 'Monday').
opens: Opening time in HH
format.
closes: Closing time in HH
format.
timezone (optional): The timezone of the input data (default is the user’s timezone).
### removeOpeningHoursForDay(dayOfWeek: string, timezone?: string)

Removes all opening hours for a specific day of the week.

dayOfWeek: The day of the week to remove (e.g., 'Monday').
### exportOpeningHours(timezone?: string): OpeningHoursSpecification[]

Exports the opening hours in the specified timezone.

timezone (optional): The timezone to export the hours in (default is the user’s timezone).
Returns: An array of OpeningHoursSpecification objects adjusted to the specified timezone.
### isOpenNow(): boolean

Checks if the business is currently open in the default timezone.

Returns: true if open, false otherwise.
### getNextChange(date?: Date, timezone?: string): NextChange | null

Retrieves the next change in opening hours (either opening or closing).

date (optional): The reference date and time to check from (default is current time).
timezone (optional): The timezone of the reference date (default is the user’s timezone).
Returns: A NextChange object containing the date and state, or null if no upcoming changes.
### getTotalOpenHours(): number

Calculates the total number of open hours for the week.

Returns: Total open hours as a number.
### getShiftsForDay(dayOfWeek: string, timezone?: string): OpenRangePerDay

Returns the openRange for a single day, with optional timezone conversion.

dayOfWeek: The day of the week to retrieve the openRange for (e.g., "Monday").
timezone (optional): The timezone to use for the openRange.
Returns: An OpenRangePerDay object containing the day of the week and its openRange.
### getDaysWithoutOpeningHours(): string[]

Returns an array of days that have no opening hours set.

Returns: Array of day names with no opening hours.
### validateOpeningHours(hours?: OpeningHoursSpecification[]): boolean

Validates the integrity of the current opening hours stored in the service.

hours (optional): Array of opening hours to validate.
Returns: true if all opening hours are valid, false otherwise.
### isOpenForDuration(durationInMinutes: number): boolean

Checks if the business will remain open for the specified duration from the current time.

durationInMinutes: The duration to check in minutes.
Returns: true if the business will remain open for the specified duration, false otherwise.
## License

This package is released under the MIT License.

## Author

Created by BlackOrder.

## Support

For any issues or feature requests, please open an issue on the GitHub repository.

## Contributing

Contributions are welcome! Please follow these steps:

Fork the repository.
Create a new branch: git checkout -b feature/YourFeature.
Commit your changes: git commit -m 'Add some feature'.
Push to the branch: git push origin feature/YourFeature.
Open a pull request.
## Changelog

All notable changes to this project will be documented in the CHANGELOG.md.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

Inspired by opening_hours.js
Powered by date-fns-tz
## Frequently Asked Questions (FAQ)

Q: Does the service support multiple timezones simultaneously?

A: Yes, the service allows you to specify different timezones when adding or exporting opening hours.

## Conclusion

The Opening Hours Service provides a robust and flexible solution for managing business hours across different timezones, ensuring accurate and reliable operations. Whether you need simple open/close checks or advanced scheduling features, this service has you covered.
