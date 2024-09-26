# Changelog

## [1.3.2] - 2024-09-26
### Changed
- Added detailed interface for the `OpeningHoursInstance` to define types and method signatures for better TypeScript support.
  - Methods like `getState`, `getNextChange`, `getOpenIntervals`, `getStateString`, and more were explicitly defined in the `OpeningHoursInstance` interface to improve clarity and type safety.

## [1.3.1] - 2024-09-25
### Initial release with basic functionality
- Handling of opening hours including validation, exporting, and timezone conversion.
- Provided methods to check open/closed state and calculate total open hours.
