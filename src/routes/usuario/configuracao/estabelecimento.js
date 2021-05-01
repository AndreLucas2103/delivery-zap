const express = require('express')
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')

require("../../../models/Usuario")
const Usuario = mongoose.model("usuarios")
require("../../../models/Estabelecimento")
const Estabelecimento = mongoose.model("estabelecimentos")

router.get('/estabelecimento/:idEstabelecimento', async (req, res) => { // Entrar no "perfil" do estabelecimento
    try {
        let estabelecimento = await Estabelecimento.aggregate([
            {$match: {_id: ObjectId(req.params.idEstabelecimento) }},
            {
                $lookup:
                    {
                        from: "usuarios",
                        localField: "_id",
                        foreignField: "estabelecimentosVinculados.idEstabelecimento",
                        as: "usuarios"
                    }
            }
        ])
        console.log()

        res.render('usuarios/configuracao/estabelecimento', {estabelecimento: estabelecimento[0]})
    } catch (err) {
        console.log(err)
    }
})


router.get('/estabelecimentos', async (req, res) => { // Listar todos os estabelecimentos
    try {
        let estabelecimentos = await Estabelecimento.aggregate([
            {$match: {idUsuarioMaster: req.user._id }},
            {
                $lookup:
                    {
                        from: "usuarios",
                        localField: "_id",
                        foreignField: "estabelecimentosVinculados.idEstabelecimento",
                        as: "usuarios"
                    }
            }
        ])
        console.log(estabelecimentos)

        res.render('usuarios/configuracao/estabelecimentos', {estabelecimentos: estabelecimentos})
    } catch (err) {
        console.log(err)
    }
})

router.post('/edit-estabelecimento', async (req, res) => {
    try {
        Estabelecimento.findById({_id: req.body.idEstabelecimento}).then(estabelecimento => {
            if(estabelecimento){
                estabelecimento.nome = req.body.nome,
                estabelecimento.url = req.body.url,
                estabelecimento.endereco = {
                    rua: req.body.rua,
                    bairro: req.body.bairro,
                    cidade: req.body.cidade,
                    cep: req.body.cep,
                    numero: req.body.numero,
                    estado: req.body.estado
                },
                estabelecimento.cnpj = req.body.cnpj,
                estabelecimento.telefone = req.body.telefone,
                estabelecimento.idUsuarioMaster = user._id
            }else{
                req.flash('error_msg', 'Ocorreu um erro')
                res.redirect('back')
            }
        }).catch(err => {
            req.flash('error_msg', 'Ocorreu um erro')
            res.redirect('back')
        })
    } catch (err) {
        req.flash('error_msg', 'Ocorreu um erro')
        res.redirect('back')
    }
})

router.post('/add-estabelecimento', (req, res) => { // adicionar estabelecimento
    let user = req.user
    if(user){
        if(user.usuarioMaster == true){
            addEstabelecimento = {
                nome: req.body.nome,
                url: req.body.url,
                endereco: {
                    rua: req.body.rua,
                    bairro: req.body.bairro,
                    cidade: req.body.cidade,
                    cep: req.body.cep,
                    numero: req.body.numero,
                    estado: req.body.estado
                },
                cnpj: req.body.cnpj,
                telefone: req.body.telefone,
                idUsuarioMaster: user._id
            }
            new Estabelecimento(addEstabelecimento).save().then((estabelecimento) => {
                editUsuario = {
                    idEstabelecimento: estabelecimento._id,
                    cnpj: estabelecimento.cnpj,
                    nome: estabelecimento.nome,
                    url: estabelecimento.url
                }
                Usuario.updateOne(
                    { '_id': user._id },
                    {
                        $push: { "estabelecimentosVinculados":  editUsuario}
                    }
                ).then(e => {
                    req.flash('success_msg', 'Estabelecimento adicionado')
                    res.redirect('back')
                }).catch(err => {
                    console.log(err)
                })
                
            }).catch(err => {
                req.flash('error_msg', 'Ocorreu um erro')
                res.redirect('back')
            })
        }else{
            req.flash('warning_msg', 'Somente usuário MASTER pode adicionar um estabelecimento')
            res.redirect('back')
        }
    }else{
        req.flash('error_msg', 'Usuário não está logado')
        res.redirect('back')
    }
})




module.exports = router;

