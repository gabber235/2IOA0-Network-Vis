import { Observable, of } from "rxjs"
import { map } from "rxjs/operators"
import { diffMapFirst, foldDiffFirst, observableToArray } from "../../src/pipeline/basics"
import { DataSet, diffDataSet, diffPureDataSet, MapDiff } from "../../src/pipeline/dynamicDataSet"
import * as utils from "../../src/utils"

describe("pipeline.basics.observableToArray", () => {
    test("0", () => {
        let arr = observableToArray(of(1,2,3,4,5,6))

        expect(arr).toEqual([1,2,3,4,5,6])
    })
})

describe("pipeline.basics.diffMapFirst", () => {
    test("0", () => {
        let stream: Observable<[DataSet<string>, number]> = of([{1:"a", 2: "b"}, 0], [{1: "c", 3: "d"}, 1], [{1: "c", 2: "b"}, 2]) as any
        let diffed = stream.pipe(diffMapFirst({} as DataSet<string>, diffDataSet))

        expect(observableToArray(diffed)).toEqual([
            [new MapDiff([{id: 1, value: "a"}, {id: 2, value: "b"}], [], []), 0],
            [new MapDiff([{id: 3, value: "d"}], [{id: 1, value: "c"}], [{id: 2}]), 1],
            [new MapDiff([{id: 2, value: "b"}], [{id: 1, value: "c"}], [{id: 3}]), 2],
        ])
    })
    test("1", () => {
        let stream: Observable<[DataSet<string>, number]> = of([{1:"a", 2: "b"}, 0], [{1: "c", 3: "d"}, 1], [{1: "c", 2: "b"}, 2]) as any
        let diffed = stream.pipe(diffMapFirst({} as DataSet<string>, diffPureDataSet))

        expect(observableToArray(diffed)).toEqual([
            [new MapDiff([{id: 1, value: "a"}, {id: 2, value: "b"}], [], []), 0],
            [new MapDiff([{id: 3, value: "d"}], [{id: 1, value: "c"}], [{id: 2}]), 1],
            [new MapDiff([{id: 2, value: "b"}], [], [{id: 3}]), 2],
        ])
    })
})


describe("pipeline.basics.foldDiffFirst", () => {
    test("0", () => {
        let stream: Observable<[MapDiff<string>, number]> = of(
            [new MapDiff([{id: 1, value: "a"}, {id: 2, value: "b"}], [], []), 0],
            [new MapDiff([{id: 3, value: "d"}], [{id: 1, value: "c"}], [{id: 2}]), 1],
            [new MapDiff([{id: 2, value: "b"}], [], [{id: 3}]), 2]
        ) as any

        let folded = stream.pipe(foldDiffFirst, map(([i, j]) => [Object.assign({}, i), j]))

        expect(observableToArray(folded)).toEqual([
            [{1:"a", 2: "b"}, 0], 
            [{1: "c", 3: "d"}, 1], 
            [{1: "c", 2: "b"}, 2]
        ])
    })
})
