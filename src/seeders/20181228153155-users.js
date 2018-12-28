const faker = require('faker');
const uuid = require('uuid/v4');
const bcrypt = require('bcrypt');
const times = require('lodash/times');

const users = [];
const salt = bcrypt.genSaltSync(12);
const hash = bcrypt.hashSync('qwerty123', salt);

times(10, () => {
  users.push({
    id: uuid(),
    email: faker.internet.email().toLowerCase(),
    password: hash,
    confirmed: true,
    createdAt: faker.date.past().toISOString(),
    updatedAt: faker.date.recent().toISOString(),
  });
});

module.exports = {
  up: queryInterface => queryInterface.bulkInsert('users', users, {}),
  down: queryInterface => queryInterface.bulkDelete('Person', null, {}),
};
