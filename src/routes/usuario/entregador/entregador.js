const express = require("express")
const router = express.Router()
const mongoose = require("mongoose")
const { eAdmin } = require("../../../helpers/eAdmin")


require("../../../models/Entregador")
const Entregador = mongoose.model("entregadores")

router.get('/entregadores',eAdmin, async (req, res) => {
    try {
        let entregadores = await Entregador.aggregate([
            { $match: { _id: req.user._id } },
            {
                $lookup:
                {
                    from: "estabelecimentos",
                    localField: "estabelecimentos.idEstabelecimento",
                    foreignField: "_id",
                    as: "estabelecimentosVinculados"
                }
            },
            {
                $lookup:
                {
                    from: "entregadores",
                    localField: "estabelecimentos._id",
                    foreignField: "estabelecimentos.idEstabelecimento",
                    as: "entregadoresVinculados"
                }
            },
        ])
        res.render('usuarios/entregador/entregadores', { entregadores: entregadores[0] })
       

    } catch (err) {
        console.log(err)
    }
})
   

module.exports = router