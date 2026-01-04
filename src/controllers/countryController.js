// src/controllers/countryController.js

const CountryService = require('../data/countries');

class CountryController {
  /**
   * Get all countries grouped by region
   * GET /api/v1/countries
   */
  static async getAllCountries(req, res) {
    console.log('\n========== GET ALL COUNTRIES REQUEST ==========');
    
    try {
      const countries = CountryService.getAllCountries();
      
      // Count total countries
      let totalCountries = 0;
      Object.values(countries).forEach(regionCountries => {
        totalCountries += regionCountries.length;
      });
      
      console.log(`✅ Retrieved ${totalCountries} countries across ${Object.keys(countries).length} regions`);
      console.log('========== GET ALL COUNTRIES SUCCESS ==========\n');

      res.status(200).json({
        success: true,
        data: {
          countries,
          totalCountries,
          totalRegions: Object.keys(countries).length
        }
      });

    } catch (error) {
      console.error('❌ GET ALL COUNTRIES ERROR:', error);
      console.error('Error stack:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve countries',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get countries by region
   * GET /api/v1/countries/region/:region
   */
  static async getCountriesByRegion(req, res) {
    console.log('\n========== GET COUNTRIES BY REGION REQUEST ==========');
    console.log('📝 Region:', req.params.region);
    
    try {
      const { region } = req.params;
      
      // Validate region
      const validRegions = CountryService.getAllRegions();
      if (!validRegions.includes(region)) {
        console.log('❌ Invalid region:', region);
        return res.status(404).json({
          success: false,
          message: `Invalid region. Valid regions are: ${validRegions.join(', ')}`
        });
      }
      
      const countries = CountryService.getCountriesByRegion(region);
      
      if (countries.length === 0) {
        console.log('❌ No countries found for region');
        return res.status(404).json({
          success: false,
          message: 'No countries found for this region'
        });
      }
      
      console.log(`✅ Retrieved ${countries.length} countries for region: ${region}`);
      console.log('========== GET COUNTRIES BY REGION SUCCESS ==========\n');

      res.status(200).json({
        success: true,
        data: {
          region,
          countries,
          totalCountries: countries.length
        }
      });

    } catch (error) {
      console.error('❌ GET COUNTRIES BY REGION ERROR:', error);
      console.error('Error stack:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve countries',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get all available regions
   * GET /api/v1/countries/regions
   */
  static async getAllRegions(req, res) {
    console.log('\n========== GET ALL REGIONS REQUEST ==========');
    
    try {
      const regions = CountryService.getAllRegions();
      
      // Get country count per region
      const regionsWithCount = regions.map(region => {
        const countries = CountryService.getCountriesByRegion(region);
        return {
          name: region,
          countryCount: countries.length
        };
      });
      
      console.log(`✅ Retrieved ${regions.length} regions`);
      console.log('========== GET ALL REGIONS SUCCESS ==========\n');

      res.status(200).json({
        success: true,
        data: {
          regions: regionsWithCount,
          totalRegions: regions.length
        }
      });

    } catch (error) {
      console.error('❌ GET ALL REGIONS ERROR:', error);
      console.error('Error stack:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve regions',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }

  /**
   * Get country by code
   * GET /api/v1/countries/:code
   */
  static async getCountryByCode(req, res) {
    console.log('\n========== GET COUNTRY BY CODE REQUEST ==========');
    console.log('📝 Country code:', req.params.code);
    
    try {
      const { code } = req.params;
      
      // Validate code format
      if (!code || code.length !== 2) {
        console.log('❌ Invalid country code format');
        return res.status(400).json({
          success: false,
          message: 'Country code must be 2 characters (e.g., US, GB, FR)'
        });
      }
      
      const country = CountryService.getCountryByCode(code.toUpperCase());
      
      if (!country) {
        console.log('❌ Country not found for code:', code);
        return res.status(404).json({
          success: false,
          message: `Country with code '${code.toUpperCase()}' not found`
        });
      }
      
      console.log('✅ Retrieved country:', country.name);
      console.log('========== GET COUNTRY BY CODE SUCCESS ==========\n');

      res.status(200).json({
        success: true,
        data: {
          country
        }
      });

    } catch (error) {
      console.error('❌ GET COUNTRY BY CODE ERROR:', error);
      console.error('Error stack:', error.stack);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve country',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
}

module.exports = CountryController;