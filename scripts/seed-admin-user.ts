import { containers } from "../lib/azure-cosmos";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";

// Load environment variables
dotenv.config({ path: ".env.local" });

async function seedAdminUser() {
  try {
    console.log("🔐 Seeding admin user...");

    const container = containers.users;

    // Check if admin already exists
    const { resources: existingAdmins } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: "admin@traffic.com" }],
      })
      .fetchAll();

    if (existingAdmins.length > 0) {
      console.log("✅ Admin user already exists");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash("admin123", 10);

    // Create admin user
    const adminUser = {
      id: "user-admin-001",
      name: "Administrator",
      email: "admin@traffic.com",
      password: hashedPassword,
      role: "admin",
      avatar: "https://ui-avatars.com/api/?name=Administrator&background=0040a1&color=fff",
      status: "active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await container.items.create(adminUser);

    console.log("✅ Admin user created successfully");
    console.log("📧 Email: admin@traffic.com");
    console.log("🔑 Password: admin123");
  } catch (error) {
    console.error("❌ Error seeding admin user:", error);
    throw error;
  }
}

seedAdminUser()
  .then(() => {
    console.log("✅ Seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  });
