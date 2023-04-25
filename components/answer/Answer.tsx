import {FC, useEffect, useState} from 'react';
import styles from './answer.module.css';

interface Props {
    text: string;
}

export const Answer: FC<Props> = ({text}) =>{
    const [words, setWords] = useState<string[]>([]);

    useEffect(()=>{
        setWords(text.split(" "));
    }, [text])

    return (
        <div className="">
            {text ? <div className="text-xl mt-4 ">Respuesta:</div> : ""}
            {text ? <div className="border p-4 rounded">
                
                {words.map((word, index)=>(
                    <span
                    key = {index}
                    className={styles.fadeIn + " font-l"}
                    style={{animationDelay: `${index *0.1}s`}}
                    >
                        {word}{" "}
                    </span>
                ))}
            </div> : ""}
        </div>
    )
}