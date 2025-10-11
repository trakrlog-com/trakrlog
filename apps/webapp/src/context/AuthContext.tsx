import { 
    createContext,
    useContext,
    useEffect,
    useState,
    type ReactNode,
} from "react";
 
import { useFetch } from "../hooks/useFetch";


const CLIENT_HOME_PAGE_URL = "http://localhost:4000";


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

export const AuthContextProvider: React.FC<{ children: ReactNode }> = (
    props,
) => {
    const [userData, setUserData] = useState<UserState>();
    const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
    const { doFetch } = useFetch();

    const handleLoginClick = (provider: string): void => {
        window.open(`${CLIENT_HOME_PAGE_URL}/auth/${provider}`, "_self");
    };

    const handleLogoutClick = (): void => {
        window.open(`${CLIENT_HOME_PAGE_URL}/auth/logout`, "_self");
    };

    useEffect(() => {
        doFetch<any, unknown>({
            onSuccess: (fetchResp: any) => {
                setUserData({
                    authenticated: true,
                    userData: fetchResp,
                });
            },
            onError: () => {
                setUserData({
                    authenticated: false,
                });
            },
            onFinally: () => setLoadingInitial(false),
            url: `${CLIENT_HOME_PAGE_URL}/auth/is-auth/`,
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
            {!loadingInitial && props.children}
        </appContext.Provider>
    );
};

export const useAppContext = (): AppContext => useContext(appContext);