import session from 'express-session';
import ConnectMongoDBSession from 'connect-mongodb-session';
const MongoDBStore = ConnectMongoDBSession(session);

const store = new MongoDBStore({
  uri: process.env.MONGODB_URI!,
  collection: 'sessions'
});

export default () => {
  return session({
    secret: 'my secret',
    resave: false,
    saveUninitialized: false,
    store: store
  });
}