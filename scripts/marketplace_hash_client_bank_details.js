/**
 * READ ME
 * This script is used to hash existing (plain) client details in the database of marketplace
 * The script needs to be placed in the root directory of marketplace-api project
 * run the script with node by passing the mongo connection url as a parameter
 * e.g node hashData.js mongodb://localhost:27017/marketplace   (replace localhost with the hostname of the machine running mongo)
 */

const Mongoose = require('./db/connect/Moongose');
const mongooseConfigs = require('./db/connect/configs');
const { encryptBankDetails } = require('./helpers/encryption/clientDetails');
const { parallel } = require('./helpers/each');

const [, , connString] = process.argv;

const clientSchema = new Mongoose.Schema({
  clientId: String,
  partnerId: String,
  processed: String,
  firstName: String,
  lastName: String,
  companyName: String,
  taxId: String,
  dateOfBirth: Date,
  streetAddress: String,
  city: String,
  state: String,
  zip: String,
  email: String,
  phone: String,
  bankName: String,
  bankAccountHolderName: String,
  bankRoutingNumber: String,
  bankAccountNumber: String,
  ar_ap_flag: Boolean,
  status: String,
  creditCardType: String,
  creditCardFirstName: String,
  creditCardLastName: String,
  creditCardNumber: String,
  creditCardExpiration: String,
  creditCardBillingZipCode: String,
  creditCardCvv: String,
  createTimeStamp: Date,
  updateTimeStamp: Date,
});

(async () => {
  try {
    console.log('Attempting database connection');
    const mongoose = new Mongoose();
    const conn = await mongoose.createMarketplaceConnection(connString, mongooseConfigs);
    conn.model('client', clientSchema); // eslint-disable-line
    const clients = await conn.models.client.find();
    await parallel(clients, async client => {
      let c = client.toObject();
      const updatedClient = encryptBankDetails(client);
      console.log(updatedClient);
      try {
        await conn.models.client.findOneAndUpdate({ clientId: client.clientId }, Object.assign(c, updatedClient));
      } catch (err) {
        console.log('error client', client);
      }
      console.log('client updated', client.clientId);
    });
  } catch (err) {
    throw err;
  }
})();
