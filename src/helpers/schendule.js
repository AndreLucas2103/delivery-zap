const schedule = require('node-schedule');
const mongoose = require("mongoose");
const moment = require('moment')
const { v4: uuidv4 } = require('uuid');

require("../models/Usuario")
const Usuario = mongoose.model("usuarios")
require("../models/Estabelecimento")
const Estabelecimento = mongoose.model("estabelecimentos")
require("../models/Plano")
const Plano = mongoose.model("planos")
require("../models/RotinaSistema")
const RotinaSistema = mongoose.model("rotinasSistemas")

const registerLog = require('../components/log')

// remover o tempo de teste do usuario
schedule.scheduleJob('1 1 5 * * *' , async function(){ // executar as 05:01:01 todos os dias
    try {
        let usuariosMaster = await Usuario.find({$and: [
            {'statusAtivo': true},
            {'freeSystem.habilitado': true}
        ]})
        
        if(usuariosMaster == [] || usuariosMaster == null || usuariosMaster.length == 0){
            console.log('Nenhum usuário em teste')
        }else{
            usuariosMaster.forEach(usuario => {
                if(moment().diff(usuario.freeSystem.dataFim, 'days') < 0){
                    console.log('Usuario ainda possui tempo de teste')
                }else{
                    Usuario.updateOne(
                        {'_id': usuario._id},
                        {'$set': {
                            'freeSystem.habilitado': false
                        }}
                    ).then(() => {
                        console.log('Usuario acabou e alterado o teste')
                    })
                }
            })
        }

    } catch (err) {
        return registerLog.registerLog({text: "Error in the test system change routine", code: "500", description: "Ocorreu um erro ao executar a rotina do sistema, favor analisar o log e consultar qual estabelecimento foi parado"})
    }
});

schedule.scheduleJob('1 1 6 * * *', async function(){ // executar as 06:01:01 todos os dias
    try {
        let rotina = await RotinaSistema.find({
            "$and": [
                {'executada': false},
                {"dataExecutar": {'$gte': new Date(moment().format('YYYY-MM-DD')), "$lte": new Date(moment())}}
            ]
        })

        if(rotina.length === 0) {
            return registerLog.registerLog({text: "No routine to run", code: "200", description: "A base de dados não possui nenhuma rotina para executar"})
        } 

        rotina.forEach(async  rotina => {
            try {
                switch  (rotina.tipo)  {
                    case "cobranca":
                        let plano = await Plano.findById(rotina.typeCobranca.idPlano) 
    
                        let estabelecimento = await Estabelecimento.updateOne(
                            {"_id": rotina.typeCobranca.idEstabelecimento},
                            {
                                "$push" : {
                                    'locacao.faturas': {
                                        $each: [
                                            {
                                                idPlano: plano._id,
                                                descricao: `Fatura ${moment(rotina.typeCobranca.vencimento).format('DD/MM/YYYY')} até ${moment(rotina.typeCobranca.vencimento).add(plano.mesesPeriodicidade, 'months').format('DD/MM/YYYY')}`,
                                                valor: plano.valor,
                                                vencimento: rotina.typeCobranca.vencimento,
                                                situacao: 'waiting',
                                                pago: false,
                                                cancelado: false,
                                                "rotina": {
                                                    "validado": false
                                                },
                                                'idTransacaoOperadora': `${rotina.typeCobranca.idEstabelecimento}#@#${uuidv4() + uuidv4()}`,
                                                logs: [{
                                                    descricao: 'Fatura gerada pelo sistema (Rotina)'
                                                }]
                                            }
                                        ],
                                        $position: 0,
                                    }
                                }
                            }
                        )

                        await RotinaSistema.updateOne(
                            {'_id': rotina._id},
                            {
                                '$set': {
                                    'executada': true
                                }
                            }
                        )
    
                        registerLog.registerLog({text: "Charge generated", code: "200", description: `Cobrança gerada para o estabelecimento ${rotina.typeCobranca.idEstabelecimento}`})
                        break;
                
                    default:
                        registerLog.registerLog({
                            text: "Routine with no defined type", 
                            code: "500", 
                            description: `A rotina não possui tipo definido {_id: ${rotina._id}}`
                        })
                        break;
                }
            } catch (err) {
                registerLog.registerLog({text: "No routine to run", code: "200", description: err})
            }
        })

    } catch (err) {
        registerLog.registerLog({text: "Error system routine", code: "500", description: err})
    }
});

schedule.scheduleJob('1 1 7 * * *', async function(){ // executar as 07:01:01 todos os dias, rotina de remoção dos estabelecimentos selecionados
    try {
        let estabelecimentos = await Estabelecimento.find({
            $and: [
                {"statusAtivo": true},
                {"freeSystem.habilitado": false},
                {"locacao.liberado": true},
                {"locacao.dataLiberado": {"$lt": moment().subtract(1, "days")}}
            ]
        })

        if(estabelecimentos.length === 0 ){
            console.log("nenhum establecimento")
        }

        estabelecimentos.forEach(async estabelecimento => {
            await Estabelecimento.updateOne(
                {"_id": estabelecimento._id},
                {
                    "$set": {
                        'locacao.liberado': false,
                        "statusAtivo": false
                    }
                }
            )
            await Usuario.updateMany(
                {"estabelecimentosSelecionados.idEstabelecimento": estabelecimento._id},
                {
                    "$pull": {
                        "estabelecimentosSelecionados": {"idEstabelecimento": estabelecimento._id}
                    }
                }
            )
        })

    } catch (err) {
        console.log(err)
        registerLog.registerLog({text: "Error system routine", code: "500", description: err})
    }
});
