import { Head } from "$fresh/runtime.ts";
import Playground from "../islands/Playground.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <title>Json Query Playground</title>
        <link href="themes/prism.css" rel="stylesheet" />
        <script src="prism.js"></script>
      </Head>
      <Playground />
    </>
  );
}
