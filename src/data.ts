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
  date: string;
  fromId: number;
  fromEmail: string;
  fromJobtitle: Title;
  toId: number;
  toEmail: string;
  toJobtitle: Title;
  messageType: "CC" | "TO";
  sentiment: number;
};

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
  let list: Email[] = [];

  for (let line of text
    .split(/\r?\n/u) // split on linebreaks
    .slice(1)) {
    // ignore first list because it contains the titles
    if (line !== "") {
      // we ignore empty lines
      let d = line.split(",");
      list.push({
        date: d[0],
        fromId: +d[1],
        fromEmail: d[2],
        fromJobtitle: d[3] as any,
        toId: +d[4],
        toEmail: d[5],
        toJobtitle: d[6] as any,
        messageType: d[7] as any,
        sentiment: +d[8],
      });
    }
  }
  return list;
}

/**
 * Takes a list of emails and returns a dictionary of the correspondants
 */
export function getCorrespondants(dataset: Email[]): Correspondants {
  let personDict: Correspondants = {};

  for (let email of dataset) {
    personDict[email.fromId] = {
      id: email.fromId,
      emailAdress: email.fromEmail,
      title: email.fromJobtitle,
    };
    personDict[email.toId] = {
      id: email.toId,
      emailAdress: email.toEmail,
      title: email.toJobtitle,
    };
  }

  return personDict;
}
