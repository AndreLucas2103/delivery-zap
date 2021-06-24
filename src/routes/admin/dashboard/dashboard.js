const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const { eAdmin } = require("../../../helpers/eAdmin")

router.get('/', (req, res) => {
    res.render('admin/dashboard/dashboard', {})
})

module.exports = router