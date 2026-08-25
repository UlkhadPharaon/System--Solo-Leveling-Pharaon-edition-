/**
 * ICS export (F7) — one-click "add my week to Google Calendar".
 *
 * Converts the app's weekly schedule (RoutineBlock[] per DayOfWeek) into a
 * valid VCALENDAR with recurring weekly VEVENTs, so the timetable can be
 * imported into any calendar app instead of being maintained twice.
 *
 * Pure functions: no React, no storage access. The caller downloads the
 * returned string.
 */

import type { RoutineBlock, DayOfWeek } from '../types';

/** ICS weekday codes, Monday-first like the app's own day list. */
const ICS_DAY: Record<DayOfWeek, string> = {
  Monday: 'MO',
  Tuesday: 'TU',
  Wednesday: 'WE',
  Thursday: 'TH',
  Friday: 'FR',
  Saturday: 'SA',
  Sunday: 'SU',
};

const DAYS_ORDER: DayOfWeek[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Escape per RFC 5545 §3.3.11 TEXT. */
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}

/**
 * Fold content lines at 75 octets (RFC 5545 §3.1) — long titles/descriptions
 * would otherwise produce an invalid calendar that some importers reject.
 */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [line.slice(0, 75)];
  let rest = line.slice(75);
  while (rest.length > 0) {
    parts.push(` ${rest.slice(0, 74)}`);
    rest = rest.slice(74);
  }
  return parts.join('\r\n');
}

/**
 * Next occurrence of `dayName` strictly after `from` — the DTSTART anchor so
 * the weekly RRULE begins in the future, not in the past.
 */
export function nextOccurrence(dayName: DayOfWeek, from = new Date()): Date {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const targetIdx = DAYS_ORDER.indexOf(dayName);
  const currentIdx = (d.getDay() + 6) % 7;
  const delta = (targetIdx - currentIdx + 7) % 7 || 7; // 0 → next week
  d.setDate(d.getDate() + delta);
  return d;
}

/**
 * Build the ICS text for every non-empty day of the schedule.
 * Returns null when there is nothing to export (caller shows feedback).
 */
export function buildScheduleIcs(
  daySchedules: Partial<Record<DayOfWeek, RoutineBlock[]>>,
  opts?: { calendarName?: string },
): string | null {
  const events: string[] = [];

  for (const day of DAYS_ORDER) {
    const blocks = daySchedules[day];
    if (!blocks || blocks.length === 0) continue;

    for (const block of blocks) {
      const timeRe = /^([01]\d|2[0-3]):([0-5]\d)$/;
      if (!timeRe.test(block.startTime) || !timeRe.test(block.endTime)) continue;

      const startDay = nextOccurrence(day);
      const [sh, sm] = block.startTime.split(':').map(Number);
      const [eh, em] = block.endTime.split(':').map(Number);

      const dtstart = new Date(startDay);
      dtstart.setHours(sh, sm, 0, 0);
      const dtend = new Date(startDay);
      dtend.setHours(eh, em, 0, 0);
      // Blocks crossing midnight are clamped to end-of-day (invalid otherwise).
      if (dtend <= dtstart) dtend.setHours(23, 59, 0, 0);

      const fmtLocal = (d: Date) =>
        `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;

      // Floating local times (no TZID): portable and correct for a single-user,
      // single-timezone personal schedule.
      events.push(
        [
          'BEGIN:VEVENT',
          `UID:${block.id}-${day.toLowerCase()}@ka-rise.app`,
          `DTSTAMP:${fmtLocal(new Date())}`,
          `DTSTART:${fmtLocal(dtstart)}`,
          `DTEND:${fmtLocal(dtend)}`,
          `RRULE:FREQ=WEEKLY;BYDAY=${ICS_DAY[day]}`,
          `SUMMARY:${esc(block.title || 'Session')}`,
          ...(block.description ? [`DESCRIPTION:${esc(block.description.slice(0, 300))}`] : []),
          'END:VEVENT',
        ].join('\r\n'),
      );
    }
  }

  if (events.length === 0) return null;

  return (
    [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Ka Rise//Weekly Schedule Export//FR',
      'CALSCALE:GREGORIAN',
      ...(opts?.calendarName ? [`X-WR-CALNAME:${esc(opts.calendarName)}`] : []),
      ...events,
      'END:VCALENDAR',
      '',
    ].join('\r\n')
  );
}
