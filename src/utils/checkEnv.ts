// Check all environment variables are set

const checkEnv = () => {
  console.log("Checking environment variables...");
  let missingEnv: string[] = [];
  if (process.env.NODE_ENV === undefined) {
    missingEnv.push("NODE_ENV");
  }
  if (process.env.DATABASE_URI === undefined) {
    missingEnv.push("DATABASE_URI");
  }
  if (process.env.NEBULA_USERNAME === undefined) {
    missingEnv.push("NEBULA_USERNAME");
  }
  if (process.env.NEBULA_PASSWORD === undefined) {
    missingEnv.push("NEBULA_PASSWORD");
  }
  if (process.env.DATABASE_PASSWORD === undefined) {
    missingEnv.push("DATABASE_PASSWORD");
  }
  if (process.env.DATABASE_USERNAME === undefined) {
    missingEnv.push("DATABASE_USERNAME");
  }
  if (process.env.YOUTUBE_API_KEY === undefined) {
    missingEnv.push("YOUTUBE_API_KEY");
  }
  // if (process.env.GITHUB_TOKEN === undefined) {
  // missingEnv.push("GITHUB_TOKEN");
  // }
  // if (process.env.GITHUB_USER === undefined) {
  // missingEnv.push("GITHUB_USER");
  // }
  // if (process.env.GITHUB_REPO === undefined) {
  // missingEnv.push("GITHUB_REPO");
  // }

  if (missingEnv.length > 0) {
    console.error(`checkEnv: Missing environment variables: ${missingEnv}`);
    throw new Error("checkEnv: Environment variables not set");
  } else {
    console.log("checkEnv: Environment variables are set!");
  }
};

export default checkEnv;
