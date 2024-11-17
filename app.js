const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const fileUpload = require('express-fileupload');
const session = require('express-session');
const axios = require('axios');
const app = express();

const PORT = 3000;
require('dotenv').config();

const { isAdmin, isEditor, canEditContent } = require('./middleware/roleMiddleware');

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(403).send('Access denied: Not authorized');
};

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));  

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(fileUpload());  
app.use(session({ secret: 'your-secret', resave: false, saveUninitialized: true }));

const keysDir = path.join(__dirname, 'keys');
if (!fs.existsSync(keysDir)) {
  fs.mkdirSync(keysDir);
}

mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'Connection error to MongoDB'));
db.once('open', () => console.log('Connected to MongoDB'));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  publicKey: { type: String, required: true },
  privateKey: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  age: { type: Number, required: true },
  city: { type: String, required: true },
  country: { type: String, required: true },
  gender: { type: String, required: true },
  role: { type: String, enum: ['admin', 'editor'], default: 'editor' },
});

const portfolioItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  images: [{ type: String, required: true }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
});

async function getCurrencyData() {
    const myHeaders = new Headers();
    myHeaders.append("apikey", "fivKKMndEFJL9lFgZOstuk47W3Cd1bzQ");
  
    const currentDate = new Date();
    const formattedCurrentDate = currentDate.toISOString().split('T')[0];
  
    const halfYearAgo = new Date();
    halfYearAgo.setMonth(currentDate.getMonth() - 1);
    const formattedHalfYearAgo = halfYearAgo.toISOString().split('T')[0];
  
    const requestOptions = {
      method: 'GET',
      redirect: 'follow',
      headers: myHeaders
    };
  
    const response = await fetch(`https://api.apilayer.com/exchangerates_data/timeseries?start_date=${formattedHalfYearAgo}&end_date=${formattedCurrentDate}&base=KZT&symbols=EUR`, requestOptions);
    
    if (!response.ok) {
      throw new Error('Failed to fetch data');
    }
  
    const result = await response.json();
    return result;
  }
  
async function getCountryData(country) {
    const requestOptions = {
        method: 'GET'
    };

    try {
        var url1 = `https://restcountries.com/v3.1/name/${country}`
        console.log(url1)
        const response = await fetch(url1, requestOptions);
        
        if (!response.ok) {
            throw new Error('Country data could not be obtained');
        }

        const result = await response.json();
        const countryData = result[0]; 

        const countryName = result[0].name?.common || "Unknown country";
                console.log(countryData)

        const capital = countryData?.capital?.[0] || "Unknown capital";
        const population = countryData?.population || "Unknown population";
        const flagUrl = countryData?.flags?.png || ""; 
        const currentTimestamp = new Date().toLocaleString(); 

        return {
            title: countryName,
            description: capital,
            population: population,
            timestamps: currentTimestamp,
            flag: flagUrl,
        };
    } catch (error) {
        console.error('Error in obtaining country data:', error);
        throw new Error('Error in obtaining country data');
    }
}

const User = mongoose.model('User', userSchema);
const PortfolioItem = mongoose.model('PortfolioItem', portfolioItemSchema);

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/register', async (req, res) => {
    const { username, password, firstName, lastName, age, city, country, gender, role } = req.body;
  
    if (!username || !password || !firstName || !lastName || !age || !city || !country || !gender || !role ) {
      return res.status(400).send('All fields are required');
    }
  
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', { modulusLength: 2048 });
      
      const privateKeyPath = path.join(__dirname, 'keys', `${username}-private.pem`);
      fs.writeFileSync(privateKeyPath, privateKey.export({ type: 'pkcs1', format: 'pem' }));
  
      const user = new User({
        username,
        password: hashedPassword,
        publicKey: publicKey.export({ type: 'pkcs1', format: 'pem' }),
        privateKey: privateKey.export({ type: 'pkcs1', format: 'pem' }),
        firstName,
        lastName,
        age,
        city,  
        country,
        gender,
        role,
      });
  
      await user.save();
      res.download(privateKeyPath, `${username}-private.pem`);
    } catch (error) {
      console.error(error);
      res.status(500).send('server error');
    }
  });
  

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const privateKeyFile = req.files?.privateKeyFile;

  if (!username || !password || !privateKeyFile) {
    return res.status(400).send('All fields are required');
  }

  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(404).send('The user was not found');

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) return res.status(400).send('Invalid password');

    const privateKeyPem = privateKeyFile.data.toString('utf8');
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(username);
    sign.end();
    const signature = sign.sign(privateKeyPem, 'base64');

    const verify = crypto.createVerify('RSA-SHA256');
    verify.update(username);
    verify.end();
    const isValid = verify.verify(user.publicKey, signature, 'base64');

    if (isValid) {
      req.user = user;
      req.session.user = user;  
      return res.redirect('/portfolio');
    } else {
      return res.status(400).send('Invalid signature');
    }
  } catch (error) {
    res.status(500).send('Server error');
  }
});

app.get('/portfolio', isAuthenticated, async (req, res) => {
    try {
      const portfolioItems = await PortfolioItem.find().populate('creator');
      const userRole = req.session.user.role;
  
      const cityData = await getCurrencyData();
  
      if (!cityData || !cityData.rates) {
        throw new Error('Failed to get currency data');
      }
  
      const countryData = await getCountryData(req.session.user.country);
      console.log(req.session.user.country)
      res.render('port', { 
        portfolioItems,
        user: req.session.user,
        userRole,
        cityData,         
        countryData: countryData  
    });
    } catch (error) {
      console.error(error);
      res.status(500).send('Error loading the portfolio');
    }
  });
  
  

app.get('/portfolio/create', isAuthenticated, isAdmin, (req, res) => {
  res.render('createPortfolioItem');
});

app.get('/portfolio/edit/:id', isAuthenticated, canEditContent, async (req, res) => {
    try {
      const item = await PortfolioItem.findById(req.params.id);
      if (!item) {
        return res.status(404).send('Контент не найден');
      }
      res.render('editPortfolioItem', { item });
    } catch (error) {
      console.error('Ошибка при загрузке контента:', error);
      res.status(500).send('Ошибка при загрузке контента');
    }
  });  

app.delete('/portfolio/:id', isAuthenticated, canEditContent, async (req, res) => {
  try {
    await PortfolioItem.findByIdAndDelete(req.params.id);
    res.status(200).send('Контент удалён');
  } catch (error) {
    res.status(500).send('Ошибка удаления контента');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on the port ${PORT}`);
});
