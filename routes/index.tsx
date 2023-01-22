import { Head } from "$fresh/runtime.ts";
import Playground from "../islands/Playground.tsx";

export default function Home() {
  return (
    <>
      <Head>
        <title>Json Query Playground</title>
      </Head>
      <Playground />
    </>
  );
}
