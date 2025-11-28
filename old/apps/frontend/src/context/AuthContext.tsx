/* eslint-disable react/prop-types */
import { 
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
 
import { useFetch } from "../hooks/useFetch";


export interface AppContext {
    authContext: AuthContext;
}

export interface AuthContext {
    userData: UserState | undefined;
    loginClick: (provider: string) => void;
    logoutClick: () => void;
}

export interface UserState {
    userData?: any;
    error?: string;
    authenticated: boolean;
}


export const initialState: AppContext = {
    authContext: {
        userData: {
            authenticated: false,
        },
        loginClick: () => {
            throw Error();
        },
        logoutClick: () => {
            throw Error();
        },
    },
};

const appContext = createContext<AppContext>(initialState);

export const AuthContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [userData, setUserData] = useState<UserState>();
    const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
    const { doFetch } = useFetch();

    const handleLoginClick = (provider: string): void => {
        window.open(`${import.meta.env.VITE_BACKEND_URL}/auth/${provider}`, "_self");
    };

    const handleLogoutClick = (): void => {
        window.open(`${import.meta.env.VITE_BACKEND_URL}/auth/logout`, "_self");
    };

    useEffect(() => {
        doFetch<any, unknown>({
            onSuccess: (fetchResp: any) => {
                setUserData({
                    authenticated: fetchResp.success,
                    userData: fetchResp.data,
                });
            },
            onError: () => {
                setUserData({
                    authenticated: false,
                });
            },
            onFinally: () => setLoadingInitial(false),
            url: `${import.meta.env.VITE_BACKEND_URL}/auth/is-auth/`,
            method: "GET",
        });
    }, [doFetch]);

    return (
        <appContext.Provider
            value={{
                authContext: {
                    userData,
                    loginClick: handleLoginClick,
                    logoutClick: handleLogoutClick,
                },
            }}
        >
            {!loadingInitial && children}
        </appContext.Provider>
    );
};

export const useAppContext = (): AppContext => useContext(appContext);