import * as React from 'react';
import styles from "./SectionTwo.module.scss"
import ThumbnailBox from '../ThumbnailBox/ThumbnailBox';

export type ThumbNailState = {
    "url": string,
    "tags": {
        "tagName": string,
        "repetition": number,
        "imageID": string
    }[]
}

function SectionTwo() {
    const [inputTags, setInputTags] = React.useState("")
    const [thumbNails, setThumbNails] = React.useState<ThumbNailState[]>([])
    const [msg, setMsg] = React.useState("")
    const [viewState, setViewState] = React.useState(0) // 0 for preview, 1 for tags modification
    const [preViewUrl, setPreviewUrl] = React.useState("")
    const [previewMsg, setPreviewMsg] = React.useState("")
    const [editImageTagsAreaUrls, setEditImageTagsAreaUrls] = React.useState<string[]>([])
    const [editMsg, setEditMsg] = React.useState("Click on the thumbnails to edit tags.")
    const [modeState, setModeState] = React.useState(0)
    const [tagModification, setTagModification] = React.useState("")

    const convertToArray = (tagModification:string) => {
        const tagArray = tagModification.split(/,\s*/);
        return tagArray;
    }

    const extract_image_id = (url: string) => {
        const segments = url.split('/');
        const lastSegment = segments[segments.length - 1];
        const imageId = lastSegment.split('.')[0];
        return imageId;
    }

    const delete_url_from_thumbnail = (imageID: string) => {
        const newThumbNail = thumbNails.filter(thumbnail => !thumbnail.url.includes(imageID));
        setThumbNails(newThumbNail)
    }

    const delete_url_from_edit_thumbnail = (imageID: string) => {
        const newEditImageTagsAreaUrls = editImageTagsAreaUrls.filter(tn => !tn.includes(imageID));
        setEditImageTagsAreaUrls(newEditImageTagsAreaUrls)
    }

    const handleSubmit = async () => {
        const tagsArray = inputTags.split(',');
        const tags: { [key: string]: number } = {};

        for (let i = 0; i < tagsArray.length; i += 2) {
            const tag = tagsArray[i].trim();
            const count = parseInt(tagsArray[i + 1], 10);
            tags[tag] = count;
        }

        const jsonData = {
            tags
        };

        console.log(JSON.stringify(jsonData))

        try {
            setMsg("searching images...")
            const response = await fetch(process.env.REACT_APP_SEARCH_IMAGE_THROUGH_TAGS!, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
                },
                body: JSON.stringify(jsonData)
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            setThumbNails(data)
            setMsg("Search done. Totally " + data.length + " images found.")
            console.log('Success:', data);
        } catch (error) {
            console.error('Error:', error);
            setMsg(error + "")
        }
    }

    return (
        <div className={styles.sectionWrapper}>
            <div className={styles.inputArea}>
                <div className={styles.label}>
                    Search images by input tags.
                </div>
                <div className={styles.example}>
                    E.g. elephant, 1, person, 1
                </div>
                <input
                    className={styles.myInput}
                    onChange={(e) => {
                        setInputTags(e.currentTarget.value)
                    }}
                    value={inputTags}
                />
                <button
                    className={styles.myBut}
                    onClick={handleSubmit}
                >
                    Submit
                </button>
                {msg}
            </div>
            <div className={styles.searchResultWrapper}>
                <div className={styles.label}>Results</div>
                <div className={styles.thumbnailArea}>
                    {thumbNails.map((v, i) => {
                        return <ThumbnailBox
                            viewState={viewState}
                            setPreviewMsg={setPreviewMsg}
                            setPreviewUrl={setPreviewUrl}
                            editUrlState={editImageTagsAreaUrls}
                            setEditUrls={setEditImageTagsAreaUrls}
                            key={i}
                            url={v.url}
                            tags={v.tags}
                        />
                    })}
                </div>
            </div>
            <div className={styles.previewArea}>
                <div className={styles.tabs}>
                    <button style={viewState === 0 ? { background: "green", color: "white" } : { background: "rgb(255, 211, 211)", color: "black" }} className={styles.tab} onClick={() => { setViewState(0) }}>Image Preview</button>
                    <button style={viewState === 1 ? { background: "green", color: "white" } : { background: "rgb(255, 211, 211)", color: "black" }} className={styles.tab} onClick={() => { setViewState(1) }}>Edit Tags</button>
                </div>
                {viewState == 0 && <div className={styles.previewAndDeleteArea}>
                    <div className={styles.previewMsg}>{previewMsg}</div>
                    {preViewUrl && <img src={preViewUrl} onLoad={() => { setPreviewMsg("Image loaded.") }} alt="preViewUrl" />}
                    {preViewUrl && <button className={styles.deleteBut} onClick={async () => {
                        try {
                            setPreviewMsg("deleting this image...")
                            const response = await fetch(process.env.REACT_APP_DELETE_IMAGE!, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
                                },
                                body: JSON.stringify({
                                    "url": [preViewUrl]
                                })
                            });
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            let imageID = extract_image_id(preViewUrl)
                            delete_url_from_thumbnail(imageID)
                            setPreviewMsg("Image deleted.")
                            setPreviewUrl("")
                        } catch (error) {
                            setMsg(error + "")
                        }
                    }}>delete</button>}
                </div>}
                {viewState == 1 && <div className={styles.selectAndEditArea}>
                    <div className={styles.editMsg}>{editMsg}</div>
                    <div className={styles.editThumbnailArea}>
                        {editImageTagsAreaUrls.length != 0 && editImageTagsAreaUrls.map((v, i) => {
                            return <img onClick={() => {
                                const image_id = extract_image_id(v)
                                delete_url_from_edit_thumbnail(image_id)
                            }} key={i} src={v} />
                        })}
                    </div>
                    <div className={styles.modes}>
                        Modification Mode:&nbsp;
                        <button style={modeState === 0 ? { background: "green", color: "white" } : { background: "rgb(255, 211, 211)", color: "black" }} className={styles.tab} onClick={() => { setModeState(0) }}>delete tag</button>
                        <button style={modeState === 1 ? { background: "green", color: "white" } : { background: "rgb(255, 211, 211)", color: "black" }} className={styles.tab} onClick={() => { setModeState(1) }}>add tag</button>
                    </div>
                    <div className={styles.tagModificationArea}>
                        <div className={styles.tagModificationExample}>
                            E.g. horse, person, car, car
                        </div>
                        <input
                            className={styles.myInput}
                            onChange={(e) => {
                                setTagModification(e.currentTarget.value)
                            }}
                            value={tagModification}
                        />
                        <button className={styles.modificationBut} onClick={async ()=>{
                            try {
                                setEditMsg("Modifying tags...")
                                const request_body = JSON.stringify({
                                    "url": editImageTagsAreaUrls,
                                    "type": modeState,
                                    "tags": convertToArray(tagModification)
                                })
                                console.log(request_body)
                                const response = await fetch(process.env.REACT_APP_EDIT_IMAGES_TAGS!, {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
                                    },
                                    body: request_body
                                });
                                if (!response.ok) {
                                    throw new Error(`HTTP error! status: ${response.status}`);
                                }
                                setEditMsg("Tags modified successfully.")
                            } catch (error) {
                                setEditMsg(error + "")
                            }
                        }}>submit tag modifications</button>
                    </div>
                </div>}
            </div>
        </div>
    )
}

export default SectionTwo;