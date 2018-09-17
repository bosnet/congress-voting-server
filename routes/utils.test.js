const { expect } = require('chai');

const { underscored } = require('./utils');

describe('Utils', () => {
  describe('underscored()', () => {
    it('should underscore all keys', async () => {
      const obj = {
        id: 11,
        publicAddress: '2df81147c156710d73eafba61ac9678d8b1283ddbe968ab00c38707d',
        applicantId: '571ad509efb5c2eb9898e36e',
        status: 'pending',
        isAgreeDelegation: false,
        createdAt: '2018-09-17T05:32:50.065Z',
        updatedAt: '2018-09-17T05:32:50.065Z',
        deletedAt: null,
      };

      const result = underscored(obj);
      expect(result).to.have.not.property('publicAddress');
      expect(result).to.have.property('public_address');
    });
  });
});
