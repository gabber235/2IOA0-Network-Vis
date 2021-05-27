import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { Email, getCorrespondantsFromSingleEmail, Person } from "../data";
import { pair } from "../utils";
import { DataSetDiff, DataSet } from "./dynamicDataSet";

/**
 * Takes a dynamic dataset of emails and adds to it a dynamic dataset of the relevant correspondants
 */

export function getDynamicCorrespondants<A, B>(
    asEmails: (a: A) => DataSetDiff<Email>,
    finalize: (a: A, diff: DataSetDiff<Person>) => B
) {

    return (emails: Observable<A>): Observable<B> => {

        const emailsSet: DataSet<Email> = {};
        const personSet: DataSet<number> = {};

        function incr(id: number, person: Person, diff: DataSetDiff<Person>) {
            if (!(id in personSet)) {
                personSet[id] = 0;
                diff.add(id, person);
            }
            personSet[id]++;
        }
        function decr(id: number, diff: DataSetDiff<Person>) {

            personSet[id]--;

            if (personSet[id] === 0) {
                diff.remove(id);
                delete personSet[id];
            }
        }

        return emails.pipe(
            map((a) => {
                const diff = new DataSetDiff<Person>();
                const emailDiff = asEmails(a);

                for (const change of emailDiff.insertions) {
                    const [from, to] = getCorrespondantsFromSingleEmail(change.value);

                    incr(from.id, from, diff);
                    incr(to.id, to, diff);

                    emailsSet[change.id] = change.value;
                }
                for (const change of emailDiff.updates) {
                    const [prevFrom, prevTo] = getCorrespondantsFromSingleEmail(emailsSet[change.id]);
                    const [curFrom, curTo] = getCorrespondantsFromSingleEmail(change.value);

                    if (prevFrom.id === curFrom.id) {
                        diff.update(curFrom.id, curFrom);
                    } else {
                        decr(prevFrom.id, diff);
                        incr(curFrom.id, curFrom, diff);
                    }

                    if (prevTo.id === curTo.id) {
                        diff.update(curTo.id, curTo);
                    } else {
                        decr(prevTo.id, diff);
                        incr(curTo.id, curTo, diff);
                    }

                    emailsSet[change.id] = change.value;
                }
                for (const change of emailDiff.deletions) {
                    const [from, to] = getCorrespondantsFromSingleEmail(emailsSet[change.id]);

                    decr(from.id, diff);
                    decr(to.id, diff);

                    delete emailsSet[change.id];
                }

                return finalize(a, diff);
            })
        );
    };
}
