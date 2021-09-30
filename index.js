const express = require('express');
require('dotenv').config()

const PORT = process.env.PORT || 5001
const app = express();
const http = require('http').createServer(app);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
var expressLayouts = require('express-ejs-layouts');
app.use(expressLayouts);
const path = require('path');
app.use(express.static(path.resolve(__dirname, '../client/build')));
var cors = require('cors')
app.use(cors());



const utility = require('./lib/utility')

app.get("/api", (req, res) => {
  res.json({ message: "Hello from server!" });
});

// All other GET requests not handled before will return our React app
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
});

http.listen(PORT, '0.0.0.0', () => {
  console.log(`Listening to ${PORT}`);
});