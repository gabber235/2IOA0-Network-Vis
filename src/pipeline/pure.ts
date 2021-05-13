import { Observable } from "rxjs";
import { map } from "rxjs/operators";
import { swap } from "../utils";
import { DataSet, DataSetDiff } from "./dynamicDataSet";


/**
 * Turn an observable of datasets into a observable of dataset diff's
 */
export function pureFirst<A, B>(staticDataSet: Observable<[DataSet<A>, B]>): Observable<[DataSetDiff<A>, B]> {
    let previous: DataSet<A> = {}

    return new Observable(sub => {
        staticDataSet.subscribe({
            next([dataset, b]) {
                let diff = new DataSetDiff<A>()

                for (const id in dataset) {
                    if (id in previous) {
                        diff.update(+id, dataset[id])
                    } else {
                        diff.add(+id, dataset[id])
                    }
                }
                for (const id in previous) {
                    if (!(id in dataset)) diff.remove(+id)
                }

                previous = dataset

                sub.next([diff, b])
            }
        })
    })
}

export function pureBoth<A, B>(staticDataSet: Observable<[DataSet<A>, DataSet<B>]>): Observable<[DataSetDiff<A>, DataSetDiff<B>]> {
    return staticDataSet.pipe(pureFirst, map(swap), pureFirst, map(swap))
}