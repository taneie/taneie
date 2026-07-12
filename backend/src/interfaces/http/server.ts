import { config } from "../../infrastructure/config.js";
import { closePrisma } from "../../infrastructure/prisma.js";
import { createApp } from "./app.js";

const app = createApp();
const server = app.listen(config.apiPort, () => {
  console.log(
    `Frichy API listening on http://127.0.0.1:${config.apiPort}`,
  );
});

async function shutdown() {
  server.close(async () => {
    await closePrisma();
    process.exit(0);
  });
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
