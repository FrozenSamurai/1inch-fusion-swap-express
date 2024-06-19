import { Address, LimitOrderV4Struct } from "@1inch/fusion-sdk";
import axios from "axios";

export function serializer(data: object): object {
  return JSON.parse(
    JSON.stringify(data, (key, value) =>
      typeof value === "bigint" ? value.toString() : value
    )
  );
}

export async function getQuote({
  fromTokenAddress,
  toTokenAddress,
  amount,
  walletAddress,
}: {
  fromTokenAddress: string;
  toTokenAddress: string;
  amount: string;
  walletAddress: string;
}) {
  const url = "https://api.1inch.dev/fusion/quoter/v2.0/56/quote/receive";

  const config = {
    headers: {
      Authorization: "Bearer xiPuMO6clvukZHMZYqNKd7vTZ75cQ9ev",
    },
    params: {
      fromTokenAddress,
      toTokenAddress,
      amount,
      walletAddress,
      enableEstimate: "true",
      isLedgerLive: "true",
    },
  };

  try {
    const response = await axios.get(url, config);
    return response.data;
  } catch (error) {
    console.error(error);
    return {};
  }
}

export async function placeOrder({
  order,
  signature,
  extension,
  quoteId,
}: {
  order: LimitOrderV4Struct;
  signature: string;
  extension: string;
  quoteId: string;
}) {
  const url = "https://api.1inch.dev/fusion/relayer/v2.0/56/order/submit";

  const config = {
    headers: {
      Authorization: "Bearer xiPuMO6clvukZHMZYqNKd7vTZ75cQ9ev",
    },
    params: {
      order: order,
      signature: signature,
      extension: extension,
      quoteId: quoteId,
    },
  };

  try {
    const response = await axios.post(url, config);
    return response.data;
  } catch (error) {
    console.error(error);
  }
}

export function getWhitelist(
  auctionStartTime: bigint,
  whitelist: Address[],
  exclusiveResolver?: Address
) {
  if (exclusiveResolver) {
    return whitelist.map((resolver) => {
      const isExclusive = resolver.equal(exclusiveResolver);

      return {
        address: resolver,
        allowFrom: isExclusive ? BigInt(0) : auctionStartTime,
      };
    });
  }

  return whitelist.map((resolver) => ({
    address: resolver,
    allowFrom: BigInt(0),
  }));
}
