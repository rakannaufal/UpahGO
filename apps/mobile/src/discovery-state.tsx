import React, { createContext, useContext, useState } from "react";
import { emptyFilters, type DiscoveryFilters } from "../../../shared/jobs";
import { useSession } from "./session";
const Context = createContext({
  filters: emptyFilters,
  setFilters: (_filters: DiscoveryFilters) => {},
});
export function DiscoveryProvider({ children }: { children: React.ReactNode }) {
  const { data } = useSession();
  const key = `${data?.account.id ?? ""}:${data?.account.role ?? ""}`;
  return <FilterScope key={key}>{children}</FilterScope>;
}
function FilterScope({ children }: { children: React.ReactNode }) {
  const [filters, setFilters] = useState(emptyFilters);
  return (
    <Context.Provider value={{ filters, setFilters }}>
      {children}
    </Context.Provider>
  );
}
export const useDiscoveryFilters = () => useContext(Context);
