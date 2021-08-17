const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    tipo: {
        cobranca: Rotina para gerar cobrancas
    }
*/

const RotinaSistema = new Schema({
    dataExecutar: Date,
    tipo: String,
    executada: {
        type: Boolean,
        default: false
    },

    typeCobranca: {
        idEstabelecimento: {
            type: Schema.Types.ObjectId,
            ref: "estabelecimentos",
        },
        idPlano: {
            type: Schema.Types.ObjectId,
            ref: "planos",
        },
        vencimento: Date,
    }
},{ timestamps: true})

mongoose.model("rotinasSistemas", RotinaSistema)
