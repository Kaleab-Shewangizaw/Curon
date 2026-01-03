import prisma from "../db.ts";

export const getAllIntentsService = async () => {
  return await prisma.intent.findMany({
    include: {
      tasks: true,
    },
  });
};
