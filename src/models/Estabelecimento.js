const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const aws = require("aws-sdk");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");


/*
    
*/

const Estabelecimento = new Schema({
    nome: String,
    nomePainel: String,
    url: String,
    endereco: {
        logradouro: String,
        bairro: String,
        localidade: String,
        cep: String,
        numero: String,
        uf: String
    },
    cnpj: String,
    telefone: String,


    horarioFuncionamento: [{
        dia: String,
        inicio: String,
        fim: String
    }],

    img: {
        logo: {
            name: String,
            size: Number,
            key: String,
            url: String
        },
        capa: {
            name: String,
            size: Number,
            key: String,
            url: String
        },
    },

    painel: {
        colorFundo: {
            type: String,
            default: "#FFFFFF"
        },
        colorFonte: {
            type: String,
            default: "#000000"
        },
    },

    integracao: {
        mercadoPago: {
            statusAtivo: {
                type: Boolean,
                default: false
            },
            testadoAtivo: Boolean,
            publickey: String,
            acessToken: String
        },
    },

    entrega: {
        taxaEntrega: Number,
        cepsDisponiveis: [{
            cep: String
        }]
    },


    idUsuarioMaster: {
        type: Schema.Types.ObjectId,
        ref: "usuarios",
    },

    statusAtivo: {
        type: Boolean,
        default: true
    }

}, { timestamps: true })

const s3 = new aws.S3();

Estabelecimento.pre("save", function() {
    if (!this.url) {
      this.url = `${process.env.APP_URL}/files/${this.key}`;
    }
  });
  
  Estabelecimento.pre("remove", function() {
    if (process.env.STORAGE_TYPE === "s3") {
      return s3
        .deleteObject({
          Bucket: process.env.BUCKET_NAME,
          Key: this.key
        })
        .promise()
        .then(response => {
          console.log(response.status);
        })
        .catch(response => {
          console.log(response.status);
        });
    } else {
      return promisify(fs.unlink)(
        path.resolve(__dirname, "..", "..", "tmp", "uploads", this.key)
      );
    }
  })
  

mongoose.model("estabelecimentos", Estabelecimento)
