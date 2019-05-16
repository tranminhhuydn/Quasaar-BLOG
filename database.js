const sqlite = require('sqlite');
const path = require('path');

module.exports = async () => {
    const db = await sqlite.open(path.resolve(__dirname, './db.sqlite'), { Promise });

    await db.run('CREATE TABLE IF NOT EXISTS posts (id INTEGER PRIMARY KEY AUTOINCREMENT, header TEXT, content TEXT, createdAt DATETIME DEFAULT CURRENT_TIMESTAMP, addedBy TEXT)');
    await db.run('CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, user TEXT, pass TEXT)');
    //await db.run('INSERT INTO users (user, pass) VALUES (\'admin\', \'test\')');

    module.exports = db;
    console.log('database is ready');
    return db;
}