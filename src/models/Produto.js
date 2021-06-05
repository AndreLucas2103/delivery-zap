const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const aws = require("aws-sdk");
const fs = require("fs");
const path = require("path");
const { promisify } = require("util");


/*
    
*/

const Produto = new Schema({
    nome: String,
    valor: Number,
    descricao: String,
    
    ingredientes: [{
        nome: String
    }],
    adicionais: [{
        idAdicional: {
            type: Schema.Types.ObjectId,
            ref: "adicionais",
        },
        idCategoriaAdicional: {
            type: Schema.Types.ObjectId,
            ref: "categoriaAdicionais",
        }
    }],

    opcao: [{
        nome: String,
        descricao: String,

        obrigatorio: {
            type: Boolean,
            default: true
        },

        opcoes: [{
            nome: String,
            valor: Number
        }],

        vinculoProduto: Boolean,
        dividendo: {
            type: Number,
            default: 1
        },
        opcoesProduto: [{
            idProduto: {
                type: Schema.Types.ObjectId,
                ref: "produtos",
            },
        }],
        
        multiplaEscolha: Boolean
    }],

    img: {
        foto: {
            name: String,
            size: Number,
            key: String,
            url: String
        },
    },

    promocao: Boolean,
    valorPromocao: Number,
    
    idCategoriaProduto: {
        type: Schema.Types.ObjectId,
        ref: "categoriaProdutos",
    },

    idEstabelecimento: {
        type: Schema.Types.ObjectId,
        ref: "estabelecimentos",
    },

    identificaouuidv4: String,

    statusAtivo: {
        type: Boolean,
        default: true
    }

},{ timestamps: true})

const s3 = new aws.S3();

Produto.pre("save", function() {
    if (!this.url) {
      this.url = `${process.env.APP_URL}/files/${this.key}`;
    }
  });
  
  Produto.pre("remove", function() {
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

mongoose.model("produtos", Produto)



