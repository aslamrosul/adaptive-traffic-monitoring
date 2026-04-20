import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "./api/auth/[...nextauth]/route";

export default async function Home() {
  const session = await getServerSession(authOptions);
  
  // If logged in, go to dashboard
  if (session) {
    redirect("/dashboard");
  }
  
  // If not logged in, go to landing page
  redirect("/landing");
}
