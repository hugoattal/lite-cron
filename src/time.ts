function parseCronPart(cronPart: string, min: number, max: number) {
    if (cronPart === "*") {
        return Array.from({ length: max - min + 1 }, (_, i) => i + min);
    }

    if (cronPart.includes("/")) {
        const [start, interval] = cronPart.split("/").map(Number);
        return Array.from({ length: Math.floor((max - start) / interval) + 1 }, (_, i) => start + i * interval);
    }

    if (cronPart.includes("-")) {
        const [start, end] = cronPart.split("-").map(Number);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }

    throw new Error(`Invalid cron part "${ cronPart }"`);
}


export function getNextDate(cronTime: string, nextDate = new Date()) {
    const cronParts = cronTime.split(" ");

    if (cronParts.length === 5) {
        cronParts.unshift("0");
    }

    const seconds = parseCronPart(cronParts[0], 0, 59);
    const minutes = parseCronPart(cronParts[1], 0, 59);
    const hours = parseCronPart(cronParts[2], 0, 23);
    const days = parseCronPart(cronParts[3], 1, 31);
    const months = parseCronPart(cronParts[4], 1, 12);
    const weekdays = parseCronPart(cronParts[5], 0, 6);

    let maxTry = 1000;

    while (--maxTry > 0) {
        nextDate.setSeconds(seconds.find(second => second >= nextDate.getSeconds()) || seconds[0]);
        nextDate.setMinutes(minutes.find(minute => minute >= nextDate.getMinutes()) || minutes[0]);
        nextDate.setHours(hours.find(hour => hour >= nextDate.getHours()) || hours[0]);
        nextDate.setDate(days.find(day => day >= nextDate.getDate()) || days[0]);

        const nextMonth = months.find(month => month - 1 >= nextDate.getMonth()) || months[0];
        nextDate.setMonth(nextMonth - 1);
        if (nextMonth - 1 < nextDate.getMonth()) {
            nextDate.setFullYear(nextDate.getFullYear() + 1);
        }

        if (weekdays.includes(nextDate.getDay())) {
            break;
        }
    }

    if (maxTry === 0) {
        throw new Error("Unable to find a valid date within the given constraints.");
    }

    return nextDate;
}
