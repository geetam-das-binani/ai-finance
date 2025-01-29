import { seedTransactions } from "@/actions/seed";

export const GET = async () => {
  const response=await seedTransactions();
  return Response.json(response);
};
