/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/* global getAssetRegistry getFactory emit */
const NS = "org.supplychain.network";
/**
 * Sample transaction processor function.
 * @param {org.supplychain.network.TemperatureReading} tx The sample transaction instance.
 * @transaction
 */
async function temperatureReading(tx) {  // eslint-disable-line no-unused-vars
  const temperatureReading = tx.temperature;
  var shipment = tx.shipment;
  if(shipment.temperatureReadings) {
    shipment.temperatureReadings.push(tx)
  } else {
    shipment.temperatureReadings = [tx]
  }
  const shipmentRegistry = await getAssetRegistry(NS + ".Shipment")
  await shipmentRegistry.update(shipment)
}

/**
* Transaction when shipment is received by the importer
* @param {org.supplychain.network.ShipmentReceived} tx 
* @transaction
*/
async function shipmentReceived(tx) {
  const shipment = tx.shipment;
  shipment.status = "SHIPMENT_ARRIVED"
  const contract = shipment.contract;
  contract.contractStatus = "AWAITING_PAYMENT";
  const shipmentRegistry = await getAssetRegistry(NS + ".Shipment")
  await shipmentRegistry.update(shipment)
  const contractRegistry = await getAssetRegistry(NS + ".Contract")
  await contractRegistry.update(contract)
}

/**
* Transaction to record that shipment has started
* @param {org.supplychain.network.StartShipment} tx
* @transaction
*/
async function startShipment(tx) {
  const shipment = tx.shipment;
  shipment.status = "SHIPMENT_IN_TRANSIT";
  const contract = shipment.contract;
  contract.contractStatus = "IN_SHIPMENT";
  const shipmentRegistry = await getAssetRegistry(NS + ".Shipment")
  await shipmentRegistry.update(shipment)
  const contractRegistry = await getAssetRegistry(NS + ".Contract")
  await contractRegistry.update(contract)
}

/**
* Payment for the goods received by importer
* @param {org.supplychain.network.Payment} tx
* @transaction
*/
async function payment(tx) {
  const contract = tx.contract;
  const amount = contract.unitPrice * contract.units;
  const importer = contract.importer;
  const supplier = contract.supplier;
  if(importer.balance < amount) {
  	throw new Error("Insufficiant Balance")
  }
  importer.balance = importer.balance - amount
  supplier.balance = supplier.balance + amount
  const importerRegistry = await getParticipantRegistry(NS + ".Importer")
  await importerRegistry.update(importer)
  const supplierRegistry = await getParticipantRegistry(NS + ".Supplier")
  await supplierRegistry.update(supplier)
  contract.contractStatus = "CLOSED"
  const contractRegistry = await getAssetRegistry(NS + ".Contract")
  await contractRegistry.update(contract)
}

