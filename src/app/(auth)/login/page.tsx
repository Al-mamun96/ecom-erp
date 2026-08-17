import { getBusinessByHost } from "@/lib/host";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  // On a client's custom domain, brand the login and hide public signup.
  const hostBusiness = await getBusinessByHost();
  return <LoginForm brand={hostBusiness?.name ?? null} allowSignup={!hostBusiness} />;
}
