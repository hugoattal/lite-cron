function parseCronPart(cronPart: string, min: number, max: number) {
    if (cronPart === "*") {
        return Array.from({ length: max - min + 1 }, (_, i) => i + min);
    }

    if (cronPart.startsWith("*/")) {
        const step = Number(cronPart.slice(2));
        return Array.from({ length: Math.floor((max - min) / step) + 1 }, (_, i) => min + i * step);
    }

    if (cronPart.includes("-")) {
        const [start, end] = cronPart.split("-").map(Number);
        return Array.from({ length: end - start + 1 }, (_, i) => start + i);
    }

    return cronPart.split(",").map(Number);
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

    let maxTry = 1024;

    if (nextDate.getMilliseconds() !== 0) {
        nextDate.setMilliseconds(0);
        nextDate.setSeconds(nextDate.getSeconds() + 1);
    }

    while (--maxTry > 0) {
        const currentMonth = nextDate.getMonth() + 1;
        if (!months.includes(currentMonth)) {
            const nextMonth = months.find(month => month > currentMonth) ?? months[0];
            if (nextMonth < currentMonth) {
                nextDate.setFullYear(nextDate.getFullYear() + 1);
            }
            nextDate.setMonth(nextMonth);
            nextDate.setDate(1);
            nextDate.setHours(0);
            nextDate.setMinutes(0);
            nextDate.setSeconds(0);
        }

        const currentDay = nextDate.getDate();
        if (!days.includes(currentDay)) {
            const nextDay = days.find(day => day > currentDay) ?? days[0];
            if (nextDay < currentDay) {
                nextDate.setMonth(nextDate.getMonth() + 1);
            }

            nextDate.setDate(nextDay);
            nextDate.setHours(0);
            nextDate.setMinutes(0);
            nextDate.setSeconds(0);
        }

        const currentHour = nextDate.getHours();
        if (!hours.includes(currentHour)) {
            const nextHour = hours.find(hour => hour > currentHour) ?? hours[0];
            if (nextHour < currentHour) {
                nextDate.setDate(nextDate.getDate() + 1);
            }

            nextDate.setHours(nextHour);
            nextDate.setMinutes(0);
            nextDate.setSeconds(0);
        }

        const currentMinute = nextDate.getMinutes();
        if (!minutes.includes(currentMinute)) {
            const nextMinute = minutes.find(minute => minute > currentMinute) ?? minutes[0];
            if (nextMinute < currentMinute) {
                nextDate.setHours(nextDate.getHours() + 1);
            }

            nextDate.setMinutes(nextMinute);
            nextDate.setSeconds(0);
        }

        const currentSecond = nextDate.getSeconds();
        if (!seconds.includes(currentSecond)) {
            const nextSecond = seconds.find(second => second > currentSecond) ?? seconds[0];
            if (nextSecond < currentSecond) {
                nextDate.setMinutes(nextDate.getMinutes() + 1);
            }

            nextDate.setSeconds(nextSecond);
        }

        if (weekdays.includes(nextDate.getDay())) {
            break;
        }
        else {
            nextDate.setDate(nextDate.getDate() + 1);
        }
    }

    if (maxTry === 0) {
        throw new Error("Unable to find a valid date within the given constraints.");
    }

    return nextDate;
}
