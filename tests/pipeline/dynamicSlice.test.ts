import { of, Subject } from "rxjs"
import { map, share } from "rxjs/operators"
import { foldDiffFirst, observableToArray } from "../../src/pipeline/basics"
import { MapDiff } from "../../src/pipeline/dynamicDataSet"
import { ConstArray, dynamicSlice } from "../../src/pipeline/dynamicSlice"


describe("pipeline.dynamicSlice.dynamicSlice", () => {
    test("0", () => {
        let array = of({getItem: (index: number): [number, number] => [index,index], length: 5})
        let begin = of()
        let end = of()

        let sliced = array.pipe(
            map((x): [ConstArray<[number, number]>, null] => [x, null]),
            dynamicSlice(0, begin, 5, end),
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
        let begin = of()
        let end = of()

        let sliced = array.pipe(
            map((x): [ConstArray<[number, number]>, null] => [x, null]),
            dynamicSlice(0, begin, 5, end),
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
        let begin = of()
        let end = of(10)

        let sliced = array.pipe(
            map((x): [ConstArray<[number, number]>, null] => [x, null]),
            dynamicSlice(0, begin, 5, end),
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
        let begin = new Subject<number>()
        let end = new Subject<number>()


        let sliced = array.pipe(
            map((x): [ConstArray<[number, number]>, null] => [x, null]),
            dynamicSlice(0, begin, 5, end),
            foldDiffFirst,
            map(([a, b]) => [Object.assign({}, a), b])
        )

        let arr = observableToArray(sliced)

        end.next(10)
        begin.next(5)

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
        let begin = new Subject<number>()
        let end = new Subject<number>()


        let sliced = array.pipe(
            map((x): [ConstArray<[number, number]>, null] => [x, null]),
            dynamicSlice(0, begin, 5, end),
            foldDiffFirst,
            map(([a, b]) => [Object.assign({}, a), b])
        )

        let arr = observableToArray(sliced)

        end.next(10)
        begin.next(5)
        begin.next(-10)
        end.next(3)


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
        let begin = new Subject<number>()
        let end = new Subject<number>()


        let sliced = array.pipe(
            map((x): [ConstArray<[number, number]>, null] => [x, null]),
            dynamicSlice(0, begin, 5, end),
            foldDiffFirst,
            map(([a, b]) => [Object.assign({}, a), b])
        )

        let arr = observableToArray(sliced)

        array.next({getItem: i => [i, i], length: 100})
        end.next(10)
        begin.next(5)
        begin.next(-10)
        end.next(3)
        array.next({getItem: i => [i, i + 1], length: 100})
        end.next(10)
        begin.next(5)

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
})