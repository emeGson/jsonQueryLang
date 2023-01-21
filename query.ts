async function run() {
    if (Deno.args.length !== 2) {
        console.log("Usage file query")
        return
    }
    const data = await Deno.readTextFile(Deno.args[0])
    const input = Deno.args[1]
    console.log(interpret(input, data))

}

function interpret(exp: string, data: string): string {
    const parsed = parse(exp)
    if (!parsed) throw new Error("Syntax error")
    const res = evalulate(parsed, JSON.parse(data))
    return JSON.stringify(res)
}

function parse(exp: string): Token | null {
    if (exp.length == 0) return null
    return Expression(createTokenizer(exp))
}

function BetterTrim(str: string, trim = '"'): string {
    if (str.length === 0) return str
    if (str.length === 1) return str[0] === trim ? '' : str
    return str.slice(str[0] === trim ? 1 : 0, str[str.length - 1] === trim ? str.length - 1 : undefined)
}

interface Obj { [keyof: string]: DataType }
type DataType = null | boolean | string | number | Obj | DataType[]
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
    const stringEval = (str: Token) => BetterTrim(str.raw)
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
                    console.log("🚀 ~ file: query.ts:67 ~ functionEval ~ seperator", `'${seperator}'`)
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

type ParserReturn = Token | Token[] | null
type Parser<P> = (tokenizer: Tokenizer, ...args: P[]) => ParserReturn

type Token = {
    type: string,
    raw: string,
    idx: number,
    children: Token[]
}
type Tokenizer = {
    idx: number;
    text: string;
    marks: number,
    logging: boolean,
    next: () => string | null;
    mark: (funcName?: string, ...args: unknown[]) => number;
    reset: (idx: number) => void;
    log: (token: Token) => void
}

function createTokenizer(text: string, logging = false): Tokenizer {
    if (logging) console.log(`\nCreated tokenizer\n---DATA---\n${text}\n`)
    const logPrefix = (i: number) => Array(i).join('| ')
    return {
        idx: 0,
        text: text,
        marks: 0,
        logging: logging,
        next: function (this: Tokenizer) {
            if (this.text.length == this.idx) return null
            this.idx++
            const c = this.text[this.idx - 1]
            if (this.logging) console.log(`${logPrefix(this.marks - 1)}| ${c}`)
            return c
        },
        mark: function (this: Tokenizer, funcName?: string, ...args: unknown[]) {
            if (this.logging) console.log(`${logPrefix(this.marks)}> ${this.idx} ${funcName}${args ? ' ' + args.join(' ') : ''}`);
            this.marks++;
            return this.idx
        },
        reset: function (this: Tokenizer, idx: number) { this.idx = idx, this.marks-- },
        log: function (this: Tokenizer, token: Token) {
            if (this.logging) {
                console.log(`${logPrefix(this.marks - 1)}| Matched ${token.type}`)
                console.log(`${logPrefix(this.marks - 1)}| raw: ${token.raw}`)
            }
        }
    }
}

function createToken(tokenizer: Tokenizer, raw: string, type: string, children?: Token[]): Token {
    const newToken: Token = {
        idx: tokenizer.idx - raw.length,
        raw: raw,
        type: type,
        children: children ? children : []
    }
    tokenizer.log(newToken)
    return newToken
}

const AnyOfString = (tokenizer: Tokenizer, inString: string): Token | null => {
    const mark = tokenizer.mark('AnyOfString', inString)
    const c = tokenizer.next()
    if (c === null) return null
    if (inString.includes(c)) {
        return createToken(tokenizer, c, 'char')
    }
    tokenizer.reset(mark)
    return null
}

const OneOrMore = (tokenizer: Tokenizer, parser: Parser<unknown>): Token[] | null => {
    const mark = tokenizer.mark('OneOrMore')
    const t = parser(tokenizer)
    if (!t || Array.isArray(t)) {
        tokenizer.reset(mark)
        return null
    }
    const res = ZeroOrMore(tokenizer, parser)
    return !res ? [t] : [t, ...res]
}

const ZeroOrMore = (tokenizer: Tokenizer, parser: Parser<unknown>): Token[] => {
    const res: Token[] = []
    let t = parser(tokenizer)
    while (t !== null) {
        if (Array.isArray(t)) {
            res.push(...t)
        } else {
            res.push(t)
        }

        t = parser(tokenizer)
    }
    return res
}

const SequenceOf = (tokenizer: Tokenizer, parsers: Parser<unknown>[]): Token[] | null => {
    const mark = tokenizer.mark('SequenceOf')
    const res: Token[] = []

    for (const t of parsers) {
        const r = t(tokenizer)
        if (r === null /* || (Array.isArray(r) && r.length === 0) */) {
            tokenizer.reset(mark)
            return null
        }
        if (Array.isArray(r)) {
            res.push(...r)
            continue
        }
        res.push(r)
    }
    return res
}

const Maybe = (tokenizer: Tokenizer, parser: Parser<unknown>): Token[] | Token => {
    const res = parser(tokenizer)
    if (!res) return []
    return res

}

const Int = (tokenizer: Tokenizer): Token | null => {
    const mark = tokenizer.mark('Int')
    const res = OneOrMore(tokenizer, (t: Tokenizer) => { return AnyOfString(t, "0123456789") })
    if (res === null) {
        tokenizer.reset(mark)
        return null
    }
    const raw = res.map(t => t.raw).join('')
    return createToken(tokenizer, raw, 'int')
}

const Float = (tokenizer: Tokenizer): Token | null => {
    const mark = tokenizer.mark('Float')
    const real = Int(tokenizer)
    if (!real) {
        tokenizer.reset(mark)
        return null
    }
    const decimal = SequenceOf(tokenizer, [
        (t: Tokenizer) => StringLiteral(t, '.'),
        Int
    ])

    return createToken(tokenizer, real.raw + (Array.isArray(decimal) ? decimal : []).map(t => t.raw).join(''), 'float')
}

const StringLiteral = (tokenizer: Tokenizer, chars: string): ParserReturn => {
    const mark = tokenizer.mark('StringLiteral', chars)
    for (const t of chars) {
        if (t !== tokenizer.next()) {
            tokenizer.reset(mark)
            return null
        }
    }
    return createToken(tokenizer, chars, 'stringLiteral')
}

const Any = (tokenizer: Tokenizer): Token | null => {
    const mark = tokenizer.mark('Any');
    const c = tokenizer.next()
    if (!c) {
        tokenizer.reset(mark)
        return null
    }

    return createToken(tokenizer, c, 'char')
}

const Choice = (tokenizer: Tokenizer, parsers: Parser<unknown>[]): Token[] | Token | null => {
    const mark = tokenizer.mark('Choice')
    for (const p of parsers) {
        const res = p(tokenizer)
        if (res !== null && !Array.isArray(res)) {
            return res
        }
        if (Array.isArray(res) && res.length !== 0) {
            return res
        }
    }
    tokenizer.reset(mark)
    return null
}

const String = (tokenizer: Tokenizer): Token | null => {
    const mark = tokenizer.mark('String')
    if (!StringLiteral(tokenizer, '"')) {
        tokenizer.reset(mark)
        return null
    }

    const res: Token[] = []

    const stringParser = (tok: Tokenizer) => Choice(tok, [
        (t: Tokenizer) => StringLiteral(t, '\\"'),
        Any
    ])

    let c = stringParser(tokenizer)
    while (c !== null && !Array.isArray(c) && c.raw !== '"') {
        res.push(c)
        c = stringParser(tokenizer)
    }

    if (!c) {
        tokenizer.reset(mark)
        return null
    }

    return createToken(tokenizer, '"' + res.map(t => t.raw).join('') + '"', 'string')
}

const Identifier = (tokenizer: Tokenizer): Token | null => {
    const mark = tokenizer.mark('Identifier')
    const letters = 'abcdefghijklmnopqrstuvwxyzåäö'
    const validStarters = letters + letters.toUpperCase() + '_'
    const validBody = validStarters + '0123456789'
    const starter = AnyOfString(tokenizer, validStarters)
    if (!starter) {
        tokenizer.reset(mark)
        return null
    }

    const body = ZeroOrMore(tokenizer, (t) => AnyOfString(t, validBody))

    return !body ? createToken(tokenizer, starter.raw, 'identifier') : createToken(tokenizer, starter.raw + body.map(t => t.raw).join(''), 'identifier')
}

const Wildcard = (tokenizer: Tokenizer): Token | null => {
    const mark = tokenizer.mark('Wildcard')
    if (StringLiteral(tokenizer, '*') === null) {
        tokenizer.reset(mark)
        return null
    }
    return createToken(tokenizer, '*', 'wildcard')
}

const Boolean = (tokenizer: Tokenizer): Token | null => {
    const mark = tokenizer.mark('Boolean')
    const res = Choice(tokenizer, [
        (t) => StringLiteral(t, 'true'),
        (t) => StringLiteral(t, 'false')
    ])
    if (res == null || Array.isArray(res)) {
        tokenizer.reset(mark)
        return null
    }

    return createToken(tokenizer, res.raw, 'boolean')
}

const Atom = (tokenizer: Tokenizer): Token | null => {
    const mark = tokenizer.mark('Atom')
    const res = Choice(tokenizer, [
        Boolean,
        String,
        Float
    ])

    if (!res || Array.isArray(res)) {
        tokenizer.reset(mark)
        return null
    }

    return res
}

const Argument = (tokenizer: Tokenizer): Token | null => {
    const mark = tokenizer.mark('Argument')
    const res = Choice(tokenizer, [
        Atom,
        Expression
    ])
    if (!res || Array.isArray(res)) { tokenizer.reset(mark); return null }
    return res
}

const FunctionArguments = (tokenizer: Tokenizer): Token | null => {
    const mark = tokenizer.mark('FunctionArguments')
    const res = SequenceOf(tokenizer, [
        (t) => StringLiteral(t, '('),
        (t) => Maybe(t,
            (t) => SequenceOf(t,
                [
                    Argument,
                    (t) => ZeroOrMore(t,
                        (t) => SequenceOf(t, [
                            (t) => StringLiteral(t, ','),
                            Argument
                        ]))
                ])),
        (t) => StringLiteral(t, ')')
    ])

    if (!res) {
        tokenizer.reset(mark)
        return null
    }

    return createToken(tokenizer, res.map(r => r.raw).join(''), 'arguments', res.filter(r => r.type === 'string' || r.type === 'float' || r.type === 'boolean' || r.type === 'expression'))
}

const Function = (tokenizer: Tokenizer): Token | null => {
    const mark = tokenizer.mark('Function')
    const func = SequenceOf(tokenizer, [
        (t) => StringLiteral(t, '$'),
        Identifier,
        (t) => Maybe(t,

            FunctionArguments
        )
    ])
    if (!func) {
        tokenizer.reset(mark)
        return null
    }

    // console.log(`----Matched----\n${func.map(r => `${r.type}: ${r.raw}`).join(', ')}\n\n`)

    return createToken(tokenizer, func.map(r => r.raw).join(''), 'function', func.filter(r => r.type === 'identifier' || (r.type === 'arguments' && r.children.length > 0)))
}

const Expression = (tokenizer: Tokenizer): Token | null => {
    const mark = tokenizer.mark('Expression')
    const expression = SequenceOf(tokenizer, [
        (t) => Choice(t, [
            Identifier,
            Wildcard,
            Function
        ]),
        (t) => ZeroOrMore(t,
            (t) => SequenceOf(t,
                [
                    (t) => StringLiteral(t, '.'),
                    (t) => Choice(t,
                        [
                            Identifier,
                            Wildcard,
                            Function
                        ])
                ])
        )
    ])

    if (!expression) {
        tokenizer.reset(mark)
        return null
    }

    return createToken(
        tokenizer,
        expression.map(p => p.raw).join(''),
        'expression', expression.filter(r => r.type === 'identifier' || r.type === 'function' || r.type === 'wildcard'))
}

if (import.meta.main) {
    run()
}

export {
    parse,
    interpret,
    Int,
    createTokenizer,
    StringLiteral,
    Float,
    String,
    Identifier,
    Function,
    Expression,
    FunctionArguments,
    Atom,
    Boolean,
    Maybe,
    SequenceOf,
    Choice,
    ZeroOrMore,
    BetterTrim
}