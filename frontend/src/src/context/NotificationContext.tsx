import React, { createContext, useContext, useState } from 'react';
import Notification from '../components/app/Notification';

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface NotificationContextType {
    showNotification: (message: string, type: NotificationType, title: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [notifications, setNotifications] = useState<Array<{ id: string; message: string; title: string; type: NotificationType }>>([]);

    const showNotification = (message: string, type: NotificationType, title: string) => {
        const id = Date.now().toString();
        setNotifications(prev => [...prev, { id, message, title, type }]);

        // Auto remove after 5 seconds
        setTimeout(() => {
            setNotifications(prev => prev.filter(n => n.id !== id));
        }, 5000);
    };

    return (
        <NotificationContext.Provider value={{ showNotification }}>
            {children}
            {notifications.map(notification => (
                <Notification 
                    title={notification.title}
                    type={notification.type}
                    key={notification.id}
                    message={notification.message}
                />
            ))}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};