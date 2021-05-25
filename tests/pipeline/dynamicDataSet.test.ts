import { Observable, of } from "rxjs"
import { map } from "rxjs/operators"
import { Email, Person } from "../../src/data"
import { diffMapFirst, foldDiffFirst, observableToArray } from "../../src/pipeline/basics"
import { DataSet, diffDataSet, getDynamicCorrespondants, ignoreDoubles, MapDiff } from "../../src/pipeline/dynamicDataSet"

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

describe("pipeline.dynamicDataSet.ignoreDoubles", () => {
    test("0", () => {
        let stream: Observable<[MapDiff<string>, number]> = of(
            [new MapDiff([{id: 1, value: "a"}, {id: 2, value: "b"}, {id: 1, value: "a"}], [], []), 0],
            [new MapDiff([{id: 1, value: "a"}, {id: 2, value: "b"}], [], []), 1],
            [new MapDiff([{id: 3, value: "d"}], [{id: 1, value: "c"}], [{id: 2}, {id: 2}]), 2],
            [new MapDiff([{id: 3, value: "d"}], [{id: 1, value: "c"}], [{id: 2}]), 3],
            [new MapDiff([{id: 2, value: "b"}], [], [{id: 3}]), 4],
            [new MapDiff([{id: 2, value: "b"}], [], [{id: 3}]), 5],
        ) as any

        let x = stream.pipe(ignoreDoubles)

        expect(observableToArray(x)).toEqual([
            [new MapDiff([{id: 1, value: "a"}, {id: 2, value: "b"}], [], []), 0],
            [new MapDiff(), 1],
            [new MapDiff([{id: 3, value: "d"}], [{id: 1, value: "c"}], [{id: 2}]), 2],
            [new MapDiff([], [{id: 1, value: "c"}], []), 3],
            [new MapDiff([{id: 2, value: "b"}], [], [{id: 3}]), 4],
            [new MapDiff(), 5],
        ])
    })
})



describe("pipeline.dynamicDataSet.getDynamicCorrespondants", () => {
    test("0", () => {
        let stream: Observable<[DataSet<Email>, number]> = of(
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

        let x = stream.pipe(
            diffMapFirst({} as DataSet<Email>, diffDataSet),
            getDynamicCorrespondants,
            map(([a,b,c]): [MapDiff<Person>, [MapDiff<Email>, number]] => [a, [b,c]]),
            foldDiffFirst,
            map(([a,[b,c]]): [MapDiff<Email>, [DataSet<Person>, number]] => [b, [a,c]]),
            foldDiffFirst,
            map(([a,[b,c]]): [DataSet<Person>, DataSet<Email>, number] => [b, a, c]),
            map(([a, b, c]): [DataSet<Person>, DataSet<Email>, number] => [
                Object.assign({}, a), Object.assign({}, b), c
            ])
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
