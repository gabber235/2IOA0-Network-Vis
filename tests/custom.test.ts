import * as utils from "../src/utils"

describe("utils.binarySearch", () => {
    test("0", () => {
        const array: number[] = []
        const result: any = utils.binarySearch((index) => array[index], 69, 0, array.length, (a, b) => a - b)
        expect(result).toBe(0)
    })
    test("1", () => {
        const array = [1, 2, 3, 12, 24, 44, 1121, 123123]
        const result: any = utils.binarySearch((index) => array[index], 1121, 0, array.length, (a, b) => a - b)
        expect(result).toBe(6)
    })
    test("1", () => {
        const array = [1, 2, 2, 2, 3, 12, 24, 44, 1121, 123123]
        const result: any = utils.binarySearch((index) => array[index], 2, 0, array.length, (a, b) => a - b)
        expect(result).toBe(1)
    })
    test("2", () => {
        const array = [1, 2, 2, 2, 3, 12, 24, 44, 1121, 123123]
        const result: any = utils.binarySearch((index) => array[index], 69, 0, array.length, (a, b) => a - b)
        expect(result).toBe(8)
    })
    test("3", () => {
        const array = ["A", "B", "C", "D", "E"]
        const result: any = utils.binarySearch((index) => array[index], "E", 0, array.length, (a, b) => a.localeCompare(b))
        expect(result).toBe(4)
    })
    test("4", () => {
        const array = ["A", "B", "C", "D", "E"]
        const result: any = utils.binarySearch((index) => array[index], "F", 0, array.length, (a, b) => a.localeCompare(b))
        expect(result).toBe(5)
    })
    test("5", () => {
        const array = ["B", "C", "D", "E"]
        const result: any = utils.binarySearch((index) => array[index], "A", 0, array.length, (a, b) => a.localeCompare(b))
        expect(result).toBe(0)
    })
})
