// import { FusionSDK, PrivateKeyProviderConnector } from "@1inch/fusion-sdk";
// import Web3 from "web3";

import { Address, AuctionDetails, FusionOrder } from "@1inch/fusion-sdk";
import { getQuote, placeOrder } from "./utils";

// const makerPrivateKey =
//   "a55c28a75ee03bf5234564b003a08553db4f6fa938a6ee5bc24866db68edf39d";
// const makerAddress = "0xCB05FE33C5396E006d32788b22baD1EcfbD3Fa2e";

// const nodeUrl = "https://bsc-dataseed1.binance.org/";

// const blockchainProvider = new PrivateKeyProviderConnector(
//   makerPrivateKey,
//   new Web3(nodeUrl) as any
// );

// const sdk = new FusionSDK({
//   url: "https://fusion.1inch.io",
//   network: 56,
//   blockchainProvider,
// });

// sdk
//   .placeOrder({
//     fromTokenAddress: "0xaA9826732f3A4973FF8B384B3f4e3c70c2984651", // XPRESS
//     toTokenAddress: "0xbb4cdb9cbd36b01bd1cbaebf2de08d9173bc095c", // BNB
//     amount: "200000000000000000000", // 0.01 ETH
//     walletAddress: makerAddress,
//   })
//   .then(console.log);

function getWhitelist(
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

getQuote().then((quote) => {
  const signature = "";
  const extensionContract = new Address(quote.settlementAddress);
  const startTime =
    BigInt(Math.floor(Date.now() / 1000)) +
    BigInt(quote.presets[quote.recommended_preset].startAuctionIn);
  const order = FusionOrder.new(
    extensionContract,
    {
      makerAsset: new Address("0xaA9826732f3A4973FF8B384B3f4e3c70c2984651"),
      takerAsset: new Address("0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c"),
      makingAmount: BigInt(quote.fromTokenAmount),
      takingAmount: BigInt(quote.toTokenAmount),
      maker: new Address("0xCB05FE33C5396E006d32788b22baD1EcfbD3Fa2e"),
      salt: BigInt(10),
      receiver: new Address("0xCB05FE33C5396E006d32788b22baD1EcfbD3Fa2e"),
    },
    {
      auction: new AuctionDetails({
        duration: BigInt(
          quote.presets[quote.recommended_preset].auctionDuration
        ),
        startTime: startTime,
        initialRateBump:
          quote.presets[quote.recommended_preset].initialRateBump,
        points: quote.presets[quote.recommended_preset].points,
      }),
      whitelist: getWhitelist(
        startTime,
        quote.whitelist,
        quote.presets[quote.recommended_preset].exclusiveResolver
      ),
    },
    {
      unwrapWETH: true,
    }
  );

  const builtOrder = order.build();
  const extension = order.extension.encode();

  console.log(JSON.stringify(order.getTypedData(56)));

  //   placeOrder({
  //     order: builtOrder,
  //     signature: signature,
  //     extension: extension,
  //     quoteId: quote.quoteId,
  //   }).then((orderDetails) => {
  //     console.log(orderDetails);
  //   });
});
