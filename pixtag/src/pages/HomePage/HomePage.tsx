import * as React from 'react';
import styles from "./HomePage.module.scss"
import { useNavigate } from 'react-router-dom';
import ServiceBlock from '../../components/ServiceBlock/ServiceBlock';
import SectionOne from '../../components/SectionOne/SectionOne';
import SectionTwo from '../../components/SectionTwo/SectionTwo';
import SectionThree from '../../components/SectionThree/SectionThree';
import SectionFour from '../../components/SectionFour/SectionFour';

function HomePage() {
    const navigate = useNavigate()
    const [section, setSection] = React.useState(1)
    const handleSignout = ()=>{
        sessionStorage.removeItem("accessToken");
        sessionStorage.removeItem("idToken");
        sessionStorage.removeItem("isAuth");
        sessionStorage.removeItem("expiryTime");
        window.location.href = process.env.REACT_APP_COGNITO_LOGOUT!;
    }

    return (
        <div className={styles.wrapper}>
            <button className={styles.logout} onClick={handleSignout}>
                logout
            </button>
            <div className={styles.welcomeMsg}>
                Welcome to <span style={{ color: "yellow" }}>PixTag</span>, helping you to manage images using tags through using our object detection model.
            </div>
            <div className={styles.welcomeMsg2}>
                Please choose one of the following service:
            </div>
            <div className={styles.serviceWrapper}>
                <ServiceBlock style={{backgroundColor: "pink"}} handleOnClick={() => { setSection(1) }} words="upload your image" />
                <ServiceBlock style={{backgroundColor: "palegoldenrod"}} handleOnClick={() => { setSection(2) }} words="query images using tags" />
                <ServiceBlock style={{backgroundColor: "paleturquoise"}} handleOnClick={() => { setSection(3) }} words="query images using image" />
                <ServiceBlock style={{backgroundColor: "palevioletred"}} handleOnClick={() => { setSection(4) }} words="subscribe notifications" />
            </div>

            {section === 1 && <SectionOne />}
            {section === 2 && <SectionTwo />}
            {section === 3 && <SectionThree />}
            {section === 4 && <SectionFour />}
        </div>
    );
}

export default HomePage;