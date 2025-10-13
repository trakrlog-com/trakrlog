import React, { useState } from 'react';

const JoinWaitlist: React.FC = () => {
    const [email, setEmail] = useState('');
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/waitlist', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email }),
            });

            if (response.ok) {
                setIsSubmitted(true);
                setEmail('');
            } else {
                const errorData = await response.json();
                setError(errorData?.error?.message || 'Failed to join waitlist');
            }
        } catch (err) {
            setError('Something went wrong. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!import.meta.env.VITE_WAITLISTENABLED) {
        return null;
    }

    return (
        <div className="relative isolate overflow-hidden bg-[var(--dark-bg)]">

            <div className="sm:mx-auto max-w-7xl px-6 py-8 sm:py-8 lg:px-8 mx-5 rounded-2xl border border-white/10 waitlist">
                <div className="mx-auto max-w-2xl text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-white sm:text-6xl">
                        Join the Waitlist
                    </h2>
                    <p className="mt-4 text-lg leading-8 text-gray-300">
                        Be among the first to experience our game analytics platform. <br />Sign up now and stay updated!
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="mx-auto mt-10 max-w-md">
                    <div className="group relative flex flex-col sm:flex-row gap-4 sm:gap-0">
                        <div className="relative grow">
                            <input
                                type="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="block w-full rounded-lg sm:rounded-r-none border-0 bg-white/10 px-4 py-4 text-white
                                        ring-1 ring-inset ring-white/30 transition-shadow duration-300
                                        placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-white
                                        hover:ring-white/50"
                                placeholder="Enter your email"
                            />
                            <div className="absolute inset-0 -z-10 rounded-lg sm:rounded-r-none transition-opacity duration-300
                                        bg-gradient-to-r from-neutral-600/30 via-neutral-700/30 to-neutral-800/30 opacity-0 
                                        group-hover:opacity-100" />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex items-center justify-center rounded-lg sm:rounded-l-none 
                                    bg-gradient-to-r from-neutral-600 via-neutral-700 to-neutral-800 px-6 py-4 text-sm
                                    font-semibold text-white transition-all duration-300
                                    ring-1 ring-inset ring-white/30 hover:ring-white/50
                                    hover:from-neutral-700 hover:via-neutral-800 hover:to-neutral-900
                                    focus:ring-2 focus:ring-inset focus:ring-white
                                    active:scale-[0.98]
                                    disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Joining...' : 'Join Now'}
                        </button>
                    </div>
                </form>

                {/* Success/Error messages */}
                <div
                    className={`mt-4 text-center transition-all duration-300 ${
                        isSubmitted || error
                            ? 'opacity-100 translate-y-0'
                            : 'opacity-0 -translate-y-4'
                    }`}
                >
                    {isSubmitted && (
                        <p className="text-md text-green-400">
                            Thanks for joining!✨ We'll be in touch soon when we launch!
                        </p>
                    )}
                    {error && (
                        <p className="text-md text-red-400">
                            {error}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default JoinWaitlist;