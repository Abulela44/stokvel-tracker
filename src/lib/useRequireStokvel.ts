import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useStokvel } from "@/lib/data";

/** Loads the signed-in admin's stokvel, sending them to setup when none exists. */
export function useRequireStokvel() {
  const navigate = useNavigate();
  const query = useStokvel();

  useEffect(() => {
    if (!query.isLoading && !query.data) navigate({ to: "/setup", replace: true });
  }, [query.isLoading, query.data, navigate]);

  return query;
}
