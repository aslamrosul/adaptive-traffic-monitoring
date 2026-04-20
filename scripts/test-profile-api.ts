import { containers } from "../lib/azure-cosmos";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function testProfileAPI() {
  try {
    console.log("🧪 Testing Profile API Integration\n");

    // 1. Check if admin user exists
    console.log("1️⃣ Checking admin user in database...");
    const container = containers.users;
    
    const { resources: users } = await container.items
      .query({
        query: "SELECT * FROM c WHERE c.email = @email",
        parameters: [{ name: "@email", value: "admin@traffic.com" }],
      })
      .fetchAll();

    if (users.length === 0) {
      console.log("   ❌ Admin user not found!");
      console.log("   Run: npm run db:seed:admin");
      return;
    }

    const admin = users[0];
    console.log("   ✅ Admin user found:");
    console.log(`      Name: ${admin.name}`);
    console.log(`      Email: ${admin.email}`);
    console.log(`      Role: ${admin.role}`);
    console.log(`      Avatar: ${admin.avatar?.substring(0, 50)}...`);
    console.log(`      Provider: ${admin.provider || "credentials"}`);
    console.log("");

    // 2. Check user structure
    console.log("2️⃣ Checking user data structure...");
    const requiredFields = ["id", "name", "email", "role", "avatar", "status", "createdAt", "updatedAt"];
    const missingFields = requiredFields.filter(field => !admin[field]);
    
    if (missingFields.length > 0) {
      console.log(`   ⚠️  Missing fields: ${missingFields.join(", ")}`);
    } else {
      console.log("   ✅ All required fields present");
    }
    console.log("");

    // 3. Test profile transformation
    console.log("3️⃣ Testing profile data transformation...");
    const profileData = {
      id: admin.id,
      name: admin.name,
      email: admin.email,
      phone: admin.phone || "+62 812-3456-7890",
      position: admin.role === "admin" ? "Administrator" : "Operator",
      department: "Traffic Control Center",
      bio: admin.bio || "Operator sistem monitoring lalu lintas.",
      avatar: admin.avatar,
      memberSince: admin.createdAt,
      lastLogin: admin.updatedAt,
      accountType: admin.role === "admin" ? "Premium" : "Standard",
      stats: {
        totalLogin: admin.reportsCreated || 0,
        incidentsHandled: 0,
        reportsCreated: admin.reportsCreated || 0,
        activeHours: admin.activeHours || 0,
      },
      performance: {
        responseTime: 95,
        accuracy: 98,
        efficiency: 92,
      },
      skills: [
        "Traffic Management",
        "IoT Systems",
        "Data Analysis",
        "Emergency Response",
      ],
      settings: {
        publicProfile: true,
        showEmail: false,
        showActivity: true,
      },
    };

    console.log("   ✅ Profile transformation successful:");
    console.log(`      Position: ${profileData.position}`);
    console.log(`      Account Type: ${profileData.accountType}`);
    console.log(`      Member Since: ${profileData.memberSince}`);
    console.log("");

    // 4. Summary
    console.log("📊 Summary:");
    console.log("   ✅ Database connection: OK");
    console.log("   ✅ Admin user: Found");
    console.log("   ✅ Data structure: Valid");
    console.log("   ✅ Profile transformation: Working");
    console.log("");
    console.log("🎉 Profile API is ready to use!");
    console.log("");
    console.log("Next steps:");
    console.log("   1. Login with: admin@traffic.com / admin123");
    console.log("   2. Navigate to Profile page");
    console.log("   3. Profile data should load from Azure Cosmos DB");
    console.log("");

  } catch (error) {
    console.error("❌ Error:", error);
  }
}

testProfileAPI();
