// ------ Módulos carregados -----------------------------------------------------------------------------------------------------------------------
const express = require('express')
const handlebars = require('express-handlebars')
const bodyParser = require("body-parser")
const path = require("path")
const app = express()
const session = require("express-session")
const flash = require("connect-flash")
const passport = require("passport")




// ----- Middleware -----------------------------------------------------------------------------------------------------------------------
app.use(session({
    secret: "cursodenode",
    resave: true,
    saveUninitialized: true
}))

app.use(passport.initialize())
app.use(passport.session())

app.use(flash())

app.use((req, res, next) => {
    res.locals.success_msg = req.flash("success_msg")
    res.locals.error_msg = req.flash("error_msg")
    res.locals.warning_msg = req.flash("warning_msg")
    res.locals.info_msg = req.flash("info_msg")
    res.locals.error = req.flash("error")
    res.locals.user = req.user || null;
    next();
})

app.use(function (req, res, next) {
    if (req.user) {
        res.locals.usuarioLogado = req.user.toObject();
    }
    next();
});


// ----- Body Parser -----------------------------------------------------------------------------------------------------------------------

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

// Handlebars

app.engine('handlebars', handlebars({ defaultLayout: 'main' }))
app.set('view engine', 'handlebars')
app.set('views', 'src/views/')




// ----- Banco de dados -----------------------------------------------------------------------------------------------------------------------

const mongoose = require("mongoose")


// ----- Mongoose --------------------------------------------------------------------------------------------------------------------------------

//url de destino para conexão com o mongoDB no Atlas, servidor Online:
//- mongodb+srv://admin:admin@delivery-zap-teste1.hrbcb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority
// Para se conectar ao mongodb Compass utilize: mongodb+srv://admin:admin@delivery-zap-teste1.hrbcb.mongodb.net/test
//url de destino para a base de dados localhost:
//- mongodb://localhost/delzap


mongoose.Promise = global.Promise;
mongoose.connect("mongodb+srv://admin:admin@delivery-zap-teste1.hrbcb.mongodb.net/myFirstDatabase?retryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Conectado ao mongo")
}).catch((err) => {
    console.log("Erro ao se conectar: " + err)
})



// ----- Public ----------------------------------------------------------------------------------------------------------------------------------

app.use(express.static(path.join(__dirname, "public")))



// ----- Colections ------------------------------------------------------------------------------------------------------------------------------
require("../src/models/Usuario")
const Usuario = mongoose.model("usuarios")



// ----- Rotas -------------------------------------------------------------------------------------------------------------------------------------

app.get('/', (req, res) => {
    res.render('index')
})

app.get('/login', (req, res) => {
    res.render('usuarios/acesso/login')
})

app.get('/registro', (req, res) => {
    res.render('usuarios/acesso/registro')
})


// ---- Rotas "routes" -----------------------------------------------------------------------------------------------------------------------------

// Rotas para USUARIOS
const acessoUsuario = require("./routes/usuario/acessos/acessos")
const usuarioDashboard = require("./routes/usuario/dashboard/dashboard")

app.use('/acessos', acessoUsuario)
app.use('/dashboard', usuarioDashboard)


// ---- Rotas Para TESTES -----------------------------------------------------------------------------------------------------------------------------

app.get('/teste', async (req, res) => {
    res.render('teste')
})


// ---- Port -----------------------------------------------------------------------------------------------------------------------------------

const PORT = 3000
app.listen(PORT, () => {
    console.log("Servidor rodando! ")
})