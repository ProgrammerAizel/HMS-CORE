const mongoose = require('mongoose');

const PatientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  mobile: { type: String, required: true },
  disease: { type: String, required: true },
  dateAdded: { type: Date, default: Date.now },
  createdBy: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
  visitsCount: {type: Number, default: 1}
});

module.exports = mongoose.model('Patient', PatientSchema);