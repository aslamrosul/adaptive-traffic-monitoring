import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { createActivityLog } from "@/lib/activity-log-service";

async function getUserByEmail(email: string) {
  const normalizedEmail = String(email).trim().toLowerCase();

  const result = await dynamo.send(
    new GetCommand({
      TableName: awsTables.users,
      Key: {
        email: normalizedEmail,
      },
    })
  );

  return result.Item || null;
}

async function createGoogleUser(user: {
  email: string;
  name?: string | null;
  image?: string | null;
}) {
  const normalizedEmail = String(user.email).trim().toLowerCase();
  const now = new Date().toISOString();

  const newUser = {
    email: normalizedEmail,
    id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    name: user.name || "User",
    password: "",
    role: "operator",
    avatar:
      user.image ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        user.name || "User"
      )}&background=0040a1&color=fff`,
    status: "active",
    provider: "google",
    createdAt: now,
    updatedAt: now,
  };

  await dynamo.send(
    new PutCommand({
      TableName: awsTables.users,
      Item: newUser,
      ConditionExpression: "attribute_not_exists(email)",
    })
  );

  return newUser;
}

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
          const user = await getUserByEmail(credentials.email);

          if (!user) {
            throw new Error("Email atau password salah");
          }

          if (!user.password) {
            throw new Error(
              "Akun ini dibuat dengan Google. Silakan login menggunakan Google."
            );
          }

          if (user.status && user.status !== "active") {
            throw new Error("Akun tidak aktif");
          }

          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            throw new Error("Email atau password salah");
          }

          // Update login info and log activity
          const updatedUser = {
            ...user,
            lastLoginAt: new Date().toISOString(),
            totalLogin: Number(user.totalLogin || 0) + 1,
            updatedAt: new Date().toISOString(),
          };

          await dynamo.send(
            new PutCommand({
              TableName: awsTables.users,
              Item: updatedUser,
            })
          );

          await createActivityLog({
            userId: String(user.id),
            email: String(user.email),
            name: String(user.name),
            type: "auth.login",
            action: "Login ke sistem",
            description: "Pengguna berhasil masuk menggunakan email dan password",
            metadata: {
              provider: "credentials",
            },
          }).catch((error) => {
            console.error("Failed to log login:", error);
          });

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            avatar: user.avatar,
          } as any;
        } catch (error: any) {
          console.error("Auth error:", error);
          throw new Error(error.message || "Gagal login");
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },

  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        try {
          if (!user.email) {
            return false;
          }

          const existingUser = await getUserByEmail(user.email);

          if (!existingUser) {
            await createGoogleUser({
              email: user.email,
              name: user.name,
              image: user.image,
            });
          }

          return true;
        } catch (error: any) {
          if (error.name === "ConditionalCheckFailedException") {
            return true;
          }

          console.error("Error in Google sign in:", error);
          return false;
        }
      }

      return true;
    },

    async jwt({ token, user, account }) {
      if (user?.email) {
        token.email = String(user.email).trim().toLowerCase();
      }

      const email =
        typeof token.email === "string" ? token.email.trim().toLowerCase() : "";

      if (email) {
        try {
          const dbUser = await getUserByEmail(email);

          if (dbUser) {
            const isGoogle = account?.provider === "google" || !user;
            if (isGoogle && user?.email) {
              // Update info login untuk Google (abaikan kegagalan tulis).
              const updatedUser = {
                ...dbUser,
                lastLoginAt: new Date().toISOString(),
                totalLogin: Number(dbUser.totalLogin || 0) + 1,
                updatedAt: new Date().toISOString(),
              };

              await dynamo
                .send(
                  new PutCommand({
                    TableName: awsTables.users,
                    Item: updatedUser,
                  })
                )
                .catch((error) => {
                  console.error("Failed to update login info:", error);
                });

              if (user.image && !dbUser.avatar) {
                try {
                  await createActivityLog({
                    userId: String(dbUser.id),
                    email: String(dbUser.email),
                    name: String(dbUser.name),
                    type: "auth.login",
                    action: "Login ke sistem",
                    description: "Pengguna berhasil masuk menggunakan Google",
                    metadata: { provider: "google" },
                  });
                } catch (error) {
                  console.error("Failed to log Google login:", error);
                }
              }
            }

            if (dbUser.status && dbUser.status !== "active") {
              // Nonaktif: cabut hak, jangan pernah naikkan.
              token.id = dbUser.id;
              token.email = dbUser.email;
              token.name = dbUser.name;
              token.role = "operator";
              token.avatar = dbUser.avatar;
              token.userStatus = "inactive";
            } else {
              token.id = dbUser.id;
              token.email = dbUser.email;
              token.name = dbUser.name;
              token.role = dbUser.role === "admin" ? "admin" : "operator";
              token.avatar = dbUser.avatar || dbUser.photoURL || token.picture;
              token.userStatus = "active";
            }
          } else if (!token.role) {
            // Tanpa record DB dan tanpa role: least-privilege.
            token.role = "operator";
          }
        } catch (error) {
          console.error("Error refreshing user in JWT callback:", error);
          // Gagal lookup: pertahankan role valid yang ada, else operator.
          // TIDAK PERNAH naikkan hak karena error.
          if (token.role !== "admin" && token.role !== "operator") {
            token.role = "operator";
          }
        }
      } else if (!token.role) {
        token.role = "operator";
      }

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role === "admin" ? "admin" : "operator";
        (session.user as any).avatar = token.avatar;
        (session.user as any).userStatus = (token as any).userStatus || "active";
      }

      return session;
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
};