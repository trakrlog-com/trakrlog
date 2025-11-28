import React from 'react';
import { useDashboard } from '../../context/DashboardContext';



export const ProjectInfo: React.FC = () => {

    const { selectedProject } = useDashboard();

    return (
        <>
            <h3 className="text-lg px-4 ml-4 font-semibold text-white my-5" >{selectedProject?.name}</h3>
        </>
    );
};