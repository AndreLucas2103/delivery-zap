const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const { eAdmin } = require("../../../helpers/eAdmin")

require("../../../models/Estabelecimento")
const Estabelecimento = mongoose.model("estabelecimentos")

router.get('/', async (req, res) => {

try {

    let estabelecimentos_ativos = await Estabelecimento.countDocuments({
        $and: [
            { 'locacao.liberado': 'true' }
        ]
    })



    res.render('admin/dashboard/dashboard', {
        estabelecimentos_ativos: estabelecimentos_ativos,
    })
} catch (err) {
    console.log(err)
}
})

module.exports = router