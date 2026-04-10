const http = require('http');

function get(url) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function testAPI() {
    try {
        const products = await get('http://localhost:5001/api/products?category=Nam');
        console.log(`Total Nam products: ${products.length}`);
        
        products.forEach(p => {
            console.log(`- ${p.name} | Cat: ${p.category} | Sub: ${p.subCategory}`);
        });

        const subName = 'Áo phông / Áo thun';
        const productsSub = await get('http://localhost:5001/api/products?category=Nam&subCategory=' + encodeURIComponent(subName));
        console.log(`\nFiltered by "${subName}": ${productsSub.length}`);
        productsSub.forEach(p => {
            console.log(`- ${p.name} (Sub: ${p.subCategory})`);
        });

        const subPolo = 'Áo polo';
        const productsPolo = await get('http://localhost:5001/api/products?category=Nam&subCategory=' + encodeURIComponent(subPolo));
        console.log(`\nFiltered by "${subPolo}": ${productsPolo.length}`);
        productsPolo.forEach(p => {
            console.log(`- ${p.name} (Sub: ${p.subCategory})`);
        });

    } catch (err) {
        console.error(err);
    }
}

testAPI();
