
module.exports = async (req, res, next) => {
    if(!req.user)
        return res.redirect("/login")

    if(req.user.administracao === true ){
        next();
    }else{
        req.flash('error_msg', 'Acesso negado')
        return res.redirect("back")
    }
}