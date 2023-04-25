import endent from "endent";
import { GBChunk } from '@/types';
import {useState} from 'react';
import { Answer } from "@/components/answer/Answer";
import { RefList } from "@/components/refList/RefList";

export default function Home() {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [chunks, setChunks] = useState<GBChunk[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAnswer = async ()=>{
    setAnswer("");
    setLoading(true);

    const searchResponse = await fetch('/api/search', {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({query})
    })

    if(!searchResponse.ok){
      setLoading(false)
      return;
    }
    
    const results: GBChunk[] = await searchResponse.json();
    console.log('results',results);
    setChunks(results);
    
    const prompt = endent`
    Usa los siguientes pasajes para responder a la pregunta: ${query}
    
    ${results.map((chunk)=>chunk.chunk_content).join("\n")}
    `;

    const answerResponse = await fetch("/api/answer",{
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({prompt})
    })

    if(!answerResponse.ok){
      setLoading(false)
      return;
    }

    const data = answerResponse.body;

    if(!data){
      setLoading(false)
      return;
    }

    const reader = data.getReader();
    const decoder = new TextDecoder();
    let done = false;

      while(!done){
        const {value, done: doneReading} = await reader.read();
        done = doneReading;

        const chunkValue = decoder.decode(value);
        setAnswer((prev) => prev + chunkValue);
       }

       setLoading(false);
  }

  return (
    <div className="flex min-w-full  justify-center">
      <div className=" flex flex-col rounded border p-6 w-full m-4  lg:m-0 lg:w-1/2 ">
        <div>
          <h1 className="text-3xl text-center mt-6 mb-6">GPTBueno v1</h1>
        </div>
        <input
        className="border p-2 rounded"
        type="text"
        placeholder='Pregúntale algo a Don Gustavo'
        value={query}
        onChange={(e)=> { setQuery(e.target.value) }}
        />
        <button
        className="rounded mt-6 p-2 bg-indigo-800 text-white"
        onClick={handleAnswer}
        >
          Submit
        </button>

        <div className="mt-6">
          {loading ? <div>Cargando... Paciencia, nos puede llevar hasta un minuto encontrar la respuesta adecuada.</div> : <Answer text={answer}/>}
        </div>
          {chunks.length === 0 ? "": <RefList references={chunks}/>}
      </div>
    </div>
  )
}
