import { JobService } from "../../application/services.js";
import { closePrisma, prisma } from "../../infrastructure/prisma.js";

async function main() {
  const result = await new JobService(prisma).importExternalProjects();
  console.log(JSON.stringify(result, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePrisma();
  });
