import { expect, test } from "vitest";
import { getNextDate } from "@/time.ts";

test("should be the current date", () => {
    const nextDate = getNextDate("* * * * * *", new Date(0));

    expect(nextDate.getTime()).toBe(0);
});

test("should be the next second", () => {
    const nextDate = getNextDate("* * * * * *", new Date(1));

    expect(nextDate.getTime()).toBe(1000);
});

test("should be the next five seconds", () => {
    const nextDate = getNextDate("*/5 * * * * *", new Date(1));

    expect(nextDate.getTime()).toBe(5000);
});

test("should be the next three minutes", () => {
    const nextDate = getNextDate("* 3-5 * * * *", new Date(1));

    expect(nextDate.getTime()).toBe(new Date("1970-01-01T00:03:00Z").getTime());
});

test("should be the next sunday", () => {
    const nextDate = getNextDate("* * * * * 0", new Date(0));

    expect(nextDate.getTime()).toBe(new Date("1970-01-04T00:00:00Z").getTime());
});
