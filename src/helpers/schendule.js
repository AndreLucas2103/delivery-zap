const schedule = require('node-schedule');
const mongoose = require("mongoose");
const moment = require('moment')

require("../models/Usuario")
const Usuario = mongoose.model("usuarios")
require("../models/Estabelecimento")
const Estabelecimento = mongoose.model("estabelecimentos")
require("../models/Plano")
const Plano = mongoose.model("planos")

// remover o tempo de teste do usuario
schedule.scheduleJob('1 1 5 * * *', async function(){
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
        console.log("Ocorreu um erro na rotina de execução dos usuarios")
        console.log(err)
    }
});


// gerar cobranca
schedule.scheduleJob('1 1 6 * * *', async function(){
    try {
        let estabelecimentos = await Estabelecimento.find({
            $and: [
                {'statusAtivo': true},
                {'locacao.liberado': true}
            ]
        })

        estabelecimentos.forEach(estabelecimento => {
            let diffDataLiberado = moment().diff(estabelecimento.locacao.dataLiberado, 'days')

            // data de hoje for menor que a data de liberado, o valor será negativo 
            if(diffDataLiberado >= -10 && diffDataLiberado <= 0){
                
                if (estabelecimento.locacao.faturas.length == 0){
                    console.log('Estabelecimento sem cobrança ' + estabelecimento._id)
                }else{
                    let dataUltimaFatura = estabelecimento.locacao.faturas[0].vencimento
                    if(moment().format('MM-YYYY') == moment(dataUltimaFatura).format('MM-YYYY')){
                        console.log('Estabelecimento já possui cobrança gerada')
                    }else{
                        Plano.findById({'_id': estabelecimento.locacao.idPlano}).then(plano => {
                            Estabelecimento.updateOne(
                                {'_id': estabelecimento._id},
                                {'$push': {
                                    'locacao.faturas': {
                                        $each: [
                                            {
                                                idPlano: plano._id,
                                                descricao: `Fatura ${moment(estabelecimento.locacao.dataLiberado).format('DD/MM/YYYY')} até ${moment(estabelecimento.locacao.dataLiberado).add(plano.mesesPeriodicidade, 'months').format('DD/MM/YYYY')}`,
                                                valor: estabelecimento.locacao.valor,
                                                vencimento: estabelecimento.locacao.dataLiberado,
                                                situacao: 'waiting',
                                                pago: false,
                                                cancelado: false,
                                                logs: [{
                                                    descricao: 'Fatura gerada sdpelo sistema (Rotina)'
                                                }]
                                            }
                                        ],
                                        $position: 0,
                                    }
                                }}
                            ).then(() => {
                                console.log('fatura gerada')
                            })
                        })
                    }
                }
                
            }
        })  

    } catch (err) {
        console.log("Ocorreu um erro na rotina de execução dos estabelecimentos")
        console.log(err)
    }
});


// bloqueio do estabelecimento
schedule.scheduleJob('1 1 7 * * *', async function(){
    try {
        let estabelecimentos = await Estabelecimento.find({'statusAtivo': true})

        estabelecimentos.forEach(estabelecimento => {

            if (estabelecimento.locacao.faturas.length == 0){
                // console.log('Estabelecimento sem cobrança ' + estabelecimento._id)
            }else{
                if(estabelecimento.freeSystem == true){
                    if(moment().diff(estabelecimento.freeSystem.dataFim, 'days') > 0){
                        Estabelecimento.updateOne(
                            {'_id': estabelecimento._id},
                            {'$set': {
                                'freeSystem.habilitado': false
                            }}
                        )
                    }
                }else{
                    let diffDataLiberado = moment().diff(estabelecimento.locacao.dataLiberado, 'days')

                    if(diffDataLiberado >0){
                        if(estabelecimento.locacao.faturas[0].situacao == "waiting"){

                            console.log(moment().diff(estabelecimento.locacao.faturas[0].vencimento, 'days'))
                            if(moment().diff(estabelecimento.locacao.faturas[0].vencimento, 'days') > 0){
                                Estabelecimento.updateOne(
                                    {'_id': estabelecimento._id},
                                    {
                                        $set: {
                                            'locacao.liberado': false
                                        }
                                    }
                                ).then(() => {
                                    console.log('rotina executada')
                                })
                            }else{
                                console.log('ainda tem tempo de pagar')
                            }
                        }
                    }

                }
            }

        })

    } catch (err) {
        console.log("Ocorreu um erro na rotina de execução dos estabelecimentos")
        console.log(err)
    }
});