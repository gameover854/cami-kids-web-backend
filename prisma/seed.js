const prisma = require("../config/prisma");
const { seed } = require("../seeder");

seed()
  .then(async () => {
    await prisma.$disconnect();
    console.log("Prisma seed completed.");
  })
  .catch(async (error) => {
    console.error("Prisma seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });
