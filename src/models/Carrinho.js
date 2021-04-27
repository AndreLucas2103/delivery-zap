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

        opcoes: [{
            nome: String,
            valor: Number
        }],

        adicionais: [{
            idAdicional: ObjectId,
            nome: String,
            valor: Number
        }],

        idCategoriaProduto: {
            type: Schema.Types.ObjectId,
            ref: "categoriaProdutos",
        },

        quantidade: Number,
        observacao: String,
        valorProduto: Number,
    }],

    uuid4Client: String,

    idEstabelecimento: {
        type: Schema.Types.ObjectId,
        ref: "estabelecimentos",
    }

},{ timestamps: true})


mongoose.model("carrinhos", Carrinho)
