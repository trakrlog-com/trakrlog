import React from 'react';
import HttpExample from './HttpExample';
import JoinWaitlist from './JoinWaitlist';

interface GetStartedNowProps {
}

const GetStartedNow: React.FC<GetStartedNowProps> = () => {
    return (
        <div className="bg-[#1a1919] pt-16">
            <HttpExample />

            <div className="bg-[var(--dark-bg)]">
                <div className="px-6 py-24 sm:py-32 lg:px-8">
                    <div className="mx-auto max-w-3xl text-center">
                        <h2 className="text-6xl font-semibold tracking-tight 
                            text-balance text-gray-900   dark:text-white">
                            Ready to get started?
                        </h2>

                        {!import.meta.env.VITE_WAITLISTENABLED ? (
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <a
                                href="/login"
                                className="main-button p-3"
                            >
                                Get Started for free
                            </a>
                        </div>) : (
                        <div className="mt-10 flex items-center justify-center gap-x-6">
                            <JoinWaitlist />
                        </div>)}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GetStartedNow;