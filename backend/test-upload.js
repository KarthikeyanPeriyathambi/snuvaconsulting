const FormData = require('form-data');
const fs = require('fs');
const fetch = require('node-fetch');

async function test() {
  const form = new FormData();
  // just generate a tiny dummy pdf
  fs.writeFileSync('test.pdf', 'dummy content');
  form.append('resume', fs.createReadStream('test.pdf'));
  
  try {
    const res = await fetch('http://localhost:5000/api/resumes', {
      method: 'POST',
      body: form
    });
    const text = await res.text();
    console.log('STATUS:', res.status);
    console.log('RESPONSE:', text);
  } catch (err) {
    console.error(err);
  }
}
test();
