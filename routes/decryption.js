const router = require('express').Router();
const multer = require('multer');
const savePath = `./public/uploads`;

const upload = multer({ dest: savePath });
const fs = require('fs');
const zbarScan = require('zbar-qr');
const PDFParser = require('pdf2json');

const PNGCrop = require('png-crop');

const Quagga = require('@ericblade/quagga2').default; // Common JS (important: default)

const { convertPDFtoPNG, generatePNGBuffer, formatCodedAmount, deleteAllFiles } = require('../utils/fileHandler');

const pdfParser = new PDFParser();

const invoicePDFToData = async (req, res) => {
  try {
    const { originalname, filename: tmpFilename } = req.file;
    const [onlyFilename] = originalname.split('.');
    const filenameTmp = `${savePath}/${tmpFilename}`;
    const pathToPDF = `${savePath}/${originalname}`;

    await fs.createReadStream(filenameTmp).pipe(fs.createWriteStream(pathToPDF));

    fs.unlink(filenameTmp, async (e) => {
      if (e) return;

      await convertPDFtoPNG(originalname);

      const imgData = generatePNGBuffer(onlyFilename);

      const qrResult = !!imgData ? zbarScan(imgData) : 'Error';

      pdfParser.on('pdfParser_dataReady', (pdfData) => {
        const invoiceAmount = pdfData.Pages[0].Texts.find((text) => {
          const codedString = text.R[0].T;
          if (codedString.includes('Efectivo')) {
            // console.log('Found it!');
            return formatCodedAmount(codedString);
          }
        });
        const amount = formatCodedAmount(invoiceAmount.R[0].T);
        // deleteAllFiles();
        return res.json({ qrData: qrResult[0].data, amount });
      });

      pdfParser.loadPDF(pathToPDF);

      // deleteAllFiles();
      return;
    });
  } catch (e) {
    // deleteAllFiles();
    return res.sendStatus(204);
  }
};

const qrcodePDFToData = async (req, res) => {
  try {
    const { originalname, filename: tmpFilename } = req.file;
    const [onlyFilename] = originalname.split('.');
    const filenameTmp = `${savePath}/${tmpFilename}`;
    const pathToPDF = `${savePath}/${originalname}`;

    await fs.createReadStream(filenameTmp).pipe(fs.createWriteStream(pathToPDF));

    fs.unlink(filenameTmp, async (e) => {
      if (e) return;

      await convertPDFtoPNG(originalname);

      const imgData = generatePNGBuffer(onlyFilename);

      const qrResult = !!imgData ? zbarScan(imgData) : 'Error';

      // deleteAllFiles();
      return res.json({ qrData: qrResult[0].data });
    });
  } catch (e) {
    // deleteAllFiles();
    return res.sendStatus(204);
  }
};

const barcodePDFToData = async (req, res) => {
  try {
    const { originalname, filename: tmpFilename } = req.file;
    const [onlyFilename] = originalname.split('.');
    const filenameTmp = `${savePath}/${tmpFilename}`;
    const pathToPDF = `${savePath}/${originalname}`;

    await fs.createReadStream(filenameTmp).pipe(fs.createWriteStream(pathToPDF));

    fs.unlink(filenameTmp, async (e) => {
      if (e) return;

      await convertPDFtoPNG(originalname);

      const config1 = { width: 500, height: 1000, top: 1500 };

      await PNGCrop.crop(
        `${savePath}/${onlyFilename}.1.png`,
        `${savePath}/cropped${onlyFilename}.1.png`,
        config1,
        function (err) {
          if (err) throw err;

          Quagga.decodeSingle(
            {
              type: 'ImageStream',
              src: `${savePath}/cropped${onlyFilename}.1.png`,
              locate: true,
              numOfWorkers: 0, // Needs to be 0 when used within node
              decoder: {
                readers: ['i2of5_reader']
              }
            },
            (result) => {
              const barcodeResult = result?.codeResult?.code;
              if (barcodeResult) {
                // console.log('BARCODE DETECTED!: ', barcodeResult);
                // deleteAllFiles();
                return res.send({ barcode: barcodeResult });
              } else {
                // console.log('BARCODE NOT DETECTED');
                // deleteAllFiles();
                return res.sendStatus(204);
              }
            }
          );
        }
      );
    });
  } catch (e) {
    // deleteAllFiles();
    return res.sendStatus(204);
  }
};

router.post('/decrypt/invoice', upload.single('invoice'), invoicePDFToData);

router.post('/decrypt/qrcode', upload.single('qrcode'), qrcodePDFToData);

router.post('/decrypt/barcode', upload.single('barcode'), barcodePDFToData);

router.get('/ping', (req, res) => {
  res.sendStatus(200);
});

module.exports = router;
