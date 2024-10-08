
const express = require('express');
require('dotenv').config();
const session = require('express-session');
const socketIo = require('socket.io');
const http = require('http');
const connection = require('./config');
const RedisStore = require('connect-redis').default;
const redis = require('redis');
const path = require('path');
const multer = require('multer');

//getting routes
const authenticate = require('./routes/login');
const books = require('./routes/books');
const library = require('./routes/library');
const community = require('./routes/community');

const app = express();

//redis
const redisClient = redis.createClient({
    password: 'JFfh1H5DKW9pF6PG67u1LJnvXhgNnQG1',
    socket: {
        host: 'redis-16150.c8.us-east-1-2.ec2.redns.redis-cloud.com',
        port: 16150
    }
});

(async () => {
    await redisClient.connect();
})();
redisClient.on("connect", () => {
    console.log('redis client connected');
});
redisClient.on("error", (err) => {
    console.log("could not conect redis", err);
});


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'public/images')
    },
    filename: (req, file, cb) => {
        const uId = req.session.userInfo[0].member_id.toString();
        req.session.filePath = uId + path.extname(file.originalname);
        cb(null,  uId + path.extname(file.originalname));
    }
})
const upload = multer({
    storage: storage,
    limits: 10000000
}).single('image');

app.use(session({
    store: new RedisStore({client: redisClient}),
    // store:new session.MemoryStore(),
    secret: 'ibook-library-session',
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: false,
        httpOnly: false,
        maxAge: 1000 * 60 * 30
    }
}));

app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({extended: true}));



const server = http.createServer(app);
const io = socketIo(server);

// 
io.on('connection', (socket) => {
    console.log('client connected');

    socket.on('dataUpdate', (message) => {
        // console.log(message);
        connection.query("INSERT INTO community (member_id, chat) VALUES (?, ?)", [message.id, message.chat], (err) => {
            if(err) {
                console.log(err);
                return;
            }

            connection.query("SELECT community.member_id, member_username, chat FROM community INNER JOIN members ON community.member_id = members.member_id ORDER BY id ASC", (err, results) => {
                if(err) {
                    console.log(err);
                    return;
                }
                io.emit('dataUpdate', results);
            })
        })
    })
})

app.post('/borrowBook', (req, res) => {
    books.borrowBook(req, res);
    
})

//regist users
app.post('/addMember', (req, res) => {
    authenticate.addMember(req, res);
    
})
app.post('/logMember', (req, res) => {
    authenticate.loginPost(req, res);
})

app.get('/logMember', (req, res) => {
    authenticate.loginGet(req, res);
});
app.get('/settings', (req, res) => {
    authenticate.settings(req, res);
})

app.get('/logout', (req, res) => {
    authenticate.logout(req, res);
})

app.post('/addBook', (req, res) => {
    books.addBook(req, res);

})
app.post("/addCopy", (req, res) => {
    books.addCopy(req, res);
})
//look at
app.post('/addChat/:id', (req, res) => {
    community.addChat(req, res);
})

app.get('/', (req, res) => {
    res.render('home');
})

app.get('/signup', (req, res) => {
    authenticate.signup(req, res);
})
app.get('/login', (req, res) => {
    authenticate.login(req, res);
})

let myBooks = [];
app.get('/library',(req, res) => {
    library.libraryHome(req, res);
})


//specific book page
app.get('/library/book/:id', (req, res) => {
    library.libraryBook(req, res);
})

//specific user
app.get('/library/user/:id', (req, res) => {
    library.libraryUser(req, res);
})

app.get('/community/:id', (req, res) => {
    community.communityMember(req, res);
})
app.post('/changeUsername', async (req, res) => {
    community.changeUsername(req, res);
})
app.post('/deleteAccount', (req, res) => {
    community.deleteAccount(req, res);
})
app.get('/backCommunity', (req, res) => {
    community.back(req, res);
})
app.post('/changeProfile', (req, res) => {
    upload(req, res, (err) => {
        if (err) {
          console.error(err);
          res.status(500).send('An error occurred while uploading the file.');
        } else {
          console.log('file uploaded succesfully');
          const path = "./images/" + req.session.filePath;
          const id = req.session.userInfo[0].member_id;
          connection.query("UPDATE members SET member_picture = ? WHERE member_id = ?;", [path, id], (err) => {
              if(err) {
                  console.log(err);
                  return res.send("Colud not execute query");
              }
              req.session.userInfo[0].member_picture = path;
              res.redirect('/logMember');
          })
        }
      });

    
})
app.use((req, res) => {
    res.status(404).render('404');
})

connection.connect((err) => {
    if(err) {
        console.log(err);
        return;
    }
    console.log('connected');
    server.listen(3002, () => {
        console.log('listening at port 3000');
    });
})