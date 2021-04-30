const express = require('express')
const router = express.Router()
const mongoose = require("mongoose")
const bcryptjs = require("bcryptjs")
const passport = require("passport")
const { ObjectId } = require('bson')

require("../../../models/Usuario")
const Usuario = mongoose.model("usuarios")


router.get('/perfil', async (req, res) => {
    try {
        let usuario = await Usuario.aggregate([
            {$match: {_id: ObjectId("6089dd9ac10c142f7c22fa23")}}
        ])
        
        res.render('usuarios/usuario/perfil')
    } catch (err) {
        console.log(err)
    }
})

module.exports = router ;
