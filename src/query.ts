import { interpret } from "./intepreter.ts";
async function run() {
  if (Deno.args.length !== 2) {
    console.log("Usage file query");
    return;
  }
  const data = await Deno.readTextFile(Deno.args[0]);
  const input = Deno.args[1];
  const { val, err } = interpret(input, data);
  if (err !== null) {
    console.error(err);
    return;
  }
  console.log(JSON.stringify(val, undefined, 4));
}

if (import.meta.main) {
  run();
}
