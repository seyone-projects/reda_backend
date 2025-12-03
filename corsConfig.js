import cors from "cors";

const devCorsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};

const prodCorsOptions = {
 origin: [
    "https://apartment-frontend-rosy.vercel.app", // Production frontend
    "https://livez-website.s3-website.ap-south-1.amazonaws.com", // Production S3 bucket (HTTPS)
    "http://livez-website.s3-website.ap-south-1.amazonaws.com", // Production S3 bucket (HTTP)
    "http://liveez-qa.com.s3-website.ap-south-1.amazonaws.com", // QA S3 buckets
    "https://liveez-qa.com.s3-website.ap-south-1.amazonaws.com", // QA S3 bucket HTTPS
    "http://liveez-qa-mui.com.s3-website.ap-south-1.amazonaws.com",
    "https://liveez-qa-mui.com.s3-website.ap-south-1.amazonaws.com",
    "http://liveez-service-qa.com.s3-website.ap-south-1.amazonaws.com",
    "https://liveez-service-qa.com.s3-website.ap-south-1.amazonaws.com",
    "http://localhost:5173", // Local frontend for development
    /http:\/\/localhost:\d+/, // Allow localhost with any port
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD", "OPTIONS"],
  allowedHeaders: [
    "Content-Type",
    "Origin",
    "X-Requested-With",
    "Accept",
    "x-client-key",
    "x-client-token",
    "x-client-secret", 
    "Authorization",
  ],
  //allowedHeaders: ['Content-Type', 'Authorization', 'x-client-key', 'x-client-token', 'x-client-secret'],
  credentials: true,
  optionsSuccessStatus: 200,
};

const corsOptions =
  process.env.NODE_ENV === "development" ? devCorsOptions : prodCorsOptions;

export default cors(corsOptions);
