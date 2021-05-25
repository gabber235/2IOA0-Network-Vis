import { Observable, of, Subject } from "rxjs"
import { map, share } from "rxjs/operators"
import { foldDiffFirst, observableToArray } from "../../src/pipeline/basics"
import { MapDiff } from "../../src/pipeline/dynamicDataSet"
import { ConstArray, dynamicSlice } from "../../src/pipeline/dynamicSlice"


describe("pipeline.dynamicSlice.dynamicSlice", () => {
    test("0", () => {
        let array = of({getItem: (index: number): [number, number] => [index,index], length: 5})
        let range = of()

        let sliced = array.pipe(
            map((x): [ConstArray<[number, number]>, null] => [x, null]),
            dynamicSlice(0, 5, range),
            foldDiffFirst,
            map(([a, b]) => [Object.assign({}, a), b])
        )
        
        expect(observableToArray(sliced))
        .toEqual([
            [{
                0: 0,
                1: 1,
                2: 2,
                3: 3,
                4: 4,
            }, null]
        ])
    })
    test("1", () => {
        let array = of({getItem: (index: number): [number, number] => [index,index], length: 100})
        let range = of()

        let sliced = array.pipe(
            map((x): [ConstArray<[number, number]>, null] => [x, null]),
            dynamicSlice(0, 5, range),
            foldDiffFirst,
            map(([a, b]) => [Object.assign({}, a), b])
        )

        expect(observableToArray(sliced))
        .toEqual([
            [{
                0: 0,
                1: 1,
                2: 2,
                3: 3,
                4: 4,
            }, null]
        ])
    })
    test("2", () => {
        let array = of({getItem: (index: number): [number, number] => [index,index], length: 100})
        let range: Observable<[number, number]> = of([0, 10])

        let sliced = array.pipe(
            map((x): [ConstArray<[number, number]>, null] => [x, null]),
            dynamicSlice(0, 5, range),
            foldDiffFirst,
            map(([a, b]) => [Object.assign({}, a), b])
        )

        expect(observableToArray(sliced))
        .toEqual([
            [{
                0: 0,
                1: 1,
                2: 2,
                3: 3,
                4: 4,
            }, null],
            [{
                0: 0,
                1: 1,
                2: 2,
                3: 3,
                4: 4,
                5: 5,
                6: 6,
                7: 7,
                8: 8,
                9: 9,
            }, null],
        ])
    })
    test("3", () => {
        let array = of({getItem: (index: number): [number, number] => [index,index], length: 100})
        let range = new Subject<[number, number]>()


        let sliced = array.pipe(
            map((x): [ConstArray<[number, number]>, null] => [x, null]),
            dynamicSlice(0, 5, range),
            foldDiffFirst,
            map(([a, b]) => [Object.assign({}, a), b])
        )

        let arr = observableToArray(sliced)

        range.next([0, 10])
        range.next([5, 10])

        expect(arr)
        .toEqual([
            [{
                0: 0,
                1: 1,
                2: 2,
                3: 3,
                4: 4,
            }, null],
            [{
                0: 0,
                1: 1,
                2: 2,
                3: 3,
                4: 4,
                5: 5,
                6: 6,
                7: 7,
                8: 8,
                9: 9,
            }, null],
            [{
                5: 5,
                6: 6,
                7: 7,
                8: 8,
                9: 9,
            }, null],
        ])
    })
    test("4", () => {
        let array = of({getItem: (index: number): [number, number] => [index,index], length: 100})
        let range = new Subject<[number, number]>()


        let sliced = array.pipe(
            map((x): [ConstArray<[number, number]>, null] => [x, null]),
            dynamicSlice(0, 5, range),
            foldDiffFirst,
            map(([a, b]) => [Object.assign({}, a), b])
        )

        let arr = observableToArray(sliced)

        range.next([0, 10])
        range.next([5, 10])
        range.next([-10, 10])
        range.next([-10, 3])


        expect(arr)
        .toEqual([
            [{
                0: 0,
                1: 1,
                2: 2,
                3: 3,
                4: 4,
            }, null],
            [{
                0: 0,
                1: 1,
                2: 2,
                3: 3,
                4: 4,
                5: 5,
                6: 6,
                7: 7,
                8: 8,
                9: 9,
            }, null],
            [{
                5: 5,
                6: 6,
                7: 7,
                8: 8,
                9: 9,
            }, null],
            [{
                0: 0,
                1: 1,
                2: 2,
                3: 3,
                4: 4,
                5: 5,
                6: 6,
                7: 7,
                8: 8,
                9: 9,
            }, null],
            [{
                0: 0,
                1: 1,
                2: 2,
            }, null],
        ])
    })
    test("5", () => {
        let array = new Subject<ConstArray<[number, number]>>()
        let range = new Subject<[number, number]>()


        let sliced = array.pipe(
            map((x): [ConstArray<[number, number]>, null] => [x, null]),
            dynamicSlice(0, 5, range),
            foldDiffFirst,
            map(([a, b]) => [Object.assign({}, a), b])
        )

        let arr = observableToArray(sliced)

        range.next([0, 5])
        array.next({getItem: i => [i, i], length: 100})
        range.next([0, 10])
        range.next([5, 10])
        range.next([-10, 10])
        range.next([-10, 3])
        array.next({getItem: i => [i, i + 1], length: 100})
        range.next([-10, 10])
        range.next([5, 10])

        expect(arr)
        .toEqual([
            [{
                0: 0,
                1: 1,
                2: 2,
                3: 3,
                4: 4,
            }, null],
            [{
                0: 0,
                1: 1,
                2: 2,
                3: 3,
                4: 4,
                5: 5,
                6: 6,
                7: 7,
                8: 8,
                9: 9,
            }, null],
            [{
                5: 5,
                6: 6,
                7: 7,
                8: 8,
                9: 9,
            }, null],
            [{
                0: 0,
                1: 1,
                2: 2,
                3: 3,
                4: 4,
                5: 5,
                6: 6,
                7: 7,
                8: 8,
                9: 9,
            }, null],
            [{
                0: 0,
                1: 1,
                2: 2,
            }, null],
            [{
                0: 1,
                1: 2,
                2: 3,
            }, null],
            [{
                0: 1,
                1: 2,
                2: 3,
                3: 4,
                4: 5,
                5: 6,
                6: 7,
                7: 8,
                8: 9,
                9: 10,
            }, null],
            [{
                5: 6,
                6: 7,
                7: 8,
                8: 9,
                9: 10,
            }, null],
        ])
    })
    test("5", () => {
        let array = new Subject<ConstArray<[number, number]>>()
        let range = new Subject<[number, number]>()


        let sliced = array.pipe(
            map((x): [ConstArray<[number, number]>, null] => [x, null]),
            dynamicSlice(0, 5, range),
            foldDiffFirst,
            map(([a, b]) => [Object.assign({}, a), b])
        )

        let arr = observableToArray(sliced)

        array.next({getItem: i => [i, i], length: 100})
        range.next([10, 15])

        expect(arr)
        .toEqual([
            [{
                0: 0,
                1: 1,
                2: 2,
                3: 3,
                4: 4,
            }, null],
            [{
                10: 10,
                11: 11,
                12: 12,
                13: 13,
                14: 14,
            }, null],
        ])
    })
})