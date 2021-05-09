module.exports = {
    eAdmin: function(req, res, next){

        if(req.user.eTipoAdmin == true){
            return next();
        }
        res.redirect("/usuario/bloqueado")
    }
}



