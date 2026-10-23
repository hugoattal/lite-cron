import type { TCronSchedule, TNextDateOptions } from "@/time.ts";
import { getNextDate, parseCron } from "@/time.ts";
import { MAX_TIMEOUT_MS } from "@/wait.ts";

export { getNextDate, parseCron };
export type { TCronSchedule, TNextDateOptions };

export type TCronOptions = {
    job: () => void | Promise<void>;
    time: string;
    utc?: boolean;
};

export class Cron {
    options: TCronOptions;
    nextDate: Date;
    running = true;
    #schedule: TCronSchedule;
    #timeout?: ReturnType<typeof setTimeout>;

    constructor(options: TCronOptions) {
        this.options = options;
        this.#schedule = parseCron(options.time);
        this.nextDate = getNextDate(this.#schedule, new Date(), options);
        this.#scheduleNext();
    }

    stop() {
        this.running = false;
        clearTimeout(this.#timeout);
    }

    #scheduleNext() {
        if (!this.running) {
            return;
        }

        const waitTime = this.nextDate.getTime() - Date.now();
        if (waitTime > MAX_TIMEOUT_MS) {
            this.#timeout = setTimeout(() => this.#scheduleNext(), MAX_TIMEOUT_MS);
            return;
        }

        this.#timeout = setTimeout(() => this.#trigger(), Math.max(waitTime, 0));
    }

    #trigger() {
        this.nextDate = getNextDate(this.#schedule, new Date(Math.max(Date.now(), this.nextDate.getTime() + 1)), this.options);
        this.#runJob();
        this.#scheduleNext();
    }

    #runJob() {
        try {
            Promise.resolve(this.options.job()).catch(console.error);
        }
        catch (error) {
            console.error(error);
        }
    }
}
