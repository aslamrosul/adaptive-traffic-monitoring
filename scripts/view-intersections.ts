import { containers } from "../lib/azure-cosmos";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function viewIntersections() {
  try {
    console.log("🚦 Viewing Intersections Collection\n");

    const container = containers.intersections;

    // Get all intersections
    const { resources: intersections } = await container.items
      .query("SELECT * FROM c")
      .fetchAll();

    console.log(`Total Intersections: ${intersections.length}\n`);

    intersections.forEach((int: any, idx: number) => {
      console.log(`${idx + 1}. ${int.name}`);
      console.log(`   ID: ${int.id}`);
      console.log(`   Device ID: ${int.deviceId}`);
      console.log(`   Status: ${int.status}`);
      console.log(`   Address: ${int.address}`);
      console.log(`   Location: ${int.location?.lat}, ${int.location?.lng}`);
      console.log(`   Lanes: ${int.lanes?.count || 4} lanes`);
      console.log(`   Mode: ${int.config?.mode || "auto"}`);
      console.log("");
    });
  } catch (error) {
    console.error("Error:", error);
  }
}

viewIntersections();
