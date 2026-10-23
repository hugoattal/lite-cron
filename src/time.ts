export type TCronSchedule = {
    days: Set<number>;
    hours: Set<number>;
    matchAnyDay: boolean;
    minutes: Set<number>;
    months: Set<number>;
    seconds: Set<number>;
    weekdays: Set<number>;
};

const MAX_ITERATIONS = 100_000;
const SECOND_MS = 1000;
const MINUTE_MS = 60 * SECOND_MS;

const CRON_ITEM_REGEX = /^(?:\*|(\d+)(?:-(\d+))?)(?:\/(\d+))?$/;

function parseCronItem(item: string, min: number, max: number) {
    const match = CRON_ITEM_REGEX.exec(item);
    if (!match) {
        throw new Error(`Invalid cron value "${ item }"`);
    }

    const [, startPart, endPart, stepPart] = match;
    const start = startPart === undefined ? min : Number(startPart);
    const end = endPart !== undefined ? Number(endPart) : startPart === undefined || stepPart !== undefined ? max : start;
    const step = stepPart === undefined ? 1 : Number(stepPart);

    if (start < min || end > max || end < start || step < 1) {
        throw new Error(`Invalid cron value "${ item }"`);
    }

    const values: Array<number> = [];
    for (let value = start; value <= end; value += step) {
        values.push(value);
    }

    return values;
}

function parseCronPart(cronPart: string, min: number, max: number) {
    return new Set(cronPart.split(",").flatMap((item) => parseCronItem(item, min, max)));
}

export function parseCron(cronTime: string): TCronSchedule {
    const cronParts = cronTime.trim().split(/\s+/);

    if (cronParts[0] === "" || cronParts.length > 6) {
        throw new Error(`Invalid cron expression "${ cronTime }"`);
    }

    while (cronParts.length < 6) {
        cronParts.unshift("0");
    }

    const weekdays = new Set([...parseCronPart(cronParts[5], 0, 7)].map((weekday) => (weekday % 7)));

    return {
        days: parseCronPart(cronParts[3], 1, 31),
        hours: parseCronPart(cronParts[2], 0, 23),
        matchAnyDay: cronParts[3][0] !== "*" && cronParts[5][0] !== "*",
        minutes: parseCronPart(cronParts[1], 0, 59),
        months: parseCronPart(cronParts[4], 1, 12),
        seconds: parseCronPart(cronParts[0], 0, 59),
        weekdays
    };
}

function findNext(values: Set<number>, current: number) {
    let next: number | undefined;
    for (const value of values) {
        if (value > current && (next === undefined || value < next)) {
            next = value;
        }
    }
    return next;
}

type TDateField = "Date" | "Day" | "Hours" | "Minutes" | "Month" | "Seconds";

function getField(date: Date, field: TDateField, utc: boolean) {
    return date[`get${ utc ? "UTC" : "" }${ field }` as const]();
}

function setHourStart(date: Date, hour: number, utc: boolean) {
    date[utc ? "setUTCHours" : "setHours"](hour, 0, 0);
}

function advance(date: Date, schedule: TCronSchedule, utc: boolean) {
    const month = getField(date, "Month", utc);
    if (!schedule.months.has(month + 1)) {
        date[utc ? "setUTCMonth" : "setMonth"](month + 1, 1);
        setHourStart(date, 0, utc);
        return true;
    }

    const day = getField(date, "Date", utc);
    const dayMatch = schedule.days.has(day);
    const weekdayMatch = schedule.weekdays.has(getField(date, "Day", utc));
    if (schedule.matchAnyDay ? !dayMatch && !weekdayMatch : !dayMatch || !weekdayMatch) {
        date[utc ? "setUTCDate" : "setDate"](day + 1);
        setHourStart(date, 0, utc);
        return true;
    }

    const hour = getField(date, "Hours", utc);
    if (!schedule.hours.has(hour)) {
        setHourStart(date, findNext(schedule.hours, hour) ?? 24, utc);
        return true;
    }

    const minute = getField(date, "Minutes", utc);
    const second = getField(date, "Seconds", utc);
    if (!schedule.minutes.has(minute)) {
        const minuteDelta = (findNext(schedule.minutes, minute) ?? 60) - minute;
        date.setTime(date.getTime() + minuteDelta * MINUTE_MS - second * SECOND_MS);
        return true;
    }

    if (!schedule.seconds.has(second)) {
        const secondDelta = (findNext(schedule.seconds, second) ?? 60) - second;
        date.setTime(date.getTime() + secondDelta * SECOND_MS);
        return true;
    }

    return false;
}

export type TNextDateOptions = {
    utc?: boolean;
};

export function getNextDate(cron: string | TCronSchedule, fromDate = new Date(), options: TNextDateOptions = {}) {
    const schedule = typeof cron === "string" ? parseCron(cron) : cron;
    const nextDate = new Date(Math.ceil(fromDate.getTime() / SECOND_MS) * SECOND_MS);

    for (let i = 0; i < MAX_ITERATIONS; i++) {
        const previousTime = nextDate.getTime();

        if (!advance(nextDate, schedule, options.utc ?? false)) {
            return nextDate;
        }

        if (nextDate.getTime() <= previousTime) {
            nextDate.setTime(previousTime + SECOND_MS);
        }
    }

    throw new Error("Unable to find a valid date within the given constraints.");
}
