import {
  OpeningHoursService,
  OpeningHoursSpecification,
  OpenRangePerDay,
  NextChange
} from '../src/OpeningHoursService'

import { fromZonedTime, toZonedTime, format } from 'date-fns-tz'

describe('OpeningHoursService', () => {
  let service: OpeningHoursService

  beforeEach(() => {
    service = new OpeningHoursService()
  })

  /** Initialization Tests **/
  describe('Initialization', () => {
    it('should return empty array when no opening hours are set', () => {
      const exportedHours = service.exportOpeningHours()
      expect(exportedHours).toEqual([]) // No opening hours should be present
    })
  })

  /** Adding and Removing Opening Hours **/
  describe('Adding and Removing Hours', () => {
    it('should correctly remove opening hours for multiple days', () => {
      service.addOpeningHour('Monday', '09:00', '12:00', 'UTC')
      service.addOpeningHour('Tuesday', '10:00', '14:00', 'UTC')
      service.addOpeningHour('Wednesday', '11:00', '15:00', 'UTC')

      service.removeOpeningHoursForDay('Monday', 'UTC')
      service.removeOpeningHoursForDay('Wednesday', 'UTC')

      const exportedHours = service.exportOpeningHours('UTC')
      expect(exportedHours).toEqual([
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Tuesday',
          opens: '10:00',
          closes: '14:00'
        }
      ]) // Only Tuesday should remain
    })

    it('should correctly handle adding hours for the same day in different timezones', () => {
      service.addOpeningHour('Monday', '09:00', '12:00', 'UTC')
      service.addOpeningHour('Monday', '14:00', '17:00', 'America/New_York')

      const exportedHours = service.exportOpeningHours('UTC')
      expect(exportedHours).toEqual([
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '12:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '18:00',
          closes: '21:00'
        }
      ]) // Handles timezone conversion correctly
    })

    it('should throw an error for invalid timezones', () => {
      expect(() => {
        service.addOpeningHour('Monday', '09:00', '17:00', 'Invalid/Timezone')
      }).toThrow('Invalid time value') // Adjust error message based on implementation
    })
  })

  /** Exporting Opening Hours **/
  describe('Exporting Opening Hours', () => {
    it('should export closing time as 24:00 correctly', () => {
      const openingHours: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Sunday',
          opens: '10:00',
          closes: '24:00'
        }
      ]
      service.setOpeningHours(openingHours, 'UTC')

      const exportedHours = service.exportOpeningHours('UTC')
      expect(exportedHours).toEqual([
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Sunday',
          opens: '10:00',
          closes: '24:00'
        }
      ])
    })

    it('should correctly handle exporting hours with timezone conversion', () => {
      service.addOpeningHour('Monday', '09:00', '18:00', 'UTC')
      service.addOpeningHour('Monday', '14:00', '20:00', 'America/New_York')

      const exportedHoursUTC = service.exportOpeningHours('UTC')
      expect(exportedHoursUTC).toEqual([
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '24:00'
        }
      ])
    })
  })

  /** Time Range Validation **/
  describe('Time Range Validation', () => {
    it('should throw an error if closing time is before opening time on the same day', () => {
      const input: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '14:00',
          closes: '12:00'
        }
      ]
      expect(() => service.setOpeningHours(input)).toThrow(
        'Invalid time range on Monday: opens at 14:00 but closes at 12:00'
      )
    })

    it('should throw an error for invalid time format', () => {
      const input: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: 'invalid-time',
          closes: '12:00'
        }
      ]
      expect(() => service.setOpeningHours(input)).toThrow('Invalid time value') // Adjust based on implementation
    })

    it('should throw an error for invalid day of week', () => {
      const input: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'NotADay',
          opens: '09:00',
          closes: '12:00'
        }
      ]
      expect(() => service.setOpeningHours(input)).toThrow(
        'Invalid dayOfWeek: "NotADay"'
      )
    })

    it('should allow closing time as 24:00', () => {
      const input: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '24:00'
        }
      ]
      expect(() => service.setOpeningHours(input)).not.toThrow()
    })

    it('should throw an error if opening time is 24:00', () => {
      const input: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '24:00',
          closes: '18:00'
        }
      ]
      expect(() => service.setOpeningHours(input)).toThrow(
        'Invalid time range on Monday: opens at 24:00 but closes at 18:00'
      )
    })

    it('should throw an error if closing time exceeds 24:00', () => {
      const input: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '24:01'
        }
      ]
      expect(() => service.setOpeningHours(input)).toThrow(
        'Invalid time range on Monday: opens at 09:00 but closes at 00:01' // Adjust based on implementation
      )
    })

    it('should throw an error when trying to add a time span that crosses midnight', () => {
      expect(() => {
        service.addOpeningHour('Monday', '23:00', '02:00', 'UTC')
      }).toThrow(
        'Invalid time range on Monday: opens at 23:00 but closes at 02:00'
      )
    })

    it('should throw an error for overlapping time ranges on the same day', () => {
      const overlappingHours = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '12:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '11:00',
          closes: '18:00'
        }
      ]
      expect(() => service.setOpeningHours(overlappingHours)).toThrow(
        'Invalid time ranges: Monday [09:00-12:00] overlaps with Monday [11:00-18:00]'
      )
    })
  })

  /** Handling Opening Hours **/
  describe('Handling Opening Hours', () => {
    it('should return empty openRange for a day with no opening hours', () => {
      const openRange = service.getOpenRangeForDay('Monday')
      expect(openRange.openRange).toEqual([]) // No openRange for Monday
    })

    it('should correctly handle opening and closing times within the same day without changes', () => {
      const input: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Wednesday',
          opens: '09:00',
          closes: '17:00'
        }
      ]

      service.setOpeningHours(input)
      const exportedHours = service.exportOpeningHours()

      expect(exportedHours).toEqual(input) // No changes as it's within the same day
    })

    it('should handle opening at midnight and closing later on the same day', () => {
      const input: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Wednesday',
          opens: '00:00',
          closes: '08:00'
        }
      ]

      service.setOpeningHours(input)
      const exportedHours = service.exportOpeningHours()

      expect(exportedHours).toEqual(input) // No splitting needed, but time starts at midnight
    })

    it('should handle multiple open ranges on the same day without overlaps', () => {
      const openingHours: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Thursday',
          opens: '09:00',
          closes: '12:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Thursday',
          opens: '13:00',
          closes: '17:00'
        }
      ]

      service.setOpeningHours(openingHours)
      const openRangePerDay = service.getOpenRangeForDay('Thursday')

      expect(openRangePerDay.openRange).toEqual([
        { open: '09:00', closes: '12:00' },
        { open: '13:00', closes: '17:00' }
      ])
    })

    it('should throw an error for overlapping time ranges on the same day', () => {
      const overlappingHours = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Friday',
          opens: '09:00',
          closes: '12:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Friday',
          opens: '11:00',
          closes: '15:00'
        }
      ]
      expect(() => service.setOpeningHours(overlappingHours)).toThrow(
        'Invalid time ranges: Friday [09:00-12:00] overlaps with Friday [11:00-15:00]'
      )
    })

    it('should correctly handle adding and exporting multiple ranges across different days', () => {
      const openingHours: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '12:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '13:00',
          closes: '17:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Tuesday',
          opens: '10:00',
          closes: '16:00'
        }
      ]

      service.setOpeningHours(openingHours)
      const openRangeMonday = service.getOpenRangeForDay('Monday')
      const openRangeTuesday = service.getOpenRangeForDay('Tuesday')
      const openRangeWednesday = service.getOpenRangeForDay('Wednesday')

      expect(openRangeMonday.openRange).toEqual([
        { open: '09:00', closes: '12:00' },
        { open: '13:00', closes: '17:00' }
      ])
      expect(openRangeTuesday.openRange).toEqual([
        { open: '10:00', closes: '16:00' }
      ])
      expect(openRangeWednesday.openRange).toEqual([]) // No hours set for Wednesday
    })
  })

  /** Total Open Hours Calculation **/
  describe('Total Open Hours', () => {
    it('should calculate total open hours for a single day', () => {
      const openingHours = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '18:00'
        }
      ]
      service.setOpeningHours(openingHours)
      expect(service.getTotalOpenHours()).toBe(9) // 9 hours open on Monday
    })

    it('should calculate total open hours for multiple days', () => {
      const openingHours = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '18:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Tuesday',
          opens: '10:00',
          closes: '15:00'
        }
      ]
      service.setOpeningHours(openingHours)
      expect(service.getTotalOpenHours()).toBe(14) // 9 hours on Monday + 5 hours on Tuesday
    })

    it('should calculate total open hours accurately with multiple ranges per day', () => {
      const openingHours: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Wednesday',
          opens: '09:00',
          closes: '12:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Wednesday',
          opens: '13:00',
          closes: '17:00'
        }
      ]
      service.setOpeningHours(openingHours)
      expect(service.getTotalOpenHours()).toBe(7) // 3 hours + 4 hours on Wednesday
    })

    it('should return 0 when no opening hours are set', () => {
      expect(service.getTotalOpenHours()).toBe(0)
    })
  })

  /** Next Opening and Closing Times **/
  describe('Next Opening and Closing Times', () => {
    it('should return the next closing time for the current day', () => {
      const openingHours: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '10:00',
          closes: '22:00'
        }
      ]
      service.setOpeningHours(openingHours, 'UTC')
      const date = new Date('2024-04-01T10:30:00Z') // Assuming April 1, 2024 is a Monday

      const nextChange: NextChange | null = service.getNextChange(date)

      let expectedDate = new Date('2024-04-01T22:00:00Z')
      expect(nextChange).not.toBeNull()
      expect(nextChange?.state).toBe('close')
      expect(nextChange?.date).toEqual(expectedDate)
    })

    it('should return the next opening time for the current day if before opening', () => {
      const openingHours: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '18:00'
        }
      ]
      service.setOpeningHours(openingHours, 'UTC')

      const date = new Date('2024-04-01T08:00:00Z') // Assuming April 1, 2024 is a Monday
      const nextChange: NextChange | null = service.getNextChange(date)

      let expectedDate = new Date('2024-04-01T09:00:00Z')
      expect(nextChange).not.toBeNull()
      expect(nextChange?.state).toBe('open')
      expect(nextChange?.date).toEqual(expectedDate)
    })

    it('should return null if there are no upcoming changes', () => {
      const openingHours: OpeningHoursSpecification[] = []
      service.setOpeningHours(openingHours, 'UTC')

      const date = new Date('2024-04-01T19:00:00Z') // Assuming April 1, 2024 is a Monday
      const nextChange: NextChange | null = service.getNextChange(date)

      expect(nextChange).toBeNull()
    })

    it('should correctly identify the next opening time for the next day', () => {
      const openingHours: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '18:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Tuesday',
          opens: '10:00',
          closes: '17:00'
        }
      ]
      service.setOpeningHours(openingHours, 'UTC')

      const date = new Date('2024-04-01T19:00:00Z') // Assuming April 1, 2024 is a Monday
      const nextChange: NextChange | null = service.getNextChange(date)

      let expectedDate = new Date('2024-04-02T10:00:00Z')
      expect(nextChange).not.toBeNull()
      expect(nextChange?.state).toBe('open')
      expect(nextChange?.date).toEqual(expectedDate)
    })

    it('should return the next closing time as 00:00 for the current day', () => {
      const openingHours: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '24:00'
        }
      ]
      service.setOpeningHours(openingHours)

      const date = new Date('2024-04-01T10:00:00') // Assuming April 1, 2024 is a Monday
      const nextChange: NextChange | null = service.getNextChange(date)

      expect(nextChange).not.toBeNull()
      expect(nextChange?.state).toBe('close')
      expect(format(nextChange!.date, 'HH:mm')).toBe('00:00')
    })

    it('should handle closing at 24:00 without changing the day', () => {
      const openingHours: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Tuesday',
          opens: '10:00',
          closes: '24:00'
        }
      ]
      service.setOpeningHours(openingHours)

      const date = new Date('2024-04-02T23:30:00') // Assuming April 2, 2024 is a Tuesday
      const nextChange: NextChange | null = service.getNextChange(date)

      expect(nextChange).not.toBeNull()
      expect(nextChange?.state).toBe('close')
      expect(format(nextChange!.date, 'HH:mm')).toBe('00:00')
      expect(nextChange!.date.getDate()).toBe(3) // Next day (Wednesday)
    })
  })

  /** Current Status Tests **/
  describe('Current Status', () => {
    it('should return true if the establishment is currently open', () => {
      const day = new Date().toLocaleString('en-us', { weekday: 'long' })
      const now = new Date()
      const before = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      const fiveSecondsLater = new Date(now.getTime() + 65 * 1000)
      const after = fiveSecondsLater.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      service.addOpeningHour(day, before, after)
      const isOpen = service.isOpenNow()
      expect(isOpen).toBe(true)
    })

    it('should return false if the establishment is currently open', () => {
      const day = new Date().toLocaleString('en-us', { weekday: 'long' })
      const now = new Date()
      const before = now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      const fiveSecondsLater = new Date(now.getTime() + 65 * 1000)
      const after = fiveSecondsLater.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      service.addOpeningHour(day, before, after)
      const isClosed = service.isClosedNow()
      expect(isClosed).toBe(false)
    })

    it('should return false if the establishment is currently closed', () => {
      const day = new Date().toLocaleString('en-us', { weekday: 'long' })
      const now = new Date()
      const fiveSecondsLater = new Date(now.getTime() + 65 * 1000)
      const SixtyFiveSecondsLater = new Date(now.getTime() + 130 * 1000)
      const before = fiveSecondsLater.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      const after = SixtyFiveSecondsLater.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      service.addOpeningHour(day, before, after)
      const isOpen = service.isOpenNow()
      expect(isOpen).toBe(false)
    })

    it('should return true if the establishment is currently closed', () => {
      const day = new Date().toLocaleString('en-us', { weekday: 'long' })
      const now = new Date()
      const fiveSecondsLater = new Date(now.getTime() + 65 * 1000)
      const SixtyFiveSecondsLater = new Date(now.getTime() + 130 * 1000)
      const before = fiveSecondsLater.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      const after = SixtyFiveSecondsLater.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      })
      service.addOpeningHour(day, before, after)
      const isClosed = service.isClosedNow()
      expect(isClosed).toBe(true)
    })

    it('should return a list of days without opening hours', () => {
      const openingHours = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '18:00'
        }
      ]
      service.setOpeningHours(openingHours)
      expect(service.getDaysWithoutOpeningHours()).toEqual([
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday'
      ])
    })

    it('should return an empty array if all days have opening hours', () => {
      const openingHours = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '18:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Tuesday',
          opens: '09:00',
          closes: '18:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Wednesday',
          opens: '09:00',
          closes: '18:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Thursday',
          opens: '09:00',
          closes: '18:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Friday',
          opens: '09:00',
          closes: '18:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Saturday',
          opens: '09:00',
          closes: '18:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Sunday',
          opens: '09:00',
          closes: '18:00'
        }
      ]
      service.setOpeningHours(openingHours)
      expect(service.getDaysWithoutOpeningHours()).toEqual([])
    })
  })

  /** isOpenAt Tests **/
  describe('isOpenAt', () => {
    it('should return true if the establishment is open at the specified date and time', () => {
      const openingHours = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Friday',
          opens: '09:00',
          closes: '17:00'
        }
      ]
      service.setOpeningHours(openingHours, 'UTC')

      const testDate = new Date('2024-04-05T12:00:00Z') // Assuming April 5, 2024 is a Friday
      expect(service.isOpenAt(testDate)).toBe(true)
    })

    it('should return false if the establishment is closed at the specified date and time', () => {
      const openingHours = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Friday',
          opens: '09:00',
          closes: '17:00'
        }
      ]
      service.setOpeningHours(openingHours, 'UTC')

      const testDate = new Date('2024-04-05T08:00:00Z') // Before opening
      expect(service.isOpenAt(testDate)).toBe(false)

      const testDateAfter = new Date('2024-04-05T18:00:00Z') // After closing
      expect(service.isOpenAt(testDateAfter)).toBe(false)
    })

    it('should handle multiple open ranges on the same day correctly', () => {
      const openingHours: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Saturday',
          opens: '09:00',
          closes: '12:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Saturday',
          opens: '14:00',
          closes: '17:00'
        }
      ]
      service.setOpeningHours(openingHours)

      const testDateMorning = new Date('2024-04-06T10:00:00') // During first range
      expect(service.isOpenAt(testDateMorning)).toBe(true)

      const testDateMidday = new Date('2024-04-06T12:30:00') // Between ranges
      expect(service.isOpenAt(testDateMidday)).toBe(false)

      const testDateAfternoon = new Date('2024-04-06T14:00:00') // During second range
      expect(service.isOpenAt(testDateAfternoon)).toBe(true)
    })

    it('should return false for days with no opening hours', () => {
      const openingHours = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Sunday',
          opens: '10:00',
          closes: '16:00'
        }
      ]
      service.setOpeningHours(openingHours, 'UTC')

      const testDate = new Date('2024-04-07T12:00:00Z') // Assuming April 7, 2024 is a Sunday
      expect(service.isOpenAt(testDate)).toBe(true)

      const testDateMonday = new Date('2024-04-08T12:00:00Z') // Monday with no hours
      expect(service.isOpenAt(testDateMonday)).toBe(false)
    })
  })

  /** getOpenRangePerDay and getOpenRangeForDay Tests **/
  describe('Open Range Retrieval', () => {
    it('should return correct open ranges per day', () => {
      const openingHours: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '12:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '13:00',
          closes: '17:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Tuesday',
          opens: '10:00',
          closes: '15:00'
        }
      ]
      service.setOpeningHours(openingHours, 'UTC')

      const openRangeMonday = service.getOpenRangeForDay('Monday', 'UTC')
      const openRangeTuesday = service.getOpenRangeForDay('Tuesday', 'UTC')
      const openRangeWednesday = service.getOpenRangeForDay('Wednesday', 'UTC')

      expect(openRangeMonday.openRange).toEqual([
        { open: '09:00', closes: '12:00' },
        { open: '13:00', closes: '17:00' }
      ])
      expect(openRangeTuesday.openRange).toEqual([
        { open: '10:00', closes: '15:00' }
      ])
      expect(openRangeWednesday.openRange).toEqual([]) // No hours set for Wednesday
    })

    it('should handle timezone conversion correctly when retrieving open ranges', () => {
      service.addOpeningHour('Monday', '09:00', '12:00', 'UTC')
      service.addOpeningHour('Monday', '13:00', '17:00', 'America/New_York')

      const openRangeUTC = service
        .getOpenRangePerDay('UTC')
        .find(day => day.dayOfWeek === 'Monday')
      const openRangeNY = service
        .getOpenRangePerDay('America/New_York')
        .find(day => day.dayOfWeek === 'Monday')

      expect(openRangeUTC?.openRange).toEqual([
        { open: '09:00', closes: '12:00' },
        { open: '17:00', closes: '21:00' }
      ])
      expect(openRangeNY?.openRange).toEqual([
        { open: '05:00', closes: '08:00' },
        { open: '13:00', closes: '17:00' }
      ])
    })
  })

  /** isOpenForDuration and isClosedForDuration Tests **/
  describe('Duration-Based Open/Closed Checks', () => {
    it('should return true if the establishment is open for the entire duration', () => {
      const openingHours: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Wednesday',
          opens: '09:00',
          closes: '18:00'
        }
      ]
      service.setOpeningHours(openingHours)

      const date = new Date('2024-04-03T10:00:00')
      expect(service.isOpenForDuration(60, date)).toBe(true)

      jest.restoreAllMocks()
    })

    it('should return false if the establishment will close before the duration elapses', () => {
      const openingHours: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Thursday',
          opens: '09:00',
          closes: '12:00'
        }
      ]
      service.setOpeningHours(openingHours)

      const date = new Date('2024-04-04T11:30:00')
      expect(service.isOpenForDuration(60, date)).toBe(false)

      jest.restoreAllMocks()
    })

    it('should return true if the establishment is closed and remains closed for the duration', () => {
      const openingHours: OpeningHoursSpecification[] = []
      service.setOpeningHours(openingHours)

      // Assuming current time is any time, and checking for any duration
      expect(service.isClosedForDuration(60)).toBe(true)
    })

    it('should return false if the establishment will open before the duration elapses', () => {
      const openingHours: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Friday',
          opens: '10:00',
          closes: '18:00'
        }
      ]
      service.setOpeningHours(openingHours)

      const date = new Date('2024-04-05T09:30:00')
      expect(service.isClosedForDuration(60, date)).toBe(false)

      jest.restoreAllMocks()
    })
  })

  /** getOpenRangePerDay and getOpenRangeForDay Tests **/
  describe('Open Range Retrieval', () => {
    it('should return correct open ranges per day', () => {
      const openingHours: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '12:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '13:00',
          closes: '17:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Tuesday',
          opens: '10:00',
          closes: '15:00'
        }
      ]
      service.setOpeningHours(openingHours, 'UTC')

      const openRangeMonday = service.getOpenRangeForDay('Monday', 'UTC')
      const openRangeTuesday = service.getOpenRangeForDay('Tuesday', 'UTC')
      const openRangeWednesday = service.getOpenRangeForDay('Wednesday', 'UTC')

      expect(openRangeMonday.openRange).toEqual([
        { open: '09:00', closes: '12:00' },
        { open: '13:00', closes: '17:00' }
      ])
      expect(openRangeTuesday.openRange).toEqual([
        { open: '10:00', closes: '15:00' }
      ])
      expect(openRangeWednesday.openRange).toEqual([]) // No hours set for Wednesday
    })

    it('should handle timezone conversion correctly when retrieving open ranges', () => {
      service.addOpeningHour('Monday', '09:00', '12:00', 'UTC')
      service.addOpeningHour('Monday', '14:00', '17:00', 'America/New_York')

      const openRangeUTC = service
        .getOpenRangePerDay('UTC')
        .find(day => day.dayOfWeek === 'Monday')
      const openRangeNY = service
        .getOpenRangePerDay('America/New_York')
        .find(day => day.dayOfWeek === 'Monday')

      expect(openRangeUTC?.openRange).toEqual([
        { open: '09:00', closes: '12:00' },
        { open: '18:00', closes: '21:00' }
      ])
      expect(openRangeNY?.openRange).toEqual([
        { open: '05:00', closes: '08:00' },
        { open: '14:00', closes: '17:00' }
      ])
    })
  })

  /** Comprehensive validateOpeningHours Tests **/
  describe('validateOpeningHours', () => {
    it('should return true for valid opening hours', () => {
      const openingHours = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '18:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Tuesday',
          opens: '09:00',
          closes: '18:00'
        }
      ]
      expect(service.validateOpeningHours(openingHours)).toBe(true)
    })

    it('should return false for invalid opening hours (closes before opens)', () => {
      const invalidHours: OpeningHoursSpecification[] = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '18:00',
          closes: '09:00'
        }
      ]
      expect(service.validateOpeningHours(invalidHours)).toBe(false)
    })

    it('should return false for overlapping time ranges on the same day', () => {
      const overlappingHours = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '12:00'
        },
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '11:00',
          closes: '18:00'
        }
      ]
      expect(service.validateOpeningHours(overlappingHours)).toBe(false)
    })
  })
})
