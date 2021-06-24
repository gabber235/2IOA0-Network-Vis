import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Email, getCorrespondantsFromSingleEmail, Person } from "../data";
import { DataSetDiff, DataSet, ID } from "./dynamicDataSet";

/**
 * Takes a dynamic dataset of emails and adds to it a dynamic dataset of the relevant correspondants
 */
export function getDynamicCorrespondants<A, B>(
    asEmails: (a: A) => DataSetDiff<Email>,
    finalize: (a: A, diff: DataSetDiff<Person>) => B
) {
    return (emails: Observable<A>): Observable<B> => {
        /*
        We need to keep track of every correspondant that has either send or recieved an email in the current set.
        To do this we keep track of how many emails each person has send or recieved.
        This is essentially like a reference count for each person. 
        */
        const emailsSet: DataSet<Email> = {};
        const personReferenceCounts: DataSet<number> = {};

        // This function increases the reference count for a person.
        // If the reference count increases to 1 we add the person as an insertion to the diff.
        function incr(id: ID, person: Person, diff: DataSetDiff<Person>) {
            if (!(id in personReferenceCounts)) {
                personReferenceCounts[id] = 0;
                diff.add(id, person);
            }
            personReferenceCounts[id]++;
        }
        // This function decreases the reference count for a person.
        // If the reference count decreases to 0 we add the person as a deletion to the diff.
        function decr(id: ID, diff: DataSetDiff<Person>) {

            personReferenceCounts[id]--;

            if (personReferenceCounts[id] === 0) {
                diff.remove(id);
                delete personReferenceCounts[id];
            }
        }

        return emails.pipe(
            // The messages are 1 to 1 so we use map
            map((a) => {
                const diff = new DataSetDiff<Person>();
                const emailDiff = asEmails(a);

                for (const change of emailDiff.insertions) {
                    const [from, to] = getCorrespondantsFromSingleEmail(change.value);

                    incr(`${from.id}`, from, diff);
                    incr(`${to.id}`, to, diff);

                    emailsSet[change.id] = change.value;
                }
                for (const change of emailDiff.updates) {
                    const [prevFrom, prevTo] = getCorrespondantsFromSingleEmail(emailsSet[change.id]);
                    const [curFrom, curTo] = getCorrespondantsFromSingleEmail(change.value);

                    if (prevFrom.id === curFrom.id) {
                        diff.update(`${curFrom.id}`, curFrom);
                    } else {
                        decr(`${prevFrom.id}`, diff);
                        incr(`${curFrom.id}`, curFrom, diff);
                    }

                    if (prevTo.id === curTo.id) {
                        diff.update(`${curTo.id}`, curTo);
                    } else {
                        decr(`${prevTo.id}`, diff);
                        incr(`${curTo.id}`, curTo, diff);
                    }

                    emailsSet[change.id] = change.value;
                }
                for (const change of emailDiff.deletions) {
                    const [from, to] = getCorrespondantsFromSingleEmail(emailsSet[change.id]);

                    decr(`${from.id}`, diff);
                    decr(`${to.id}`, diff);

                    delete emailsSet[change.id];
                }

                return finalize(a, diff);
            })
        );
    };
}
