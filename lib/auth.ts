import { containers } from "@/lib/azure-cosmos";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email dan password harus diisi");
        }

        try {
          const container = containers.users;
          
          // Query user by email
          const { resources: users } = await container.items
            .query({
              query: "SELECT * FROM c WHERE c.email = @email",
              parameters: [{ name: "@email", value: credentials.email }],
            })
            .fetchAll();

          const user = users[0];

          if (!user) {
            throw new Error("Email atau password salah");
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error("Email atau password salah");
          }

          // Return user object (without password)
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
          };
        } catch (error: any) {
          console.error("Auth error:", error);
          throw new Error(error.message || "Gagal login");
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async signIn({ user, account, profile }) {
      // Handle Google sign in
      if (account?.provider === "google") {
        try {
          const container = containers.users;

          // Check if user exists
          const { resources: existingUsers } = await container.items
            .query({
              query: "SELECT * FROM c WHERE c.email = @email",
              parameters: [{ name: "@email", value: user.email }],
            })
            .fetchAll();

          if (existingUsers.length === 0) {
            // Create new user from Google account
            const newUser = {
              id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              name: user.name || "User",
              email: user.email!,
              password: "", // No password for OAuth users
              role: "operator",
              avatar: user.image || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || "User")}&background=0040a1&color=fff`,
              status: "active",
              provider: "google",
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            };

            await container.items.create(newUser);
          }

          return true;
        } catch (error) {
          console.error("Error in Google sign in:", error);
          return false;
        }
      }

      return true;
    },
    async jwt({ token, user, account }) {
      if (user) {
        // For Google OAuth, fetch user from database
        if (account?.provider === "google") {
          try {
            const container = containers.users;
            const { resources: users } = await container.items
              .query({
                query: "SELECT * FROM c WHERE c.email = @email",
                parameters: [{ name: "@email", value: user.email }],
              })
              .fetchAll();

            if (users.length > 0) {
              const dbUser = users[0];
              token.id = dbUser.id;
              token.email = dbUser.email;
              token.name = dbUser.name;
              token.role = dbUser.role;
              token.avatar = dbUser.avatar;
            }
          } catch (error) {
            console.error("Error fetching user in JWT callback:", error);
          }
        } else {
          // For credentials login
          token.id = user.id;
          token.email = user.email;
          token.name = user.name;
          token.role = (user as any).role;
          token.avatar = (user as any).avatar;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).avatar = token.avatar;
      }
      return session;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
