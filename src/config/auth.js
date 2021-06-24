const localStrategy = require("passport-local").Strategy
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")


// Model de usuário
require("../models/Usuario")
const Usuario = mongoose.model("usuarios")

require("../models/admin/AdmUsuario")
const Usuarioadm = mongoose.model("admUsuarios")


module.exports = function(passport){
    passport.use(new localStrategy({usernameField: "email", passwordField: "senha"}, (email, senha, done) => {
        Usuario.findOne({email: email}).lean().then((usuario) => {
            
            if(!usuario){
                Usuarioadm.findOne({email: email}).lean().then((usuario) => {
                    if(!usuario){
                        return done(null, false,{message: "E-mail não cadastrado."})
                        
                    }
                    if(usuario.statusAtivo == false){
                        return done(null, false,{message: "Usuário inativo."})
                    }
                    
                    bcrypt.compare(senha, usuario.senha, (erro, batem) => {
    
                        if(batem){
                            console.log('ojk')
                            return done(null, usuario)
                            
                        }else{
                            return done(null, false, {message: "Senha incorreta."})
                        }
                    })

                })

            }else {
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
            }

        })

    }))

    passport.serializeUser((usuario, done) => {
        done(null, {_id: usuario._id, adm: usuario.administracao})
    })

    passport.deserializeUser((id, done) => {
        if(!id.adm){
            Usuario.findById(id, (err, usuario) => {
                done(err, usuario)
            })
        }else{
            Usuarioadm.findById(id, (err, usuario) => {
                done(err, usuario)
            })
        }
        
    })

}



