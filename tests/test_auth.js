const http = require('http');

function testLogin(username, password, description) {
    const data = JSON.stringify({
        username: username,
        password: password
    });

    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/login',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': data.length
        }
    };

    const req = http.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
            console.log(`Testing: ${description}`);
            console.log(`Status: ${res.statusCode}`);
            console.log(`Response: ${body}`);
            console.log("---------------------------------------------------");
        });
    });

    req.on('error', (error) => {
        console.error(error);
    });

    req.write(data);
    req.end();
}

// Đợi server khởi động rồi test
setTimeout(() => {
    console.log("=== BẮT ĐẦU TEST API LOGIN ===");
    
    // 1. Test đúng (Dùng user mẫu trong MockDatabase)
    testLogin("quan.tran@hcmut.edu.vn", "123456", "CASE 1: Đăng nhập đúng (Tutor)");

    // 2. Test sai mật khẩu
    testLogin("quan.tran@hcmut.edu.vn", "wrongpass", "CASE 2: Sai mật khẩu");

    // 3. Test user không tồn tại
    testLogin("ghost@hcmut.edu.vn", "123456", "CASE 3: User không tồn tại");
}, 1000);