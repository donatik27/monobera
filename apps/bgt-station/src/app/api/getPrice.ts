import { type Pool, type RouterService } from "@bera/bera-router";
import { getAddress, parseUnits } from "viem";
import { type Address } from "wagmi";

import { honeyAddress } from "../../config";

export interface MappedTokens {
  [key: string]: number;
}

const BASE_TOKEN = getAddress(honeyAddress);

export const getBaseTokenPrice = async (
  pools: Pool[],
  router: RouterService,
) => {
  let mappedTokens: MappedTokens = {};

  if (pools.length) {
    const allPoolPromises: any[] = [];
    pools.forEach((pool) => {
      const tokenPromises = pool.tokens
        .filter((token: { address: string }) => token.address !== BASE_TOKEN)
        .map((token: { address: any; decimals: number }) =>
          router
            .getSwaps(
              token.address,
              BASE_TOKEN,
              0,
              parseUnits(`${1}`, token.decimals),
            )
            .catch(() => {
              return undefined;
            }),
        );

      allPoolPromises.push(tokenPromises);
    });

    const allPoolData = (await Promise.all(allPoolPromises.flat())).filter(
      (pool) => pool !== undefined,
    );

    mappedTokens = allPoolData?.length
      ? allPoolData?.reduce(
          (acc, cur) => {
            acc[cur.tokenIn] = cur.formattedReturnAmount;
            return acc;
          },
          { [BASE_TOKEN]: "1" },
        )
      : undefined;
  }

  return mappedTokens;
};

export const getWBeraPriceForToken = (
  prices: MappedTokens,
  token: Address,
  amount: number,
) => {
  if (!prices) return 0;
  if (!token) return 0;
  if (!prices[token]) return 0;
  const priceInBera = Number(prices[token]);
  return priceInBera * amount;
};