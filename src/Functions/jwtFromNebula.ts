//Imports
import axios from "axios";
import fs from "fs";
import path from "path";

export const jwtFromNebula = async () => {
  const simple_key = await fs.promises.readFile(
    path.join(__dirname, "..", "store", "simple_key.txt"),
    "utf-8"
  );

  // console.log("Getting auth with simple key: %s", simple_key);
  await axios
    .post("https://api.watchnebula.com/api/v1/authorization/", {
      data: { Authorization: `Token ${simple_key}` },
    })
    .then((res) => {
      if (res.status)
        if (res.data.has_curiositystream_subscription === false)
          process.exit(1);
      // console.log("Auth Response: %s", res.data);
      console.log("New token fetched");
      fs.promises
        .writeFile(
          path.join(__dirname, "..", "database", "json_token.txt"),
          res.data.token
        )
        .then(() => {
          return;
        });
    })
    .catch((err) => console.log(err.response.data));
};
