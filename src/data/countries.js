// src/data/countries.js

const countries = {
  Americas: [
    {
      code: 'US',
      name: 'United States',
      flag: '🇺🇸',
      currency: 'USD',
      currencySymbol: '$'
    },
    {
      code: 'CA',
      name: 'Canada',
      flag: '🇨🇦',
      currency: 'CAD',
      currencySymbol: '$'
    },
    {
      code: 'MX',
      name: 'Mexico',
      flag: '🇲🇽',
      currency: 'MXN',
      currencySymbol: '$'
    },
    {
      code: 'BR',
      name: 'Brazil',
      flag: '🇧🇷',
      currency: 'BRL',
      currencySymbol: 'R$'
    }
  ],
  Europe: [
    {
      code: 'GB',
      name: 'United Kingdom',
      flag: '🇬🇧',
      currency: 'GBP',
      currencySymbol: '£'
    },
    {
      code: 'DE',
      name: 'Germany',
      flag: '🇩🇪',
      currency: 'EUR',
      currencySymbol: '€'
    },
    {
      code: 'FR',
      name: 'France',
      flag: '🇫🇷',
      currency: 'EUR',
      currencySymbol: '€'
    },
    {
      code: 'ES',
      name: 'Spain',
      flag: '🇪🇸',
      currency: 'EUR',
      currencySymbol: '€'
    },
    {
      code: 'IT',
      name: 'Italy',
      flag: '🇮🇹',
      currency: 'EUR',
      currencySymbol: '€'
    },
    {
      code: 'NL',
      name: 'Netherlands',
      flag: '🇳🇱',
      currency: 'EUR',
      currencySymbol: '€'
    }
  ],
  Asia: [
    {
      code: 'CN',
      name: 'China',
      flag: '🇨🇳',
      currency: 'CNY',
      currencySymbol: '¥'
    },
    {
      code: 'JP',
      name: 'Japan',
      flag: '🇯🇵',
      currency: 'JPY',
      currencySymbol: '¥'
    },
    {
      code: 'IN',
      name: 'India',
      flag: '🇮🇳',
      currency: 'INR',
      currencySymbol: '₹'
    },
    {
      code: 'SG',
      name: 'Singapore',
      flag: '🇸🇬',
      currency: 'SGD',
      currencySymbol: '$'
    },
    {
      code: 'AE',
      name: 'United Arab Emirates',
      flag: '🇦🇪',
      currency: 'AED',
      currencySymbol: 'د.إ'
    },
    {
      code: 'SA',
      name: 'Saudi Arabia',
      flag: '🇸🇦',
      currency: 'SAR',
      currencySymbol: 'ر.س'
    }
  ],
  Africa: [
    {
      code: 'ZA',
      name: 'South Africa',
      flag: '🇿🇦',
      currency: 'ZAR',
      currencySymbol: 'R'
    },
    {
      code: 'NG',
      name: 'Nigeria',
      flag: '🇳🇬',
      currency: 'NGN',
      currencySymbol: '₦'
    },
    {
      code: 'EG',
      name: 'Egypt',
      flag: '🇪🇬',
      currency: 'EGP',
      currencySymbol: 'E£'
    },
    {
      code: 'KE',
      name: 'Kenya',
      flag: '🇰🇪',
      currency: 'KES',
      currencySymbol: 'KSh'
    }
  ],
  Oceania: [
    {
      code: 'AU',
      name: 'Australia',
      flag: '🇦🇺',
      currency: 'AUD',
      currencySymbol: '$'
    },
    {
      code: 'NZ',
      name: 'New Zealand',
      flag: '🇳🇿',
      currency: 'NZD',
      currencySymbol: '$'
    }
  ]
};

class CountryService {
  /**
   * Get all countries grouped by region
   */
  static getAllCountries() {
    return countries;
  }

  /**
   * Get countries by region
   */
  static getCountriesByRegion(region) {
    return countries[region] || [];
  }

  /**
   * Get all regions
   */
  static getAllRegions() {
    return Object.keys(countries);
  }

  /**
   * Get country by code
   */
  static getCountryByCode(code) {
    for (const region in countries) {
      const country = countries[region].find(c => c.code === code);
      if (country) {
        return { ...country, region };
      }
    }
    return null;
  }

  /**
   * Validate country code
   */
  static isValidCountryCode(code) {
    return this.getCountryByCode(code) !== null;
  }

  /**
   * Get flattened list of all countries
   */
  static getFlatCountryList() {
    const flatList = [];
    for (const region in countries) {
      countries[region].forEach(country => {
        flatList.push({
          ...country,
          region
        });
      });
    }
    return flatList;
  }
}

module.exports = CountryService;