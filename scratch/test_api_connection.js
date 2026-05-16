const api = 'http://localhost:5000';

async function test() {
  try {
    const res = await fetch(`${api}/admin-stats`);
    const data = await res.json();
    console.log('Admin Stats:', data);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

test();