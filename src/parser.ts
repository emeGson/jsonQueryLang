import { createTokenizer } from "./tokenizer.ts"
import { Parser, Token, Tokenizer } from "./types.ts"

function parse(exp: string): Token | null {
    if (exp.length == 0) return null
    return Expression(createTokenizer(exp))
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

const StringLiteral = (tokenizer: Tokenizer, chars: string): Token | null => {
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
        (t) => StringLiteral(t, '>'),
        Identifier,
        (t) => Maybe(t,

            FunctionArguments
        )
    ])
    if (!func) {
        tokenizer.reset(mark)
        return null
    }

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

export {
    parse,
    Int,
    Float,
    StringLiteral,
    String,
    Atom,
    Boolean,
    Identifier,
    ZeroOrMore,
    Maybe,
    SequenceOf,
    Choice,
    FunctionArguments,
    Expression,
    Function
}