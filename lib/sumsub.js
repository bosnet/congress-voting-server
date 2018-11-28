const got = require('got');
const debug = require('debug')('voting:lib:sumsub');

const { SUMSUB_APIKEY } = process.env;
const SUMSUB_HOST = process.env.SUMSUB_HOST || 'https://test-api.sumsub.com';

module.exports = {
  getApplicantStatus: async (applicantId) => {
    const res = await got(`${SUMSUB_HOST}/resources/applicants/${applicantId}/state?key=${SUMSUB_APIKEY}`, { json: true });
    debug('getApplicantStatus %s %o', applicantId, res.body);

    if (res.body.status && res.body.status.reviewResult && res.body.status.reviewResult.reviewAnswer === 'GREEN') {
      return 'verified';
    }
    if (res.body.status && res.body.status.reviewResult && res.body.status.reviewResult.reviewAnswer === 'RED') {
      return 'rejected';
    }
    if (res.body.status && res.body.status.reviewStatus === 'pending') {
      return 'pending';
    }
    if (res.body.status && res.body.status.reviewStatus === 'init') {
      return 'init';
    }

    return null;
  },
  getAccessToken: async (address) => {
    const res = await got.post(`${SUMSUB_HOST}/resources/accessTokens?userId=${address}&key=${SUMSUB_APIKEY}`, { json: true });
    debug('getAccessToken %s %o', address, res.body);

    return res.body.token;
  },
  getApplicant: async (applicantId) => {
    const res = await got(`${SUMSUB_HOST}/resources/applicants/${applicantId}?key=${SUMSUB_APIKEY}`, { json: true });
    debug('getApplicant %s %o', applicantId, res.body);

    if (res.body.list && res.body.list.items && res.body.list.items.length > 0) {
      return res.body.list.items[0];
    }

    return null;
  },
  getApplicantByAddress: async (address) => {
    const res = await got(`${SUMSUB_HOST}/resources/applicants/-;externalUserId=${address}?key=${SUMSUB_APIKEY}`, { json: true });
    debug('getApplicantByAddress %s %o', address, res.body);

    if (res.body.list && res.body.list.items && res.body.list.items.length > 0) {
      return res.body.list.items[0];
    }

    return null;
  },
};
