import { Token, Tokenizer } from "./types.ts";

function createTokenizer(text: string, logging = false): Tokenizer {
  if (logging) console.log(`\nCreated tokenizer\n---DATA---\n${text}\n`);
  const logPrefix = (i: number) => Array(i).join("| ");
  return {
    idx: 0,
    text: text,
    marks: 0,
    logging: logging,
    next: function (this: Tokenizer) {
      if (this.text.length == this.idx) return null;
      this.idx++;
      const c = this.text[this.idx - 1];
      if (this.logging) console.log(`${logPrefix(this.marks - 1)}| ${c}`);
      return c;
    },
    mark: function (this: Tokenizer, funcName?: string, ...args: unknown[]) {
      if (this.logging) {
        console.log(
          `${logPrefix(this.marks)}> ${this.idx} ${funcName}${
            args ? " " + args.join(" ") : ""
          }`,
        );
      }
      this.marks++;
      return this.idx;
    },
    reset: function (this: Tokenizer, idx: number) {
      this.idx = idx, this.marks--;
    },
    log: function (this: Tokenizer, token: Token) {
      if (this.logging) {
        console.log(`${logPrefix(this.marks - 1)}| Matched ${token.type}`);
        console.log(`${logPrefix(this.marks - 1)}| raw: ${token.raw}`);
      }
    },
  };
}

export { createTokenizer };
