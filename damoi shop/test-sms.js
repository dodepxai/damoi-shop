const token = '9DZolpJcB8B8iPzpmq5werGz-DYjs-6s';
const auth = 'Basic ' + Buffer.from(token + ':x').toString('base64');
const phone = '84837290135';

async function testApi() {
  const payloads = [
    { type: 2, sender: '84837290135' },
    { type: 3, sender: '84837290135' },
    { type: 2, sender: '0837290135' }
  ];

  for (let i = 0; i < payloads.length; i++) {
    const p = payloads[i];
    try {
      const res = await fetch('https://api.speedsms.vn/index.php/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': auth },
        body: JSON.stringify({ to: [phone], content: 'Test SMS damoi', type: p.type, sender: p.sender })
      });
      const data = await res.json();
      console.log('Result for sender', p.sender, 'type', p.type, ':', data);
    } catch (e) {
      console.error(e);
    }
  }
}

testApi();
