const mongoose = require("mongoose")

require("../models/Carrinho")
const Carrinho = mongoose.model("carrinhos")

module.exports = async (req, res, next) => {
    try {
        if (!req.body.idProduto){
            return console.error('Ocorreu um erro no middleware para remover produtos do carrinho momento da edição')
        }

        await Carrinho.updateMany(
            {"produtos.idProduto": req.body.idProduto},
            {
                "$pull": {
                    "produtos": {idProduto: req.body.idProduto}
                }
            }
        )

        return next();
    } catch (err) {
        console.log(err)
    }
}