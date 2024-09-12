import { expect, test } from "vitest";
import { Cron } from "@/index.ts";
import { wait } from "@/wait.ts";

test("test seconds", async () => {
    let count = 0;

    const cron = new Cron({
        onTick: () => {
            count++;
        },
        time: "* * * * * *"
    });

    await wait(3500);
    cron.stop();

    expect(count).toBe(3);
});

test("test 5 seconds", async () => {
    let count = 0;

    const cron = new Cron({
        onTick: () => {
            count++;
        },
        time: "*/5 * * * * *"
    });

    await wait(7000);
    cron.stop();

    expect(count).toBe(1);
}, { timeout: 10000 });
