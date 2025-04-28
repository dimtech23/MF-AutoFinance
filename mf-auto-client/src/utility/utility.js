import { faker } from '@faker-js/faker';

const generateDummyRequest = () => {
  const sampleTypes = ['Blood', 'Urine', 'Tissue', 'Saliva', 'Plasma', 'Serum'];
  const containerTypes = ['10x10 Cryo box', '9x19 Cryo box', 'Universal Bijou', '15 ml Falcon tubes', '50 ml Falcon tubes'];
  const shipmentModes = ['Liquid Nitrogen', 'Dry Ice', 'Ice Packs', 'Ambient Temp'];

  const generateSampleDescription = () => ({
    sampleType: faker.helpers.arrayElement(sampleTypes),
    containerType: faker.helpers.arrayElement(containerTypes),
    boxID: faker.string.alphanumeric(6).toUpperCase(),
    totalNumber: faker.number.int({ min: 1, max: 100 }),
    totalVolume: faker.number.float({ min: 0.1, max: 10, precision: 0.1 })
  });

  return {
    fullName: faker.person.fullName(),
    staffEmail: faker.internet.email(),
    projectName: faker.commerce.productName(),
    chargeCode: faker.finance.accountNumber(6),
    shipmentMode: faker.helpers.arrayElement(shipmentModes),
    consigneeName: faker.person.fullName(),
    address: faker.location.streetAddress(),
    tel: faker.phone.number(),
    isHazardous: faker.datatype.boolean(),
    hasMTA: faker.datatype.boolean(),
    purpose: faker.lorem.sentence(),
    sampleDescriptions: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, generateSampleDescription)
  };
};

export const generateDummyRequests = (count) => {
  return Array.from({ length: count }, generateDummyRequest);
}