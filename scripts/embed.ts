import {GBJSON} from './../types/index';
import {loadEnvConfig} from '@next/env';
import fs from 'fs';
import {Configuration, OpenAIApi} from 'openai' 
import {createClient} from '@supabase/supabase-js';
import { debug } from 'console';

loadEnvConfig("") 

const generateEmbeddings = async (contents: any) => {

    const configuration = new Configuration({
        apiKey: process.env.OPENAI_API_KEY,
    });
    const openai = new OpenAIApi(configuration);
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
  
    for(let i = 0; i < contents.length; i++){
        const content = contents[i];

        for(let j = 0; j < content.chunks.length; j++){
            const chunk = content.chunks[j];

            const embeddingResponse = await openai.createEmbedding({
                model: 'text-embedding-ada-002',
                input: chunk.chunk_content
            })

            const [{embedding}] = embeddingResponse.data.data;
            const {data, error} = await supabase
                .from('gustavo_bueno')
                .insert({
                    content_title: chunk.content_title,
                    content_url: chunk.content_url,
                    content_date: chunk.content_date,
                    content: chunk.chunk_content,
                    content_tokens: chunk.chunk_tokens,
                    embedding
                })
                .select('*')

                if(error){
                    console.log('error', error);
                    
                }else {
                    console.log('saved', i, j);
                }

                await new Promise(resolve => setTimeout(resolve, 300));
        }
    }
}

(async()=>{
const json: GBJSON = JSON.parse(fs.readFileSync('scripts/pg.json','utf8'))

await generateEmbeddings(json.contents)
})()