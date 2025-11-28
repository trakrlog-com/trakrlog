import type { NavigateFunction } from 'react-router-dom';

export const redirectToNotFound = (navigate: NavigateFunction) => {
    navigate('/not-found', { replace: true });
};

export const redirectToUnauthorized = (navigate: NavigateFunction) => {
    navigate('/unauthorized', { replace: true });
};

// You can add more navigation utilities here as needed