import { Email } from "../data";
import { millisInDay } from "../utils";

export function groupEmailsToCount(emails: Email[]): number[] {
    const firstDay = indexEmail(emails[0]);
    const lastDay = indexEmail(emails[emails.length - 1]);


    const days: number[] = Array(lastDay - firstDay + 1).fill(0, 0);

    emails.forEach(email => {
        days[indexEmail(email) - firstDay] += 1
    })

    return days;
}

function indexEmail(email: Email): number {
    return Math.floor(new Date(email.date).getTime() / millisInDay)
}