module.exports = {
  testEnvironment: "jsdom",
  transform: { "^.+\\.(ts|tsx)$": "babel-jest" },
  testMatch: ["**/*.test.ts", "**/*.test.tsx"],
  moduleNameMapper: { "\\.(css|less|scss|sass)$": "identity-obj-proxy" },
};
