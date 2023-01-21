import { parse } from "./parser.ts"
import { DataType, Obj, Token } from "./types.ts"
import { trimCitation } from "./util.ts"

function interpret(exp: string, data: string): DataType {
    const parsed = parse(exp)
    if (!parsed) throw new Error("Syntax error")
    const res = evalulate(parsed, JSON.parse(data))
    return res
}

function evalulate(expression: Token, data: DataType): DataType {
    const mathFuncAgainstData = (data: DataType, operation: (a: number, b: number) => number, name: string) => {
        if (typeof data === 'number') return data
        if (typeof data === 'string') throw new Error(`Cant ${name} string type`)
        if (typeof data === 'boolean') throw new Error(`Cant ${name} string type`)
        if (data === null) throw new Error(`Cant ${name} null`)
        if (Array.isArray(data)) return data.filter(d => typeof d === 'number').reduce((prev, curr) => operation((prev as number), (curr as number)), 0)
        return Object.values(data).filter(d => typeof d === 'number').reduce((prev, curr) => operation((prev as number), (curr as number)), 0)
    }
    const mathFuncAgainstArgs = (func: Token, data: DataType, operation: (a: number, b: number) => number, name: string) => {
        const evaluatedArgs = argumentsEval(func.children[1], data)
        let maxLen = 0
        const onlyNumbers = evaluatedArgs.every(n => { if(Array.isArray(n)) maxLen = Math.max(maxLen,n.length); return typeof n === 'number'})
        if (onlyNumbers) return evaluatedArgs.reduce((prev, curr) => operation(prev as number, curr as number))
        const numbers = evaluatedArgs.map(a => {
            if(typeof a === 'number') return Array(maxLen).fill(a)
            return (a as DataType[]).filter(a => typeof a === 'number')
        }
        ) as number[][]

        if (numbers.some(n => n.length !== numbers[0].length)) throw new Error(`Attempting to ${name} arrays of different length`)
        const zippedNumbers = numbers[0].map((_, idx) => numbers.map(num => num[idx]))
        return zippedNumbers.map(n => n.reduce((prev, curr) => operation(prev, curr)))
    }
    const mathFunc = (func: Token, data: DataType, operation: (a: number, b: number) => number, name: string) => {
        if (func.children.length > 1) {
            return mathFuncAgainstArgs(func, data, operation, name)
        } else {
            return mathFuncAgainstData(data, operation, name)
        }
    }
    const stringEval = (str: Token) => trimCitation(str.raw)
    const floatEval = (float: Token) => Number.parseFloat(float.raw)
    const intEval = (int: Token) => Number.parseInt(int.raw)
    const booleanEval = (bool: Token) => bool.raw === 'true' ? true : false
    const functionEval = (func: Token, data: DataType) => {
        if (func.children.length > 2) throw new Error(`Function should never have more than two children: ${JSON.stringify(func, undefined, 4)}`)
        switch (func.children[0].raw) {
            case 'add':
                return mathFunc(func, data, (a, b) => a + b, 'add')
            case 'join':
                {
                    if (!Array.isArray(data)) throw new Error(`Cant join none array data`)
                    let seperator: DataType = ' ';
                    if (func.children.length > 1 && func.children[0].children.length > 0) seperator = evalulate(func.children[1].children[0], structuredClone(data))
                    if (typeof seperator !== 'string') throw new Error("Cant join with none string seperator")
                    return data.filter(d => typeof d === 'string').join(seperator)
                }
            case 'multiply':
                return mathFunc(func, data, (a, b) => a * b, 'multiply')
            default:
                throw new Error(`Function not implemented yet: ${func.children[0].raw}`)
        }
    }
    const argumentsEval = (args: Token, data: DataType) => {
        if (args.children.length === 0) return []
        return args.children.map(a => evalulate(a, structuredClone(data)))
    }
    const identifierEval = (identifier: Token, data: DataType) => {
        if (typeof data == 'string') {
            throw new Error(`Unable to retrieve identifier data from string`)
        } else if (typeof data == 'number') {
            throw new Error(`Unable to retrieve identifier data from number`)
        } else if (Array.isArray(data)) {
            return data.filter(d => !Array.isArray(d) && typeof d !== 'string' && typeof d !== 'number').map(d => (d as Obj)[identifier.raw])
        } else if (typeof data === 'boolean') {
            throw new Error(`Unable to retrieve identifier data from boolean`)
        } else if (data === null) {
            throw new Error(`Unable to retrieve identifier data from null`)
        } else {
            return data[identifier.raw]
        }
    }
    const wildcardEval = (data: DataType) => {
        if (typeof data == 'string') {
            throw new Error(`Unable to loop string should maybe do something about that`)
        } else if (typeof data == 'number') {
            throw new Error(`Unable to loop number`)
        } else if (Array.isArray(data)) {
            return data.reduce((prev, d) => {
                if (!Array.isArray(d)) return [...(prev as DataType[]), d]
                return [...(prev as DataType[]), ...d]
            }, [])
        } else {
            throw new Error("Unable to loop object right now should probably do something about that")
        }
    }
    const expressionEval = (expression: Token, data: DataType) => {
        for (const expr of expression.children) {
            data = evalulate(expr, data)
        }
        return data
    }

    switch (expression.type) {
        case 'string':
            return stringEval(expression)
        case 'float':
            return floatEval(expression)
        case 'int':
            return intEval(expression)
        case 'boolean':
            return booleanEval(expression)
        case 'function':
            return functionEval(expression, data)
        case 'arguments':
            return argumentsEval(expression, data)
        case 'identifier':
            return identifierEval(expression, data)
        case 'wildcard':
            return wildcardEval(data)
        case 'expression':
            return expressionEval(expression, data)
        default:
            throw new Error(`None implemented eval ${expression.type}`)
    }
}

export {
    interpret
}