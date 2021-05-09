const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")

router.get('/pedidos', (req, res) => {
    res.render('usuarios/pedido/pedidos', {})
})

module.exports = router