const { ObjectId } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    situacao: {
        andamento: chamado está em andamento ou ainda falta respondido
        aguardando: chamado está aguardando o requisitante
        resolvido: chamado foi resolvido
    }
*/

const Chamado = new Schema({
    idUsuarioRequisitante: {
        type: Schema.Types.ObjectId,
        ref: "usuarios",
    },
    idAdministracaoResponsavel: {
        type: Schema.Types.ObjectId,
        ref: "usuarios",
    },
    
    mensagens: [{
        conteudo: String,
        data: String,
        ladoMensagem: String,
        idEmissor: {
            type: Schema.Types.ObjectId,
            ref: "usuarios",
        },
    }],

    observacao: String,

    situacao: String,
    
    statusAtivo: {
        type: Boolean,
        default: true
    }

},{ timestamps: true})

mongoose.model("chamados", Chamado)
