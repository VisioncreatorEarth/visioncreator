console.log(
  "----------external process env NANGO------------",
  process.env.NANGO_HOST
);
console.log(
  "----------external process env VERCEL_------------",
  process.env.VERCEL_ENV
);
console.log(
  "----------external process env NODE_ENV------------",
  process.env.NODE_ENV
);

export const domainConfig = {
  userInfoEndpoint: "http://127.0.0.1:3000/auth/userinfo",
  allowedOrigins: ["http://127.0.0.1:3000"],
  publicNodeUrl: "http://127.0.0.1:9991",
};
