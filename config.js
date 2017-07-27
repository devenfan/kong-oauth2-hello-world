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
    KONG_ADMIN_SERVER: "http://10.5.52.56:8001",   //Kong Information
    KONG_API_SERVER: "https://10.5.52.56:8443",    //Kong Information
    //KONG_API_SERVER: "http://10.5.52.56:8000",
    API_PUBLIC_DNS: "test.com", //API Information
    API_URI: "/test",           //API Information
    CLIENT_ID: "c683e5e2fbb9487898f81fbc0d6ffb5b",
    CLIENT_SECRET: "17e49c221d1840a58fdf84b937144000",
    SCOPES: {
        email: "Grant permissions to read your email address",
        address: "Grant permissions to read your address information",
        phone: "Grant permissions to read your mobile phone number"
    },

    CLIENT_APP_URL: "http://127.0.0.1:3000"  //当前node app 节点的访问地址
};
module.exports = config;
