import React from 'react';

const Unauthorized: React.FC = () => {

  return (
    <main className="grid min-h-screen w-full place-items-center  px-6 py-24 sm:py-32 
          lg:px-8 bg-[var(--dark-bg)]">
        <div className="text-center"> 
          <p className="text-base font-semibold text-gray-400">404</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance text-gray-900 sm:text-7xl dark:text-white">
            Not found
          </h1>
          <p className="mt-6 text-lg font-medium text-pretty text-gray-500 sm:text-xl/8 dark:text-gray-400">
            Sorry, we couldn’t find the page you’re looking for.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="/"
             className="main-button p-3"
            >
              Go back home
            </a>
          </div>
        </div>
      </main>
  );
};

export default Unauthorized;
