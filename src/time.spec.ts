import { describe, expect, test } from "vitest";

import { getNextDate, parseCron } from "@/time.ts";

function localDate(year: number, month: number, day: number, hours = 0, minutes = 0, seconds = 0, ms = 0) {
    return new Date(year, month - 1, day, hours, minutes, seconds, ms);
}

function next(cronTime: string, from: Date) {
    return getNextDate(cronTime, from).getTime();
}

function nextUtc(cronTime: string, from: number) {
    return getNextDate(cronTime, new Date(from), { utc: true }).getTime();
}

function withTimezone(timezone: string, callback: () => void) {
    const previousTimezone = process.env.TZ;
    process.env.TZ = timezone;

    try {
        callback();
    }
    finally {
        if (previousTimezone === undefined) {
            delete process.env.TZ;
        }
        else {
            process.env.TZ = previousTimezone;
        }
    }
}

describe("getNextDate", () => {
    test("should be the current date", () => {
        expect(next("* * * * * *", localDate(2024, 1, 1))).toBe(localDate(2024, 1, 1).getTime());
    });

    test("should be the next second", () => {
        expect(next("* * * * * *", localDate(2024, 1, 1, 0, 0, 0, 1))).toBe(localDate(2024, 1, 1, 0, 0, 1).getTime());
    });

    test("should be the next five seconds", () => {
        expect(next("*/5 * * * * *", localDate(2024, 1, 1, 0, 0, 0, 1))).toBe(localDate(2024, 1, 1, 0, 0, 5).getTime());
    });

    test("should be the next five seconds with base 0", () => {
        expect(next("0/5 * * * * *", localDate(2024, 1, 1, 0, 0, 0, 1))).toBe(localDate(2024, 1, 1, 0, 0, 5).getTime());
    });

    test("should be the next five seconds with base 2", () => {
        expect(next("2/5 * * * * *", localDate(2024, 1, 1, 0, 0, 0, 1))).toBe(localDate(2024, 1, 1, 0, 0, 2).getTime());
    });

    test("should be the next five seconds with base 2 skipped", () => {
        expect(next("2/5 * * * * *", localDate(2024, 1, 1, 0, 0, 4))).toBe(localDate(2024, 1, 1, 0, 0, 7).getTime());
    });

    test("should be the next three minutes", () => {
        expect(next("* 3-5 * * * *", localDate(2024, 1, 1, 0, 0, 0, 1))).toBe(localDate(2024, 1, 1, 0, 3).getTime());
    });

    test("should be the next sunday", () => {
        const thursday = localDate(2024, 1, 4);
        const sunday = localDate(2024, 1, 7);
        expect(next("* * * * * 0", thursday)).toBe(sunday.getTime());
    });

    test("should use 1-based months", () => {
        expect(next("0 0 0 1 3 *", localDate(2024, 1, 15))).toBe(localDate(2024, 3, 1).getTime());
    });

    test("should not overflow when changing month from the 31st", () => {
        expect(next("0 0 0 1 2 *", localDate(2024, 1, 31))).toBe(localDate(2024, 2, 1).getTime());
    });

    test("should wrap to next year for an earlier month", () => {
        expect(next("0 0 0 1 3 *", localDate(2024, 6, 1))).toBe(localDate(2025, 3, 1).getTime());
    });

    test("should re-check the hour after a minute carry", () => {
        expect(next("0 30 6 * * *", localDate(2024, 1, 1, 6, 45))).toBe(localDate(2024, 1, 2, 6, 30).getTime());
    });

    test("should re-check the day after a second carry", () => {
        expect(next("0 0 0 * * *", localDate(2024, 1, 1, 0, 0, 0, 500))).toBe(localDate(2024, 1, 2).getTime());
    });

    test("should re-check the day of month after an hour carry", () => {
        expect(next("0 0 3 15 * *", localDate(2024, 1, 15, 5))).toBe(localDate(2024, 2, 15, 3).getTime());
    });

    test("should reset the time when skipping a weekday", () => {
        const sundayMorning = localDate(2024, 1, 7, 9, 30);
        const mondayMorning = localDate(2024, 1, 8, 9);
        expect(next("0 * 9 * * 1", sundayMorning)).toBe(mondayMorning.getTime());
    });

    test("should match either day field when both are restricted", () => {
        const tuesday = localDate(2024, 1, 2);
        const nextMonday = localDate(2024, 1, 8);
        expect(next("0 0 0 1 * 1", tuesday)).toBe(nextMonday.getTime());

        const lastMondayOfJanuary = localDate(2024, 1, 29, 1);
        const firstOfFebruary = localDate(2024, 2, 1);
        expect(next("0 0 0 1 * 1", lastMondayOfJanuary)).toBe(firstOfFebruary.getTime());

        const fridayThe13th = localDate(2024, 9, 13);
        expect(next("0 0 0 13 * 5", localDate(2024, 9, 7))).toBe(fridayThe13th.getTime());
    });

    test("should match both day fields when one starts with *", () => {
        const nextMondayOnOddDay = localDate(2024, 1, 15);
        expect(next("0 0 0 */2 * 1", localDate(2024, 1, 2))).toBe(nextMondayOnOddDay.getTime());

        const nextFirstOfMonth = localDate(2024, 2, 1);
        expect(next("0 0 0 1 * *", localDate(2024, 1, 2))).toBe(nextFirstOfMonth.getTime());
    });

    test("should skip months without the requested day", () => {
        expect(next("0 0 0 31 * *", localDate(2024, 4, 1))).toBe(localDate(2024, 5, 31).getTime());
    });

    test("should find the next leap day", () => {
        expect(next("0 0 0 29 2 *", localDate(2025, 1, 1))).toBe(localDate(2028, 2, 29).getTime());
    });

    test("should support lists of ranges and values", () => {
        expect(next("0 0 0 1-3,5 * *", localDate(2024, 1, 4))).toBe(localDate(2024, 1, 5).getTime());
    });

    test("should support steps on ranges", () => {
        expect(next("0 10-20/5 * * * *", localDate(2024, 1, 1, 0, 11))).toBe(localDate(2024, 1, 1, 0, 15).getTime());
        expect(next("0 10-20/5 * * * *", localDate(2024, 1, 1, 0, 21))).toBe(localDate(2024, 1, 1, 1, 10).getTime());
    });

    test("should ignore extra whitespace", () => {
        expect(next(" 0  0 * * * * ", localDate(2024, 1, 1, 0, 0, 30))).toBe(localDate(2024, 1, 1, 1).getTime());
    });

    test("should accept 7 as sunday", () => {
        const monday = localDate(2024, 1, 1, 1);
        const sunday = localDate(2024, 1, 7);
        expect(next("0 0 0 * * 7", monday)).toBe(sunday.getTime());
    });

    test("should not mutate the given date", () => {
        const from = localDate(2024, 1, 1, 0, 0, 0, 500);
        getNextDate("0 0 0 * * *", from);

        expect(from.getTime()).toBe(localDate(2024, 1, 1, 0, 0, 0, 500).getTime());
    });

    test("should only move forward", () => {
        let date = localDate(2024, 1, 1);
        for (let i = 0; i < 500; i++) {
            const nextDate = getNextDate("17 */7 * * * *", new Date(date.getTime() + 1));
            expect(nextDate.getTime()).toBeGreaterThan(date.getTime());
            date = nextDate;
        }
    });

    test("should only move forward across a DST fall back", () => {
        withTimezone("Europe/Paris", () => {
            const secondOccurrenceOf0200 = new Date("2024-10-27T01:00:30Z");
            let date = secondOccurrenceOf0200;
            for (let i = 0; i < 200; i++) {
                const nextDate = getNextDate("30 * * * * *", new Date(date.getTime() + 1));
                expect(nextDate.getTime()).toBe(date.getTime() + 60_000);
                date = nextDate;
            }
        });
    });

    test("should throw for impossible dates", () => {
        expect(() => getNextDate("0 0 0 30 2 *", localDate(2024, 1, 1))).toThrow("Unable to find a valid date");
    });
});

describe("getNextDate with utc", () => {
    test("should use UTC hours", () => {
        expect(nextUtc("0 0 9 * * *", Date.UTC(2024, 0, 1, 10))).toBe(Date.UTC(2024, 0, 2, 9));
    });

    test("should use UTC weekdays", () => {
        const thursday = Date.UTC(2024, 0, 4);
        const sunday = Date.UTC(2024, 0, 7);
        expect(nextUtc("0 0 0 * * 0", thursday)).toBe(sunday);
    });

    test("should use UTC months and days", () => {
        expect(nextUtc("0 0 0 1 3 *", Date.UTC(2024, 0, 31))).toBe(Date.UTC(2024, 2, 1));
        expect(nextUtc("0 0 0 31 * *", Date.UTC(2024, 3, 1))).toBe(Date.UTC(2024, 4, 31));
    });

    test("should use UTC minutes in a timezone with a 45 minute offset", () => {
        withTimezone("Asia/Kathmandu", () => {
            const from = Date.UTC(2024, 0, 1, 0, 10);
            expect(nextUtc("0 0 * * * *", from)).toBe(Date.UTC(2024, 0, 1, 1));
            expect(next("0 0 * * * *", new Date(from))).toBe(Date.UTC(2024, 0, 1, 0, 15));
        });
    });

    test("should ignore local DST changes", () => {
        withTimezone("Europe/Paris", () => {
            const dayClocksGoForward = Date.UTC(2024, 2, 31);
            expect(nextUtc("0 30 2 * * *", dayClocksGoForward)).toBe(Date.UTC(2024, 2, 31, 2, 30));
            expect(nextUtc("0 30 2 * * *", Date.UTC(2024, 2, 31, 3))).toBe(Date.UTC(2024, 3, 1, 2, 30));
        });
    });
});

describe("parseCron", () => {
    test("should fill missing fields with 0", () => {
        expect(parseCron("6 * * *")).toEqual(parseCron("0 0 6 * * *"));
    });

    test.each([
        ["empty", ""],
        ["too many fields", "* * * * * * *"],
        ["out of range", "60 * * * * *"],
        ["out of range month", "* * * * 0 *"],
        ["not a number", "a * * * * *"],
        ["empty list item", "1, * * * * *"],
        ["reversed range", "5-3 * * * * *"],
        ["zero step", "*/0 * * * * *"],
        ["double step", "*/2/3 * * * * *"],
        ["negative", "-1 * * * * *"]
    ])("should reject %s", (_, cronTime) => {
        expect(() => parseCron(cronTime)).toThrow();
    });
});
