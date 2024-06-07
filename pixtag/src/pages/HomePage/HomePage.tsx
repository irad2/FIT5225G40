import * as React from 'react';
import styles from "./HomePage.module.scss"
import { useNavigate } from 'react-router-dom';
import ServiceBlock from '../../components/ServiceBlock/ServiceBlock';
import SectionOne from '../../components/SectionOne/SectionOne';
import SectionTwo from '../../components/SectionTwo/SectionTwo';
import SectionThree from '../../components/SectionThree/SectionThree';

function HomePage() {
    const navigate = useNavigate()
    const [section, setSection] = React.useState(0)
    return (
        <div className={styles.wrapper}>
            <button className={styles.logout}>
                logout
            </button>
            <div className={styles.welcomeMsg}>
                Welcome to <span style={{ color: "yellow" }}>PixTag</span>, helping you to manage images using tags through using our object detection model.
            </div>
            <div className={styles.welcomeMsg}>
                Please choose one of the following service:
            </div>
            <div className={styles.serviceWrapper}>
                <ServiceBlock handleOnClick={() => { setSection(1) }} words="upload your image" />
                <ServiceBlock handleOnClick={() => { setSection(2) }} words="query images using tags" />
                <ServiceBlock handleOnClick={() => { setSection(3) }} words="query images using image" />
            </div>

            {section === 1 && <SectionOne />}
            {section === 2 && <SectionTwo />}
            {section === 3 && <SectionThree />}
        </div>
    );
}

export default HomePage;