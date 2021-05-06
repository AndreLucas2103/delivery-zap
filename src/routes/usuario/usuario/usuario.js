const express = require('express')
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')
const bcryptjs = require("bcryptjs")

require("../../../models/Usuario")
const Usuario = mongoose.model("usuarios")


router.get('/usuarios', async (req, res) => {
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
            },
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
        res.render('usuarios/usuario/usuarios', { usuarios: usuarios[0] })

    } catch (err) {
        console.log(err)
    }
})

router.post("/add-usuario", (req, res) => {//Rota para cadastrar novo usuário.

    req.user.usuarioMaster == true ? idUsuarioMaster = req.user._id : idUsuarioMaster = req.user.usuarioMaster


    const novoUsuario = new Usuario({
        primeiroNome: req.body.primeiroNome,
        nomeCompleto: req.body.nomeCompleto,
        email: req.body.email,
        cpf: req.body.cpf,
        senha: req.body.senha,
        usuarioMaster: true,
        statusAtivo: true,
        perfilAvatar: 'cashier',
        idUsuarioMaster: req.user._id,
        identificaouuidv4: req.user.identificaouuidv4

    })
    bcryptjs.genSalt(10, (erro, salt) => {

        bcryptjs.hash(novoUsuario.senha, salt, (erro, hash) => {
            if (erro) {
                res.json(402)
            }

            novoUsuario.senha = hash
            novoUsuario.save().then((usuario) => {
                let arrayEstabelecimentos = req.body.estabelecimentos
                arrayEstabelecimentos.forEach(element => {
                    Usuario.updateOne(
                        { _id: usuario._id },
                        {
                            $push: {
                                'estabelecimentosVinculados': { 'idEstabelecimento': ObjectId(element) },
                            }
                        }
                    ).then(() => {
                        
                    }).catch(err => {
                        console.log(err)
                    })
                })

                req.flash("success_msg", "Usuario criado com sucesso!")
                res.redirect("/usuario/usuarios")
            }).catch((err) => {
                console.log(err)
                req.flash("error_msg", "Houve um erro ao criar o usuário")
                res.redirect("/usuario/usuarios")

            })
        })
    })

})

router.get('/perfil', async (req, res) => {
    try {
        let usuario = await Usuario.aggregate([
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
        ])

        console.log(usuario[0])

        res.render('usuarios/usuario/perfil', { usuario: usuario[0] })
    } catch (err) {
        console.log(err)
    }
})

router.post('/alterar-avatar', (req, res) => {
    Usuario.updateOne(
        { '_id': req.user._id },
        {
            $set: { "perfilAvatar": req.body.perfilAvatar }
        }
    ).then(e => {
        req.flash('success_msg', 'Avatar editado')
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
})

router.post('/edit-perfil-infos-gerais', (req, res) => {
    req.body.estabelecimentoSelecionado ? estabelecimentoSelecionado = req.body.estabelecimentoSelecionado : estabelecimentoSelecionado = null
    console.log(req.body.estabelecimentoSelecionado)
    Usuario.updateOne(
        { '_id': req.user._id },
        {
            $set: {
                "primeiroNome": req.body.primeiroNome,
                "nomeCompleto": req.body.nomeCompleto,
                "email": req.body.email,
                "cpf": req.body.cpf,
                "timeZone": req.body.timeZone,
                "estabelecimentoSelecionado": estabelecimentoSelecionado
            }
        }
    ).then(e => {
        req.flash('success_msg', 'Perfil editado')
        res.redirect('back')
    }).catch(err => {
        console.log(err)
    })
})

router.post('/trocar-senha', async (req, res) => {

    Usuario.findById({ _id: req.user._id }).then(usuario => {
        if (req.body.novaSenha != req.body.confirmaSenha) {
            req.flash('error_msg', 'Senhas divergentes.')
            res.redirect('/usuario/perfil')
        }
        if (req.body.novaSenha.length < 4) {
            req.flash('error_msg', 'Senha muito curta.')
            res.redirect('/usuario/perfil')

        } else {
            usuario.senha = req.body.novaSenha
            bcryptjs.genSalt(10, (erro, salt) => {
                bcryptjs.hash(usuario.senha, salt, (erro, hash) => {
                    if (erro) {
                        res.json(402)
                    }

                    usuario.senha = hash

                    usuario.save().then(() => {
                        console.log('ok')
                        req.flash('success_msg', 'Senha alterada com sucesso.')
                        res.redirect('/usuario/perfil')
                    }).catch(err => {
                        req.flash('error_msg', 'Error ao editar dados' + err)
                        res.redirect('/')
                        console.log(err)
                    })

                })
            })
        }
    })
})


module.exports = router;

