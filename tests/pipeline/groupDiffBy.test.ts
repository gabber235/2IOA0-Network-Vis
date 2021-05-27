import { identity, of } from "rxjs"
import { observableToArray } from "../../src/pipeline/basics"
import { DataSetDiff } from "../../src/pipeline/dynamicDataSet"
import { groupDiffBy } from "../../src/pipeline/groupDiffBy"
import { pair, zipArrays } from "../../src/utils"


describe("pipeline.groupDiffBy.groupDiffBy", () => {
    test("0", () => {

        const diffs = [
            new DataSetDiff([{id: "0", value: pair(0, 'a')}])
        ]

        const stream = of(...diffs)

        const x = stream.pipe(
            groupDiffBy(identity, ([i, _]) => i+"", (a, diff) => pair(a, diff))
        )

        expect(observableToArray(x)).toEqual(zipArrays(diffs, [
            new DataSetDiff([{id: "0", value: new DataSetDiff([{id: "0", value: pair(0, 'a')}])}])
        ]))
    })

    test("1", () => {

        const diffs = [
            new DataSetDiff([{id: "0", value: pair(0, 'a')}, {id: "1", value: pair(0, 'b')}])
        ]

        const stream = of(...diffs)

        const x = stream.pipe(
            groupDiffBy(identity, ([i, _]) => i+"", (a, diff) => pair(a, diff))
        )

        expect(observableToArray(x)).toEqual(zipArrays(diffs, [
            new DataSetDiff(
                [{id: "0", value: new DataSetDiff([{id: "0", value: pair(0, 'a')}])}],
                [{id: "0", value: new DataSetDiff([{id: "1", value: pair(0, 'b')}])}],
            )
        ]))
    })

    test("2", () => {

        const diffs = [
            new DataSetDiff([{id: "0", value: pair(0, 'a')}, {id: "1", value: pair(0, 'b')}]),
            new DataSetDiff([{id: "2", value: pair(0, 'c')}]),
        ]

        const stream = of(...diffs)

        const x = stream.pipe(
            groupDiffBy(identity, ([i, _]) => i+"", (a, diff) => pair(a, diff))
        )

        expect(observableToArray(x)).toEqual(zipArrays(diffs, [
            new DataSetDiff(
                [{id: "0", value: new DataSetDiff([{id: "0", value: pair(0, 'a')}])}],
                [{id: "0", value: new DataSetDiff([{id: "1", value: pair(0, 'b')}])}],
            ),
            new DataSetDiff(
                [],
                [{id: "0", value: new DataSetDiff([{id: "2", value: pair(0, 'c')}])}],
            )
        ]))
    }),
    test("3", () => {

        const diffs = [
            new DataSetDiff([{id: "0", value: pair(0, 'a')}, {id: "1", value: pair(0, 'b')}]),
            new DataSetDiff([{id: "2", value: pair(0, 'c')}, {id: "3", value: pair(1, 'd')}]),
            new DataSetDiff([{id: "4", value: pair(2, 'e')}]),
            new DataSetDiff([{id: "5", value: pair(0, 'f')}]),
        ]

        const stream = of(...diffs)

        const x = stream.pipe(
            groupDiffBy(identity, ([i, _]) => i+"", (a, diff) => pair(a, diff))
        )

        expect(observableToArray(x)).toEqual(zipArrays(diffs, [
            new DataSetDiff(
                [{id: "0", value: new DataSetDiff([{id: "0", value: pair(0, 'a')}])}],
                [{id: "0", value: new DataSetDiff([{id: "1", value: pair(0, 'b')}])}],
            ),
            new DataSetDiff(
                [{id: "1", value: new DataSetDiff([{id: "3", value: pair(1, 'd')}])}],
                [{id: "0", value: new DataSetDiff([{id: "2", value: pair(0, 'c')}])}],
            ),
            new DataSetDiff(
                [{id: "2", value: new DataSetDiff([{id: "4", value: pair(2, 'e')}])}],
                [],
            ),
            new DataSetDiff(
                [],
                [{id: "0", value: new DataSetDiff([{id: "5", value: pair(0, 'f')}])}],
            )
        ]))
    })
    test("4", () => {

        const diffs = [
            new DataSetDiff([{id: "0", value: pair(0, 'a')}, {id: "1", value: pair(0, 'b')}]),
            new DataSetDiff([{id: "2", value: pair(0, 'c')}, {id: "3", value: pair(1, 'd')}]),
            new DataSetDiff([{id: "4", value: pair(2, 'e')}]),
            new DataSetDiff([{id: "5", value: pair(0, 'f')}], [{id: "0", value: pair(0, 'A')}]),

            new DataSetDiff([], [{id: "3", value: pair(1, 'D')}, {id: "4", value: pair(2, 'E')}])
        ]

        const stream = of(...diffs)

        const x = stream.pipe(
            groupDiffBy(identity, ([i, _]) => i+"", (a, diff) => pair(a, diff))
        )

        expect(observableToArray(x)).toEqual(zipArrays(diffs, [
            new DataSetDiff(
                [{id: "0", value: new DataSetDiff([{id: "0", value: pair(0, 'a')}])}],
                [{id: "0", value: new DataSetDiff([{id: "1", value: pair(0, 'b')}])}],
            ),
            new DataSetDiff(
                [{id: "1", value: new DataSetDiff([{id: "3", value: pair(1, 'd')}])}],
                [{id: "0", value: new DataSetDiff([{id: "2", value: pair(0, 'c')}])}],
            ),
            new DataSetDiff(
                [{id: "2", value: new DataSetDiff([{id: "4", value: pair(2, 'e')}])}],
                [],
            ),
            new DataSetDiff(
                [],
                [{id: "0", value: new DataSetDiff([{id: "5", value: pair(0, 'f')}], [{id: "0", value: pair(0, 'A')}])}],
            ),

            new DataSetDiff([],[
                {id: "1", value: new DataSetDiff([], [{id: "3", value: pair(1, 'D')}])},
                {id: "2", value: new DataSetDiff([], [{id: "4", value: pair(2, 'E')}])}
            ])
        ]))
    })
    test("5", () => {

        const diffs = [
            new DataSetDiff([{id: "0", value: pair(0, 'a')}, {id: "1", value: pair(0, 'b')}]),
            new DataSetDiff([{id: "2", value: pair(0, 'c')}, {id: "3", value: pair(1, 'd')}]),
            new DataSetDiff([{id: "4", value: pair(2, 'e')}]),
            new DataSetDiff([{id: "5", value: pair(0, 'f')}], [{id: "0", value: pair(0, 'A')}]),

            new DataSetDiff([], [{id: "3", value: pair(1, 'D')}, {id: "4", value: pair(2, 'E')}]),
            new DataSetDiff([], [{id: "1", value: pair(1, 'b')}]),
        ]

        const stream = of(...diffs)

        const x = stream.pipe(
            groupDiffBy(identity, ([i, _]) => i+"", (a, diff) => pair(a, diff))
        )
        
        const arr = observableToArray(x)

        expect(arr).toEqual(zipArrays(diffs, [
            new DataSetDiff(
                [{id: "0", value: new DataSetDiff([{id: "0", value: pair(0, 'a')}])}],
                [{id: "0", value: new DataSetDiff([{id: "1", value: pair(0, 'b')}])}],
            ),
            new DataSetDiff(
                [{id: "1", value: new DataSetDiff([{id: "3", value: pair(1, 'd')}])}],
                [{id: "0", value: new DataSetDiff([{id: "2", value: pair(0, 'c')}])}],
            ),
            new DataSetDiff(
                [{id: "2", value: new DataSetDiff([{id: "4", value: pair(2, 'e')}])}],
                [],
            ),
            new DataSetDiff(
                [],
                [{id: "0", value: new DataSetDiff([{id: "5", value: pair(0, 'f')}], [{id: "0", value: pair(0, 'A')}])}],
            ),

            new DataSetDiff([],[
                {id: "1", value: new DataSetDiff([], [{id: "3", value: pair(1, 'D')}])},
                {id: "2", value: new DataSetDiff([], [{id: "4", value: pair(2, 'E')}])}
            ]),
            new DataSetDiff([], [
                {id: "0", value: new DataSetDiff([], [], [{id: "1"}])},
                {id: "1", value: new DataSetDiff([{id: "1", value: pair(1, 'b')}])},
            ], [])
        ]))
    })
    test("6", () => {

        const diffs = [
            new DataSetDiff([{id: "0", value: pair(0, 'a')}, {id: "1", value: pair(0, 'b')}]),
            new DataSetDiff([{id: "2", value: pair(0, 'c')}, {id: "3", value: pair(1, 'd')}]),
            new DataSetDiff([{id: "4", value: pair(2, 'e')}]),
            new DataSetDiff([{id: "5", value: pair(0, 'f')}], [{id: "0", value: pair(0, 'A')}]),

            new DataSetDiff([], [{id: "3", value: pair(1, 'D')}, {id: "4", value: pair(2, 'E')}]),
            new DataSetDiff([], [{id: "1", value: pair(1, 'b')}]),

            new DataSetDiff([], [{id: "4", value: pair(3, 'E')}]),
        ]

        const stream = of(...diffs)

        const x = stream.pipe(
            groupDiffBy(identity, ([i, _]) => i+"", (a, diff) => pair(a, diff))
        )
        
        const arr = observableToArray(x)

        expect(arr).toEqual(zipArrays(diffs, [
            new DataSetDiff(
                [{id: "0", value: new DataSetDiff([{id: "0", value: pair(0, 'a')}])}],
                [{id: "0", value: new DataSetDiff([{id: "1", value: pair(0, 'b')}])}],
            ),
            new DataSetDiff(
                [{id: "1", value: new DataSetDiff([{id: "3", value: pair(1, 'd')}])}],
                [{id: "0", value: new DataSetDiff([{id: "2", value: pair(0, 'c')}])}],
            ),
            new DataSetDiff(
                [{id: "2", value: new DataSetDiff([{id: "4", value: pair(2, 'e')}])}],
                [],
            ),
            new DataSetDiff(
                [],
                [{id: "0", value: new DataSetDiff([{id: "5", value: pair(0, 'f')}], [{id: "0", value: pair(0, 'A')}])}],
            ),

            new DataSetDiff([],[
                {id: "1", value: new DataSetDiff([], [{id: "3", value: pair(1, 'D')}])},
                {id: "2", value: new DataSetDiff([], [{id: "4", value: pair(2, 'E')}])}
            ]),
            new DataSetDiff([], [
                {id: "0", value: new DataSetDiff([], [], [{id: "1"}])},
                {id: "1", value: new DataSetDiff([{id: "1", value: pair(1, 'b')}])},
            ], []),
            new DataSetDiff([
                {id: "3", value: new DataSetDiff([{id: "4", value: pair(3, 'E')}])}
            ], [], [{id: "2"}])
        ]))
    })
    test("7", () => {

        const diffs = [
            new DataSetDiff([{id: "0", value: pair(0, 'a')}, {id: "1", value: pair(0, 'b')}]),
            new DataSetDiff([{id: "2", value: pair(0, 'c')}, {id: "3", value: pair(1, 'd')}]),
            new DataSetDiff([{id: "4", value: pair(2, 'e')}]),
            new DataSetDiff([{id: "5", value: pair(0, 'f')}], [{id: "0", value: pair(0, 'A')}]),

            new DataSetDiff([], [{id: "3", value: pair(1, 'D')}, {id: "4", value: pair(2, 'E')}]),
            new DataSetDiff([], [{id: "1", value: pair(1, 'b')}]),

            new DataSetDiff([], [{id: "4", value: pair(3, 'E')}]),

            new DataSetDiff([], [], [{id: "5"}, {id: "4"}])
        ]

        const stream = of(...diffs)

        const x = stream.pipe(
            groupDiffBy(identity, ([i, _]) => i+"", (a, diff) => pair(a, diff))
        )
        
        const arr = observableToArray(x)

        expect(arr).toEqual(zipArrays(diffs, [
            new DataSetDiff(
                [{id: "0", value: new DataSetDiff([{id: "0", value: pair(0, 'a')}])}],
                [{id: "0", value: new DataSetDiff([{id: "1", value: pair(0, 'b')}])}],
            ),
            new DataSetDiff(
                [{id: "1", value: new DataSetDiff([{id: "3", value: pair(1, 'd')}])}],
                [{id: "0", value: new DataSetDiff([{id: "2", value: pair(0, 'c')}])}],
            ),
            new DataSetDiff(
                [{id: "2", value: new DataSetDiff([{id: "4", value: pair(2, 'e')}])}],
                [],
            ),
            new DataSetDiff(
                [],
                [{id: "0", value: new DataSetDiff([{id: "5", value: pair(0, 'f')}], [{id: "0", value: pair(0, 'A')}])}],
            ),

            new DataSetDiff([],[
                {id: "1", value: new DataSetDiff([], [{id: "3", value: pair(1, 'D')}])},
                {id: "2", value: new DataSetDiff([], [{id: "4", value: pair(2, 'E')}])}
            ]),
            new DataSetDiff([], [
                {id: "0", value: new DataSetDiff([], [], [{id: "1"}])},
                {id: "1", value: new DataSetDiff([{id: "1", value: pair(1, 'b')}])},
            ], []),
            new DataSetDiff([
                {id: "3", value: new DataSetDiff([{id: "4", value: pair(3, 'E')}])}
            ], [], [{id: "2"}]),
            new DataSetDiff([], [{id: "0", value: new DataSetDiff([], [], [{id: "5"}])}], [{id: "3"}])
        ]))
    })
})