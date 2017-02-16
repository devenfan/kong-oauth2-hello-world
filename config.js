var config = {
    // debug 为 true 时，用于本地调试
    debug: true,

    name: 'Nodeclub', // 社区名字
    description: 'CNode：Node.js专业中文社区', // 社区的描述
    keywords: 'nodejs, node, express, connect, socket.io',

    // loadFromEnv 为 true 时，从系统evn中加载
    loadFromEnv: false,

    // 其他配置项...
    PROVISION_KEY: "1f2b8d4baadb4b6f93c82b1599cad575",
    KONG_ADMIN: "http://10.5.52.56:8001",
    KONG_API: "https://10.5.52.56:8443",
    //KONG_API: "http://10.5.52.56:8000",
    API_PUBLIC_DNS: "test.com",
    SCOPES: {
        email: "Grant permissions to read your email address",
        address: "Grant permissions to read your address information",
        phone: "Grant permissions to read your mobile phone number"
    }
};
module.exports = config;
