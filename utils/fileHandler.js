const fs = require('fs');
const path = require('path');

const { fromPath } = require('pdf2pic');
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

const convertPDFtoPNG = async (originalName, density = 100) => {
  const onlyFilename = originalName.split('.')[0];

  const options = {
    density,
    saveFilename: onlyFilename,
    format: 'png',
    width: 1280,
    height: 1810,
    savePath
  };

  const pathToPDF = `${savePath}/${originalName}`;

  const convert = fromPath(pathToPDF, options);

  await convert(1); // Solo la primera: page = 1
};

const generatePNGBuffer = (fileName) => {
  try {
    const fileToPNG = `${savePath}/${fileName}.1.png`;
    const imgData = PNG.sync.read(fs.readFileSync(fileToPNG));
    return imgData;
  } catch (e) {
    // console.log(e);
    console.log('Error generando PNG');
  }
};

const formatCodedAmount = (codedAmount) => {
  const partialAmount = decodeURIComponent(codedAmount).split('Efectivo')[1];
  const formattedAmount = partialAmount.replace(/,/g, '').split('$ ')[1];
  return formattedAmount;
};

const deleteAllFiles = () => {
  fs.readdir(savePath, (err, files) => {
    if (err) throw err;

    for (const file of files) {
      fs.unlink(path.join(savePath, file), (err) => {
        if (err) throw err;
      });
    }
  });
};

module.exports = { save, convertPDFtoPNG, generatePNGBuffer, formatCodedAmount, deleteAllFiles };
