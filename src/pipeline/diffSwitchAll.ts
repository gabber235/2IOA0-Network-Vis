import { Observable } from "rxjs";



export function diffSwitchAll<Data, Diff>(diff: (x: Data, y: Data) => Diff, fold: (diff: Diff, prev: Data) => Data) {
    return (stream: Observable<Observable<Diff>>): Observable<Diff> => {
        return new Observable(sub => {
            
        })
    }
}