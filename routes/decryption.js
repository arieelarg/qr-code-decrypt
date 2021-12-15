const router = require("express").Router();

const { fromPath } = require("pdf2pic");
const fs = require("fs");
const zbarScan = require("zbar-qr");
const PNG = require("pngjs").PNG;

const Quagga = require("quagga").default;

const savePath = `./public/uploads`;

router.get("/decrpyt/qrcode", async (req, res, next) => {
  try {
    const PAGE = 1;
    const filename = "sample.pdf";
    const saveFilename = "sample";
    const options = {
      density: 100,
      saveFilename,
      format: "png",
      width: 2000,
      height: 2000,
    };

    const pathToPDF = `${savePath}/${filename}`;

    const storeAsImage = fromPath(pathToPDF, { options, ...savePath });

    await storeAsImage(PAGE);

    const fileToPNG = `${savePath}/${saveFilename}.${PAGE}.png`;

    const imgData = PNG.sync.read(fs.readFileSync(fileToPNG));

    const qrResult = !!imgData ? zbarScan(imgData) : "Error";

    res.send({ qrResult });
    next;
  } catch (err) {
    console.log("QR code error: ", err);
  }
});

router.get("/decrpyt/barcode", async (req, res, next) => {
  try {
    const file = "barcodeExample.png";
    const decodeBarcode = (fileName) =>
      new Promise((resolve, reject) => {
        Quagga.decodeSingle(
          {
            src: `${savePath}/${fileName}`,
            numOfWorkers: 0,
            decoder: {
              readers: ["code_128_reader", "ean_reader"],
            },
          },
          (result) => {
            const barcodeResult = result.codeResult;
            if (barcodeResult) {
              console.log("BARCODE DETECTED");
              resolve(barcodeResult);
            } else {
              console.log("BARCODE NOT DETECTED");
              reject("Error");
            }
          }
        );
      });

    const barcodeResult = await decodeBarcode(file);

    res.send({ barcodeResult: barcodeResult.code });
    next;
  } catch (err) {
    console.log("Barcode error: ", err);
  }
});

module.exports = router;
