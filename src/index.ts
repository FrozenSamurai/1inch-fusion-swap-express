import {
  Address,
  AuctionDetails,
  FusionSDK,
  NetworkEnum,
  FusionOrder,
  ONE_INCH_LIMIT_ORDER_V4,
} from "@1inch/fusion-sdk";

import express, { Request, Response } from "express";
import { getQuote, placeOrder, serializer } from "./utils";
import { getWhitelist } from "./utils";
import cors from "cors";

const app = express();
const port = 8000;

app.use(cors());

app.use(express.json());

// Initialize 1inch Fusion SDK
const sdk = new FusionSDK({
  url: "https://api.1inch.dev/fusion",
  network: NetworkEnum.BINANCE,
  authKey: "xiPuMO6clvukZHMZYqNKd7vTZ75cQ9ev",
});

app.get("/getquote", async (req: Request, res: Response) => {
  console.log(req, "orders");

  const { fromTokenAddress, toTokenAddress, amount, walletAddress } = req.query;
  // Get the quote
  try {
    const quote = await sdk.getQuote({
      fromTokenAddress: fromTokenAddress as string,
      toTokenAddress: toTokenAddress as string,
      amount: amount as string,
      walletAddress: walletAddress as string,
    });
    console.log("Quote:", quote);
    const serializedQuote = serializer(quote);
    res.send(serializedQuote);
  } catch (error) {
    console.error("Error getting quote:", error);
  }
});

app.post("/order", async (req: Request, res: Response) => {
  const { fromTokenAddress, toTokenAddress, amount, walletAddress } = req.body;

  const quote = await getQuote({
    fromTokenAddress,
    toTokenAddress,
    amount,
    walletAddress,
  });
  console.log(JSON.stringify(quote));

  const extensionContract = new Address(quote.settlementAddress);
  const startTime =
    BigInt(Math.floor(Date.now() / 1000)) +
    BigInt(quote.presets[quote.recommended_preset].startAuctionIn);

  const order = FusionOrder.new(
    extensionContract,
    {
      makerAsset: new Address(fromTokenAddress),
      takerAsset: new Address(toTokenAddress),
      makingAmount: BigInt(quote.fromTokenAmount),
      takingAmount: BigInt(quote.toTokenAmount),
      maker: new Address(walletAddress),
      salt: BigInt(15),
      receiver: new Address(walletAddress),
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

  const typedData = order.getTypedData(56);

  res.send({ builtOrder, extension, typedData, quoteId: quote.quoteId });
});

app.post("/place-order", async (req: Request, res: Response) => {
  const { builtOrder, extension, quoteId, signature } = req.body;
  const orderDetails = placeOrder({
    order: builtOrder,
    signature: signature,
    extension: extension,
    quoteId: quoteId,
  });
  console.log(orderDetails);
  res.send(orderDetails);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

ONE_INCH_LIMIT_ORDER_V4;
