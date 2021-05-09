const express = require('express')
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')
const bcryptjs = require("bcryptjs")
const { eAdmin } = require("../../../helpers/eAdmin")

require("../../../models/Usuario")
const Usuario = mongoose.model("usuarios")


router.get('/usuarios',eAdmin, async (req, res) => {
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
    let eTipoAdmin
    req.body.eTipoAdmin == "true" ? eTipoAdmin = true : eTipoAdmin = false
    req.user.usuarioMaster == true ? idUsuarioMaster = req.user._id : idUsuarioMaster = req.user.usuarioMaster


    const novoUsuario = new Usuario({
        primeiroNome: req.body.primeiroNome,
        nomeCompleto: req.body.nomeCompleto,
        email: req.body.email,
        cpf: req.body.cpf,
        senha: req.body.senha,
        usuarioMaster: false,
        statusAtivo: true,
        eTipoAdmin: eTipoAdmin,
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

router.post("/edit-usuario", (req, res) => {//Rota editar novo usuário.
    let eTipoAdmin
    let statusAtivo
    req.body.eTipoAdmin == "true" ? eTipoAdmin = true : eTipoAdmin = false   
    req.body.statusAtivo == "true" ? statusAtivo = true : statusAtivo = false
    let arrayEstabelecimentos = req.body.estabelecimentos

    if(!arrayEstabelecimentos){
        req.flash('warning_msg', 'Ao editar um usuário ela deve possuir pelo menos UM estabelecimento')
        res.redirect('back')
    }else{
        Usuario.updateOne( // defino que o estabelecimento é valor zerado e depois ocorre o forEach adicionando todos os estabelecimentos
            {_id: req.body.idUsuario},
            { $set: 
                {'estabelecimentosVinculados': [], 'primeiroNome': req.body.primeiroNome, 'nomeCompleto': req.body.nomeCompleto, 'statusAtivo': statusAtivo, 
                'eTipoAdmin': eTipoAdmin, 'email': req.body.email, 'cpf': req.body.cpf}
                 
            }
        ).then(() => {
            arrayEstabelecimentos.forEach(element => {
                Usuario.updateOne(
                    {_id: req.body.idUsuario},
                    { $push: 
                        {'estabelecimentosVinculados': {'idEstabelecimento': ObjectId(element)}}
                    }
                ).then(() => {
                    
                }).catch(err => {
                    console.log(err)
                })
            })
            setTimeout(() => {
                req.flash('success_msg', 'Categoria adicionada')
                res.redirect('back')
            }, 1000)
        }).catch(err => {
            console.log(err)
        })
    }
})

router.post('/ajax-get-usuarios', (req, res) => { // consulto pela rota  "/produto/categoria-produtos" para poder pegar as informações e editar seus valores
    Usuario.findById({_id: req.body.idUsuario}).lean().then(usuario => {
        res.json(usuario)
    })
})

router.get('/perfil', async (req, res) => {//Acessar perfil do usuário
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

//Rota para quando o usuário não tiver permissão para acessar
router.get('/bloqueado', (req, res) => {
    res.render('usuarios/usuario/bloqueado')
})

module.exports = router;

