const http = require('http');

function request(path, method, data) {
    return new Promise((resolve, reject) => {
        const payload = JSON.stringify(data);
        const options = {
            hostname: 'localhost',
            port: 5000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(payload)
            }
        };

        const req = http.request(options, (res) => {
            let resData = '';
            res.on('data', chunk => resData += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(resData) });
                } catch(e) {
                    resolve({ status: res.statusCode, data: resData });
                }
            });
        });

        req.on('error', reject);
        if (data) req.write(payload);
        req.end();
    });
}

async function runTests() {
    const ts = Date.now();
    const phone = '090' + ts.toString().slice(-7);
    const email = `test${ts}@test.com`;
    const password = 'password123';

    console.log('--- Test Registration ---');
    const regRes = await request('/api/users/register', 'POST', {
        fullName: 'Test User',
        email,
        phone,
        password
    });
    console.log('Register Result:', regRes.status, regRes.data);

    console.log('\n--- Test Duplicate Phone Registration ---');
    const dupRes = await request('/api/users/register', 'POST', {
        fullName: 'Dup User',
        email: `dup${ts}@test.com`,
        phone,
        password
    });
    console.log('Register Dup Result:', dupRes.status, dupRes.data);

    console.log('\n--- Test Login by Email ---');
    const loginEmailRes = await request('/api/users/login', 'POST', {
        identifier: email,
        password
    });
    console.log('Login Email Result:', loginEmailRes.status, loginEmailRes.data.email);

    console.log('\n--- Test Login by Phone ---');
    const loginPhoneRes = await request('/api/users/login', 'POST', {
        identifier: phone,
        password
    });
    console.log('Login Phone Result:', loginPhoneRes.status, loginPhoneRes.data.phone);
}

runTests().catch(console.error);
