import { GBChunk } from "@/types";
import { FC } from "react";
import styles from './reflist.module.css';
interface Props {
    references: GBChunk[];
}


export const RefList: FC<Props> = ({references})=>{

    const referenceList = references.map((chunk,i)=>{
        return <div
        key={i}
        className={styles.fadeIn + " border rounded mt-4  p-4 divide-y"}
        style={{animationDelay: `${i *0.1}s`}}
        >
            <div className="flex justify-between">
                <small className="pl-4">{chunk.content_title}</small>
                <small className="pr-4">{chunk.content_date}</small>
            </div>
            <div><p>{chunk.content}</p></div>
        </div>
    })
    
    return(<div className="">
        {referenceList}
    </div>);
}