const router = require('express').Router();
const savePath = `./public/uploads`;

const multer = require('multer');
const upload = multer({ dest: savePath });
const fileHandler = require('../utils/fileHandler');

const zbarScan = require('zbar-qr');
// const Quagga = require('quagga').default;

const qrCodeDecrypt = async (req, res) => {
  const { save, convertPDFtoPNG, generatePNGBuffer } = fileHandler;

  try {
    const originalName = await save(req.file);

    const [fileName, extension] = originalName.split('.');

    // Extension should always be PDF since the endpoint is not ready to process other file type
    if (fileName && extension === 'pdf') {
      // First convert PDF to PNG
      console.log('Comienza a convertir PDF a PNG');
      await convertPDFtoPNG(fileName, extension);
      console.log('Termino de guardar imagen');
      console.log('Termino de convertir PDF a PNG');
      // Last decode QR from PNG
      console.log('Comienza a decodificar QR');
      const imgData = await generatePNGBuffer(fileName);
      const qrResult = !!imgData ? zbarScan(imgData) : 'Error';
      console.log('Termino de decodificar QR');
      return res.json({ qrResult });
    } else {
      return res.json({ error: true, message: 'Ocurrió un error' });
    }
  } catch (e) {
    // console.log(e);
    return res.json({ error: true, message: 'Ocurrió un error' });
  }
};

// router.get('/decrpyt/qrcode', async (req, res, next) => {
//   try {
//     const PAGE = 1;
//     const filename = 'sample.pdf';
//     const saveFilename = 'sample';
//     const options = {
//       density: 100,
//       saveFilename,
//       savePath: './public/uploads',
//       format: 'png',
//       width: 2000,
//       height: 2000
//     };

//     const pathToPDF = `${options.savePath}/${filename}`;

//     const storeAsImage = fromPath(pathToPDF, options);

//     await storeAsImage(PAGE);

//     const fileToPNG = `${options.savePath}/${saveFilename}.${PAGE}.png`;

//     const imgData = PNG.sync.read(fs.readFileSync(fileToPNG));

//     const qrResult = !!imgData ? zbarScan(imgData) : 'Error';

//     res.send({ qrResult });
//     next;
//   } catch (err) {
//     console.log('Qrcode error: ', err);
//   }
// });

// router.get('/decrpyt/barcode', async (req, res, next) => {
//   try {
//     const file = 'barcodeExample.png';
//     const decodeBarcode = (fileName) =>
//       new Promise((resolve, reject) => {
//         Quagga.decodeSingle(
//           {
//             src: `${savePath}/${fileName}`,
//             numOfWorkers: 0,
//             decoder: {
//               readers: ['code_128_reader', 'ean_reader']
//             }
//           },
//           (result) => {
//             const barcodeResult = result.codeResult;
//             if (barcodeResult) {
//               console.log('BARCODE DETECTED');
//               resolve(barcodeResult);
//             } else {
//               console.log('BARCODE NOT DETECTED');
//               reject('Error');
//             }
//           }
//         );
//       });

//     const barcodeResult = await decodeBarcode(file);

//     return res.send({ barcodeResult: barcodeResult.code });
//   } catch (err) {
//     console.log('Barcode error: ', err);
//   }
// });

router.post('/decrypt/qrcode', upload.single('invoice'), qrCodeDecrypt);

module.exports = router;
