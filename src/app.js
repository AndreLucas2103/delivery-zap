// ------Módulos carregados-----
const express = require('express')
const handlebars = require('express-handlebars')
const bodyParser = require("body-parser")
const path = require("path")
const app = express()

// -----Banco de dados------
const mongoose = require("mongoose")

//Middleware


// -----Colections-----



// -----Body Parser-----

app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
// Handlebars
app.engine('handlebars', handlebars({defaultLayout: 'main'}))
app.set('view engine', 'handlebars')

// -----Mongoose-----

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost/delzap", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("Conectado ao mongo")
}).catch((err) => {
    console.log("Erro ao se conectar: "+err)
})
// -----Public-----

app.use(express.static(path.join(__dirname,"public")))

// -----Rotas-----
app.get('/', (req, res) => {
    res.render('index')
})

// ----Rotas "routes"----


// ----Port-----
const PORT = 3000
app.listen(PORT,() => {
console.log("Servidor rodando! ")
})