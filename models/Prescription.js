const mongoose = require('mongoose');

// 1. Define the schema variable
const prescriptionSchema = new mongoose.Schema({
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient' },
    doctorName: String,
    diagnosis: String,
    medicines: String,
    advice: String,
    date: { type: Date, default: Date.now }
});

// 2. Export it using the EXACT same variable name as above
module.exports = mongoose.model('Prescription', prescriptionSchema);