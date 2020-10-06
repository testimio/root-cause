"use strict";

const port = process.env.TEST_SERVER_PORT ? Number(process.env.TEST_SERVER_PORT) : 8080;

module.exports = {
  browserContext: "incognito",
  exitOnPageError: false,
  launch: {
    slowMo: process.env.SLOW_MO ? Number.parseInt(process.env.SLOW_MO) : undefined,
    headless: process.env.HEADLESS !== "false",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  },
  // server: {
  //   command: `cross-env PORT=${port} http-server ../todomvc-c50cc922495fd76cb44844e3b1cd77e35a5d6be1/examples`,
  //   port,
  //   launchTimeout: 4000,
  // },
};
