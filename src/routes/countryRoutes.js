// src/routes/countryRoutes.js

const express = require('express');
const router = express.Router();
const CountryController = require('../controllers/countryController');

/**
 * @route   GET /api/v1/countries
 * @desc    Get all countries grouped by region
 * @access  Public
 */
router.get('/', CountryController.getAllCountries);

/**
 * @route   GET /api/v1/countries/regions
 * @desc    Get all available regions
 * @access  Public
 */
router.get('/regions', CountryController.getAllRegions);

/**
 * @route   GET /api/v1/countries/region/:region
 * @desc    Get countries by specific region
 * @access  Public
 * @params  region - Americas, Europe, Asia, Africa, Oceania
 */
router.get('/region/:region', CountryController.getCountriesByRegion);

/**
 * @route   GET /api/v1/countries/:code
 * @desc    Get single country by ISO code
 * @access  Public
 * @params  code - 2-letter country code (e.g., US, GB, FR)
 */
router.get('/:code', CountryController.getCountryByCode);

module.exports = router;