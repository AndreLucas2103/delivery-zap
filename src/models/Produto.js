const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

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
        capa: {
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

mongoose.model("produtos", Produto)



