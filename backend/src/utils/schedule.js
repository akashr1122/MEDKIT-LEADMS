const { Op, fn, col, where: sqlWhere } = require('sequelize');

const TIME_SLOTS = {
  morning: ['06:00', '11:59'],
  afternoon: ['12:00', '16:59'],
  evening: ['17:00', '23:59'],
};

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HH_MM = /^\d{2}:\d{2}$/;
// Postgres regex for a normalized demoTime that carries a time part ("YYYY-MM-DDTHH:mm")
const DEMO_HAS_TIME = '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}';

const pad = (n) => String(n).padStart(2, '0');

const buildIso = (year, month, day, hours, minutes) => {
  const y = Number(year);
  const mo = Number(month);
  const d = Number(day);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;

  const date = `${y}-${pad(mo)}-${pad(d)}`;
  if (hours === undefined || hours === null || hours === '') return date;

  const h = Number(hours);
  const m = Number(minutes || 0);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return `${date}T${pad(h)}:${pad(m)}`;
};

/**
 * Normalize a demo date/time into "YYYY-MM-DDTHH:mm" (or "YYYY-MM-DD" when no time is given)
 * so the schedule filter can match it by date. Handles the datetime-local value sent by the UI
 * and the formats commonly found in Google Sheets (DD/MM/YYYY, "Oct 12, 2026 1:10 PM", ...).
 * Values that cannot be parsed are returned trimmed and unchanged.
 */
const normalizeDemoTime = (value) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  const raw = String(value).trim();
  if (!raw) return null;

  // 2026-10-12 | 2026-10-12T13:10 | 2026-10-12 13:10:00
  let m = raw.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[T\s]+(\d{1,2}):(\d{2}))?/);
  if (m) return buildIso(m[1], m[2], m[3], m[4], m[5]) || raw;

  // 12/10/2026 | 12-10-2026 1:10 PM | 12.10.2026, 13:10:00  (day first, as used in India)
  m = raw.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:[,\s]+(\d{1,2})(?::(\d{2}))?(?::\d{2})?\s*([AaPp][Mm])?)?$/);
  if (m) {
    const [, a, b, year, h, min, ampm] = m;
    // Only treat it as MM/DD when DD/MM is impossible (e.g. 10/25/2026)
    const [day, month] = Number(b) > 12 && Number(a) <= 12 ? [b, a] : [a, b];
    let hours = h;
    if (h !== undefined && ampm) {
      hours = (Number(h) % 12) + (ampm.toLowerCase() === 'pm' ? 12 : 0);
    }
    return buildIso(year, month, day, hours, min) || raw;
  }

  // Free-form text such as "Oct 12, 2026 1:10 PM" or "12 October 2026"
  const parsed = new Date(raw);
  if (!isNaN(parsed.getTime())) {
    const hasTime = /\d{1,2}:\d{2}/.test(raw);
    return buildIso(
      parsed.getFullYear(),
      parsed.getMonth() + 1,
      parsed.getDate(),
      hasTime ? parsed.getHours() : undefined,
      hasTime ? parsed.getMinutes() : undefined
    ) || raw;
  }

  return raw;
};

/**
 * Build a WHERE clause for the date / time filters that matches a lead when either its
 * call follow-up OR its demo falls on the requested date and time.
 * Returns null when no schedule filter is active.
 */
const buildScheduleFilter = ({ followUpDate, followUpTime, timeSlot }) => {
  const date = ISO_DATE.test(followUpDate || '') ? followUpDate : null;
  const slot = TIME_SLOTS[timeSlot] || null;
  const time = !slot && HH_MM.test(followUpTime || '') ? followUpTime : null;

  if (!date && !slot && !time) return null;

  // 1) Call follow-up scheduled on this date / time
  const followUp = {};
  if (date) followUp.nextFollowUp = date;
  if (slot) followUp.followUpTime = { [Op.between]: slot };
  if (time) followUp.followUpTime = time;

  // 2) Demo scheduled on this date / time
  let demo;
  if (slot || time) {
    // Time filters need the time part of demoTime ("YYYY-MM-DDTHH:mm" → "HH:mm")
    const demoTimeOfDay = sqlWhere(
      fn('substr', col('Lead.demoTime'), 12, 5),
      slot ? { [Op.between]: slot } : time
    );
    demo = {
      [Op.and]: [
        { demoTime: date ? { [Op.startsWith]: `${date}T` } : { [Op.regexp]: DEMO_HAS_TIME } },
        demoTimeOfDay,
      ],
    };
  } else {
    // demoDate is set from the "Assign Demo" flow, demoTime from Add/Edit lead and sheet sync
    demo = {
      [Op.or]: [
        { demoTime: { [Op.startsWith]: date } },
        { demoDate: date },
      ],
    };
  }

  return { [Op.or]: [followUp, demo] };
};

/**
 * One-time cleanup for leads saved before demoTime was normalized (e.g. raw Google Sheet text),
 * so they also show up in the date filters. Safe to run on every boot.
 */
const normalizeStoredDemoTimes = async (Lead) => {
  const leads = await Lead.findAll({
    attributes: ['id', 'demoTime'],
    where: {
      demoTime: {
        [Op.ne]: null,
        [Op.notRegexp]: '^[0-9]{4}-[0-9]{2}-[0-9]{2}(T[0-9]{2}:[0-9]{2})?$',
      },
    },
  });

  let fixed = 0;
  for (const lead of leads) {
    const normalized = normalizeDemoTime(lead.demoTime);
    if (normalized !== lead.demoTime) {
      await Lead.update({ demoTime: normalized }, { where: { id: lead.id } });
      fixed++;
    }
  }
  return fixed;
};

module.exports = {
  TIME_SLOTS,
  normalizeDemoTime,
  buildScheduleFilter,
  normalizeStoredDemoTimes,
};
