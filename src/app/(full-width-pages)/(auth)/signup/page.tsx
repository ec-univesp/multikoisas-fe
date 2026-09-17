import SignUpForm from "@/components/auth/SignUpForm";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SignUp Page | MultiKoisas",
  description: "This is Next.js SignUp Page MultiKoisas",
  // other metadata
};

export default function SignUp() {
  return <SignUpForm />;
}
