
import fetch from 'node-fetch';

console.log("Probing localhost:5000...");
fetch('http://localhost:5000/api/auth/ping', { method: 'GET' })
    .then(res => console.log(`Response: ${res.status}`))
    .catch(err => console.error(`Error: ${err.message}`));
