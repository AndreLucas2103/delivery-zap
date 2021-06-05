const express = require('express')
const router = express.Router()
const mongoose = require("mongoose")
const multer = require('multer')
const multerConfig = require('../../../config/multer')
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
            if (estabelecimento) {
                estabelecimento.nome = req.body.nome,
                    estabelecimento.url = req.body.url,
                    estabelecimento.endereco = {
                        logradouro: req.body.logradouro,
                        bairro: req.body.bairro,
                        localidade: req.body.cidade,
                        cep: req.body.cep,
                        numero: req.body.numero,
                        uf: req.body.uf
                    },
                    estabelecimento.cnpj = req.body.cnpj,
                    estabelecimento.telefone = req.body.telefone


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

router.post('/edit-estabelecimento-integracao-mercado-pago', (req, res) => {
    try {
        Estabelecimento.findById({ _id: req.body.idEstabelecimento }).then(estabelecimento => {
            if (estabelecimento) {
                req.body.statusAtivo == "true" ? statusAtivo = true : statusAtivo = false
                estabelecimento.integracao.mercadoPago.testadoAtivo == true ? integracaoMercadoPagoAtiva = true : integracaoMercadoPagoAtiva = false

                estabelecimento.integracao.mercadoPago = {
                    statusAtivo: statusAtivo,
                    testadoAtivo: integracaoMercadoPagoAtiva,
                    publickey: req.body.publickey,
                    acessToken: req.body.acessToken
                },

                    estabelecimento.save().then(() => {
                        req.flash('success_msg', 'Estabelecimento editado')
                        res.redirect('back')
                    }).catch(err => {
                        console.log(err)

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
        console.log(err)

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
                nomePainel: req.body.nome,
                url: req.body.url,
                endereco: {
                    logradouro: req.body.logradouro,
                    bairro: req.body.bairro,
                    localidade: req.body.cidade,
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

router.get('/painel/:idPainel', eAdmin, async (req, res) => {
    try {
        let estabelecimento = await Estabelecimento.aggregate([
            { $match: { _id: ObjectId(req.params.idPainel) } },
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

        res.render('usuarios/configuracao/configpainel', { estabelecimento: estabelecimento[0] })
    } catch (err) {
        console.log(err)
    }
})


router.post('/edit-config-painel', (req, res) => { // adicionar estilo do estabelecimento
    Estabelecimento.findById({ _id: req.body.idPainel }).then(estabelecimento => {
        if (estabelecimento) {
            estabelecimento.nomePainel = req.body.nome,

                estabelecimento.endereco.logradouro = req.body.logradouro,
                estabelecimento.endereco.numero = req.body.numero,
                estabelecimento.endereco.bairro = req.body.bairro,

                estabelecimento.painel = {
                    colorFundo: req.body.colorFundo,
                    colorFonte: req.body.colorFonte
                }
            estabelecimento.save().then(() => {
                req.flash('success_msg', 'Painel de vendas editado.')
                res.redirect('back')
            }).catch(err => {
                req.flash('error_msg', 'Ocorreu um erro')
                res.redirect('back')
            })
        } else {
            req.flash('error_msg', 'Ocorreu um erro')
            res.redirect('back')
        }
    })

})


router.get("/posts", async (req, res) => {
    const posts = await Estabelecimento.find();

    return res.json(posts);
});


let upload = multer(multerConfig.uploadEstabelecimento).single('file')

router.post("/posts/:teste",  async (req, res) => {
    upload(req, res, function (err) {
        if (err) {
            let teste = "" + err; // pego o código do erro e exibo a mensagem para o usuário
            if(teste == 'Error: Invalid file type.'){
                req.flash('error_msg', 'Formato de arquivo não suportado')
                res.redirect('back')
                return
            }else{
                req.flash('error_msg', 'Arquivo muito grande! Deve possui no máximo 250 MB')
                res.redirect('back')
                return
            }
        }

        const { originalname: name, size, key, location: url = "" } = req.file;
        const post = await Estabelecimento.create({
            name,
            size,
            key,
            url
        });

        return res.json(post);
    })
    
});


router.delete("/posts/:id", async (req, res) => {
    const post = await Estabelecimento.findById(req.params.id);

    await post.remove();

    return res.send();
});


module.exports = router;

