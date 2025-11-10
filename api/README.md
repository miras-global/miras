These scripts listen to the contracts to populate a database.

To run them:

```bash
node monitor-attesters.js
```

You can set environment variables to configure them:

```bash
RPC_WS=wss://mainnet.infura.io/ws/v3/...
CONTRACT_ADDRESS=0x...
START_BLOCK=1234567
CONFIRMATIONS=5
node monitor-attesters.js
```

The scripts will create a `lastBlock.txt` file to keep track of the last processed block.

The output files are:

- `attesters.txt`: list of attesters
- `lastBlock.txt`: last processed block

They will be accessible online, on purpose. This information is meant to be public.
