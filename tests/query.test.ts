import { assertEquals } from "https://deno.land/std@0.172.0/testing/asserts.ts";
import { interpret } from "../src/intepreter.ts";
import {
  Atom,
  Boolean,
  Choice,
  Expression,
  Float,
  Function,
  FunctionArguments,
  Identifier,
  Int,
  Maybe,
  parse,
  SequenceOf,
  String,
  StringLiteral,
  UnsignedInt,
  WhiteSpace,
  ZeroOrMore,
} from "../src/parser.ts";
import { createTokenizer } from "../src/tokenizer.ts";
import { DataType } from "../src/types.ts";
import { trimCitation } from "../src/util.ts";

const makeRes = (d:DataType) => {return {val:d,err:null}}

try {
  const text1 = await Deno.readTextFile("./tests/test.json");
  const text2 = await Deno.readTextFile("./tests/test2.json");
  const text3 = await Deno.readTextFile("./tests/test3.json");

  Deno.test("combinators whitespace", () => {
    assertEquals(WhiteSpace(createTokenizer(" ")), {
      raw: " ",
      idx: 0,
      type: "whitespace",
      children: [],
    });
    assertEquals(WhiteSpace(createTokenizer("   ")), {
      raw: "   ",
      idx: 0,
      type: "whitespace",
      children: [],
    });
    assertEquals(WhiteSpace(createTokenizer(" 234")), {
      raw: " ",
      idx: 0,
      type: "whitespace",
      children: [],
    });
    assertEquals(WhiteSpace(createTokenizer("234  ")), null);
    assertEquals(
      WhiteSpace(createTokenizer(`
        `)),
      {
        raw: `
        `,
        idx: 0,
        type: "whitespace",
        children: [],
      },
    );
  });

  Deno.test("combinators unsinged int", () => {
    assertEquals(UnsignedInt(createTokenizer("234")), {
      raw: "234",
      idx: 0,
      type: "unsignedInt",
      children: [],
    });
    assertEquals(UnsignedInt(createTokenizer("-2323789347893292374924")), null);
    assertEquals(UnsignedInt(createTokenizer(" 234")), null);
    assertEquals(UnsignedInt(createTokenizer("ssasd")), null);
    assertEquals(UnsignedInt(createTokenizer("234 ,true")), {
      raw: "234",
      idx: 0,
      type: "unsignedInt",
      children: [],
    });
  });

  Deno.test("combinators  int", () => {
    assertEquals(Int(createTokenizer("234")), {
      raw: "234",
      idx: 0,
      type: "int",
      children: [],
    });
    assertEquals(Int(createTokenizer("-2323789347893292374924")), {
      raw: "-2323789347893292374924",
      idx: 0,
      type: "int",
      children: [],
    });
    assertEquals(Int(createTokenizer(" 234")), null);
    assertEquals(Int(createTokenizer("ssasd")), null);
    assertEquals(Int(createTokenizer("234 ,true")), {
      raw: "234",
      idx: 0,
      type: "int",
      children: [],
    });
  });

  Deno.test("combinators float", () => {
    assertEquals(Float(createTokenizer("234.45")), {
      raw: "234.45",
      idx: 0,
      type: "float",
      children: [],
    });
    assertEquals(Float(createTokenizer("2323789347893292374924")), {
      raw: "2323789347893292374924",
      idx: 0,
      type: "float",
      children: [],
    });
    assertEquals(Float(createTokenizer(" 234")), null);
    assertEquals(Float(createTokenizer("ssasd")), null);
    assertEquals(Float(createTokenizer("-234.23323 ")), {
      raw: "-234.23323",
      idx: 0,
      type: "float",
      children: [],
    });
    assertEquals(Float(createTokenizer("234.-23323 ")), {
      raw: "234",
      idx: 0,
      type: "float",
      children: [],
    });
  });

  Deno.test("combinators string literal", () => {
    assertEquals(StringLiteral(createTokenizer("hello"), "hello"), {
      raw: "hello",
      idx: 0,
      type: "stringLiteral",
      children: [],
    });
    assertEquals(StringLiteral(createTokenizer("hello world"), "hello"), {
      raw: "hello",
      idx: 0,
      type: "stringLiteral",
      children: [],
    });
    assertEquals(StringLiteral(createTokenizer(" 234"), "hello"), null);
    assertEquals(StringLiteral(createTokenizer("hello"), "hello world"), null);
  });

  Deno.test("combinators string", () => {
    assertEquals(String(createTokenizer(`'hello'`)), {
      raw: `'hello'`,
      idx: 0,
      type: "string",
      children: [],
    });
    assertEquals(String(createTokenizer(`'hell\\'o wo'rld`)), {
      raw: `'hell\\'o wo'`,
      idx: 0,
      type: "string",
      children: [],
    });
    assertEquals(String(createTokenizer(" 234")), null);
    assertEquals(String(createTokenizer(`'hello`)), null);
    assertEquals(String(createTokenizer(`h'ello'`)), null);
  });

  Deno.test("combinators atom", () => {
    assertEquals(Atom(createTokenizer(`'hello'`)), {
      raw: `'hello'`,
      idx: 0,
      type: "string",
      children: [],
    });
    assertEquals(Atom(createTokenizer("123")), {
      raw: "123",
      idx: 0,
      type: "float",
      children: [],
    });
    assertEquals(Atom(createTokenizer("true")), {
      raw: "true",
      idx: 0,
      type: "boolean",
      children: [],
    });
  });

  Deno.test("combinators boolean", () => {
    assertEquals(Boolean(createTokenizer("true")), {
      raw: "true",
      idx: 0,
      type: "boolean",
      children: [],
    });
    assertEquals(Boolean(createTokenizer("false")), {
      raw: "false",
      idx: 0,
      type: "boolean",
      children: [],
    });
    assertEquals(Boolean(createTokenizer("yolo")), null);
  });

  Deno.test("combinators identifier", () => {
    assertEquals(Identifier(createTokenizer("true")), {
      raw: "true",
      idx: 0,
      type: "identifier",
      children: [],
    });
    assertEquals(Identifier(createTokenizer("_false")), {
      raw: "_false",
      idx: 0,
      type: "identifier",
      children: [],
    });
    assertEquals(Identifier(createTokenizer("12312yolo")), null);
  });

  Deno.test("combinators zeroOrMore", () => {
    assertEquals(ZeroOrMore(createTokenizer("true"), Boolean), [{
      raw: "true",
      idx: 0,
      type: "boolean",
      children: [],
    }]);
    assertEquals(ZeroOrMore(createTokenizer("truefalse"), Boolean), [
      { raw: "true", idx: 0, type: "boolean", children: [] },
      { raw: "false", idx: 4, type: "boolean", children: [] },
    ]);
    assertEquals(ZeroOrMore(createTokenizer("12312yolo"), Boolean), []);
    assertEquals(
      ZeroOrMore(createTokenizer("truefalsetrue"), (t) =>
        SequenceOf(t, [
          Boolean,
          Boolean,
        ])),
      [
        { type: "boolean", raw: "true", idx: 0, children: [] },
        { type: "boolean", raw: "false", idx: 4, children: [] },
      ],
    );
  });

  Deno.test("combinators maybe", () => {
    assertEquals(Maybe(createTokenizer("true"), Boolean), {
      raw: "true",
      idx: 0,
      type: "boolean",
      children: [],
    });
    assertEquals(Maybe(createTokenizer("_false"), Boolean), []);
    assertEquals(
      Maybe(createTokenizer("arg1"), (t) =>
        SequenceOf(t, [
          Identifier,
          (t) =>
            ZeroOrMore(t, (t) =>
              SequenceOf(t, [
                (t) => StringLiteral(t, ","),
                Identifier,
              ])),
        ])),
      [
        { type: "identifier", raw: "arg1", idx: 0, children: [] },
      ],
    );
    assertEquals(
      Maybe(createTokenizer("arg1,arg2,arg3"), (t) =>
        SequenceOf(t, [
          Identifier,
          (t) =>
            ZeroOrMore(t, (t) =>
              SequenceOf(t, [
                (t) => StringLiteral(t, ","),
                Identifier,
              ])),
        ])),
      [
        { type: "identifier", raw: "arg1", idx: 0, children: [] },
        { type: "stringLiteral", raw: ",", idx: 4, children: [] },
        { type: "identifier", raw: "arg2", idx: 5, children: [] },
        { type: "stringLiteral", raw: ",", idx: 9, children: [] },
        { type: "identifier", raw: "arg3", idx: 10, children: [] },
      ],
    );
  });

  Deno.test("combinators choice", () => {
    assertEquals(
      Choice(createTokenizer("true"), [
        Boolean,
        Int,
      ]),
      { raw: "true", idx: 0, type: "boolean", children: [] },
    );
    assertEquals(
      Choice(createTokenizer("34"), [
        Boolean,
        Int,
      ]),
      { raw: "34", idx: 0, type: "int", children: [] },
    );
    assertEquals(
      Choice(createTokenizer("truefalse"), [
        (t) => SequenceOf(t, [Boolean, Boolean]),
        Int,
      ]),
      [{ type: "boolean", raw: "true", idx: 0, children: [] }, {
        type: "boolean",
        raw: "false",
        idx: 4,
        children: [],
      }],
    );
    assertEquals(
      Choice(createTokenizer("truefalse"), [
        (t) => SequenceOf(t, [Int, Boolean]),
        Int,
      ]),
      null,
    );
  });

  Deno.test("combinators sequenceOf", () => {
    assertEquals(
      SequenceOf(createTokenizer("truefalsetrue"), [
        Boolean,
        Boolean,
        Boolean,
      ]),
      [
        { raw: "true", idx: 0, type: "boolean", children: [] },
        { raw: "false", idx: 4, type: "boolean", children: [] },
        { raw: "true", idx: 9, type: "boolean", children: [] },
      ],
    );
    assertEquals(
      SequenceOf(createTokenizer(`'string'`), [
        (t) => Maybe(t, Boolean),
        (t) => Choice(t, [Int, String]),
      ]),
      [{ raw: `'string'`, idx: 0, type: "string", children: [] }],
    );
    assertEquals(
      SequenceOf(createTokenizer("truefalse123"), [
        Boolean,
        Boolean,
        Boolean,
      ]),
      null,
    );
    assertEquals(
      SequenceOf(createTokenizer("truefalse"), [
        Boolean,
        Boolean,
        (t) => Maybe(t, Boolean),
      ]),
      [
        { type: "boolean", idx: 0, raw: "true", children: [] },
        { type: "boolean", idx: 4, raw: "false", children: [] },
      ],
    );
    assertEquals(
      SequenceOf(createTokenizer("truefalse"), [
        Boolean,
        Boolean,
        (t) => ZeroOrMore(t, Int),
      ]),
      [
        { type: "boolean", idx: 0, raw: "true", children: [] },
        { type: "boolean", idx: 4, raw: "false", children: [] },
      ],
    );
    assertEquals(
      SequenceOf(createTokenizer("truefalse"), [
        (t) => ZeroOrMore(t, Int),
        Boolean,
        Boolean,
      ]),
      [
        { type: "boolean", idx: 0, raw: "true", children: [] },
        { type: "boolean", idx: 4, raw: "false", children: [] },
      ],
    );
  });

  Deno.test("combinators function arguments", () => {
    assertEquals(FunctionArguments(createTokenizer("()")), {
      type: "arguments",
      raw: "()",
      idx: 0,
      children: [],
    });
    assertEquals(FunctionArguments(createTokenizer("(arg1)")), {
      type: "arguments",
      raw: "(arg1)",
      idx: 0,
      children: [{
        raw: "arg1",
        idx: 1,
        type: "expression",
        children: [
          { type: "identifier", raw: "arg1", idx: 1, children: [] },
        ],
      }],
    });
    assertEquals(FunctionArguments(createTokenizer(`(arg1,'  ')`)), {
      type: "arguments",
      raw: `(arg1,'  ')`,
      idx: 0,
      children: [
        {
          raw: "arg1",
          idx: 1,
          type: "expression",
          children: [
            { type: "identifier", raw: "arg1", idx: 1, children: [] },
          ],
        },
        { type: "string", raw: `'  '`, idx: 6, children: [] },
      ],
    });
    assertEquals(FunctionArguments(createTokenizer(" 234")), null);
    assertEquals(FunctionArguments(createTokenizer(`'hello`)), null);
    assertEquals(FunctionArguments(createTokenizer(`h'ello'`)), null);
  });

  Deno.test("combinators expression", () => {
    assertEquals(Expression(createTokenizer("location")), {
      raw: "location",
      idx: 0,
      type: "expression",
      children: [{ raw: "location", idx: 0, type: "identifier", children: [] }],
    });
    assertEquals(Expression(createTokenizer("location.lat")), {
      raw: "location.lat",
      idx: 0,
      type: "expression",
      children: [
        { raw: "location", idx: 0, type: "identifier", children: [] },
        { raw: "lat", idx: 9, type: "identifier", children: [] },
      ],
    });
    assertEquals(Expression(createTokenizer("  dsadsa")), {
      raw: "  dsadsa",
      idx: 0,
      type: "expression",
      children: [{ raw: "dsadsa", idx: 2, type: "identifier", children: [] }],
    });
    assertEquals(Expression(createTokenizer('"d,trueassds')), null);
    assertEquals(Expression(createTokenizer("12121")), null);
    assertEquals(Expression(createTokenizer("*")), {
      type: "expression",
      raw: "*",
      idx: 0,
      children: [
        { type: "wildcard", raw: "*", idx: 0, children: [] },
      ],
    });
    assertEquals(Expression(createTokenizer("t.*")), {
      type: "expression",
      raw: "t.*",
      idx: 0,
      children: [
        { type: "identifier", raw: "t", idx: 0, children: [] },
        { type: "wildcard", raw: "*", idx: 2, children: [] },
      ],
    });
    assertEquals(Expression(createTokenizer("*.t")), {
      type: "expression",
      raw: "*.t",
      idx: 0,
      children: [
        { type: "wildcard", raw: "*", idx: 0, children: [] },
        { type: "identifier", raw: "t", idx: 2, children: [] },
      ],
    });
    assertEquals(Expression(createTokenizer("t.*.t")), {
      type: "expression",
      raw: "t.*.t",
      idx: 0,
      children: [
        { type: "identifier", raw: "t", idx: 0, children: [] },
        { type: "wildcard", raw: "*", idx: 2, children: [] },
        { type: "identifier", raw: "t", idx: 4, children: [] },
      ],
    });
  });

  Deno.test("combinators function", () => {
    assertEquals(Function(createTokenizer(">s,trueum")), {
      raw: ">s",
      idx: 0,
      type: "function",
      children: [
        { type: "identifier", raw: "s", idx: 1, children: [] },
      ],
    });
    assertEquals(Function(createTokenizer(">s()")), {
      raw: ">s()",
      idx: 0,
      type: "function",
      children: [
        { type: "identifier", raw: "s", idx: 1, children: [] },
      ],
    });
    assertEquals(Function(createTokenizer(">s(arg1)")), {
      type: "function",
      raw: ">s(arg1)",
      idx: 0,
      children: [
        { type: "identifier", raw: "s", idx: 1, children: [] },
        {
          type: "arguments",
          raw: "(arg1)",
          idx: 2,
          children: [
            {
              type: "expression",
              raw: "arg1",
              idx: 3,
              children: [
                { type: "identifier", raw: "arg1", idx: 3, children: [] },
              ],
            },
          ],
        },
      ],
    });
    assertEquals(Function(createTokenizer('>1231s,trueum(arg1,"yolo")')), null);
    assertEquals(Function(createTokenizer("234sdfsdfss")), null);
    assertEquals(Function(createTokenizer('"h,trueello')), null);
    assertEquals(Function(createTokenizer('-h,true"ello"')), null);
  });

  Deno.test("test parsing empty", () => {
    assertEquals(parse(""), null);
  });
  Deno.test("test parsing simple property", () => {
    assertEquals(parse("propertyName"), {
      type: "expression",
      raw: "propertyName",
      idx: 0,
      children: [
        { type: "identifier", raw: "propertyName", idx: 0, children: [] },
      ],
    });
  });
  Deno.test("test parsing only atoms", () => {
    assertEquals(parse("profile.location.lat"), {
      type: "expression",
      raw: "profile.location.lat",
      idx: 0,
      children: [
        { type: "identifier", raw: "profile", idx: 0, children: [] },
        { type: "identifier", raw: "location", idx: 8, children: [] },
        { type: "identifier", raw: "lat", idx: 17, children: [] },
      ],
    });
  });
  Deno.test("test parsing wildcard", () => {
    assertEquals(parse("profile.*.location.lat.*"), {
      type: "expression",
      raw: "profile.*.location.lat.*",
      idx: 0,
      children: [
        { type: "identifier", raw: "profile", idx: 0, children: [] },
        { type: "wildcard", raw: "*", idx: 8, children: [] },
        { type: "identifier", raw: "location", idx: 10, children: [] },
        { type: "identifier", raw: "lat", idx: 19, children: [] },
        { type: "wildcard", raw: "*", idx: 23, children: [] },
      ],
    });
  });
  Deno.test("test parsing simple function", () => {
    assertEquals(parse("profile.nestedList.>sum"), {
      type: "expression",
      raw: "profile.nestedList.>sum",
      idx: 0,
      children: [
        { type: "identifier", raw: "profile", idx: 0, children: [] },
        { type: "identifier", raw: "nestedList", idx: 8, children: [] },
        {
          type: "function",
          raw: ">sum",
          idx: 19,
          children: [
            { type: "identifier", raw: "sum", idx: 20, children: [] },
          ],
        },
      ],
    });
  });
  Deno.test("test parsing function with argumment", () => {
    assertEquals(parse(`roles.>join(' ')`), {
      type: "expression",
      raw: `roles.>join(' ')`,
      idx: 0,
      children: [
        { type: "identifier", raw: "roles", idx: 0, children: [] },
        {
          type: "function",
          raw: `>join(' ')`,
          idx: 6,
          children: [
            { type: "identifier", raw: "join", idx: 7, children: [] },
            {
              type: "arguments",
              raw: `(' ')`,
              idx: 11,
              children: [
                { type: "string", raw: `' '`, idx: 12, children: [] },
              ],
            },
          ],
        },
      ],
    });
  });
  Deno.test("test parsing function with multiple arguments", () => {
    assertEquals(
      parse("Account.Order.Product.>multiply(Price,Quantity).>sum"),
      {
        type: "expression",
        raw: "Account.Order.Product.>multiply(Price,Quantity).>sum",
        idx: 0,
        children: [
          { type: "identifier", raw: "Account", idx: 0, children: [] },
          { type: "identifier", raw: "Order", idx: 8, children: [] },
          { type: "identifier", raw: "Product", idx: 14, children: [] },
          {
            type: "function",
            raw: ">multiply(Price,Quantity)",
            idx: 22,
            children: [
              { type: "identifier", raw: "multiply", idx: 23, children: [] },
              {
                type: "arguments",
                raw: "(Price,Quantity)",
                idx: 31,
                children: [
                  {
                    type: "expression",
                    raw: "Price",
                    idx: 32,
                    children: [
                      {
                        type: "identifier",
                        raw: "Price",
                        idx: 32,
                        children: [],
                      },
                    ],
                  },
                  {
                    type: "expression",
                    raw: "Quantity",
                    idx: 38,
                    children: [
                      {
                        type: "identifier",
                        raw: "Quantity",
                        idx: 38,
                        children: [],
                      },
                    ],
                  },
                ],
              },
            ],
          },
          {
            type: "function",
            raw: ">sum",
            idx: 48,
            children: [
              { type: "identifier", raw: "sum", idx: 49, children: [] },
            ],
          },
        ],
      },
    );
  });

  Deno.test("test parsing function with multiple arguments where one arg is string with comma", () => {
    assertEquals(parse(`Account.Order.Product.>concat(Price,',').>join`), {
      type: "expression",
      raw: `Account.Order.Product.>concat(Price,',').>join`,
      idx: 0,
      children: [
        { type: "identifier", raw: "Account", idx: 0, children: [] },
        { type: "identifier", raw: "Order", idx: 8, children: [] },
        { type: "identifier", raw: "Product", idx: 14, children: [] },
        {
          type: "function",
          raw: `>concat(Price,',')`,
          idx: 22,
          children: [
            { type: "identifier", raw: "concat", idx: 23, children: [] },
            {
              type: "arguments",
              raw: `(Price,',')`,
              idx: 29,
              children: [
                {
                  type: "expression",
                  raw: "Price",
                  idx: 30,
                  children: [
                    { type: "identifier", raw: "Price", idx: 30, children: [] },
                  ],
                },
                { type: "string", raw: `','`, idx: 36, children: [] },
              ],
            },
          ],
        },
        {
          type: "function",
          raw: ">join",
          idx: 41,
          children: [
            { type: "identifier", raw: "join", idx: 42, children: [] },
          ],
        },
      ],
    });
  });

  Deno.test("intepret minimum", () => {
    assertEquals(interpret("name", text3), makeRes("Copeland Rogers"));
  });

  Deno.test("intepret minimum chaining", () => {
    assertEquals(interpret("location.lat", text3), makeRes(68.279554));
  });

  Deno.test("intepret profile.location.lat", () => {
    assertEquals(interpret("profile.location.lat", text1), makeRes([
      68.279554,
      80.520788,
      36.387318,
      -36.095195,
      80.257117,
      42.492128,
      -5.886025,
      -24.504043,
      20.122613,
    ]));
  });

  Deno.test("intepret profile.nestedList", () => {
    assertEquals(interpret("profile.nestedList", text1), makeRes([
      [26, 52, 43, 22, 78, 84, 72, 11, 62],
      [37, 79, 3, 26, 71, 20],
      [53, 30, 66, 67, 16],
      [99, 85, 55, 99, 64, 60, 12, 42, 40, 21],
      [99, 33, 75, 88, 92, 25, 12, 63, 91],
      [49, 78, 13, 46, 7, 0, 79, 66, 18, 95],
      [94, 47, 19, 19, 79],
      [98, 87, 82, 43, 68, 41, 33, 99, 34, 45],
      [82, 43, 33, 27, 46, 60, 35, 76],
    ]));
  });

  Deno.test("intepret profile.nestedList.*.>add", () => {
    assertEquals(interpret("profile.nestedList.*.>add", text1), makeRes(3814));
  });

  Deno.test("BetterTrim", () => {
    assertEquals(trimCitation("'"), "");
    assertEquals(trimCitation("'"), "");
    assertEquals(trimCitation("'123'"), "123");
    assertEquals(trimCitation("'test'"), "test");
    assertEquals(trimCitation("''"), "");
  });

  Deno.test(`intepret roles.*.>join(' ')`, () => {
    assertEquals(
      interpret(`roles.*.>join(' ')`, text1),
      makeRes("guest guest owner owner admin guest member owner guest admin guest owner member owner admin"),
    );
  });

  Deno.test(`intepret roles.*.>join(', ')`, () => {
    assertEquals(
      interpret(`roles.*.>join(', ')`, text1),
      makeRes("guest, guest, owner, owner, admin, guest, member, owner, guest, admin, guest, owner, member, owner, admin"),
    );
  });

  Deno.test("intepret Account", () => {
    assertEquals(interpret("Account", text2), makeRes({
      "Account Name": "Firefly",
      "Order": [{
        "OrderID": "order103",
        "Product": [{
          "Product Name": "Bowler Hat",
          "ProductID": 858383,
          "SKU": "0406654608",
          "Description": {
            "Colour": "Purple",
            "Width": 300,
            "Height": 200,
            "Depth": 210,
            "Weight": 0.75,
          },
          "Price": 34.45,
          "Quantity": 2,
        }, {
          "Product Name": "Trilby hat",
          "ProductID": 858236,
          "SKU": "0406634348",
          "Description": {
            "Colour": "Orange",
            "Width": 300,
            "Height": 200,
            "Depth": 210,
            "Weight": 0.6,
          },
          "Price": 21.67,
          "Quantity": 1,
        }],
      }, {
        "OrderID": "order104",
        "Product": [{
          "Product Name": "Bowler Hat",
          "ProductID": 858383,
          "SKU": "040657863",
          "Description": {
            "Colour": "Purple",
            "Width": 300,
            "Height": 200,
            "Depth": 210,
            "Weight": 0.75,
          },
          "Price": 34.45,
          "Quantity": 4,
        }, {
          "ProductID": 345664,
          "SKU": "0406654603",
          "Product Name": "Cloak",
          "Description": {
            "Colour": "Black",
            "Width": 30,
            "Height": 20,
            "Depth": 210,
            "Weight": 2,
          },
          "Price": 107.99,
          "Quantity": 1,
        }],
      }],
    }));
  });

  Deno.test("intepret Account.Order", () => {
    assertEquals(interpret("Account.Order", text2), makeRes([{
      "OrderID": "order103",
      "Product": [{
        "Product Name": "Bowler Hat",
        "ProductID": 858383,
        "SKU": "0406654608",
        "Description": {
          "Colour": "Purple",
          "Width": 300,
          "Height": 200,
          "Depth": 210,
          "Weight": 0.75,
        },
        "Price": 34.45,
        "Quantity": 2,
      }, {
        "Product Name": "Trilby hat",
        "ProductID": 858236,
        "SKU": "0406634348",
        "Description": {
          "Colour": "Orange",
          "Width": 300,
          "Height": 200,
          "Depth": 210,
          "Weight": 0.6,
        },
        "Price": 21.67,
        "Quantity": 1,
      }],
    }, {
      "OrderID": "order104",
      "Product": [{
        "Product Name": "Bowler Hat",
        "ProductID": 858383,
        "SKU": "040657863",
        "Description": {
          "Colour": "Purple",
          "Width": 300,
          "Height": 200,
          "Depth": 210,
          "Weight": 0.75,
        },
        "Price": 34.45,
        "Quantity": 4,
      }, {
        "ProductID": 345664,
        "SKU": "0406654603",
        "Product Name": "Cloak",
        "Description": {
          "Colour": "Black",
          "Width": 30,
          "Height": 20,
          "Depth": 210,
          "Weight": 2,
        },
        "Price": 107.99,
        "Quantity": 1,
      }],
    }]));
  });

  Deno.test("intepret Account.Order.Product", () => {
    assertEquals(interpret("Account.Order.Product", text2), makeRes([[{
      "Product Name": "Bowler Hat",
      "ProductID": 858383,
      "SKU": "0406654608",
      "Description": {
        "Colour": "Purple",
        "Width": 300,
        "Height": 200,
        "Depth": 210,
        "Weight": 0.75,
      },
      "Price": 34.45,
      "Quantity": 2,
    }, {
      "Product Name": "Trilby hat",
      "ProductID": 858236,
      "SKU": "0406634348",
      "Description": {
        "Colour": "Orange",
        "Width": 300,
        "Height": 200,
        "Depth": 210,
        "Weight": 0.6,
      },
      "Price": 21.67,
      "Quantity": 1,
    }], [{
      "Product Name": "Bowler Hat",
      "ProductID": 858383,
      "SKU": "040657863",
      "Description": {
        "Colour": "Purple",
        "Width": 300,
        "Height": 200,
        "Depth": 210,
        "Weight": 0.75,
      },
      "Price": 34.45,
      "Quantity": 4,
    }, {
      "ProductID": 345664,
      "SKU": "0406654603",
      "Product Name": "Cloak",
      "Description": {
        "Colour": "Black",
        "Width": 30,
        "Height": 20,
        "Depth": 210,
        "Weight": 2,
      },
      "Price": 107.99,
      "Quantity": 1,
    }]]));
  });

  Deno.test("intepret Account.Order.Product.*", () => {
    assertEquals(interpret("Account.Order.*.Product.*", text2), makeRes([{
      "Product Name": "Bowler Hat",
      "ProductID": 858383,
      "SKU": "0406654608",
      "Description": {
        "Colour": "Purple",
        "Width": 300,
        "Height": 200,
        "Depth": 210,
        "Weight": 0.75,
      },
      "Price": 34.45,
      "Quantity": 2,
    }, {
      "Product Name": "Trilby hat",
      "ProductID": 858236,
      "SKU": "0406634348",
      "Description": {
        "Colour": "Orange",
        "Width": 300,
        "Height": 200,
        "Depth": 210,
        "Weight": 0.6,
      },
      "Price": 21.67,
      "Quantity": 1,
    }, {
      "Product Name": "Bowler Hat",
      "ProductID": 858383,
      "SKU": "040657863",
      "Description": {
        "Colour": "Purple",
        "Width": 300,
        "Height": 200,
        "Depth": 210,
        "Weight": 0.75,
      },
      "Price": 34.45,
      "Quantity": 4,
    }, {
      "ProductID": 345664,
      "SKU": "0406654603",
      "Product Name": "Cloak",
      "Description": {
        "Colour": "Black",
        "Width": 30,
        "Height": 20,
        "Depth": 210,
        "Weight": 2,
      },
      "Price": 107.99,
      "Quantity": 1,
    }]));
  });

  Deno.test("intepret Account.Order.Product.*.>multiply(Price,Quantity)", () => {
    assertEquals(
      interpret("Account.Order.*.Product.*.>multiply(Price,Quantity)", text2),
      makeRes([68.9, 21.67, 137.8, 107.99]),
    );
  });

  Deno.test("intepret Account.Order.Product.*.>multiply(Price,Quantity).>add", () => {
    assertEquals(
      interpret(
        "Account.Order.*.Product.*.>multiply(Price,Quantity).>add",
        text2,
      ),
      makeRes(336.36),
    );
  });

  Deno.test("intepret Account.Order.Product.*.>add(Price,Quantity).>add", () => {
    assertEquals(
      interpret("Account.Order.*.Product.*.>add(Price,Quantity).>add", text2),
      makeRes(206.56),
    );
  });

  Deno.test("intepret Account.Order.Product.*.>add(Price,50)", () => {
    assertEquals(interpret("Account.Order.*.Product.*.>add(Price,50)", text2), makeRes([
      84.45,
      71.67,
      84.45,
      157.99,
    ]));
  });

  Deno.test("intepret >add(10,20)", () => {
    assertEquals(interpret(">add(10,20)", text2), makeRes(30));
  });

  Deno.test("test removing of whitespace", () => {
    assertEquals(
      parse(`  Account   .       Order  .*  .
        Product . * . >multiply     (   Price
            , Quantity   )
        .
        >add  `),
      {
        type: "expression",
        raw: `  Account   .       Order  .*  .
        Product . * . >multiply     (   Price
            , Quantity   )
        .
        >add  `,
        idx: 0,
        children: [
          { type: "identifier", raw: "Account", idx: 2, children: [] },
          { type: "identifier", raw: "Order", idx: 20, children: [] },
          { type: "wildcard", raw: "*", idx: 28, children: [] },
          { type: "identifier", raw: "Product", idx: 41, children: [] },
          { type: "wildcard", raw: "*", idx: 51, children: [] },
          {
            type: "function",
            raw: `>multiply     (   Price
            , Quantity   )`,
            idx: 55,
            children: [
              { type: "identifier", raw: "multiply", idx: 56, children: [] },
              {
                type: "arguments",
                raw: `(   Price
            , Quantity   )`,
                idx: 69,
                children: [
                  {
                    type: "expression",
                    raw: `Price
            `,
                    idx: 73,
                    children: [{
                      type: "identifier",
                      raw: "Price",
                      idx: 73,
                      children: [],
                    }],
                  },
                  {
                    type: "expression",
                    raw: "Quantity   ",
                    idx: 93,
                    children: [{
                      type: "identifier",
                      raw: "Quantity",
                      idx: 93,
                      children: [],
                    }],
                  },
                ],
              },
            ],
          },
          {
            type: "function",
            raw: ">add  ",
            idx: 124,
            children: [
              { type: "identifier", raw: "add", idx: 125, children: [] },
            ],
          },
        ],
      },
    );
  });
} catch (e) {
  console.error(e);
}
