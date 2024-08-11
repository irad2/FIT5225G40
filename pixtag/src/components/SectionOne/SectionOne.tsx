import * as React from 'react';
import { useState } from 'react';
import styles from "./SectionOne.module.scss";

function SectionOne() {
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [msg, setMsg] = useState("")

    // Function to handle file input change and store the selected file in state
    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            const file = event.target.files[0];
            setSelectedFile(file);

            // Create a preview URL for the selected image
            const fileUrl = URL.createObjectURL(file);
            setPreviewUrl(fileUrl);
        }
    };

    // Function to handle the upload button click and send the API request
    const handleUploadClick = async () => {
        if (selectedFile) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = reader.result!.toString().split(",")[1];
                try {
                    setMsg("uploading...")
                    const response = await fetch(process.env.REACT_APP_IMAGE_UPLOAD!, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${sessionStorage.getItem('idToken')}`
                        },
                        body: JSON.stringify({
                            name: selectedFile.name,
                            file: base64String
                        })
                    });

                    if (!response.ok) {
                        throw new Error('API call failed: ' + response.status);
                    }

                    const responseData = await response.json();
                    setMsg("upload successfully.")
                } catch (error) {
                    setMsg('Error sending API request:' + error)
                }
            };

            reader.readAsDataURL(selectedFile); // Converts the file to a base64 string
        } else {
            alert('No file selected');
        }
    };

    return (
        <div className={styles.sectionWrapper}>
            <div className={styles.contentWrapper}>
                <div className={styles.title}>
                    Upload your image here.
                </div>
                <div className={styles.content}>
                    <input type="file" accept="image/*" onChange={handleFileChange} />
                    {previewUrl && <img src={previewUrl} alt="Selected Preview" className={styles.previewImage} />}
                    <button className={styles.mybut} onClick={handleUploadClick}>Upload</button>
                    <div className={styles.msg}>{msg}</div>
                </div>
            </div>
        </div>
    );
}

export default SectionOne;
