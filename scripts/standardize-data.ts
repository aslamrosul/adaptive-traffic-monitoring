import { containers } from "../lib/azure-cosmos";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function standardizeData() {
  try {
    console.log("🔧 Standardizing Database Data\n");

    // 1. Fix Users - add missing avatar field
    console.log("1️⃣ Fixing Users Collection...");
    const usersContainer = containers.users;
    const { resources: users } = await usersContainer.items
      .query("SELECT * FROM c")
      .fetchAll();

    let usersFixed = 0;
    for (const user of users as any[]) {
      let needsUpdate = false;
      const updates: any = { ...user };

      // Add avatar if missing
      if (!user.avatar) {
        updates.avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0040a1&color=fff`;
        needsUpdate = true;
      }

      // Standardize role to lowercase
      if (user.role && user.role !== user.role.toLowerCase()) {
        updates.role = user.role.toLowerCase();
        needsUpdate = true;
      }

      // Add provider if missing
      if (!user.provider) {
        updates.provider = "credentials";
        needsUpdate = true;
      }

      // Add timestamps if missing
      if (!user.createdAt) {
        updates.createdAt = new Date().toISOString();
        needsUpdate = true;
      }
      if (!user.updatedAt) {
        updates.updatedAt = new Date().toISOString();
        needsUpdate = true;
      }

      if (needsUpdate) {
        await usersContainer.item(user.id, user.email).replace(updates);
        usersFixed++;
        console.log(`   ✅ Fixed user: ${user.name}`);
      }
    }
    console.log(`   Total users fixed: ${usersFixed}\n`);

    // 2. Fix Intersections - remove duplicates and standardize
    console.log("2️⃣ Fixing Intersections Collection...");
    const intersectionsContainer = containers.intersections;
    const { resources: intersections } = await intersectionsContainer.items
      .query("SELECT * FROM c")
      .fetchAll();

    console.log(`   Found ${intersections.length} intersections`);

    // Group by name to find duplicates
    const intersectionsByName = new Map<string, any[]>();
    for (const intersection of intersections) {
      const name = intersection.name;
      if (!intersectionsByName.has(name)) {
        intersectionsByName.set(name, []);
      }
      intersectionsByName.get(name)!.push(intersection);
    }

    let intersectionsFixed = 0;
    let intersectionsDeleted = 0;

    // Process each unique intersection
    for (const [name, duplicates] of intersectionsByName.entries()) {
      // Keep the first one, delete the rest
      const keeper = duplicates[0];
      
      // Ensure keeper has proper structure
      let needsUpdate = false;
      const updates: any = { ...keeper };

      // Add deviceId if missing
      if (!keeper.deviceId) {
        updates.deviceId = `device-${keeper.id}`;
        needsUpdate = true;
      }

      // Add address if missing
      if (!keeper.address) {
        updates.address = `${keeper.name}, Jakarta`;
        needsUpdate = true;
      }

      // Ensure lanes structure
      if (!keeper.lanes || !keeper.lanes.count) {
        updates.lanes = {
          count: 4,
          directions: ["north", "east", "south", "west"],
        };
        needsUpdate = true;
      }

      // Ensure config structure
      if (!keeper.config) {
        updates.config = {
          mode: "auto",
          threshold: {
            low: 50,
            medium: 100,
            high: 200,
            critical: 300,
          },
          alertEnabled: true,
          cycleTime: {
            min: 30,
            max: 120,
          },
        };
        needsUpdate = true;
      }

      // Add timestamps if missing
      if (!keeper.createdAt) {
        updates.createdAt = new Date().toISOString();
        needsUpdate = true;
      }
      if (!keeper.updatedAt) {
        updates.updatedAt = new Date().toISOString();
        needsUpdate = true;
      }

      // Update keeper if needed
      if (needsUpdate) {
        try {
          await intersectionsContainer.item(keeper.id, updates.deviceId).replace(updates);
          intersectionsFixed++;
          console.log(`   ✅ Fixed intersection: ${keeper.name}`);
        } catch (error: any) {
          console.log(`   ⚠️  Could not update ${keeper.name}: ${error.message}`);
        }
      }

      // Delete duplicates
      for (let i = 1; i < duplicates.length; i++) {
        const duplicate = duplicates[i];
        try {
          await intersectionsContainer.item(duplicate.id, duplicate.deviceId || `device-${duplicate.id}`).delete();
          intersectionsDeleted++;
          console.log(`   🗑️  Deleted duplicate: ${duplicate.name} (${duplicate.id})`);
        } catch (error: any) {
          console.log(`   ⚠️  Could not delete duplicate ${duplicate.name}: ${error.message}`);
        }
      }
    }
    
    console.log(`   Total intersections fixed: ${intersectionsFixed}`);
    console.log(`   Total duplicates deleted: ${intersectionsDeleted}\n`);

    console.log("✨ Standardization complete!");
  } catch (error) {
    console.error("❌ Error:", error);
  }
}

standardizeData();
