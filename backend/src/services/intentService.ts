import prisma from "../db.ts";

export const getAllIntentsService = async (userId: string) => {
  return await prisma.intent.findMany({
    where: {
      userId,
      status: {
        in: ["ACTIVE", "CLARIFICATION_REQUESTED"],
      },
    },
    include: {
      tasks: true,
    },
  });
};
