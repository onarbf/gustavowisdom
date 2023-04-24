import * as cheerio from 'cheerio';
import axios from 'axios';
import {loadEnvConfig} from '@next/env';
import * as fs from 'fs';
import { GBContent, GBChunk, GBJSON } from '@/types';
import { encode } from "gpt-3-encoder";

loadEnvConfig("") 

const getLinks = async ()=>{
    const html = await axios.get(`${process.env.SCRAPE_URL}/gbm/gtgb.htm`);
    const linkArr: {url: string; title: string}[] = [];

    const $ = cheerio.load(html.data);
    const links = $('.fv a');

    links.each((i, link) => {
        const url = $(link).attr('href')?.slice(2);

        const title = $(link).text();

        if(url && url.endsWith(".htm") && title){
            linkArr.push({
                url,
                title
            })
        }
    });
    return linkArr;
}

const getContent = async (url: string, title:string)=>{

    let GBContent : GBContent = {
        title: "",
        url: "",
        date: "",
        content: "",
        tokens: 0,
        chunks: [],
      };
    const html = await axios(process.env.SCRAPE_URL + url);
    const $ = cheerio.load(html.data);

    const date = $('article .ac:last-child').text().replace('Gustavo Bueno, ','');
    console.log(date);
    let content = "";
    let contents = $('section p'); //remove whitespaces and footnotes.

    contents.each((i,c)=>{
    content = content + `${$(c).text()}`;
    })
    
    content = content.replace(/{\d+}/g,"").replace(/{\n}/g,"").replace(/(&c)/g, "");

    const split = content.match(/([A-Z][a-z]+ [0-9]{4})/); //remove dates
    let dateStr = "";
    let contentWithoutDate = "";

    if(split){
        dateStr = split[0];
        contentWithoutDate = content.replace(dateStr,"");
    }
    
    content = contentWithoutDate.trim();
    content = content.split('——')[0];
    
    GBContent = {
        title,
        url: `${process.env.SCRAPE_URL}${url}`,
        date,
        content,
        tokens: encode(content).length,
        chunks: []
    }

    return GBContent;
}

const getChunks = async (GBcontent: GBContent)=>{
    const { title, url, date, content } = GBcontent;
    
    const contentTextChunks: string[]= [];
    const CHUNK_SIZE = Number(process.env.CHUNK_SIZE);

    if(encode(content).length > Number(CHUNK_SIZE)){
        const splits = content.split('.');
        let chunk = '';

        for (let i = 0; i < splits.length; i++) {    
            let chunkLength = encode(chunk).length;

            let sentence = splits[i];
            let sentenceLength = encode(sentence).length;

            if(chunkLength + sentenceLength > CHUNK_SIZE){
                contentTextChunks.push(chunk);
                chunk = '';
            }else{
                if (sentence && sentence[sentence.length - 1].match(/[a-z0-9]/i)) {
                    chunk += sentence + ". ";
                  } else {
                    chunk += " ";
                  }
            }
        }
        contentTextChunks.push(chunk);
    }else{
        contentTextChunks.push(content);
    }
    
    const contentChunks: GBChunk[] = contentTextChunks.map((chunkText,i)=>{
        const chunk : GBChunk = {
            content_title: title,
            content_url: url,
            content_date: date,
            chunk_content: chunkText,
            chunk_tokens: encode(chunkText).length,
            embedding: []
        };

        return chunk;
    })

    const chunkedContent: GBContent = {
        title,
        url,
        date,
        content,
        tokens: encode(content).length,
        chunks:contentChunks
    }
    return chunkedContent;
}

(async ()=>{
    const links = await getLinks();
    let contents : GBContent[] = [];
    console.log(links.length);
    for(let i = 0; i < links.length; i++){
        const link = links[i];
        const GBContent = await getContent(link.url, link.title);
        const chunkedContent = await getChunks(GBContent);
        contents.push(chunkedContent);
    }

    const json: GBJSON = {
        tokens: contents.reduce((acc,content)=>acc + content.tokens,0),
        contents
    }

    fs.writeFileSync('scripts/pg.json',JSON.stringify(json));

})()