import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import axios from '@/utils/api';

const AyushmanStatus = () => {
  const [formData, setFormData] = useState({
    aadhaarNumber: '',
    mobileNumber: '',
    captchaCode: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaImage, setCaptchaImage] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await axios.post('/ayushman/check-status', {
        aadhaarNumber: formData.aadhaarNumber,
        mobileNumber: formData.mobileNumber
      });

      if (response.data.requiresCaptcha) {
        setShowCaptcha(true);
        setCaptchaImage(`/api/ayushman/${response.data.captchaPath}`);
        return;
      }

      setResult(response.data.data);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to check status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCaptchaSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/ayushman/submit-captcha', {
        ...formData
      });

      setResult(response.data.data);
      setShowCaptcha(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to verify captcha. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Check Ayushman Card Status
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Aadhaar Number"
              name="aadhaarNumber"
              value={formData.aadhaarNumber}
              onChange={handleInputChange}
              margin="normal"
              required
              inputProps={{ maxLength: 12, pattern: "\\d*" }}
              helperText="Enter 12 digit Aadhaar number"
            />

            <TextField
              fullWidth
              label="Mobile Number"
              name="mobileNumber"
              value={formData.mobileNumber}
              onChange={handleInputChange}
              margin="normal"
              required
              inputProps={{ maxLength: 10, pattern: "\\d*" }}
              helperText="Enter 10 digit mobile number"
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={loading}
              sx={{ mt: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Check Status'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Status Result
            </Typography>

            {result.status && (
              <Typography color="primary" gutterBottom>
                Status: {result.status}
              </Typography>
            )}

            {result.beneficiaryName && (
              <Typography gutterBottom>
                Name: {result.beneficiaryName}
              </Typography>
            )}

            {result.cardNumber && (
              <Typography gutterBottom>
                Card Number: {result.cardNumber}
              </Typography>
            )}

            {result.eligibilityStatus && (
              <Typography gutterBottom>
                Eligibility: {result.eligibilityStatus}
              </Typography>
            )}

            {result.familyMembers?.length > 0 && (
              <>
                <Typography variant="subtitle1" gutterBottom>
                  Family Members:
                </Typography>
                {result.familyMembers.map((member, index) => (
                  <Typography key={index} sx={{ pl: 2 }}>
                    • {member}
                  </Typography>
                ))}
              </>
            )}

            {result.additionalInfo && (
              <Typography sx={{ mt: 2 }} color="text.secondary">
                {result.additionalInfo}
              </Typography>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={showCaptcha} onClose={() => setShowCaptcha(false)}>
        <DialogTitle>Enter Captcha</DialogTitle>
        <DialogContent>
          {captchaImage && (
            <Box sx={{ mb: 2 }}>
              <img src={captchaImage} alt="Captcha" />
            </Box>
          )}
          <TextField
            fullWidth
            label="Captcha Code"
            name="captchaCode"
            value={formData.captchaCode}
            onChange={handleInputChange}
            required
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCaptcha(false)}>Cancel</Button>
          <Button onClick={handleCaptchaSubmit} variant="contained" disabled={loading}>
            {loading ? <CircularProgress size={24} /> : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AyushmanStatus; 