// 引入 Node.js 内置的 http 模块，用于创建 Web 服务器
const http = require('http');
// 引入 Node.js 内置的 fs (文件系统) 模块，用于读取本地文件
const fs = require('fs');
// 引入 Node.js 内置的 path 模块，用于处理文件路径和扩展名
const path = require('path');

// 定义服务器监听的端口号，这里使用的是 8080 端口
const PORT = 8080;

// 定义 MIME 类型字典。当浏览器请求文件时，服务器需要告诉浏览器这是什么类型的文件
// 比如 .html 是网页，.js 是脚本，.css 是样式表
const MIME_TYPES = {
    '.html': 'text/html',
    '.js': 'text/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpg',
    '.svg': 'image/svg+xml'
};

// 创建 HTTP 服务器实例，每次有请求进来都会执行这个回调函数 (req: 请求信息, res: 响应对象)
const server = http.createServer((req, res) => {
    // 【核心机制：允许跨域 (CORS)】
    // 为什么要跨域？因为飞书客户端是在它自己的域名下运行的，而我们的本地服务器是 localhost。
    // 浏览器的安全机制会阻止飞书直接读取 localhost 的数据，所以我们需要添加这三个请求头，
    // 告诉浏览器："我允许任何来源（*）访问我的文件！"
    res.setHeader('Access-Control-Allow-Origin', '*'); // 允许所有域名跨域访问
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET'); // 允许的请求方法
    res.setHeader('Access-Control-Max-Age', 2592000); // 缓存跨域预检请求的结果

    // 如果是 OPTIONS 预检请求（浏览器在发跨域请求前会先发一个 OPTIONS 探路），直接返回成功
    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // 获取用户请求的真实路径，去掉飞书自带的问号参数（比如把 /?host=feishu 截断成 /）
    let requestUrl = req.url.split('?')[0];

    // 获取用户请求的文件路径，并在前面加上 './dist' 表示当前目录下的 dist 文件夹
    // 比如请求 /index.html，这里就会变成 ./dist/index.html
    let filePath = './dist' + requestUrl;
    
    // 如果用户什么都没输入，只访问了根目录 (/)，默认给他返回 dist 下的 index.html
    if (requestUrl === '/') {
        filePath = './dist/index.html';
    }

    // 获取文件扩展名，并转换为小写，比如 ".HTML" 变成 ".html"
    const extname = String(path.extname(filePath)).toLowerCase();
    
    // 根据扩展名从字典里找到对应的 Content-Type（如果没有匹配的，就默认为二进制流文件）
    const contentType = MIME_TYPES[extname] || 'application/octet-stream';

    // 开始读取本地文件
    fs.readFile(filePath, (error, content) => {
        if (error) {
            // 如果出错了
            if(error.code === 'ENOENT') {
                // 错误码 ENOENT 表示文件不存在 (Error NO ENTry)，返回 404 Not Found
                res.writeHead(404);
                res.end('404 Not Found');
            } else {
                // 其他错误（比如权限不足），返回 500 服务器内部错误
                res.writeHead(500);
                res.end('500 Internal Server Error: '+error.code);
            }
        } else {
            // 如果读取成功，返回 200 状态码，并附带正确的 Content-Type
            res.writeHead(200, { 'Content-Type': contentType });
            // 把读取到的文件内容返回给浏览器，'utf-8' 确保中文不会乱码
            res.end(content, 'utf-8');
        }
    });
});

// 让服务器开始监听指定的端口，启动成功后在终端打印一条提示信息
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
