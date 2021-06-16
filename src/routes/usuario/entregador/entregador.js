const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')
const { eAdmin } = require("../../../helpers/eAdmin")


require("../../../models/Entregador")
const Entregador = mongoose.model("entregadores")
require("../../../models/Estabelecimento")
const Estabelecimento = mongoose.model("estabelecimentos")

router.get('/entregadores',eAdmin, async (req, res) => {
    try {
        let userEstabelecimentos = []
        req.user.estabelecimentosSelecionados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) })

        let entregador = await Entregador.find({"estabelecimentos.idEstabelecimento" : userEstabelecimentos }).populate('estabelecimentos.idEstabelecimento').lean()
        let estabelecimentos = await Estabelecimento.find({"idUsuarioMaster" : req.user.idUsuarioMaster }).populate('idUsuarioMaster').lean()

        res.render('usuarios/entregador/entregadores', {entregador: entregador, estabelecimentos: estabelecimentos})
       

    } catch (err) {
        console.log(err)
    }
})

router.post("/add-entregador", (req, res) => {//Rota para cadastrar novo entregador.

    if(req.body.estabelecimentos){
        new Entregador({nome: req.body.nome, observacao: req.body.observacao, perfilAvatar: 'courier'}).save().then((entregador) => {
            let arrayEstabelecimentos = req.body.estabelecimentos
    
            arrayEstabelecimentos.forEach(element => {
                Entregador.updateOne(
                    {_id: entregador._id},
                    { $push: {
                        'estabelecimentos': {'idEstabelecimento': ObjectId(element)},
                    }}
                ).then(() => {
                    
                }).catch(err => {
                    console.log(err)
                })
            })
    
            req.flash('success_msg', 'Entregador adicionado')
            res.redirect('back')
        })
    }else{
        req.flash('warning_msg', 'Ao adicionar uma entregador ela deve possui pelo menos UM estabelecimento')
        res.redirect('back')
    }
    
})

router.post("/edit-entregador", (req, res) => {//Rota editar novo usuário.
    let statusAtivo
    req.body.statusAtivo == "true" ? statusAtivo = true : statusAtivo = false
    let arrayEstabelecimentos = req.body.estabelecimentos

    if(!arrayEstabelecimentos){
        req.flash('warning_msg', 'Ao editar um entregador ele deve possuir pelo menos UM estabelecimento')
        res.redirect('back')
    }else{
        Entregador.updateOne( // defino que o estabelecimento é valor zerado e depois ocorre o forEach adicionando todos os estabelecimentos
            {_id: req.body.idEntregador},
            { $set: 
                {'estabelecimentos': [], 'nome': req.body.nome, 'observacao': req.body.observacao, 'statusAtivo': statusAtivo}
                 
            }
        ).then(() => {
            arrayEstabelecimentos.forEach(element => {
                Entregador.updateOne(
                    {_id: req.body.idEntregador},
                    { $push: 
                        {'estabelecimentos': {'idEstabelecimento': ObjectId(element)}}
                    }
                ).then(() => {
                    
                }).catch(err => {
                    console.log(err)
                })
            })
            setTimeout(() => {
                req.flash('success_msg', 'Entragador editado.')
                res.redirect('back')
            }, 1000)
        }).catch(err => {
            console.log(err)
        })
    }
})

router.post('/ajax-get-entregadores', (req, res) => { // consulto pela rota  "/produto/categoria-produtos" para poder pegar as informações e editar seus valores
    Entregador.findById({_id: req.body.idEntregador}).lean().then(entregador => {
        res.json(entregador)
    })
})

   

module.exports = router