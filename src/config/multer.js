const multer = require("multer");
const path = require("path");
const { ObjectId } = require('bson')
const crypto = require("crypto");
const aws = require("aws-sdk");
const multerS3 = require("multer-s3");

const storageTypes = {

  s3Produto: multerS3({
    s3: new aws.S3(),
    bucket: process.env.BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    key: (req, file, cb) => {

        const fileName = `Estabelecimentos/${req.params.idEstabelecimento}/produtos/${req.params.idProduto} - Produto`;
  
        cb(null, fileName);
  
    }
  }),

  s3Estabelecimento: multerS3({
    s3: new aws.S3(),
    bucket: process.env.BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    acl: "public-read",
    key: (req, file, cb) => {
     
        const fileName = `Estabelecimentos/${req.params.idEstabelecimento}/painel/${req.params.idEstabelecimento}-${req.body.tipo}`;

        cb(null, fileName);
      
    }
  })
};

module.exports.uploadEstabelecimento = {
  dest: path.resolve(__dirname, "..", "..", "tmp", "uploads"),
  storage: storageTypes["s3Estabelecimento"],
  limits: {
    fileSize: 2 * 1024 * 1024
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "image/jpeg",
      "image/pjpeg",
      "image/png",
      "image/gif"
    ];
    

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type."));
    }
  }
}


module.exports.uploadProduto = {
dest: path.resolve(__dirname, "..", "..", "tmp", "uploads"),
storage: storageTypes["s3Produto"],
limits: {
  fileSize: 2 * 1024 * 1024
},
fileFilter: (req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/pjpeg",
    "image/png",
    "image/gif"
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type."));
  }
}
}
