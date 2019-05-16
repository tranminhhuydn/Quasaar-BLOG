const express = require('express');
const session = require('express-session');
const app = express();
let db = require('./database')().then(x => db = x).catch(e => {
  console.error(e);
  process.exit(1);
});

app.use(session({
  secret: 'keyboard cat',
  resave: true,
  saveUninitialized: true
}))

app.use(express.urlencoded()),
  app.set('view engine', 'ejs');

app.get('/login', (req, res) => {
  if (req.session.login) {
    res.redirect('/');
  } else {
    res.render('pages/login', { error: '', user: '', login: req.session.login });
  }
});

app.post('/login', async (req, res) => {
  let data = await db.all('SELECT * from users WHERE user = ? and pass = ?', [req.body.user, req.body.pass]);

  if (data.length == 0) { // geçersiz
    res.render('pages/login', { error: 'geçersiz bilgi girdiniz', user: req.body.user, login: req.session.login });
  } else {
    req.session.login = data[0];
    res.redirect('/');
  }
})

app.get('/logout', (req, res) => {
  if (!req.session.login) {
    return res.redirect('/');
  }
  req.session.login = null;
  res.redirect('/');
})

app.get('/new', (req, res) => {
  if (!req.session.login) {
    return res.redirect('/');
  }
  res.render('pages/new', { login: req.session.login });
});

app.get('/more/:id', async (req, res) => {
  let data = await db.all('SELECT * from posts WHERE id = ?', [req.params.id]);

  if (data.length != 1) {
    return res.redirect('/');
  }

  res.render('pages/more', { login: req.session.login, post: data[0] });
});


app.get('/edit/:id', async (req, res) => {
  if (!req.session.login) {
    return res.redirect('/');
  }
  let data = await db.all('SELECT * from posts WHERE id = ?', [req.params.id]);

  if (data.length != 1) {
    return res.redirect('/');
  }

  res.render('pages/edit', { login: req.session.login, post: data[0], done: false });
});

app.post('/edit/:id', async (req, res) => {
  if (!req.session.login) {
    return res.redirect('/');
  }

  await db.run('UPDATE posts SET header = ?, content= ? WHERE id = ?', [req.body.header, req.body.content, req.params.id]);

  let data = await db.all('SELECT * from posts WHERE id = ?', [req.params.id]);

  if (data.length != 1) {
    return res.redirect('/');
  }

  res.render('pages/edit', { login: req.session.login, post: data[0], done: true });
});


app.get('/delete/:id', async (req, res) => {
  if (!req.session.login) {
    return res.redirect('/');
  }
  await db.run('DELETE FROM posts WHERE id = ?', [req.params.id]);
  res.redirect('/');
});

app.get('/users', async (req, res) => {
  if (!req.session.login) {
    return res.redirect('/');
  }
  let users = await db.all('SELECT * FROM users');

  res.render('pages/users', { login: req.session.login, users, done: false });
});


app.post('/users', async (req, res) => {
  if (!req.session.login) {
    return res.redirect('/');
  }
  let users = await db.all('SELECT * FROM users WHERE user = ?', [req.body.user]);

  let change = false;
  if (users.length == 0) {
    await db.run('INSERT INTO users (user, pass) VALUES (?, ?)', [req.body.user, req.body.pass]);
    change = true;
  }


  users = await db.all('SELECT * FROM users');

  res.render('pages/users', { login: req.session.login, users, done: change });
});

app.get('/users/delete/:user', async (req, res) => {
  if (!req.session.login) {
    return res.redirect('/');
  }
  await db.run('DELETE FROM users WHERE user = ?', [req.params.user]);


  users = await db.all('SELECT * FROM users');

  res.render('pages/users', { login: req.session.login, users, done: true });
});



app.post('/new', async (req, res) => {
  if (!req.session.login) {
    return res.redirect('/');
  }
  await db.run('INSERT INTO posts (id, header, content, addedBy) VALUES (NULL, ?, ?, ?)', [req.body.header, req.body.content, req.session.login.user]);
  res.redirect('/');
});



app.get('/:id(\\d*)?', async (req, res) => {
  try {
    if (!req.params.id) req.params.id = 0;
    if (req.params.id < 0) req.params.id = 0;

    const postCount = await db.get('SELECT COUNT(*) as count FROM posts');
    if (req.params.id > postCount) req.params.id = postCount;
    const posts = await db.all('SELECT * FROM posts ORDER BY createdAt DESC LIMIT ?,10 ', [req.params.id]);

    res.render('pages/index', {
      posts,
      login: req.session.login,
      postCount: postCount.count
    });
  } catch (e) {
    console.error(e);
    res.render('pages/error', {
      e, login: req.session.login
    });
  }
});

app.get('/about',function(request,response){
  response.render('pages/about')
});


app.listen(80);
console.log('blog started!');