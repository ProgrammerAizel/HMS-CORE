var express = require('express');
var router = express.Router();
var Patient = require('../models/Patient');
const Prescription = require('../models/Prescription');

function isAuthenticated(req, res, next){
    if(req.session.user) {
        return next()
    }
    res.redirect('/auth/login')
}

/* POST: recieve the data from the form adnd save it. */
// 1. THE GET ROUTE: Shows the empty form (fixes your 404)
router.get('/add',isAuthenticated, (req, res) => {
    res.render('add-patient'); 
});

// 2. THE POST ROUTE: Saves the data (your existing code with one fix)
router.post('/add', async (req, res) => {
    try {
        // Create the patient object but add the logged-in user's ID
        const patientData = {
            ...req.body,
            createdBy: req.session.user._id // This links the patient to the account
        };

        const newPatient = new Patient(patientData);
        await newPatient.save();
        
        res.render('patient-created', { name: newPatient.name });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving patient: " + err.message);
    }
});
//GET all patients.
router.get('/list', isAuthenticated, async (req, res) => {
    try {
        // FILTER: Only find patients where 'createdBy' matches the logged-in user's ID
        let patients = await Patient.find({ createdBy: req.session.user._id }).lean();

        if (!patients || patients.length === 0) {
            return res.render('patients-list', { patients: [] });
        }

        // Your existing formatting logic
        const formattedPatients = patients.map(patient => {
            return {
                ...patient,
                dateAdded: patient.dateAdded ? new Date(patient.dateAdded).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }) : "No Date"
            };
        });

        res.render('patients-list', { patients: formattedPatients });

    } catch (err) {
        console.error("FULL ERROR LOG:", err);
        res.status(500).send("Error fetching patients: " + err.message);
    }
});;

//GET patient by searching.
router.get('/search', isAuthenticated, async (req, res) => { // Added isAuthenticated middleware
    try {
        const searchQuery = req.query.query; 

        // CRITICAL FIX: Add createdBy to ensure users only search THEIR OWN records
        const patients = await Patient.find({
            createdBy: req.session.user._id, // Only my patients
            name: { $regex: searchQuery, $options: 'i' } // Matching this name
        }).lean();

        // Optional: Re-format the dates so they look nice in the search results too
        const formattedPatients = patients.map(patient => ({
            ...patient,
            dateAdded: patient.dateAdded ? new Date(patient.dateAdded).toLocaleDateString() : "No Date"
        }));

        res.render('patients-list', {
            title: 'Search Results',
            patients: formattedPatients,
            searchQuery: searchQuery
        });
    } catch (err) {
        res.status(500).send("Search Error: " + err.message);
    }
});

//GET request to  delete a patient.
router.get('/delete-patient/:id',isAuthenticated, async (req, res) => {
    try{
        const patientId = req.params.id;
        await Patient.findByIdAndDelete(patientId);

        //redirect back to patient-list to show the user patient is gone.
        res.redirect('/patients/list');
    }catch (err){
        console.log("error deleting the patient: ", err);
        res.status(500).send("Unable to delete the patient");
    }
});

//POST the profile of the patient when clicked onn the patient in the form.
router.get('/patient-profile/:id', async (req, res) => {
    try {
        const patient = await Patient.findById(req.params.id).lean();
        
        if (!patient) {
            return res.status(404).send("Patient not found");
        }

        // CRITICAL FIX: Use Prescription model, not Patient model
        const prescriptions = await Prescription.find({ patientId: req.params.id })
                                                .sort({ date: -1 })
                                                .lean();

        // Format the dates for the table
        const formattedPrescriptions = prescriptions.map(p => ({
            ...p,
            date: p.date ? p.date.toLocaleDateString() : 'N/A'
        }));

        res.render('patient-profile', {
            patient,
            prescriptions: formattedPrescriptions,
            visitCount: formattedPrescriptions.length
        });
    } catch (err) {
        console.error("Error in profile route:", err);
        res.status(500).send("Error loading profile");
    }
});

//POST: Add a new visit to a specific patient.
router.post('/add-visit/:id', async (req, res)=>{
    try{
        const {diagnosis, prescription} = req.body;

        await Patient.findByIdAndUpdate(req.params.id, {
            $push: {
                visits: {
                    diagnosis: diagnosis,
                    prescription: prescription,
                    date: new Date
                }
            }
        })

        //Redirect to the profile page to see th eupdated data.
        res.redirect(`/patients/patient-profile/${req.params.id}`);
    }catch (err) {
        console.log(err);
        res.status(500).send("Error adding visits")
        
    }
})

// POST Add Prescription
router.post('/add-prescription/:id', async (req, res) => {
    try {
        const { doctorName, diagnosis, medicines, advice } = req.body;

        // Use 'Prescription' with a capital P to match your require statement
        const newPrescription = new Prescription({
            patientId: req.params.id,
            doctorName,
            diagnosis,
            medicines,
            advice
        });

        await newPrescription.save();
        
        // Redirect back to the profile to see the new record in the table
        res.redirect(`/patients/patient-profile/${req.params.id}`);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error saving prescription: " + err.message);
    }
});

//Get doctor panel (search for patient treatment)
router.get('/doctor-panel', isAuthenticated, async (req, res) => {
    try {
        // CHANGE THIS: Patient.find() -> Patient.find({ createdBy: req.session.user._id })
        const patients = await Patient.find({ createdBy: req.session.user._id }).lean();

        res.render('doctor-panel', { 
            patients,
            doctorName: req.session.user.username // Optional: pass doctor name to the view
        });
    } catch (err) {
        console.error("Doctor Panel Error:", err);
        res.status(500).send("Error loading Doctor Panel");
    }
});

//GET specific patient treatment page
router.get('/treat-patient/:id', async (req, res)=>{
    try{
    const patient = await Patient.findById(req.params.id).lean()
    res.render('add-prescription', {patient})
    }catch (err){
        res.status(500).send("Error")
    }
});

router.get('/visit-details/:prescriptionId',isAuthenticated, async (req,res)=>{
    try{
        // 1. Fetch the specific prescription and populate patient info
        const visit = await Prescription.findById(req.params.prescriptionId).populate('patientId').lean();
        
        if(!visit) return res.status(404).send("Visit record not found")

        // 2. Format the date for the display
        const formattedDate = visit.date ? new Date(visit.date).toLocaleDateString('en-US', {
            weekend: 'long', year:'numeric', month:'long', day:'numeric'
        }) : "N/A";

        res.render('visit-details', {
            visit,
            date: formattedDate,
            title: `Visit Detail - ${visit.patientId}`
        });
    }catch (err){
        res.status(500).send("Error loading visit details");
    }
})

module.exports = router;