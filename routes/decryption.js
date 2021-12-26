const router = require('express').Router();
const multer = require('multer');
const savePath = `./public/uploads`;

const upload = multer({ dest: savePath });
const fs = require('fs');
const zbarScan = require('zbar-qr');
const PDFParser = require('pdf2json');

const { convertPDFtoPNG, generatePNGBuffer, formatCodedAmount } = require('../utils/fileHandler');

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
        return res.json({ qrData: qrResult[0].data, amount });
      });

      pdfParser.loadPDF(pathToPDF);

      return;
    });
  } catch (e) {
    return res.sendStatus(500);
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

      return res.json({ qrData: qrResult[0].data });
    });
  } catch (e) {
    return res.sendStatus(500);
  }
};

router.post('/decrypt/invoice', upload.single('invoice'), invoicePDFToData);

router.post('/decrypt/qrcode', upload.single('qrcode'), qrcodePDFToData);

router.get('/ping', (req, res) => {
  res.sendStatus(200);
});

module.exports = router;
