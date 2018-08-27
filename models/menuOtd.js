const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const MenuOtdSchema = new Schema({
  _id: {type: String, required: true},
  weekday_esc: {type: String},
  weekday: {type: String},
  content: {type: Array, required: true}
});

module.exports = mongoose.model("MenuOtd", MenuOtdSchema);