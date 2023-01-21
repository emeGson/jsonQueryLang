import { interpret } from "./intepreter.ts"
async function run() {
    if (Deno.args.length !== 2) {
        console.log("Usage file query")
        return
    }
    const data = await Deno.readTextFile(Deno.args[0])
    const input = Deno.args[1]
    console.log(JSON.stringify(interpret(input, data), undefined, 4))
}

if (import.meta.main) {
    run()
}

