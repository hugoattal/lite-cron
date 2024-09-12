import { expect, test } from "vitest";
import { Cron } from "@/index.ts";
import { wait } from "@/wait.ts";

test("test seconds", async () => {
    let count = 0;

    const cron = new Cron({
        job: () => {
            count++;
        },
        time: "* * * * * *"
    });

    await wait(3000);
    cron.stop();

    expect(count).toBe(3);
});

test("test 5 seconds", { timeout: 10000 }, async () => {
    let count = 0;

    const cron = new Cron({
        job: () => {
            count++;
        },
        time: "*/5 * * * * *"
    });

    await wait(5000);
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

    await wait(3000);
    cron.stop();

    expect(countBefore).toBe(3);
    expect(countAfter).toBe(1);
});
