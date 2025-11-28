import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings } from '../../components/app/Settings/Settings';

export const SettingsPage: React.FC = () => {
    const navigate = useNavigate();

    return (
        <Settings onBack={() => navigate('/dashboard')} />
    );
};
