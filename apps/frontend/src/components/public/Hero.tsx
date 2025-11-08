
export const Hero = () => {
  return (
    <div className="bg-[var(--dark-bg)]">
      <div className="relative isolate px-6 pt-14 lg:px-8">
        <svg
          aria-hidden="true"
          className="absolute inset-0 -z-10 size-full 
              mask-[radial-gradient(100%_100%_at_top_right,white,transparent)] stroke-white/10"
        >
          <defs>
            <pattern
              x="50%"
              y={-1}
              id="83fd4e5a-9d52-42fc-97b6-718e5d7ee527"
              width={200}
              height={200}
              patternUnits="userSpaceOnUse"
            >
              <path d="M100 200V.5M.5 .5H200" fill="none" />
            </pattern>
          </defs>
          <svg x="50%" y={-1} className="overflow-visible fill-gray-800/50">
            <path
              d="M-100.5 0h201v201h-201Z M699.5 0h201v201h-201Z M499.5 400h201v201h-201Z M-300.5 600h201v201h-201Z"
              strokeWidth={0}
            />
          </svg>
          <rect
            fill="url(#83fd4e5a-9d52-42fc-97b6-718e5d7ee527)"
            width="100%"
            height="100%"
            strokeWidth={0}
          />
        </svg>
        <div className="mx-auto max-w-4xl py-32 sm:py-48 lg:py-56">
          <div className="">
            <h1 className="text-5xl font-bold tracking-tight text-balance text-white sm:text-8xl">
              Events tracking
              <br />
              {/* <span className="bg-gradient-to-r from-[var(--dark-orange-accent)]
                                 to-orange-500 bg-clip-text text-transparent">made simple</span> */}
              <span className="relative whitespace-nowrap">
                <svg
                  aria-hidden="true"
                  viewBox="0 0 418 42"
                  className="absolute top-2/3 left-0 h-[0.58em] w-full fill-white/20"
                  preserveAspectRatio="none"
                >
                  <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z" />
                </svg>
                <span
                  className="relative bg-gradient-to-r from-white/70
                                 to-white bg-clip-text text-transparent"
                >
                  made simple
                </span>
              </span>{" "}
            </h1>
            <p className="mt-8 font-medium text-pretty text-gray-400 sm:text-xl/8 max-w-xl  ">
              From critical bugs to users behavior,{" "}
              <b className="font-semibold text-white">TrakrLog</b> captures
              every detail around your game or saas.
            </p>
            {import.meta.env.VITE_WAITLISTENABLED === "false" && (
              <div className="mt-10 flex items-center   gap-x-6">
                <a href="/login" className="main-button p-3">
                  Get Started for free
                </a>
                <a href="https://github.com/trakrlog-com" className="font-semibold leading-6 text-white">
                  Documentation <span aria-hidden="true">→</span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
