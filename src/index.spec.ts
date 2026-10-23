import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { Cron } from "@/index.ts";
import { wait } from "@/wait.ts";

beforeEach(() => {
    vi.useFakeTimers({ now: new Date(2024, 0, 1, 0, 0, 0, 500) });
});

afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
});

test("test seconds", async () => {
    let count = 0;

    const cron = new Cron({
        job: () => {
            count++;
        },
        time: "* * * * * *"
    });

    await vi.advanceTimersByTimeAsync(3000);
    cron.stop();

    expect(count).toBe(3);
});

test("test 5 seconds", async () => {
    let count = 0;

    const cron = new Cron({
        job: () => {
            count++;
        },
        time: "*/5 * * * * *"
    });

    await vi.advanceTimersByTimeAsync(5000);
    cron.stop();

    expect(count).toBe(1);
});

test("test async seconds", async () => {
    let countBefore = 0;
    let countAfter = 0;

    const cron = new Cron({
        job: async () => {
            countBefore++;
            await wait(2000);
            countAfter++;
        },
        time: "* * * * * *"
    });

    await vi.advanceTimersByTimeAsync(3000);
    cron.stop();

    expect(countBefore).toBe(3);
    expect(countAfter).toBe(1);
});

test("should keep running when a sync job throws", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    let count = 0;

    const cron = new Cron({
        job: () => {
            count++;
            throw new Error("sync");
        },
        time: "* * * * * *"
    });

    await vi.advanceTimersByTimeAsync(3000);
    cron.stop();

    expect(count).toBe(3);
    expect(consoleError).toHaveBeenCalledTimes(3);
});

test("should keep running when an async job rejects", async () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    let count = 0;

    const cron = new Cron({
        job: async () => {
            count++;
            throw new Error("async");
        },
        time: "* * * * * *"
    });

    await vi.advanceTimersByTimeAsync(3000);
    cron.stop();

    expect(count).toBe(3);
    expect(consoleError).toHaveBeenCalledTimes(3);
});

test("should clear the pending timer on stop", () => {
    const cron = new Cron({
        job: () => {},
        time: "0 0 0 1 1 *"
    });

    expect(vi.getTimerCount()).toBe(1);
    cron.stop();
    expect(vi.getTimerCount()).toBe(0);
});

test("should not reschedule when stopped from the job", async () => {
    let count = 0;

    const cron: Cron = new Cron({
        job: () => {
            count++;
            cron.stop();
        },
        time: "* * * * * *"
    });

    await vi.advanceTimersByTimeAsync(3000);

    expect(count).toBe(1);
    expect(vi.getTimerCount()).toBe(0);
});

test("should run jobs scheduled beyond the max timeout", async () => {
    const runs: Array<number> = [];

    const cron = new Cron({
        job: () => {
            runs.push(Date.now());
        },
        time: "0 0 0 1 1 *"
    });

    await vi.advanceTimersByTimeAsync(new Date(2025, 0, 1).getTime() - Date.now());
    cron.stop();

    expect(runs).toEqual([new Date(2025, 0, 1).getTime()]);
});

test("should keep a single pending timer over many runs", async () => {
    let count = 0;

    const cron = new Cron({
        job: () => {
            count++;
        },
        time: "* * * * * *"
    });

    await vi.advanceTimersByTimeAsync(10_000);

    expect(count).toBe(10);
    expect(vi.getTimerCount()).toBe(1);
    cron.stop();
});

test("should throw on invalid expressions", () => {
    expect(() => new Cron({ job: () => {}, time: "61 * * * * *" })).toThrow();
});

test("should schedule in UTC with the utc option", async () => {
    vi.setSystemTime(Date.UTC(2024, 0, 1, 23, 59, 59));
    const runs: Array<number> = [];

    const cron = new Cron({
        job: () => {
            runs.push(Date.now());
        },
        time: "0 0 0 * * *",
        utc: true
    });

    await vi.advanceTimersByTimeAsync(2 * 24 * 60 * 60 * 1000);
    cron.stop();

    expect(runs).toEqual([Date.UTC(2024, 0, 2), Date.UTC(2024, 0, 3)]);
});
