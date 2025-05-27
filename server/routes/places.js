import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, type } = req.query;
    
    if (!lat || !lng || !type) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    console.log('Fetching nearby places with params:', { lat, lng, type });
    console.log('Using API key:', process.env.GOOGLE_MAPS_API_KEY);

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/place/nearbysearch/json`,
      {
        params: {
          location: `${lat},${lng}`,
          radius: '5000', // 5km radius
          type: type,
          keyword: 'hospital',
          key: process.env.GOOGLE_MAPS_API_KEY,
        },
      }
    );

    if (response.data.status === 'REQUEST_DENIED') {
      console.error('Google Places API request denied:', response.data.error_message);
      return res.status(500).json({ 
        error: 'Google Places API request denied',
        details: response.data.error_message 
      });
    }

    if (!response.data.results) {
      console.error('Unexpected Google Places API response:', response.data);
      return res.status(500).json({ 
        error: 'Invalid response from Google Places API' 
      });
    }

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching nearby places:', error.response?.data || error.message);
    res.status(500).json({ 
      error: 'Failed to fetch nearby places',
      details: error.response?.data || error.message
    });
  }
});

export default router; 