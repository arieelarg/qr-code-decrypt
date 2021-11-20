const express = require("express");
const router = express.Router();
const PORT = 3200;

const { fromPath } = require("pdf2pic");
const fs = require("fs");
const zbarScan = require("zbar-qr");
const PNG = require("pngjs").PNG;

const app = express();

const PAGE = 1;

app.get("/decrypt-qrcode", async (req, res, next) => {
  try {
    const filename = req.query?.filename || "sample.pdf";
    const saveFilename = "sample";
    const options = {
      density: 100,
      saveFilename,
      savePath: "./public/uploads",
      format: "png",
      width: 2000,
      height: 2000,
    };
    console.log("filename: ", filename);
    const storeAsImage = fromPath(`./public/uploads/${filename}`, options);
    // TO DO: Count pages and save each page in a diff file
    await storeAsImage(PAGE); // Save only first page

    const imgData = PNG.sync.read(
      fs.readFileSync(`./public/uploads/${saveFilename}.${PAGE}.png`)
    );

    const result = zbarScan(imgData);

    res.send(result);
    next;
  } catch (err) {
    console.log("err: ", err);
  }
});

app.listen(PORT, function () {
  console.log(`App listening on port ${PORT}!`);
});
