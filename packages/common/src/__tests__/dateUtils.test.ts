import { DateTime } from "luxon";

import {
    diffFromUtcInDays,
    diffInMs,
    toDateTime,
    timezoneToUtc,
    utcNow,
    utcToTimezone,
} from "../dateUtils";

describe("dateUtils", () => {
    it("utcNow returns a UTC DateTime close to the current instant", () => {
        const now = utcNow();
        const delta = Math.abs(now.toMillis() - DateTime.utc().toMillis());

        expect(now.zoneName).toBe("UTC");
        expect(delta).toBeLessThan(1000);
    });

    it("utcToTimezone converts UTC ISO strings into the target zone", () => {
        const isoUtc = "2025-01-01T12:00:00.000Z";
        const converted = utcToTimezone(isoUtc, "America/New_York");

        expect(converted.zoneName).toBe("America/New_York");
        expect(converted.toISO()).toBe("2025-01-01T07:00:00.000-05:00");
    });

    it("timezoneToUtc converts local times into UTC", () => {
        const localIso = "2025-06-01T08:30:00";
        const converted = timezoneToUtc(localIso, "America/New_York");

        expect(converted.zoneName).toBe("UTC");
        expect(converted.toISO()).toBe("2025-06-01T12:30:00.000Z");
    });

    it("toDateTime returns a luxon DateTime instance", () => {
        const iso = "2025-11-07T15:45:30.123Z";
        const dt = toDateTime(iso);

        expect(dt.isValid).toBe(true);
        expect(dt.toUTC().toISO()).toBe(iso);
    });

    it("diffFromUtcInDays rounds differences in days", () => {
        const past = DateTime.utc().minus({ days: 3, hours: 2 }).toISO();
        const future = DateTime.utc().plus({ days: 2, hours: 3 }).toISO();

        expect(diffFromUtcInDays(past)).toBe("-3");
        expect(diffFromUtcInDays(future)).toBe("2");
    });

    it("diffFromUtcInDays returns undefined when no date is provided", () => {
        expect(diffFromUtcInDays(undefined)).toBeUndefined();
    });

    it("diffInMs returns the millisecond difference between two instants", () => {
        const start = DateTime.fromISO("2025-01-01T00:00:00.000Z");
        const end = start.plus({ milliseconds: 1500 });

        expect(diffInMs(start, end)).toBe(1500);
    });
});
