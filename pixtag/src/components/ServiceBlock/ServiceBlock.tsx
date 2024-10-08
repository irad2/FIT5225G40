import * as React from 'react';
import styles from "./ServiceBlock.module.scss"

function ServiceBlock(props:{
    handleOnClick:()=>void,
    words: string,
    style: {}
}) {
    return (
        <div style={props.style} onClick={props.handleOnClick} className={styles.wrapper}>
            {props.words}
        </div>
    );
}

export default ServiceBlock;