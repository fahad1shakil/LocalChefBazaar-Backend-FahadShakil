async function testApi() {
  try {
    const res = await fetch('http://localhost:5000/users/update-role/6a07007cb6215441533f0646', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role: 'chef' })
    });
    const data = await res.json();
    console.log("Success:", data);
  } catch (err) {
    console.error("Error:", err);
  }
}
testApi();
