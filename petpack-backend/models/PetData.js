const mongoose = require('mongoose');

const petDataSchema = new mongoose.Schema({
    petName: {
        type: String,
    },
    petOwner: {
        type: String,
    },

});
module.exports = mongoose.model('PetData', petDataSchema);