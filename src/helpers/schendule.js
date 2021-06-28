const schedule = require('node-schedule');
const mongoose = require("mongoose");

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
                if(moment().diff(usuario.freeSystem.dataFim, 'days') <= 0){
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

// bloqueio do estabelecimento
schedule.scheduleJob('1 1 6 * * *', async function(){
    try {
        
    } catch (err) {
        console.log("Ocorreu um erro na rotina de execução dos estabelecimentos")
        console.log(err)
    }
});