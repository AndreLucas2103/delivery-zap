const mongoose = require("mongoose");
const Schema = mongoose.Schema;

/*
    
*/

const Ingrediente = new Schema({
    nome: String,
    
    statusAtivo: {
        type: Boolean,
        default: true
    }

},{ timestamps: true})

mongoose.model("ingredientes", Ingrediente)



