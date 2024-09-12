# ts-cron
Typed modern CRON

```
# Example of job definition:
# .---------------- secondes (0 - 59) (optional)
# |  .------------- minute (0 - 59)
# |  |  .---------- hour (0 - 23)
# |  |  |  .------- day of month (1 - 31)
# |  |  |  |  .---- month (1 - 12)
# |  |  |  |  |  .- day of week (0 - 6) (Sunday=0)
# *  *  *  *  *  *
```