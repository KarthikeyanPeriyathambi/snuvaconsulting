import axios from 'axios';

const testAPI = async () => {
  try {
    const response = await axios.get('http://localhost:5000/api/jobs', {
      headers: {
        Origin: 'http://localhost:5175'
      }
    });
    console.log('Status:', response.status);
    console.log('Access-Control-Allow-Origin:', response.headers['access-control-allow-origin']);
    console.log('Jobs Count:', response.data.jobs ? response.data.jobs.length : 'N/A');
  } catch (error) {
    if (error.response) {
      console.error('Error Status:', error.response.status);
      console.error('Error Data:', error.response.data);
    } else {
      console.error('Error Message:', error.message);
    }
  }
};

testAPI();
