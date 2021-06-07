import { Observable, of } from "rxjs"
import { map, scan } from "rxjs/operators"
import { diffStream, observableToArray } from "../../src/pipeline/basics"
import { DataSet, diffDataSet, diffPureDataSet, DataSetDiff, foldDataSet } from "../../src/pipeline/dynamicDataSet"
import { pairMap2, pair } from "../../src/utils"

describe("pipeline.basics.observableToArray", () => {
    test("0", () => {
        const arr = observableToArray(of(1, 2, 3, 4, 5, 6))

        expect(arr).toEqual([1, 2, 3, 4, 5, 6])
    })
})

describe("pipeline.basics.diffMapFirst", () => {
    test("0", () => {
        const stream: Observable<[DataSet<string>, number]> = of([{ 1: "a", 2: "b" }, 0], [{ 1: "c", 3: "d" }, 1], [{ 1: "c", 2: "b" }, 2]) as any
        const diffed = stream.pipe(diffStream(pair({}, 0), pairMap2(diffDataSet, (_, x) => x)))

        expect(observableToArray(diffed)).toEqual([
            [new DataSetDiff([{ id: "1", value: "a" }, { id: "2", value: "b" }], [], []), 0],
            [new DataSetDiff([{ id: "3", value: "d" }], [{ id: "1", value: "c" }], [{ id: "2" }]), 1],
            [new DataSetDiff([{ id: "2", value: "b" }], [{ id: "1", value: "c" }], [{ id: "3" }]), 2],
        ])
    })
    test("1", () => {
        const stream: Observable<[DataSet<string>, number]> = of([{ 1: "a", 2: "b" }, 0], [{ 1: "c", 3: "d" }, 1], [{ 1: "c", 2: "b" }, 2]) as any
        const diffed = stream.pipe(diffStream(pair({}, 0), pairMap2(diffPureDataSet, (_, x) => x)))

        expect(observableToArray(diffed)).toEqual([
            [new DataSetDiff([{ id: "1", value: "a" }, { id: "2", value: "b" }], [], []), 0],
            [new DataSetDiff([{ id: "3", value: "d" }], [{ id: "1", value: "c" }], [{ id: "2" }]), 1],
            [new DataSetDiff([{ id: "2", value: "b" }], [], [{ id: "3" }]), 2],
        ])
    })
})


describe("pipeline.basics.foldDiffFirst", () => {
    test("0", () => {
        const stream: Observable<[DataSetDiff<string>, number]> = of(
            [new DataSetDiff([{ id: "1", value: "a" }, { id: "2", value: "b" }], [], []), 0],
            [new DataSetDiff([{ id: "3", value: "d" }], [{ id: "1", value: "c" }], [{ id: "2" }]), 1],
            [new DataSetDiff([{ id: "2", value: "b" }], [], [{ id: "3" }]), 2]
        ) as any

        const folded = stream.pipe(
            scan(pairMap2(foldDataSet, (_, x) => x), [{}, 0]),
            map(([i, j]) => pair(Object.assign({}, i), j)),
        )

        expect(observableToArray(folded)).toEqual([
            [{ 1: "a", 2: "b" }, 0],
            [{ 1: "c", 3: "d" }, 1],
            [{ 1: "c", 2: "b" }, 2]
        ])
    })
})
