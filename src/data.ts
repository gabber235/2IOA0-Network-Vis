export type Title =
  | "Trader"
  | "Employee"
  | "Unknown"
  | "Vice President"
  | "Manager"
  | "CEO"
  | "Managing Director"
  | "Director"
  | "President"
  | "In House Lawyer";

export type Email = {
  id: number,
  date: string,
  fromId: number,
  fromEmail: string,
  fromJobtitle: Title,
  toId: number,
  toEmail: string,
  toJobtitle: Title,
  messageType: "CC" | "TO",
  sentiment: number
}

export type Person = {
  id: number;
  title: Title;
  emailAdress: string;
};

export type Correspondants = { [id: number]: Person }

/**
 * Parses the data from enron-v1.csv into a list of objects
 */
export function parseData(text: string): Email[] {
  let idCounter = 0

  return text
    .split(/\r?\n/) // split on linebreaks
    .slice(1) // ignore first list because it contains the titles
    .filter(i => i !== "") // ignore empty lines
    .map(line => {
      const d = line.split(/ *, */) // split on comma's
      return {
        id: idCounter++,
        date: d[0],
        fromId: +d[1],
        fromEmail: d[2],
        fromJobtitle: d[3] as any,
        toId: +d[4],
        toEmail: d[5],
        toJobtitle: d[6] as any,
        messageType: d[7] as any,
        sentiment: +d[8]
      }
    })
}


/**
 * Gets the sender and reciever of an email
 */
export function getCorrespondantsFromSingleEmail(email: Email): [Person, Person] {
  return [
    {
      id: email.fromId,
      emailAdress: email.fromEmail,
      title: email.fromJobtitle,
    },
    {
      id: email.toId,
      emailAdress: email.toEmail,
      title: email.toJobtitle,
    }
  ]
}

/**
 * Takes a list of emails and returns a dictionary of the correspondants
 */
export function getCorrespondants(dataset: Email[]): Correspondants {
  const personDict: Correspondants = {};

  for (const email of dataset) {
    const [from, to] = getCorrespondantsFromSingleEmail(email)
    personDict[email.fromId] = from;
    personDict[email.toId] = to;
  }

  return personDict;
}
