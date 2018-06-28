export default {
  db: {
    type: 'sqlite',
    database: 'app.db',
    entities: [
      __dirname + "/entity/*.js"
    ],
    synchronize: true
  }
}
