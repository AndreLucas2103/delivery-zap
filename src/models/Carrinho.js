const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    
*/

const Carrinho = new Schema({
    produtos: [{
        idProduto: ObjectId,
        nome: String,
        valor: Number,
        promocao: Boolean,

        opcao: [{
            nome: String,
            opcoes: [{
                nome: String,
                valor: Number 
            }]
        }],

        adicionais: [{
            nome: String,
            valor: Number
        }],

        idCategoriaProduto: {
            type: Schema.Types.ObjectId,
            ref: "categoriaProdutos",
        },

        quantidade: Number,
        observacao: String,
        valorTotal: Number,
    }],

    uuid4Client: String,
    valorTotal: Number,

    idEstabelecimento: {
        type: Schema.Types.ObjectId,
        ref: "estabelecimentos",
    }

},{ timestamps: true})


mongoose.model("carrinhos", Carrinho)
