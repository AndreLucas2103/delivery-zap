const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")

router.get('/', (req, res) => {
    console.log()
    res.render('usuarios/dashboard/dashboard', {
        totalPrice: 300,
    })
})

module.exports = router