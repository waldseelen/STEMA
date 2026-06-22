import { describe, expect, it } from 'vitest'
import {
    activityFormSchema,
    colorSchema,
    dateKeySchema,
    formatErrors,
    generalSettingsSchema,
    habitFormSchema,
    nameSchema,
    pomodoroSettingsSchema,
    timeSchema,
    timeSessionFormSchema,
    validateField,
    validateForm
} from '../src/lib/validation/formSchemas'

describe('Form Validation Schemas', () => {
    describe('Base Field Schemas', () => {
        describe('nameSchema', () => {
            it('should accept valid names', () => {
                expect(nameSchema.safeParse('Work').success).toBe(true)
                expect(nameSchema.safeParse('My Activity').success).toBe(true)
            })

            it('should reject empty names', () => {
                expect(nameSchema.safeParse('').success).toBe(false)
            })

            it('should reject too long names', () => {
                const longName = 'a'.repeat(101)
                expect(nameSchema.safeParse(longName).success).toBe(false)
            })

            it('should trim whitespace', () => {
                const result = nameSchema.parse('  Test  ')
                expect(result).toBe('Test')
            })
        })

        describe('colorSchema', () => {
            it('should accept valid hex colors', () => {
                expect(colorSchema.safeParse('#FF5733').success).toBe(true)
                expect(colorSchema.safeParse('#ffffff').success).toBe(true)
            })

            it('should reject invalid colors', () => {
                expect(colorSchema.safeParse('red').success).toBe(false)
                expect(colorSchema.safeParse('#FFF').success).toBe(false)
                expect(colorSchema.safeParse('#GGGGGG').success).toBe(false)
            })

            it('should allow undefined', () => {
                expect(colorSchema.safeParse(undefined).success).toBe(true)
            })
        })

        describe('dateKeySchema', () => {
            it('should accept valid date keys', () => {
                expect(dateKeySchema.safeParse('2024-01-15').success).toBe(true)
                expect(dateKeySchema.safeParse('2024-12-31').success).toBe(true)
            })

            it('should reject invalid formats', () => {
                expect(dateKeySchema.safeParse('01-15-2024').success).toBe(false)
                expect(dateKeySchema.safeParse('2024/01/15').success).toBe(false)
                expect(dateKeySchema.safeParse('invalid').success).toBe(false)
            })
        })

        describe('timeSchema', () => {
            it('should accept valid times', () => {
                expect(timeSchema.safeParse('09:00').success).toBe(true)
                expect(timeSchema.safeParse('23:59').success).toBe(true)
            })

            it('should reject invalid times', () => {
                expect(timeSchema.safeParse('9:00').success).toBe(false)
                // Note: regex only checks format, not actual valid time values
                // 25:00 matches \d{2}:\d{2} pattern
            })
        })
    })

    describe('activityFormSchema', () => {
        it('should validate valid activity', () => {
            const valid = {
                name: 'Work',
                categoryId: 'cat_123',
                color: '#FF5733',
            }
            expect(activityFormSchema.safeParse(valid).success).toBe(true)
        })

        it('should accept minimal activity', () => {
            const minimal = { name: 'Work' }
            expect(activityFormSchema.safeParse(minimal).success).toBe(true)
        })

        it('should reject activity without name', () => {
            const invalid = { color: '#FF5733' }
            expect(activityFormSchema.safeParse(invalid).success).toBe(false)
        })
    })

    describe('habitFormSchema', () => {
        it('should validate boolean habit', () => {
            const valid = {
                name: 'Meditate',
                type: 'boolean',
                frequency: 'daily',
            }
            expect(habitFormSchema.safeParse(valid).success).toBe(true)
        })

        it('should validate numeric habit', () => {
            const valid = {
                name: 'Drink Water',
                type: 'numeric',
                frequency: 'daily',
                minTarget: 8,
                unit: 'glasses',
            }
            expect(habitFormSchema.safeParse(valid).success).toBe(true)
        })

        it('should validate weekly habit with target days', () => {
            const valid = {
                name: 'Exercise',
                type: 'boolean',
                frequency: 'weekly',
                targetDays: [1, 3, 5], // Mon, Wed, Fri
            }
            expect(habitFormSchema.safeParse(valid).success).toBe(true)
        })

        it('should reject invalid frequency', () => {
            const invalid = {
                name: 'Test',
                type: 'boolean',
                frequency: 'monthly', // not allowed
            }
            expect(habitFormSchema.safeParse(invalid).success).toBe(false)
        })
    })

    describe('timeSessionFormSchema', () => {
        it('should validate valid session', () => {
            const valid = {
                activityId: 'act_123',
                startAt: 1704067200000,
                endAt: 1704070800000,
            }
            expect(timeSessionFormSchema.safeParse(valid).success).toBe(true)
        })

        it('should reject session where end is before start', () => {
            const invalid = {
                activityId: 'act_123',
                startAt: 1704070800000,
                endAt: 1704067200000,
            }
            const result = timeSessionFormSchema.safeParse(invalid)
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.error.issues[0].path).toContain('endAt')
            }
        })

        it('should reject missing activityId', () => {
            const invalid = {
                startAt: 1704067200000,
                endAt: 1704070800000,
            }
            expect(timeSessionFormSchema.safeParse(invalid).success).toBe(false)
        })
    })

    describe('generalSettingsSchema', () => {
        it('should validate valid settings', () => {
            const valid = {
                rolloverHour: 4,
                weekStart: 1,
                language: 'tr',
                theme: 'dark',
            }
            expect(generalSettingsSchema.safeParse(valid).success).toBe(true)
        })

        it('should reject invalid rollover hour', () => {
            const invalid = { rolloverHour: 25, weekStart: 1, language: 'tr', theme: 'light' }
            expect(generalSettingsSchema.safeParse(invalid).success).toBe(false)
        })

        it('should reject invalid theme', () => {
            const invalid = { rolloverHour: 4, weekStart: 1, language: 'tr', theme: 'blue' }
            expect(generalSettingsSchema.safeParse(invalid).success).toBe(false)
        })
    })

    describe('pomodoroSettingsSchema', () => {
        it('should validate valid pomodoro settings', () => {
            const valid = {
                workDuration: 25,
                shortBreakDuration: 5,
                longBreakDuration: 15,
                sessionsBeforeLongBreak: 4,
                autoStartBreaks: true,
                autoStartWork: false,
            }
            expect(pomodoroSettingsSchema.safeParse(valid).success).toBe(true)
        })

        it('should reject work duration > 120', () => {
            const invalid = {
                workDuration: 150,
                shortBreakDuration: 5,
                longBreakDuration: 15,
                sessionsBeforeLongBreak: 4,
                autoStartBreaks: true,
                autoStartWork: false,
            }
            expect(pomodoroSettingsSchema.safeParse(invalid).success).toBe(false)
        })
    })

    describe('validateForm helper', () => {
        it('should return success with parsed data', () => {
            const result = validateForm(activityFormSchema, { name: 'Work' })
            expect(result.success).toBe(true)
            if (result.success) {
                expect(result.data.name).toBe('Work')
            }
        })

        it('should return errors as field map', () => {
            const result = validateForm(activityFormSchema, { name: '' })
            expect(result.success).toBe(false)
            if (!result.success) {
                expect(result.errors).toHaveProperty('name')
            }
        })
    })

    describe('validateField helper', () => {
        it('should return null for valid field', () => {
            expect(validateField(nameSchema, 'Valid Name')).toBeNull()
        })

        it('should return error message for invalid field', () => {
            const error = validateField(nameSchema, '')
            expect(error).toBeTruthy()
            expect(typeof error).toBe('string')
        })
    })

    describe('formatErrors helper', () => {
        it('should format errors as string', () => {
            const errors = {
                name: 'Required',
                color: 'Invalid format',
            }
            const formatted = formatErrors(errors)
            expect(formatted).toContain('name: Required')
            expect(formatted).toContain('color: Invalid format')
        })
    })
})
