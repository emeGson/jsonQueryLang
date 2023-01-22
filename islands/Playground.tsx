import { useState } from "preact/hooks";
import  exampleData from "../tests/example.json" assert { type: 'json'}
import {interpret} from '../src/intepreter.ts'
import { DataType } from "../src/types.ts";
export default function Playground() {
  const [query, setQuery] = useState('');
  const [json,setJson] = useState(JSON.stringify(exampleData))

  let res:DataType = ''
  try{
    res = interpret(query, json)
  }catch(e){
    console.error(e)
  }

  const handleQueryChange = (event:any) => { setQuery(event.target.value)}
  const handleJsonChange = (event:any) => {setJson(event.target.value)}
  return (
    <div class="flex flex-col gap-2 w-full p-4 h-screen">
      <div class="flex flex-row text-xl gap-2 place-items-center">
        Query
        <input class="px-3 py-2 flex-grow bg-white rounded border(gray-500 2) disabled:(opacity-50 cursor-not-allowed)" value={query} onInput={handleQueryChange} />
      </div>
      <div class=" flex flex-row flex-grow">
        <textarea spellcheck={false} class="w-1/2 border-r-2 resize-none overflow-auto" value={JSON.stringify(JSON.parse(json),undefined,4)} onInput={handleJsonChange}></textarea>
        <pre class="overflow-auto w-1/2" >
          <code>
            {JSON.stringify(res,undefined,4)}
          </code>
        </pre>
      </div>
    </div>
  );
}
