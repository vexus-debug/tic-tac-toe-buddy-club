import { useMemo } from "react";
import { useLabRecords } from "@/hooks/useLabRecords";
import { workTypeOptions, shadeOptions, findShade, type CatalogRecord } from "@/lib/labCatalog";

/** Live Work Types catalogue (with built-in defaults) for case intake. */
export function useWorkTypeCatalog() {
  const { data = [] } = useLabRecords("work-types");
  return useMemo(() => workTypeOptions(data as CatalogRecord[]), [data]);
}

/** Alias: active restorations from the catalogue, falling back to defaults. */
export const useWorkTypes = useWorkTypeCatalog;

/** Shade codes from the Shade Library (plus VITA Classical) and a lookup for notes. */
export function useShadeLibrary() {
  const { data = [] } = useLabRecords("shades");
  return useMemo(() => ({
    options: shadeOptions(data as CatalogRecord[]),
    find: (code?: string | null) => findShade(data as CatalogRecord[], code),
  }), [data]);
}
