import React from 'react';

const Unauthorized: React.FC = () => {

  return (
    <main className="grid min-h-screen w-full place-items-center  px-6 py-24 sm:py-32 lg:px-8 bg-[var(--dark-bg)]">
        <div className="text-center">
          <p className="text-base font-semibold text-gray-400">401</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight text-balance sm:text-7xl text-white">
            Unauthorized access
          </h1>
          <p className="mt-6 text-lg font-medium text-pretty  sm:text-xl/8 text-gray-400">
            Sorry, you are not authorized to access this page.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href="/"
              className="main-button p-3">
              Go back home
            </a>
            <a href="/login" className="text-sm font-semibold  text-white">
              Login <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </div>
      </main>
  );
};

export default Unauthorized;
