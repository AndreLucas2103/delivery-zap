const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")

router.get('/', (req, res) => {
    res.render('usuarios/dashboard/dashboard', {
        totalPrice: 300,
        data: "2021-04-28T07:00:00-00:00"
    })
})

module.exports = router