const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/users/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('登录响应:', data);
    const result = JSON.parse(data);
    
    if (result.success && result.user.familyId) {
      // 测试获取家庭信息
      const familyOptions = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/families/' + result.user.familyId,
        method: 'GET'
      };
      
      const familyReq = http.request(familyOptions, (familyRes) => {
        let familyData = '';
        familyRes.on('data', (chunk) => familyData += chunk);
        familyRes.on('end', () => {
          console.log('家庭信息响应:', familyData);
        });
      });
      familyReq.end();
    }
  });
});

req.write(JSON.stringify({ phone: '15507590321' }));
req.end();
