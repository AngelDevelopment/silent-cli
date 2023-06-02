const axios = require("axios");
const crypto = require("crypto");
const fs = require("fs");

// const BASE_URL = "http://[::1]:5030/exec/get";
const BASE_URL = "https://ssilent-projcurl.onrender.com/exec/get";

const algorithm = "aes-256-cbc";

const initVector = Buffer.from([
   193, 239, 89, 111, 225, 189, 42, 242, 131, 111, 34, 42, 180, 69, 154, 177,
]);

const Securitykey = Buffer.from([
   98, 229, 233, 193, 171, 233, 188, 156, 96, 177, 233, 171, 92, 8, 153, 12,
   139, 127, 168, 64, 4, 98, 90, 108, 80, 254, 164, 196, 193, 80, 184, 244,
]);

const cipher = (text) => {
   const cipher = crypto.createCipheriv(algorithm, Securitykey, initVector);

   let encryptedData = cipher.update(text, "utf-8", "hex");

   encryptedData += cipher.final("hex");

   return encryptedData;
};

module.exports = async (url) => {
   let type = "arraybuffer";

   let { data } = await axios.get(BASE_URL, {
      responseType: "arraybuffer",
      params: {
         url: cipher(url),
         options: JSON.stringify({
            responseType: type,
         }),
      },
   });

   data = Buffer.from(
      JSON.parse(data.toString()).map((e) => e - 7),
      "binary"
   );

   return data;
}