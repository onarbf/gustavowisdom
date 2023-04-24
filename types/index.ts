export type GBContent = {
    title: string;
    url: string;
    date: string;
    content: string;
    tokens: number;
    chunks: GBChunk[];
}

export type GBChunk = {
    content_title: string;
    content_url: string;
    content_date: string;
    chunk_content: string;
    chunk_tokens: number;
    embedding: number[];
}

export type GBJSON = {
    tokens: number;
    contents: GBContent[];
}