import { containers } from "../lib/azure-cosmos";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function viewUsers() {
  try {
    console.log("📋 Viewing Users Collection\n");

    const container = containers.users;

    // Get all users
    const { resources: users } = await container.items
      .query("SELECT * FROM c")
      .fetchAll();

    console.log(`Total Users: ${users.length}\n`);

    users.forEach((user: any, idx: number) => {
      console.log(`${idx + 1}. ${user.name}`);
      console.log(`   ID: ${user.id}`);
      console.log(`   Email: ${user.email}`);
      console.log(`   Role: ${user.role}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Provider: ${user.provider || "credentials"}`);
      console.log(`   Avatar: ${user.avatar?.substring(0, 50)}...`);
      console.log(`   Created: ${user.createdAt}`);
      console.log("");
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

viewUsers();
