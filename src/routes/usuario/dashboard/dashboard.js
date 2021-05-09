const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const { eAdmin } = require("../../../helpers/eAdmin")

router.get('/',eAdmin, (req, res) => {
    res.render('usuarios/dashboard/dashboard', {})
})

module.exports = router