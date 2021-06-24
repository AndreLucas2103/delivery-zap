const localStrategy = require("passport-local").Strategy
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

// Model de usuário administrador
require("../models/admin/AdmUsuario")
const Usuarioadm = mongoose.model("admUsuarios")


module.exports = function(passport){
    passport.use(new localStrategy({usernameField: "email", passwordField: "senha"}, (email, senha, done) => {
        Usuarioadm.findOne({email: email}).lean().then((usuario) => {
            if(!usuario){
                return done(null, false,{message: "E-mail não cadastrado."})
            }
            if(usuario.statusAtivo == false){
                return done(null, false,{message: "Usuário inativo."})
            }
            bcrypt.compare(senha, usuario.senha, (erro, batem) => {

                if(batem){
                    return done(null, usuario)
                    
                }else{
                    return done(null, false, {message: "Senha incorreta."})
                }

            })

        })

    }))

    passport.serializeUser((usuario, done) => {
        done(null, usuario._id)
    
    })


    passport.deserializeUser((id, done) => {
        Usuarioadm.findById(id, (err, usuario) => {
            done(err, usuario)
        })
    })

}