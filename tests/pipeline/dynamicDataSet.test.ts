import { identity, Observable, of } from "rxjs"
import { map, scan } from "rxjs/operators"
import { Email, Person } from "../../src/data"
import { diffStream, observableToArray } from "../../src/pipeline/basics"
import { DataSet, diffDataSet, DataSetDiff, foldDataSet } from "../../src/pipeline/dynamicDataSet"
import { getDynamicCorrespondants } from "../../src/pipeline/getDynamicCorrespondants"
import { copyObject, pair, pairMap, pairMap2, tripple, trippleMap, trippleMap2 } from "../../src/utils"

function dummyEmail(id: number, from: number, to: number): Email {
    return {
        id: id,
        date: "",
        fromId: from,
        fromEmail: "",
        fromJobtitle: "Unknown",
        toId: to,
        toEmail: "",
        toJobtitle: "Unknown",
        messageType: "TO",
        sentiment: 0
    }
}
function dummyPerson(id: number): Person {
    return {
        id: id,
        emailAdress: "",
        title: "Unknown"
    }
}

// describe("pipeline.dynamicDataSet.ignoreDoubles", () => {
//     test("0", () => {
//         const stream: Observable<[DataSetDiff<string>, number]> = of(
//             [new DataSetDiff([{id: 1, value: "a"}, {id: 2, value: "b"}, {id: 1, value: "a"}], [], []), 0],
//             [new DataSetDiff([{id: 1, value: "a"}, {id: 2, value: "b"}], [], []), 1],
//             [new DataSetDiff([{id: 3, value: "d"}], [{id: 1, value: "c"}], [{id: 2}, {id: 2}]), 2],
//             [new DataSetDiff([{id: 3, value: "d"}], [{id: 1, value: "c"}], [{id: 2}]), 3],
//             [new DataSetDiff([{id: 2, value: "b"}], [], [{id: 3}]), 4],
//             [new DataSetDiff([{id: 2, value: "b"}], [], [{id: 3}]), 5],
//         ) as any

//         const x = stream.pipe(ignoreDoubles)

//         expect(observableToArray(x)).toEqual([
//             [new DataSetDiff([{id: 1, value: "a"}, {id: 2, value: "b"}], [], []), 0],
//             [new DataSetDiff(), 1],
//             [new DataSetDiff([{id: 3, value: "d"}], [{id: 1, value: "c"}], [{id: 2}]), 2],
//             [new DataSetDiff([], [{id: 1, value: "c"}], []), 3],
//             [new DataSetDiff([{id: 2, value: "b"}], [], [{id: 3}]), 4],
//             [new DataSetDiff(), 5],
//         ])
//     })
// })



describe("pipeline.dynamicDataSet.getDynamicCorrespondants", () => {
    test("0", () => {
        const stream: Observable<[DataSet<Email>, number]> = of(
            [{
                0: dummyEmail(0, 0, 1),
            }, 0],
            [{
                0: dummyEmail(0, 0, 1),
                1: dummyEmail(1, 1, 2),
                2: dummyEmail(2, 2, 0),
            }, 1],
            [{
                0: dummyEmail(0, 0, 1),
            }, 2],
            [{
                0: dummyEmail(0, 0, 1),
                1: dummyEmail(1, 1, 2),
            }, 3],
            [{
                0: dummyEmail(0, 0, 1),
                1: dummyEmail(1, 1, 3),
            }, 4],
        ) as any

        const x = stream.pipe(
            diffStream(pair({} as DataSet<Email>, 0), pairMap2(diffDataSet, (_, x) => x)),
            getDynamicCorrespondants(([email, _]) => email, (x, y) => pair(y, x)),
            map(([a,[b,c]]) => tripple(a,b,c)),
            scan(trippleMap2(foldDataSet, foldDataSet, (_, x) => x), tripple({}, {}, 0)),
            map(trippleMap(copyObject, copyObject, identity))
        )

        expect(observableToArray(x)).toEqual([
            [{
                0: dummyPerson(0),
                1: dummyPerson(1),
            }, {
                0: dummyEmail(0, 0, 1)
            }, 0],
            [{
                0: dummyPerson(0),
                1: dummyPerson(1),
                2: dummyPerson(2),
            }, {
                0: dummyEmail(0, 0, 1),
                1: dummyEmail(1, 1, 2),
                2: dummyEmail(2, 2, 0),
            }, 1],
            [{
                0: dummyPerson(0),
                1: dummyPerson(1),
            }, {
                0: dummyEmail(0, 0, 1),
            }, 2],
            [{
                0: dummyPerson(0),
                1: dummyPerson(1),
                2: dummyPerson(2),
            }, {
                0: dummyEmail(0, 0, 1),
                1: dummyEmail(1, 1, 2),
            }, 3],
            [{
                0: dummyPerson(0),
                1: dummyPerson(1),
                3: dummyPerson(3),
            }, {
                0: dummyEmail(0, 0, 1),
                1: dummyEmail(1, 1, 3),
            }, 4],
        ])
    })
})
