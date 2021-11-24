const express = require("express");
const router = express.Router();
const PORT = 3200;

const { fromPath } = require("pdf2pic");
const fs = require("fs");
const zbarScan = require("zbar-qr");
const PNG = require("pngjs").PNG;

const Quagga = require("quagga").default;

const app = express();

const PAGE = 1;

app.get("/", async (req, res, next) => {
  try {
    const filename = "sample.pdf";
    const saveFilename = "sample";
    const options = {
      density: 100,
      saveFilename,
      savePath: "./public/uploads",
      format: "png",
      width: 2000,
      height: 2000,
    };

    const pathToPDF = `${options.savePath}/${filename}`;

    const storeAsImage = fromPath(pathToPDF, options);

    await storeAsImage(PAGE);

    console.log("Se guardo OK!");

    const fileToPNG = `${options.savePath}/${saveFilename}.${PAGE}.png`;

    console.log("fileToPNG: ", fileToPNG);

    const imgData = PNG.sync.read(fs.readFileSync(fileToPNG));

    const qrResult = zbarScan(imgData);

    if (qrResult) {
      console.log("QR DETECTED!");
    } else {
      console.log("QR NOT DETECTED!");
    }

    try {
      Quagga.decodeSingle({
        src: `${options.savePath}/barcodeExample.png`,
        numOfWorkers: 0,
        decoder: {
          readers: ["code_128_reader", "ean_reader"],
        },
      }, function(result) {
        const barcodeResult = result.codeResult;
        if (barcodeResult) {
          console.log("BARCODE DETECTED!: ", barcodeResult.code);
        } else {
          console.log("BARCODE NOT DETECTED");
        }
    });

    console.log("TERMINO y MANDA")

    res.send(qrResult)

    } catch (error) {
      console.log("BARCODE ERROR");
    }

    res.send({ qrResult });
    next;
  } catch (err) {
    console.log("ERROR: ");
  }
});

app.listen(PORT, function () {
  console.log(`App listening on port ${PORT}!`);
});
