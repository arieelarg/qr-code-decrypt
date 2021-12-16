const fs = require('fs');
const { fromPath, fromBuffer } = require('pdf2pic');
const PNG = require('pngjs').PNG;

const savePath = './public/uploads';

const saveFile = async (file) => {
  const fileName = file.originalname;
  const filenameTmp = `${savePath}/${file.filename}`;
  const filenameOut = `${savePath}/${fileName}`;
  await fs.createReadStream(filenameTmp).pipe(fs.createWriteStream(filenameOut));
  fs.unlink(filenameTmp, (e) => {
    if (e) console.log(e);
  });

  return fileName;
};

function save(file) {
  return new Promise((resolve, _) => {
    resolve(saveFile(file, savePath));
  });
}

const convertPDFtoPNG = (filename, extension) => {
  const options = {
    density: 100,
    saveFilename: filename,
    format: 'png',
    width: 2000,
    height: 2000,
    savePath
  };

  const pathToPDF = `${savePath}/${filename}.${extension}`;

  const buffer = fs.readFileSync(pathToPDF);

  const convert = fromBuffer(buffer, options);

  console.log('Comienza a guardar imagen');
  return convert(1); // Solo la primera: page = 1
};

const generatePNGBuffer = (fileName) => {
  try {
    console.log('Genera PNG buffer');
    const fileToPNG = `${savePath}/${fileName}.1.png`;
    const imgData = PNG.sync.read(fs.readFileSync(fileToPNG));
    return imgData;
  } catch (e) {
    console.log(e);
    console.log('Error generando PNG');
  }
};

module.exports = { save, convertPDFtoPNG, generatePNGBuffer };
