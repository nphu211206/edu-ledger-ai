// File: server/routes/companies.routes.js

const express = require('express');
const router = express.Router();
const apiController = require('../controllers/api.controller.js');

// === API CÔNG TY (PUBLIC) ===
router.get('/', apiController.getAllCompanies);
router.get('/:slug', apiController.getPublicCompanyProfile);

module.exports = router;    