import { ReactNode, useEffect } from "react";

interface Props {
    children: ReactNode;
}

const RequireAuth: React.FC<Props> = ({ children }) => {
    const isAuth = sessionStorage.getItem("isAuth") === "true";
    const expiryTime = sessionStorage.getItem("expiryTime");

    useEffect(() => {
        const currentTime = new Date().getTime();

        if (!isAuth || (expiryTime && currentTime > parseInt(expiryTime, 10))) {
            // Clear session storage to ensure no stale tokens are kept
            sessionStorage.removeItem("accessToken");
            sessionStorage.removeItem("idToken");
            sessionStorage.removeItem("isAuth");
            sessionStorage.removeItem("expiryTime");

            // Redirect to the login page
            window.location.href = process.env.REACT_APP_AWS_COGNITO!;
        }
    }, [isAuth, expiryTime]);

    if (!isAuth || (expiryTime && new Date().getTime() > parseInt(expiryTime, 10))) return null;

    return (<>{children}</>);
}

export default RequireAuth;
