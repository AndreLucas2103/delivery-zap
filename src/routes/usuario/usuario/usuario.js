const express = require('express')
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')
const bcryptjs = require("bcryptjs")
const { eAdmin } = require("../../../helpers/eAdmin")

require("../../../models/Usuario")
const Usuario = mongoose.model("usuarios")
require("../../../models/Estabelecimento")
const Estabelecimento = mongoose.model("estabelecimentos")


router.get('/usuarios',eAdmin, async (req, res) => {
    try {
        let userEstabelecimentos = []
        req.user.estabelecimentosSelecionados.forEach(element => { userEstabelecimentos.push(element.idEstabelecimento) })

        let usuarios = await Usuario.find({"estabelecimentosVinculados.idEstabelecimento" : userEstabelecimentos }).populate('estabelecimentosVinculados.idEstabelecimento').lean()
        let estabelecimentos = await Estabelecimento.find({"idUsuarioMaster" : req.user.idUsuarioMaster }).populate('idUsuarioMaster').lean()

        res.render('usuarios/usuario/usuarios', { usuarios: usuarios, estabelecimentos: estabelecimentos })

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
        idUsuarioMaster: req.user.idUsuarioMaster,
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
                                'estabelecimentosSelecionados': { 'idEstabelecimento': ObjectId(element) },
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
                {'estabelecimentosVinculados': [], 'estabelecimentosSelecionados': [], 'primeiroNome': req.body.primeiroNome, 'nomeCompleto': req.body.nomeCompleto, 'statusAtivo': statusAtivo, 
                'eTipoAdmin': eTipoAdmin, 'email': req.body.email, 'cpf': req.body.cpf}
            
            }
        ).then(() => {
            arrayEstabelecimentos.forEach(element => {
                Usuario.updateOne(
                    {_id: req.body.idUsuario},
                    { $push: 
                        {'estabelecimentosVinculados': {'idEstabelecimento': ObjectId(element)},
                        'estabelecimentosSelecionados': { 'idEstabelecimento': ObjectId(element)}
                    },
                        
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
    Usuario.updateOne(
        { '_id': req.user._id },
        {
            $set: {
                "primeiroNome": req.body.primeiroNome,
                "nomeCompleto": req.body.nomeCompleto,
                "email": req.body.email,
                "cpf": req.body.cpf,
                "timeZone": req.body.timeZone,
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

router.post('/edit-estabelecimentosSelecionados', (req, res) => {
    if(req.body.estabelecimentosSelecionados){
        Usuario.updateOne(
            {_id: req.user._id},
            {
                $set: {'estabelecimentosSelecionados': []},
            }
        ).then(() => {
            let establecimentoInativo = false

            let arrayEstabelecimentos = JSON.parse(req.body.estabelecimentosSelecionados)
            arrayEstabelecimentos.forEach(async element => {
                try {   
                    let estabelecimento = await Estabelecimento.findById(element.idEstabelecimento)
                    if(estabelecimento.statusAtivo === false){
                        establecimentoInativo = true
                    }else{
                        await Usuario.updateOne(
                            {_id: req.user._id},
                            { $push: {
                                'estabelecimentosSelecionados': {'idEstabelecimento': ObjectId(element.idEstabelecimento)},
                            }}
                        )
                    }
                } catch (err) {
                    console.log(err)
                }
            })
    
            setTimeout(() => {
                establecimentoInativo ? req.flash("info_msg", "Um dos estabelecimentos selecionados está inativo") : req.flash("success_msg", "Estabelecimento selecionado")
                res.redirect('back')
            }, 2000)
        })
    }else{
        req.flash('error_msg', 'Selecione ao menos UM estabelecimento')
        res.redirect('back')
    }
})

//Rota para quando o usuário não tiver permissão para acessar
router.get('/bloqueado', (req, res) => {
    res.render('usuarios/usuario/bloqueado')
})



module.exports = router;

