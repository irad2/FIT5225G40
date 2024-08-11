import * as React from 'react';
import styles from "./SectionFour.module.scss"

function SectionFour() {
    const [stateMsg, setStateMsg] = React.useState("")
    const [filterPolicy, setFilterPolicy] = React.useState("")
    const [mode, setMode] = React.useState(0)

    return (
        <div className={styles.sectionWrapper}>
            <div className={styles.contentWrapper}>
                <div className={styles.title}>
                    Subscribe/Unsubscribe Notification
                </div>
                <div className={styles.msg}>
                    {stateMsg}
                </div>
                <div className={styles.butts}>
                    Mode: &nbsp;
                    <button className={styles.mybut} style={mode === 0 ? { background: "green", color: "white" } : { background: "rgb(255, 211, 211)", color: "black" }} onClick={() => setMode(0)}>subscribe</button>
                    <button className={styles.mybut} style={mode === 1 ? { background: "green", color: "white" } : { background: "rgb(255, 211, 211)", color: "black" }} onClick={() => setMode(1)}>unsubscribe</button>
                </div>
                {mode === 0 && <>
                    <div>E.g. elephant, 1, person, 1</div>
                    <input className={styles.myInput}
                        onChange={(e) => {
                            setFilterPolicy(e.currentTarget.value)
                        }}
                        value={filterPolicy}
                    />
                    <button className={styles.submitBut} onClick={async () => {
                        const tagsArray = filterPolicy.split(',');
                        const tags: { [key: string]: number } = {};

                        for (let i = 0; i < tagsArray.length; i += 2) {
                            const tag = tagsArray[i].trim();
                            const count = parseInt(tagsArray[i + 1], 10);
                            tags[tag] = count;
                        }

                        const jsonData = {
                            tags
                        };

                        try {
                            setStateMsg("subscribing...")
                            const response = await fetch(process.env.REACT_APP_SNS_SUBSCRIPTION!, {
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
                            setStateMsg(data["message"])
                        } catch (error) {
                            setStateMsg(error + "")
                        }
                    }}>subscribe</button>
                </>}
                {mode === 1 && <button className={styles.submitBut} onClick={async () => {
                    setStateMsg("unsubscribing...")
                    try {
                        const response = await fetch(process.env.REACT_APP_SNS_UNSUBSCRIPTION!, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
                            },
                            body: JSON.stringify({
                                "action": "unsubscribe"
                            })
                        });
                        const data = await response.json();
                        setStateMsg(data["message"])
                    } catch (error) {
                        setStateMsg(error + "")
                    }
                }}>unsubscribe</button>}
            </div>
        </div>
    );
}

export default SectionFour;