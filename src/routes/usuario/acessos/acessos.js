const express = require('express')
const router = express.Router()
const mongoose = require("mongoose")
const bcryptjs = require("bcryptjs")
const passport = require("passport")
const { v4: uuidv4 } = require('uuid');

require("../../../models/Usuario")
const Usuario = mongoose.model("usuarios")
require("../../../models/Estabelecimento")
const Estabelecimento = mongoose.model("estabelecimentos")


router.post("/registro", (req, res) => {//Rota para cadastro de uma nova conta.

    var error = []

    if (!req.body.senha || typeof req.body.senha == undefined || req.body.senha == null) {
        req.flash("error_msg", "Senha inválida.")
        res.redirect("/registro")
    }

    if (req.body.senha.length < 4) {
        req.flash("error_msg", "Senha muito curta.")
        res.redirect("/registro")
    }

    if (req.body.senha != req.body.senha2) {
        req.flash("error_msg", "Senhas divergentes.")
        res.redirect("/registro")

    } else {
        Usuario.findOne({ email: req.body.email }).lean().then((usuario) => {
            if (usuario) {
                req.flash("error_msg", "E-mail já cadastrado.")
                res.redirect("/registro")
            } else {

                const novoUsuario = new Usuario({
                    primeiroNome: req.body.primeiroNome,
                    nomeCompleto: req.body.nomeCompleto,
                    email: req.body.email,
                    cpf: req.body.cpf,
                    senha: req.body.senha,
                    eTipo:1,
                    usuarioMaster: true,
                    statusAtivo: true,
                    perfilAvatar: 'businessman',
                    identificaouuidv4: uuidv4()
                })
                bcryptjs.genSalt(10, (erro, salt) => {
                    bcryptjs.hash(novoUsuario.senha, salt, (erro, hash) => {
                        if (erro) {
                            res.json(402)
                        }

                        novoUsuario.senha = hash

                        novoUsuario.save().then((usuarioEdit) => {

                            addEstabelecimento = {
                                nome: req.body.nome,
                                url: req.body.url,
                                endereco: {
                                    logradouro: req.body.logradouro,
                                    bairro: req.body.bairro,
                                    localidade: req.body.localidade,
                                    cep: req.body.cep,
                                    numero: req.body.numero,
                                    uf: req.body.uf,
                                    
                                },
                                cnpj: req.body.cnpj,
                                telefone: req.body.telefone,
                                idUsuarioMaster: usuarioEdit._id
                            }
                            new Estabelecimento(addEstabelecimento).save().then((estabelecimento) => {
                                editUsuario = {
                                    idEstabelecimento: estabelecimento._id,
                                    cnpj: estabelecimento.cnpj,
                                    nome: estabelecimento.nome,
                                    url: estabelecimento.url
                                }
                                Usuario.updateOne(
                                    { '_id': usuarioEdit._id },
                                    {
                                        $push: { "estabelecimentosVinculados":  editUsuario},
                                        $set: {"idUsuarioMaster": usuarioEdit._id}
                                    }
                                ).then(e => {
                                    console.log('Usuario Criado')
                                    req.flash('success_msg', 'Cadastro realizado')
                                    res.redirect('/login')
                                }).catch(err => {
                                    console.log(err)
                                })
                                
                            }).catch(err => {
                                req.flash('error_msg', 'Ocorreu um erro')
                                res.redirect('back')
                            })
                        }).catch((err) => {
                            console.log(err)
                            req.flash("error_msg", "Ocorreu um erro interno.")
                            res.redirect("/registro")
                        })
                    })
                })
            }

        }).catch((err) => {
            req.flash("error_msg", "Houve um erro interno")
            res.redirect("/registro")
        })

    }
})


router.post("/cad-usuario", (req, res) => {//Rota para cadastrar novo usuário.

        req.user.usuarioMaster == true ? idUsuarioMaster = req.user._id : idUsuarioMaster = req.user.usuarioMaster
      

                const novoUsuario = new Usuario({
                    primeiroNome: req.body.primeiroNome,
                    nomeCompleto: req.body.nomeCompleto,
                    email: req.body.email,
                    cpf: req.body.cpf,
                    senha: req.body.senha,
                    usuarioMaster: false,
                    statusAtivo: true,
                    perfilAvatar: 'cashier',
                    idUsuarioMaster:req.user._id,
                    estabelecimentosVinculados: [{
                        idEstabelecimento: req.body.estabelecimento,
                    }],
                    identificaouuidv4: uuidv4()

                })
                bcryptjs.genSalt(10, (erro, salt) => {
                    bcryptjs.hash(novoUsuario.senha, salt, (erro, hash) => {
                        if (erro) {
                            res.json(402)
                        }

                        novoUsuario.senha = hash

                        novoUsuario.save().then(() => {
                            req.flash("success_msg", "Usuario criado com sucesso!")
                            res.redirect("/configuracao/estabelecimento/"+req.body.estabelecimento)
                        }).catch((err) => {
                            console.log(err)
                            req.flash("error_msg", "Houve um erro ao criar o usuário")
                            res.redirect("/configuracao/estabelecimento/"+req.body.estabelecimento)

                        })
                    })
                })       

        })
    




router.post("/login", (req, res, next) => {

    passport.authenticate("local", {
        successRedirect: "/dashboard",
        failureRedirect: "/login",
        failureFlash: true      
    })(req, res, next)

})

router.get("/logout", (req, res) => {

    req.logout()
    req.flash("success_msg", "Deslogado com sucesso!")
    res.redirect("/login")

})

module.exports = router ;
