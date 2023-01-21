interface Obj { [keyof: string]: DataType }
type DataType = null | boolean | string | number | Obj | DataType[]

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

export type {
    Obj,
    DataType,
    ParserReturn,
    Parser,
    Token,
    Tokenizer
}