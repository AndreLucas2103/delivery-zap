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
require("../../../models/admin/AdmUsuario")
const Usuarioadm = mongoose.model("admusuarios")


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
                        eTipoAdmin: true,
                        eTipo: 1,
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
                                    nomePainel: req.body.nome,
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
                                    }
                                    Usuario.updateOne(
                                        { '_id': usuarioEdit._id },
                                        {
                                            $push: { "estabelecimentosVinculados": editUsuario, 'estabelecimentosSelecionados': editUsuario },
                                            $set: { "idUsuarioMaster": usuarioEdit._id }
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

router.post("/login", (req, res, next) => {
    Usuario.findOne({ email: req.body.email }).lean().then((usuario) => {
        if (!usuario || usuario.eTipoAdmin == false) {

            Usuarioadm.findOne({'email': req.body.email}).then((admUser) => {
                if(admUser){
                    passport.authenticate("local", {
                        successRedirect: "/admin",
                        failureRedirect: "/login",
                        failureFlash: true
                    })(req, res, next)
                }else{
                    passport.authenticate("local", {
                        successRedirect: "/pedido/pedidos",
                        failureRedirect: "/login",
                        failureFlash: true
                    })(req, res, next)
                }
            })

        } else {
            passport.authenticate("local", {
                successRedirect: "/dashboard",
                failureRedirect: "/login",
                failureFlash: true
            })(req, res, next)
        }
    })
})

router.get("/logout", (req, res) => {
    req.logout()
    req.flash("success_msg", "Deslogado com sucesso!")
    res.redirect("/login")
})

module.exports = router;
