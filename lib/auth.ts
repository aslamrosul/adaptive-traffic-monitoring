import { awsTables, dynamo } from "@/lib/aws-dynamodb";
import { GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

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
      if (user) {
        if (account?.provider === "google") {
          try {
            if (user.email) {
              const dbUser = await getUserByEmail(user.email);

              if (dbUser) {
                token.id = dbUser.id;
                token.email = dbUser.email;
                token.name = dbUser.name;
                token.role = dbUser.role;
                token.avatar = dbUser.avatar;
              }
            }
          } catch (error) {
            console.error("Error fetching user in JWT callback:", error);
          }
        } else {
          token.id = (user as any).id;
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