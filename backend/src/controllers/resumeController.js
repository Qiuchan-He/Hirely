const resumeService = require('../helpers/resumeProcessHelper');
const path = require('path');

exports.processResume = async (req, res) => {
  try {
    // For testing, we'll use a hard-coded resume path
    const resumePath = path.join(__dirname, '../resume/resume.pdf');
    
    const result = await resumeService.processResume(resumePath);
    return res.json(result);
  } catch (error) {
    console.error('Error in processResume controller:', error);
    return res.status(500).json({ error: error.message });
  }
};

exports.queryResume = async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    const results = await resumeService.queryResume(query);
    return res.json({ results });
  } catch (error) {
    console.error('Error in queryResume controller:', error);
    return res.status(500).json({ error: error.message });
  }
};