// utils/dateHelpers.ts
export const getUTCDateString = (date?: Date): string => {
  const targetDate = date || new Date();
  return new Date(targetDate.getTime() - targetDate.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0];
};

export const isToday = (dateString: string): boolean => {
  return dateString === getUTCDateString();
};

export const isYesterday = (dateString: string): boolean => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return dateString === getUTCDateString(yesterday);
};