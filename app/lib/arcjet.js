import arcjet, { tokenBucket } from "@arcjet/next";

const aj = arcjet({
  key: process.env.ARCJET_KEY,
  characteristics: ["userId"], //Track based on clerk userid,
  rules: [
    tokenBucket({
      mode: "LIVE",
      refillRate: 10,
      interval: 3600,
      capacity: 10,
    }),
  ],
});

export  {aj}