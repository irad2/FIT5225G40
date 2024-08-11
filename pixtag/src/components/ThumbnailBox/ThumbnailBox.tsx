import { ThumbNailState } from "../SectionTwo/SectionTwo";
import styles from "./ThumbnailBox.module.scss"
import * as React from 'react';

function ThumbnailBox(props: ThumbNailState & {
    setPreviewMsg: (msg: string) => void;
    setPreviewUrl: (url: string) => void;
    setEditUrls: (urls: string[]) => void;
    editUrlState: string[];
    viewState: number;
}) {
    return (
        <div
            className={styles.wrapper}
            onClick={async () => {
                if (props.viewState === 0) {
                    try {
                        props.setPreviewMsg("loading image...")
                        const response = await fetch(process.env.REACT_APP_GET_ORIGINAL_IMAGE_URL!, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
                            },
                            body: JSON.stringify({
                                thumbnail_url: props.url
                            })
                        });

                        if (!response.ok) {
                            throw new Error('API call failed: ' + response.status);
                        }

                        const responseData = await response.json();
                        props.setPreviewUrl(responseData.standardImageUrl)
                        props.setPreviewMsg("Image received.")
                    } catch (e) {
                        props.setPreviewMsg(e + "")
                    }
                } else if (props.viewState === 1) {
                    const newEditUrlState = [...props.editUrlState]
                    if (!newEditUrlState.includes(props.url)) {
                        newEditUrlState.push(props.url);
                    }
                    props.setEditUrls(newEditUrlState)
                }
            }}
        >
            <img src={props.url} alt="thumbnail" />
            <div className={styles.msg}>
                {props.tags.map((v, i) => {
                    return <div key={i}>
                        tag: {v.tagName}, {v.repetition}
                    </div>
                })}
            </div>
        </div>
    );
}

export default ThumbnailBox;