const express = require('express')
const router = express.Router()
const mongoose = require("mongoose")
const bcryptjs = require("bcryptjs")
const passport = require("passport")
const { v4: uuidv4 } = require('uuid');

require("../../../models/admin/AdmUsuario")
const Usuarioadm = mongoose.model("admUsuarios")


router.post("/login", (req, res, next) => {
    Usuarioadm.findOne({ email: req.body.email }).lean().then((usuario) => {

            passport.authenticate("local", {
            successRedirect: "/dashboard",
            failureRedirect: "/loginadm",
            failureFlash: true
        })(req, res, next)

    })
})
router.get("/logout", (req, res) => {

    req.logout()
    req.flash("success_msg", "Deslogado com sucesso!")
    res.redirect("/login")

})

module.exports = router;
