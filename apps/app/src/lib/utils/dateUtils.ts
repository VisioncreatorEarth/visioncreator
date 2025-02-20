/**
 * Formats a date into a relative time string (e.g., "2h ago", "3d ago")
 * @param date - ISO date string or Date object
 * @returns Formatted relative time string
 */
export function getTimeAgo(date: string | Date): string {
    const now = new Date();
    const past = new Date(date);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    const intervals = {
        y: 31536000,
        m: 2592000,
        w: 604800,
        d: 86400,
        h: 3600,
        min: 60
    };

    for (const [unit, seconds] of Object.entries(intervals)) {
        const interval = Math.floor(diffInSeconds / seconds);
        if (interval >= 1) {
            return `${interval}${unit} ago`;
        }
    }

    return 'just now';
} 