
module.exports = async (req, res, next) => {
    if(!req.user)
        return res.redirect("/login")

    if(req.user.estabelecimentosSelecionados.length <= 0 ){
        req.flash('info_msg', 'Nenhum estabelecimento está selecionado')
        return res.redirect("/fatura/faturas")
    }

    next();
}