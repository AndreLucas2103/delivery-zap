const localStrategy = require("passport-local").Strategy
const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")


// Model de usuário
require("../models/Usuario")
const Usuario = mongoose.model("usuarios")


module.exports = function(passport){
    passport.use(new localStrategy({usernameField: "email", passwordField: "senha"}, (email, senha, done) => {
        Usuario.findOne({email: email}).lean().then((usuario) => {
            if(!usuario){
                console.log('nexiste')
                return done(null, false, {message: "Está conta não existe"})
            }

            bcrypt.compare(senha, usuario.senha, (erro, batem) => {

                if(batem){
                    console.log('senha certa')
                    return done(null, usuario)
                    
                }else{
                    console.log('senhaerrada')
                    return done(null, false, {message: "Senha incorreta"})
                }

            })

        })

    }))


    passport.serializeUser((usuario, done) => {
        console.log('chegou2')
        done(null, usuario._id)
    
    })

    

    passport.deserializeUser((id, done) => {
        console.log('chegou2')
        Usuario.findById(id, (err, usuario) => {
            done(err, usuario)
            console.log(err)
        })
    })

}