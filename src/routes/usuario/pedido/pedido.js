const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const { ObjectId } = require('bson')
const { eAdmin } = require("../../../helpers/eAdmin")

require("../../../models/Estabelecimento")
const Estabelecimento = mongoose.model("estabelecimentos")

router.get('/pedidos', (req, res) => {
    res.render('usuarios/pedido/pedidos', {})
})

router.get('/:urlPainel', async (req, res)=>{
    try {
        let estabelecimento = await Estabelecimento.aggregate([
            { $match: { url: req.params.urlPainel } },
            {
                $lookup:
                {
                    from: "usuarios",
                    localField: "_id",
                    foreignField: "estabelecimentosVinculados.idEstabelecimento",
                    as: "usuarios"
                }
            }
        ])

        res.render('usuarios/pedido/painelvendas', { estabelecimento: estabelecimento[0] })
    } catch (err) {
        console.log(err)
    }
})
module.exports = router