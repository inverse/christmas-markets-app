import type { PageLoad } from "./$types";
import markets from "../../data/markets.json";
import type { Market } from "$shared/types";

export const load: PageLoad = () => {
  return {
    markets: markets as Market[],
  };
};
