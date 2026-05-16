const axios = require('axios');

async function testUpdateAddress() {
    const email = 'fahad1shakil@gmail.com'; // Change to the email you're testing with
    const newAddress = 'Dhaka, Bangladesh';
    
    try {
        console.log(`Testing UPDATE ADDRESS for: ${email}`);
        const res = await axios.patch(`http://localhost:5000/users/update-address/${email}`, {
            address: newAddress
        });
        console.log('Success:', res.data);
    } catch (err) {
        console.error('Error:', err.response ? err.response.data : err.message);
    }
}

testUpdateAddress();
