"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SelectionRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/dashboard/ecole");
  }, [router]);
  return null;
}
