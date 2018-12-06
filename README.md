BOScoin Congress Voting Server
--------------

# Usage

To run linting and testing:

```sh
$ npm run lint
$ npm test
```

For development:

```sh
$ npm run dev
```

The server will run in <http://localhost:3000>.

To run server:

```sh
$ npm start
```

# Tasks
To submit new proposal into sebak:

```sh
$ SEBAK_PROPOSER_SECRET=<YOUR_SECRET> \
  SEBAK_PROPOSER_ADDRESS=<YOUR_ADDRESS> \
  SEBAK_SEQUENCE_ID=<YOUR_CURRENT_SEQUENCE_ID> \
  SEBAK_CONTRACT_PATH=<CONTRACT_YAML_FILE_RELATIVE_PATH> \
  SEBAK_VOTING_START=<BLOCK_HEIGHT> \
  SEBAK_VOTING_END=<BLOCK_HEIGHT> \
  npm run task new-proposal
```

To save new proposals from sebak:

```sh
$ SEBAK_PROPOSER_ADDRESS=<YOUR_ADDRESS> \
  npm run task save-proposals
```

To submit congress voting results:

```sh
$ SEBAK_PROPOSER_SECRET=<YOUR_SECRET> \
  SEBAK_PROPOSER_ADDRESS=<YOUR_ADDRESS> \
  SEBAK_SEQUENCE_ID=<YOUR_CURRENT_SEQUENCE_ID> \
  SEBAK_VOTING_RESULT_STORAGES=<VOTING_RESULT_STORAGES> \
  npm run task report-voting-result
```

`SEBAK_VOTING_RESULT_STORAGES`'s format is comma separated list of `<strage>|<URL>|<bucket name>`
like `s3|http://test.example.com|my-test-bucket,s3|http://boscoin.io|second-bucket`.

To confirm congress voting results:

```sh
$ SEBAK_PROPOSER_SECRET=<YOUR_SECRET> \
  SEBAK_PROPOSER_ADDRESS=<YOUR_ADDRESS> \
  SEBAK_VOTING_RESULT_STORAGES=<VOTING_RESULT_STORAGES> \
  npm run task confirm-voting-result
```
