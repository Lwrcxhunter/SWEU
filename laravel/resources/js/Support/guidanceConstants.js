/**
 * Shared guidance domain constants and options
 */

export const MEDICAL_CONDITIONS = [
    "Anemia",
    "Anxiety",
    "Asthma",
    "Blood Clots",
    "Cerebrovascular Accident",
    "Depression",
    "Hypertension",
    "Thyroid Disease",
    "Allergies",
    "Arthritis",
    "Cancer",
    "Diabetes",
    "Migraine Headaches",
    "Peptic Ulcer Disease",
    "Seizure Disorder",
];

export const SUBSTANCE_OPTIONS = [
    "No",
    "Daily",
    "Weekly",
    "Less",
    "Former User",
];

export const TIME_SLOTS = [
    "08:00",
    "08:30",
    "09:00",
    "09:30",
    "10:00",
    "10:30",
    "11:00",
    "11:30",
    "13:00",
    "13:30",
    "14:00",
    "14:30",
    "15:00",
    "15:30",
    "16:00",
    "16:30",
];

export const AVERAGE_SLEEP_OPTIONS = [
    "Less than 5 hours",
    "5 - 6 hours",
    "6 - 7 hours",
    "7 - 8 hours",
    "More than 8 hours",
];

export const MARITAL_STATUS_OPTIONS = [
    "Single",
    "Married",
    "Separated",
    "Widowed",
];

export const YEAR_LEVEL_OPTIONS = ["1", "2", "3", "4"];

export function parseDateBadge(dateStr) {
    if (!dateStr) return null;
    try {
        const parts = dateStr.split("-");
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            const d = new Date(year, month, day);
            return {
                month: d
                    .toLocaleString("en-US", { month: "short" })
                    .toUpperCase(),
                day: String(day).padStart(2, "0"),
                weekday: d
                    .toLocaleString("en-US", { weekday: "short" })
                    .toUpperCase(),
                fullDate: d.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                }),
            };
        }
        const d = new Date(dateStr);
        if (!isNaN(d.getTime())) {
            return {
                month: d
                    .toLocaleString("en-US", { month: "short" })
                    .toUpperCase(),
                day: String(d.getDate()).padStart(2, "0"),
                weekday: d
                    .toLocaleString("en-US", { weekday: "short" })
                    .toUpperCase(),
                fullDate: d.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                }),
            };
        }
    } catch {
        return null;
    }
    return null;
}

export function formatSessionTime(timeStr) {
    if (!timeStr) return null;
    try {
        const parts = timeStr.split(":");
        if (parts.length >= 2) {
            let hours = parseInt(parts[0], 10);
            const minutes = parts[1];
            const ampm = hours >= 12 ? "PM" : "AM";
            hours = hours % 12 || 12;
            return `${hours}:${minutes} ${ampm}`;
        }
    } catch {
        return timeStr;
    }
    return timeStr;
}
