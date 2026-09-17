import SignInForm from "@/components/auth/SignInForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SignIn Page | MultiKoisas",
  description: "This is Next.js Signin Page MultiKoisas",
};

export default function SignIn() {
  return <SignInForm />;
}
