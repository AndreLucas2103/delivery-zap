const express = require('express')
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')
const { eAdmin } = require("../../../helpers/eAdmin")

require("../../../models/Usuario")
const Usuario = mongoose.model("usuarios")
require("../../../models/Estabelecimento")
const Estabelecimento = mongoose.model("estabelecimentos")

router.get('/estabelecimento/:idEstabelecimento', eAdmin, async (req, res) => { // Entrar no "perfil" do estabelecimento
    try {
        let estabelecimento = await Estabelecimento.aggregate([
            { $match: { _id: ObjectId(req.params.idEstabelecimento) } },
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

        res.render('usuarios/configuracao/estabelecimento', { estabelecimento: estabelecimento[0] })
    } catch (err) {
        console.log(err)
    }
})

router.post('/add-horario-estabelecimento', async (req, res) => { // adicionar os horarios no estabelecimento
    try {
        let addHorario = {
            dia: req.body.dia,
            inicio: req.body.inicio,
            fim: req.body.fim
        }
        Estabelecimento.updateOne(
            { '_id': req.body.idEstabelecimento },
            {
                $push: {
                    'horarioFuncionamento': addHorario,
                    $sort: { dia: -1 }
                }
            }
        ).then(() => {
            req.flash('success_msg', 'Horário adicionado')
            res.redirect('back')
        }).catch(err => {
            console.log(err)
        })
    } catch (err) {
        console.log(err)
    }
})

router.post('/delete-horarioFuncionamento', async (req, res) => { // deletar os horários no estabelecimento
    try {
        Estabelecimento.updateOne( // realizo o update buscando no estabelecimento e depois o documento que possui o ID desejadi (no caso o horário)
            { '_id': req.body.idEstabelecimento },
            {
                $pull: {
                    'horarioFuncionamento': { _id: ObjectId(req.body.idHorario) },
                }
            }
        ).then(() => {
            req.flash('success_msg', 'Horário removido')
            res.redirect('back')
        }).catch(err => {
            console.log(err)
        })
    } catch (err) {
        console.log(err)
    }
})

router.get('/estabelecimentos', eAdmin, async (req, res) => { // Listar todos os estabelecimentos
    try {
        let estabelecimentos = await Usuario.aggregate([
            { $match: { _id: req.user._id } },
            {
                $lookup:
                {
                    from: "estabelecimentos",
                    localField: "estabelecimentosVinculados.idEstabelecimento",
                    foreignField: "_id",
                    as: "estabelecimentosVinculados"
                }

            },
            { $unwind: '$estabelecimentosVinculados' },
            {
                $lookup:
                {
                    from: "usuarios",
                    localField: "estabelecimentosVinculados._id",
                    foreignField: "estabelecimentosVinculados.idEstabelecimento",
                    as: "usuariosVinculados"
                }
            },

        ])

        res.render('usuarios/configuracao/estabelecimentos', { estabelecimentos: estabelecimentos })
    } catch (err) {
        console.log(err)
    }
})

router.post('/edit-estabelecimento', async (req, res) => { // Editar o estabelecimento
    try {
        Estabelecimento.findById({ _id: req.body.idEstabelecimento }).then(estabelecimento => {
            req.body.useMercadoPago == "true" ? useMercadoPagoBoolean = true : useMercadoPagoBoolean = false
            estabelecimento.mercadoPago.ativo == true ? integracaoMercadoPagoAtiva = true : integracaoMercadoPagoAtiva = false

            if (estabelecimento) {
                estabelecimento.nome = req.body.nome,
                    estabelecimento.url = req.body.url,
                    estabelecimento.endereco = {
                        logradouro: req.body.logradouro,
                        bairro: req.body.bairro,
                        cidade: req.body.cidade,
                        cep: req.body.cep,
                        numero: req.body.numero,
                        uf: req.body.uf
                    },
                    estabelecimento.cnpj = req.body.cnpj,
                    estabelecimento.telefone = req.body.telefone

                estabelecimento.useMercadoPago = useMercadoPagoBoolean
                estabelecimento.mercadoPago = {
                    ativo: integracaoMercadoPagoAtiva,
                    publickey: req.body.publickey,
                    acessToken: req.body.acessToken
                },

                    estabelecimento.save().then(() => {
                        req.flash('success_msg', 'Estabelecimento editado')
                        res.redirect('back')
                    }).catch(err => {
                        req.flash('error_msg', 'Ocorreu um erro')
                        res.redirect('back')
                    })
            } else {
                req.flash('error_msg', 'Ocorreu um erro')
                res.redirect('back')
            }
        }).catch(err => {
            console.log(err)
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
    if (user) {
        if (user.usuarioMaster == true) {
            addEstabelecimento = {
                nome: req.body.nome,
                url: req.body.url,
                endereco: {
                    logradouro: req.body.logradouro,
                    bairro: req.body.bairro,
                    cidade: req.body.cidade,
                    cep: req.body.cep,
                    numero: req.body.numero,
                    uf: req.body.uf
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
                        $push: { "estabelecimentosVinculados": editUsuario }
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
        } else {
            req.flash('warning_msg', 'Somente usuário MASTER pode adicionar um estabelecimento')
            res.redirect('back')
        }
    } else {
        req.flash('error_msg', 'Usuário não está logado')
        res.redirect('back')
    }
})

router.get('/painel', eAdmin, async (req, res) => {
    try {
        let usuarios = await Usuario.aggregate([
            { $match: { _id: req.user._id } },
            {
                $lookup:
                {
                    from: "estabelecimentos",
                    localField: "estabelecimentosVinculados.idEstabelecimento",
                    foreignField: "_id",
                    as: "estabelecimentosVinculados"
                }
            }
        ])
        res.render('usuarios/configuracao/paineldevendas', { usuarios: usuarios[0] })
    } catch (err) {
        console.log(err)
    }
})

router.post('/edit-config-painel', (req, res) => { // adicionar estilo do estabelecimento
    Estabelecimento.findById({ _id: req.body.estabelecimentoSelecionado }).then(estabelecimento => {
        estabelecimento.nomePainel = req.body.nome,

        estabelecimento.endereco = {
            logradouro: req.body.logradouro,
            numero: req.body.numero,
            bairro: req.body.bairro,
        },
        estabelecimento.painel = {
        colorFundo : req.body.colorFundo,
        colorFonte : req.body.colorFonte
    } 
        estabelecimento.save().then(() => {
            req.flash('success_msg', 'Painel de vendas editado.')
            res.redirect('back')
        }).catch(err => {
            req.flash('error_msg', 'Ocorreu um erro')
            res.redirect('back')
        })  
    })

})


router.post('/ajax-get-estabelecimento-painel', (req, res) => { // consulto pela rota  "/produto/categoria-produtos" para poder pegar as informações e editar seus valores
    Estabelecimento.findById({_id:req.body.idEstabelecimentoConfig}).then(produto => {
        res.json(produto)
    }).catch(err => {
        console.log(err)
    })
})


module.exports = router;

