import { describe, expect, it } from 'vitest'
import { buildProfileCompletionUpdate } from '../../src/modules/auth/lib/profile'

describe('profile completion helpers', () => {
    it('marks the profile as completed in the update payload', () => {
        const updates = buildProfileCompletionUpdate({
            fullName: '  Bugra Akin  ',
            occupation: '  DEV  ',
            studentStatus: 'working',
            school: 'Should be cleared',
            department: 'Should be cleared',
            grade: '4',
        })

        expect(updates).toMatchObject({
            full_name: 'Bugra Akin',
            occupation: 'DEV',
            student_status: 'working',
            school: null,
            department: null,
            grade: null,
            profile_completed: true,
        })
    })

    it('keeps student fields for student-scoped statuses', () => {
        const updates = buildProfileCompletionUpdate({
            fullName: 'Bugra Akin',
            occupation: 'Developer',
            studentStatus: 'student',
            school: 'Gaziantep University',
            department: 'EEE',
            grade: '4',
        })

        expect(updates).toMatchObject({
            school: 'Gaziantep University',
            department: 'EEE',
            grade: '4',
            profile_completed: true,
        })
    })
})
