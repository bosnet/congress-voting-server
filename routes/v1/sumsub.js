const got = require('got');

const { SUMSUB_APIKEY } = process.env;
const SUMSUB_HOST = process.env.SUMSUB_HOST || 'https://test-api.sumsub.com';

module.exports = {
  getApplicantStatus: async (applicantId) => {
    const res = await got(`${SUMSUB_HOST}/resources/applicants/${applicantId}/state?key=${SUMSUB_APIKEY}`, { json: true });

    if (res.body.status && res.body.status.reviewResult && res.body.status.reviewResult.reviewAnswer === 'GREEN') {
      return 'verified';
    }
    if (res.body.status && res.body.status.reviewResult && res.body.status.reviewResult.reviewAnswer === 'RED') {
      return 'rejected';
    }

    return null;
  },
};
