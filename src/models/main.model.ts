import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
import fs from "fs";
import path from "path";

export const mainModel = {
  async getAll() {
    try {
      const items = "await prisma.main.findMany()";
      return { success: true, data: items };

    } catch (error) {
      console.error(error);
      return { success: false, error: "Failed to fetch main items." };
    }
  },

  async add(tableName: string, entityId: string) {
    try {
      const item = "New Item"
      return { success: true, data: item };
    } catch (error) {
      console.error(error);
      return { success: false, error: "Failed to add item to main." };
    }
  },

};
