import * as utils from "../src/utils"


// @ponicode
describe("utils.swap", () => {
    test("1", () => {
        let result: any = utils.swap([undefined, undefined])
        expect(result).toEqual([undefined, undefined])
    })

    test("1", () => {
        let result: any = utils.swap([undefined, "a"])
        expect(result).toEqual(["a", undefined])
    })

    test("2", () => {
        let result: any = utils.swap([1, 2])
        expect(result).toEqual([2, 1])
    })

    test("3", () => {
        let result: any = utils.swap([true, false])
        expect(result).toEqual([false, true])
    })

    test("4", () => {
        let result: any = utils.swap([-Infinity, NaN])
        expect(result).toEqual([NaN, -Infinity])
    })
})

