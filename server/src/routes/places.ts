import express from 'express';
import axios from 'axios';

const router = express.Router();

router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, type } = req.query;
    
    if (!lat || !lng || !type) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }

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

    res.json(response.data);
  } catch (error) {
    console.error('Error fetching nearby places:', error);
    res.status(500).json({ error: 'Failed to fetch nearby places' });
  }
});

export default router; 