export interface WithdrawalWindowStatus {
  isOpen: boolean;
  kampalaTimeFormatted: string;
  currentHour: number;
  currentMinute: number;
  opensAtLabel: string;
  closesAtLabel: string;
}

/**
 * Evaluates whether the current time in Kampala, Uganda (EAT, UTC+3)
 * falls within the permitted daily withdrawal window: 7:00 AM to 6:00 PM.
 */
export function getWithdrawalWindowStatus(now: Date = new Date()): WithdrawalWindowStatus {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Kampala',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now);

  const hourPart = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const minutePart = parts.find((p) => p.type === 'minute')?.value ?? '00';

  const currentHour = Number(hourPart) % 24;
  const currentMinute = Number(minutePart);
  const totalMinutes = currentHour * 60 + currentMinute;

  // Open from 07:00 (420 min) through 18:00 (1080 min) EAT
  const isOpen = totalMinutes >= 7 * 60 && totalMinutes < 18 * 60;

  const kampalaTimeFormatted = new Intl.DateTimeFormat('en-UG', {
    timeZone: 'Africa/Kampala',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(now);

  return {
    isOpen,
    kampalaTimeFormatted,
    currentHour,
    currentMinute,
    opensAtLabel: '7:00 AM EAT',
    closesAtLabel: '6:00 PM EAT',
  };
}
