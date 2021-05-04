
export type Title = "Trader"|"Employee"|"Unknown"|"Vice President"|"Manager"|"CEO"|"Managing Director"|"Director"|"President"|"In House Lawyer"

export type Email = {
    date: string,
    fromId: number,
    fromEmail: string,
    fromJobtitle: Title,
    toId: number,
    toEmail: string,
    toJobtitle: Title,
    messageType: "CC"|"TO",
    sentiment: number
}

export type Person = {
    id: number,
    title: Title,
    email: string
}

/**
 * Takes a list of emails and returns a dictionary of the correspondants
 */
export function getCorrespondants(dataset: Email[]): {[id:number]: Person} {
    let personDict: {[id: number]: Person} = {}

    for (let email of dataset) {
        personDict[email.fromId] = {
            id: email.fromId,
            email: email.fromEmail,
            title: email.fromJobtitle
        }
        personDict[email.toId] = {
            id: email.toId,
            email: email.toEmail,
            title: email.toJobtitle
        }
    }

    return personDict
}
