import {
  OpeningHoursService,
  OpeningHoursSpecification,
  OpenRangePerDay,
  NextChange
} from '../src/OpeningHoursService'

import { format } from 'date-fns'

describe('OpeningHoursService', () => {
  let service: OpeningHoursService

  beforeEach(() => {
    service = new OpeningHoursService()
  })

  // Initialization Tests
  describe('Initialization', () => {
    it('should return empty array when no opening hours are set', () => {
      const exportedHours = service.exportOpeningHours()
      expect(exportedHours).toEqual([]) // No opening hours should be present
    })
  })

  // Adding and Removing Opening Hours
  describe('Adding and Removing Hours', () => {
    it('should correctly identify if the service is currently open', () => {
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

    it('should throw an error for invalid timezones', () => {
      expect(() => {
        service.addOpeningHour('Monday', '09:00', '17:00', 'Invalid/Timezone')
      }).toThrow('Invalid time value')
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
  })

  // Time Range Validation Tests
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
      expect(() => service.setOpeningHours(input)).toThrow('Invalid time value')
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

    it('should throw an error when trying to add a time span that crosses midnight', () => {
      expect(() => {
        service.addOpeningHour('Monday', '23:00', '02:00', 'UTC')
      }).toThrow(
        'Invalid time range on Monday: opens at 23:00 but closes at 02:00'
      )
    })
  })

  // Handling Opening Hours
  describe('Handling Opening Hours', () => {
    it('should return empty openRange for a day with no opening hours', () => {
      const openRange = service.getShiftsForDay('Monday', 'UTC')
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
      expect(service.validateOpeningHours(overlappingHours)).toBe(false)
    })
  })

  // Total Open Hours Calculation
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
  })

  // Next Opening and Closing Times
  describe('Next Opening and Closing Times', () => {
    it('should return the next opening time for the current day', () => {
      const openingHours = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '18:00'
        }
      ]
      service.setOpeningHours(openingHours)
      const nextOpeningTime = service.getNextOpeningTime()

      expect(nextOpeningTime ? format(nextOpeningTime, 'HH:mm') : 'Error').toBe(
        '09:00'
      )
    })

    it('should return the next opening time for the next day', () => {
      const openingHours = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Tuesday',
          opens: '15:00',
          closes: '18:00'
        }
      ]
      service.setOpeningHours(openingHours)
      const nextOpeningTime = service.getNextOpeningTime()

      expect(nextOpeningTime ? format(nextOpeningTime, 'HH:mm') : 'Error').toBe(
        '15:00'
      )
    })

    it('should return the next closing time for the current day', () => {
      const openingHours = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '18:00'
        }
      ]
      service.setOpeningHours(openingHours)
      const nextClosingTime = service.getNextClosingTime()
      expect(nextClosingTime ? format(nextClosingTime, 'HH:mm') : 'Error').toBe(
        '18:00'
      )
    })

    it('should return the next closing time for the next day', () => {
      const openingHours = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Tuesday',
          opens: '09:00',
          closes: '23:00'
        }
      ]
      service.setOpeningHours(openingHours)
      const nextClosingTime = service.getNextClosingTime()
      expect(nextClosingTime ? format(nextClosingTime, 'HH:mm') : 'Error').toBe(
        '23:00'
      )
    })
  })

  // Current Status Tests
  describe('Current Status', () => {
    it('should return true if the establishment is currently closed', () => {
      const openingHours = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '18:00'
        }
      ]
      service.setOpeningHours(openingHours)
      jest.spyOn(service, 'isOpenNow').mockReturnValue(false)
      expect(service.isClosedNow()).toBe(true)
    })

    it('should return false if the establishment is currently open', () => {
      const openingHours = [
        {
          '@type': 'OpeningHoursSpecification',
          dayOfWeek: 'Monday',
          opens: '09:00',
          closes: '18:00'
        }
      ]
      service.setOpeningHours(openingHours)
      jest.spyOn(service, 'isOpenNow').mockReturnValue(true)
      expect(service.isClosedNow()).toBe(false)
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
})

describe('validateOpeningHours', () => {
  let service: OpeningHoursService

  beforeEach(() => {
    service = new OpeningHoursService()
  })

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

describe('getTotalOpenHours', () => {
  let service: OpeningHoursService

  beforeEach(() => {
    service = new OpeningHoursService()
  })

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

  // Next Change Tests
  describe('getNextChange', () => {
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
      const date = new Date('2024-04-01T10:30:00') // Assuming April 1, 2024 is a Monday

      const nextChange: NextChange | null = service.getNextChange(date, 'UTC')

      expect(nextChange).not.toBeNull()
      expect(nextChange?.state).toBe('close')
      expect(format(nextChange!.date, 'HH:mm')).toBe('22:00')
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

      const date = new Date('2024-04-01T08:00:00') // Assuming April 1, 2024 is a Monday
      const nextChange: NextChange | null = service.getNextChange(date, 'UTC')

      expect(nextChange).not.toBeNull()
      expect(nextChange?.state).toBe('open')
      expect(format(nextChange!.date, 'HH:mm')).toBe('09:00')
    })

    it('should return null if there are no upcoming changes', () => {
      const openingHours: OpeningHoursSpecification[] = []
      service.setOpeningHours(openingHours, 'UTC')

      const date = new Date('2024-04-01T19:00:00') // Assuming April 1, 2024 is a Monday
      const nextChange: NextChange | null = service.getNextChange(date, 'UTC')

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

      const date = new Date('2024-04-01T19:00:00') // Assuming April 1, 2024 is a Monday
      const nextChange: NextChange | null = service.getNextChange(date, 'UTC')

      expect(nextChange).not.toBeNull()
      expect(nextChange?.state).toBe('open')
      expect(format(nextChange!.date, 'HH:mm')).toBe('10:00')
    })
  })
})
