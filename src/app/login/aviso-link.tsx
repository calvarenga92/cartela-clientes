"use client";

import { useSearchParams } from "next/navigation";

export function AvisoLink() {
  const searchParams = useSearchParams();
  if (searchParams.get("erro") !== "link") return null;

  return (
    <p role="alert" className="mb-6 rounded-xl bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
      Esse link expirou ou já foi usado. Peça um novo para quem liberou seu acesso.
    </p>
  );
}
