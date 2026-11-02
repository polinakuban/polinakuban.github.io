const budapest = new Intl.DateTimeFormat('en-GB', {
  timeZone: 'Europe/Budapest',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function formatBudapestTime(date: Date): string {
  return budapest.format(date);
}
