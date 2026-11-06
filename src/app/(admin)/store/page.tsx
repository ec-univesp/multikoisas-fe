import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configurações de site | MultiKoisas",
  description: "Configurações do site da MultiKoisas.",
};

export default function StorePage() {
  return (
    <div>
      <h1>Configurações de site</h1>
      <p>Gerencie as informações públicas da loja.</p>
    </div>
  );
}
