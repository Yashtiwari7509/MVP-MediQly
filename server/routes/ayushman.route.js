import express from 'express';
import puppeteer from 'puppeteer';
import { validateAadhaar, isValidMobile } from '../utils/validation.js';
import axios from 'axios';

const router = express.Router();

// Mock data for development
const MOCK_DATA = {
  cardDetails: {
    cardNumber: "PMJAY-XXXX-XXXX-1234",
    beneficiaryName: "John Doe",
    familyMembers: 4,
    validUntil: "2025-12-31",
    status: "Active",
    availableBalance: "₹5,00,000",
    usedAmount: "₹50,000"
  },
  hospitals: [
    {
      id: 1,
      name: "City General Hospital",
      distance: "2.5 km",
      address: "123 Healthcare Street, City Area",
      phone: "+91 98765 43210",
      specialties: ["General Medicine", "Cardiology", "Orthopedics"],
      rating: 4.5,
      waitTime: "15 mins"
    },
    {
      id: 2,
      name: "Medicare Superspeciality",
      distance: "3.8 km",
      address: "456 Medical Lane, Town Center",
      phone: "+91 98765 43211",
      specialties: ["Neurology", "Oncology", "Pediatrics"],
      rating: 4.8,
      waitTime: "30 mins"
    },
    {
      id: 3,
      name: "Community Health Center",
      distance: "1.2 km",
      address: "789 Wellness Road, Local Area",
      phone: "+91 98765 43212",
      specialties: ["Family Medicine", "Emergency Care"],
      rating: 4.2,
      waitTime: "10 mins"
    }
  ],
  claims: [
    {
      id: "CLM001",
      date: "2024-03-15",
      hospital: "City General Hospital",
      treatment: "Emergency Care",
      amount: 25000,
      status: "Approved"
    },
    {
      id: "CLM002",
      date: "2024-02-28",
      hospital: "Medicare Superspeciality",
      treatment: "Surgery",
      amount: 150000,
      status: "Processing"
    }
  ]
};

// Helper function for debugging element presence
const debugElement = async (page, selector) => {
  const exists = await page.evaluate((sel) => {
    const element = document.querySelector(sel);
    if (element) {
      return {
        exists: true,
        visible: window.getComputedStyle(element).display !== 'none',
        tag: element.tagName,
        type: element.type,
        id: element.id,
        classes: Array.from(element.classList)
      };
    }
    return { exists: false };
  }, selector);
  console.log(`Debug ${selector}:`, exists);
  return exists;
};

// Helper function to wait for and click element
const waitAndClick = async (page, selector, timeout = 5000) => {
  try {
    await page.waitForSelector(selector, { visible: true, timeout });
    await page.click(selector);
    return true;
  } catch (error) {
    console.log(`Failed to find or click element: ${selector}`);
    return false;
  }
};

// Cache for hospitals data
let hospitalsCache = {
  data: null,
  lastFetched: null,
  expiryTime: 30 * 60 * 1000 // 30 minutes
};

// Get Ayushman card details
router.get('/details', async (req, res) => {
  try {
    // For development, return mock data
    res.json({
      success: true,
      data: MOCK_DATA.cardDetails,
      isMockData: true
    });

    /* Commented out real implementation for now
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://mera.pmjay.gov.in/search/login', {
      waitUntil: 'networkidle0'
    });

    const cardDetails = await page.evaluate(() => {
      return {
        cardNumber: document.querySelector('[data-card-number]')?.textContent,
        beneficiaryName: document.querySelector('[data-beneficiary-name]')?.textContent,
        familyMembers: parseInt(document.querySelector('[data-family-members]')?.textContent || '0'),
        validUntil: document.querySelector('[data-valid-until]')?.textContent,
        status: document.querySelector('[data-card-status]')?.textContent,
        availableBalance: document.querySelector('[data-available-balance]')?.textContent,
        usedAmount: document.querySelector('[data-used-amount]')?.textContent
      };
    });

    await browser.close();

    res.json({
      success: true,
      data: cardDetails
    });
    */
  } catch (error) {
    console.error('Error fetching card details:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch card details'
    });
  }
});

// Get nearby hospitals
router.get('/hospitals', async (req, res) => {
  try {
    // For development, return mock data
    res.json({
      success: true,
      data: MOCK_DATA.hospitals,
      isMockData: true
    });

    /* Commented out real implementation for now
    // Check cache first
    const now = Date.now();
    if (hospitalsCache.data && hospitalsCache.lastFetched && 
        (now - hospitalsCache.lastFetched) < hospitalsCache.expiryTime) {
      return res.json({
        success: true,
        data: hospitalsCache.data,
        fromCache: true
      });
    }

    let browser = null;
    try {
      browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      const page = await browser.newPage();
      
      await page.goto('https://hospitals.pmjay.gov.in/Search/empnlWorkFlow.htm?actionFlag=SearchHospital', {
        waitUntil: 'networkidle0',
        timeout: 60000
      });

      await page.waitForSelector('.table-responsive', { timeout: 30000 });

      const hospitals = await page.evaluate(() => {
        const rows = document.querySelectorAll('table tbody tr');
        return Array.from(rows, row => {
          const columns = row.querySelectorAll('td');
          if (columns.length < 5) return null;

          return {
            id: Date.now() + Math.random(),
            name: columns[1]?.textContent?.trim() || 'N/A',
            address: columns[2]?.textContent?.trim() || 'N/A',
            phone: columns[3]?.textContent?.trim() || 'N/A',
            specialties: (columns[4]?.textContent?.trim() || '')
              .split(',')
              .map(s => s.trim())
              .filter(s => s),
            distance: 'Contact for details',
            rating: 0,
            waitTime: 'Contact hospital'
          };
        }).filter(hospital => hospital !== null);
      });

      hospitalsCache.data = hospitals;
      hospitalsCache.lastFetched = now;

      res.json({
        success: true,
        data: hospitals,
        fromCache: false
      });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
    */
  } catch (error) {
    console.error('Error fetching hospitals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch nearby hospitals',
      error: error.message
    });
  }
});

// Get recent claims
router.get('/claims', async (req, res) => {
  try {
    // For development, return mock data
    res.json({
      success: true,
      data: MOCK_DATA.claims,
      isMockData: true
    });

    /* Commented out real implementation for now
    const browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto('https://mera.pmjay.gov.in/search/login', {
      waitUntil: 'networkidle0'
    });

    const claims = await page.evaluate(() => {
      const claimElements = document.querySelectorAll('[data-claim]');
      return Array.from(claimElements).map(element => ({
        id: element.getAttribute('data-claim-id'),
        date: element.querySelector('[data-claim-date]')?.textContent,
        hospital: element.querySelector('[data-claim-hospital]')?.textContent,
        treatment: element.querySelector('[data-claim-treatment]')?.textContent,
        amount: parseFloat(element.querySelector('[data-claim-amount]')?.textContent?.replace(/[^0-9.]/g, '') || '0'),
        status: element.querySelector('[data-claim-status]')?.textContent
      }));
    });

    await browser.close();

    res.json({
      success: true,
      data: claims
    });
    */
  } catch (error) {
    console.error('Error fetching claims:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent claims'
    });
  }
});

// Ayushman card download endpoint
router.post('/download', async (req, res) => {
  try {
    const { aadhaarNumber, mobileNumber } = req.body;

    // Validate input
    if (!aadhaarNumber || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar number and mobile number are required'
      });
    }

    // Validate Aadhaar format
    if (!validateAadhaar(aadhaarNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Aadhaar number format'
      });
    }

    // Validate mobile number format
    if (!isValidMobile(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number format'
      });
    }

    // For development, return mock success response
    res.json({
      success: true,
      data: {
        downloadLink: 'https://example.com/mock-ayushman-card.pdf',
        message: 'This is a mock download link'
      },
      isMockData: true
    });
  } catch (error) {
    console.error('Error downloading card:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to download card'
    });
  }
});

// Ayushman card status check endpoint
router.post('/check-status', async (req, res) => {
  let browser = null;
  try {
    const { aadhaarNumber, mobileNumber } = req.body;

    // Validate input
    if (!aadhaarNumber || !mobileNumber) {
      return res.status(400).json({
        success: false,
        message: 'Aadhaar number and mobile number are required'
      });
    }

    // Validate Aadhaar format
    if (!validateAadhaar(aadhaarNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Aadhaar number format'
      });
    }

    // Validate mobile number format
    if (!isValidMobile(mobileNumber)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid mobile number format'
      });
    }

    // Launch browser with additional options
    browser = await puppeteer.launch({
      headless: 'new', // Use headless mode for production
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--window-size=1366,768'
      ],
      defaultViewport: { width: 1366, height: 768 }
    });

    const page = await browser.newPage();

    // Set longer timeout for navigation
    page.setDefaultNavigationTimeout(60000);
    page.setDefaultTimeout(30000);

    // Navigate to PMJAY beneficiary status check page
    console.log('Navigating to PMJAY status check page...');
    await page.goto('https://pmjay.gov.in/check-your-beneficiary-status', {
      waitUntil: ['networkidle0', 'domcontentloaded'],
      timeout: 60000
    });

    // Wait for the form to be loaded
    await page.waitForFunction(() => document.readyState === 'complete');

    // Fill Aadhaar number
    const aadhaarInput = await page.waitForSelector('#edit-aadhaar-no', { visible: true });
    if (!aadhaarInput) {
      throw new Error('Could not find Aadhaar input field');
    }
    await aadhaarInput.click({ clickCount: 3 });
    await aadhaarInput.press('Backspace');
    await aadhaarInput.type(aadhaarNumber, { delay: 100 });

    // Fill mobile number
    const mobileInput = await page.waitForSelector('#edit-mobile-no', { visible: true });
    if (!mobileInput) {
      throw new Error('Could not find mobile number input field');
    }
    await mobileInput.click({ clickCount: 3 });
    await mobileInput.press('Backspace');
    await mobileInput.type(mobileNumber, { delay: 100 });

    // Handle captcha if present
    const captchaPresent = await page.$('#edit-captcha-response');
    if (captchaPresent) {
      // Take screenshot of the captcha
      const captchaElement = await page.$('.captcha');
      if (captchaElement) {
        await captchaElement.screenshot({
          path: 'captcha.png'
        });
        
        return res.status(202).json({
          success: true,
          requiresCaptcha: true,
          message: 'Captcha verification required. Please check captcha.png and submit the code.'
        });
      }
    }

    // Click submit button
    const submitButton = await page.waitForSelector('#edit-submit');
    if (!submitButton) {
      throw new Error('Could not find submit button');
    }
    await submitButton.click();

    // Wait for response
    await page.waitForFunction(
      () => {
        const elements = document.querySelectorAll('.status-message, .alert, .message');
        return elements.length > 0;
      },
      { timeout: 30000 }
    );

    // Extract status information
    const statusInfo = await page.evaluate(() => {
      const getElementText = (selector) => {
        const element = document.querySelector(selector);
        return element ? element.textContent.trim() : '';
      };

      return {
        status: getElementText('.status-message') || getElementText('.alert') || getElementText('.message'),
        beneficiaryName: getElementText('.beneficiary-name'),
        familyMembers: Array.from(document.querySelectorAll('.family-member')).map(el => el.textContent.trim()),
        cardNumber: getElementText('.card-number'),
        eligibilityStatus: getElementText('.eligibility-status'),
        additionalInfo: getElementText('.additional-info')
      };
    });

    // Take screenshot of the result
    await page.screenshot({ path: 'status-result.png', fullPage: true });

    // Close browser
    await browser.close();
    browser = null;

    // Return the results
    res.json({
      success: true,
      data: {
        ...statusInfo,
        screenshotPath: 'status-result.png'
      }
    });

  } catch (error) {
    console.error('Error in Ayushman status check:', error);
    
    let errorMessage = 'Failed to check Ayushman card status';
    if (error.message.includes('timeout')) {
      errorMessage = 'The request timed out. Please try again.';
    } else if (error.message.includes('Navigation')) {
      errorMessage = 'Failed to load the status check page. Please try again.';
    }

    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.message
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// Route to submit captcha if required
router.post('/submit-captcha', async (req, res) => {
  let browser = null;
  try {
    const { aadhaarNumber, mobileNumber, captchaCode } = req.body;

    if (!captchaCode) {
      return res.status(400).json({
        success: false,
        message: 'Captcha code is required'
      });
    }

    // Similar browser setup and navigation code...
    // Fill in the form including captcha and submit
    // Extract and return results...

  } catch (error) {
    console.error('Error in captcha submission:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit captcha',
      error: error.message
    });
  } finally {
    if (browser) {
      await browser.close();
    }
  }
});

// Get list of nearby hospitals
router.get('/hospitals', async (req, res) => {
  try {
    // Redirect to official PMJAY hospital search
    res.redirect('https://hospitals.pmjay.gov.in/');
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to redirect to hospital search',
      error: error.message
    });
  }
});

// Get eligibility information
router.get('/eligibility', async (req, res) => {
  try {
    // Redirect to official eligibility check page
    res.redirect('https://pmjay.gov.in/check-your-eligibility');
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to redirect to eligibility check',
      error: error.message
    });
  }
});

// Get e-card
router.get('/e-card', async (req, res) => {
  try {
    // Redirect to official e-card portal
    res.redirect('https://mera.pmjay.gov.in/search/login');
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to redirect to e-card portal',
      error: error.message
    });
  }
});

export default router; 