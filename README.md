# Lite-CRON
Simple, lightweight, and dependency-free CRON library for TypeScript.

Packaged size: `2.48 kB` | Gzipped size: `1.19 kB`

## Installation
```bash
pnpm install lite-cron
```

Lite-CRON is ESM only. CommonJS projects can still `require("lite-cron")` on Node 20.19+ or 22.12+.

## Supported formats

```
 .---------------- seconds (0 - 59)
 |  .------------- minute (0 - 59)
 |  |  .---------- hour (0 - 23)
 |  |  |  .------- day of month (1 - 31)
 |  |  |  |  .---- month (1 - 12)
 |  |  |  |  |  .- day of week (0 - 7) (Sunday=0 or 7)
 *  *  *  *  *  *
```

- `*` any value
- `*/n` every n values
- `n/m` every m values starting at n
- `n` specific value
- `n-m` range of values
- `n-m/s` every s values between n and m
- `n,m` list of values, each item can be any of the above (e.g. `1-5,10,20/5`)

Every missing value is considered as `0`, so a standard 5-field expression runs at second `0`.

Like standard cron, when both the day of month and the day of week are restricted (neither starts with `*`), a date matches if either of them matches: `0 0 0 1 * 1` runs on the 1st of every month and on every Monday. When one of them starts with `*`, both must match: `0 0 0 */2 * 1` only runs on Mondays that fall on an odd day of the month.

Times are evaluated in the local timezone, or in UTC with the `utc` option. In the local timezone, when clocks go forward, times that don't exist that day are skipped; when clocks go back, times in the repeated hour run in both occurrences.

An invalid expression throws an error when the `Cron` is created.

### Example
- `0 0 * * * *` every hour
- `* * * *` every hour
- `*/6 * * *` every 6 hours
- `2/6 * * *` every 6 hours starting at 2am (2am, 8am, 2pm, 8pm)
- `6 * * *` every day at 6am
- `6-8 * * *` every day at 6am, 7am and 8am
- `6,8 * * *` every day at 6am and 8am
- `0 9 * * 1-5` every weekday at 9am

## Usage

### Launch a job

```typescript
import { Cron } from "lite-cron";

const cron = new Cron({
    time: "0 0 */6 * * *",
    job: () => {
        console.log("Every 6 hours");
    }
});
```

```typescript
import { Cron } from "lite-cron";

const cron = new Cron({
    time: "0 0 */6 * * *",
    job: async () => {
        await myExpensiveJob();
    }
});
```

Errors thrown by a job are logged with `console.error` and don't stop the following runs. Async jobs are not awaited, so runs can overlap.

### Use UTC

```typescript
const cron = new Cron({
    time: "0 0 9 * * *",
    utc: true,
    job: () => {
        console.log("Every day at 9:00 UTC");
    }
});
```

### Stop a job

```typescript
cron.stop();
```

### Get the next date

```typescript
import { getNextDate } from "lite-cron";

getNextDate("0 0 9 * * 1"); // next Monday at 9am
getNextDate("0 0 9 * * 1", new Date(2024, 0, 1)); // first match from the given date
getNextDate("0 0 9 * * 1", new Date(), { utc: true }); // next Monday at 9:00 UTC
```
