const config = {
    preset: "ts-jest/presets/default-esm",
    testEnvironment: "node",
    extensionsToTreatAsEsm: [".ts"],
    moduleNameMapper: {
        "^(\\.{1,2}/.*)\\.js$": "$1",
    },
    transform: {
        "^.+\\.(t|j)sx?$": [
            "ts-jest",
            {
                useESM: true,
                tsconfig: "<rootDir>/tsconfig.json",
            },
        ],
    },
    testMatch: ["<rootDir>/src/__tests__/**/*.test.ts"],
};

module.exports = config;
