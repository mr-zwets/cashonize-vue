
<script setup lang="ts">
  import { ref } from 'vue'
  import cashconnectSessions from './cashconnectSessions.vue'
  import { CashConnectWallet } from 'cashconnect'
  import { authenticationTemplateP2pkhNonHd, binToHex, hexToBin, cashAddressToLockingBytecode, decodePrivateKeyWif } from "@bitauth/libauth";
  import { useStore } from '../store'
  const store = useStore()

  async function getPrivateKey() {
    if (!store.wallet?.privateKeyWif) return;
    const privateKeyWif = store.wallet.privateKeyWif;
    const decodeResult = decodePrivateKeyWif(privateKeyWif);
    if (typeof decodeResult === "string") {
      throw new Error(decodeResult);
    }
    const privateKey = decodeResult.privateKey;
    return privateKey;
  }
  const privateKey = await getPrivateKey();

  // List of Sessions
  const sessions = ref({})

  async function disconnectSession(topic:any){
    await cashConnectService.disconnectSession(topic);
  }
  function onSessionsUpdated(newSessions:any) {
    sessions.value = newSessions;
  }

  async function onSessionProposal(sessionProposal) {}
  async function onRPCRequest(session, request, response) {}
  async function onError(error) {}
  async function pairCashConnect(wcUri) {
    // Pair with the service.
    await cashConnectService.core.pairing.pair({ uri: wcUri });
  }
  async function showApprovalModal(modalType, data, onAccept) {}

  const cashConnectService = new CashConnectWallet(
    // The master private key.
    privateKey,
    // Project ID.
    '3fd234b8e2cd0e1da4bc08a0011bbf64',
    // Metadata.
    {
      name: 'Cashonize',
      description: 'Cashonize BitcoinCash Web Wallet',
      url: 'cashonize.com/',
      icons: ['https://cashonize.com/images/favicon.ico'],
    },
    // Event Callbacks.
    {
      // Session State Callbacks.
      onSessionsUpdated: onSessionsUpdated,
      onSessionProposal: onSessionProposal,
      onSessionDelete: () => { },
      onRPCRequest: onRPCRequest,
      onError: onError,
    },
    // CashRPC Callbacks.
    {
      // Network-related callbacks.
      network: {
        // Get the source output of the given transaction and index.
        getSourceOutput: async (outpointTransactionHash: Uint8Array, outpointIndex: number) => {
          const wallet = store.wallet;
          if (!wallet) return;

          const transaction = await wallet.provider.getRawTransactionObject(binToHex(outpointTransactionHash));

          const outpoint = transaction.vout[outpointIndex];

          let token;

          if (outpoint.tokenData) {
            token = {
              amount: BigInt(outpoint.tokenData.amount),
              category: hexToBin(outpoint.tokenData.category),
              nft: outpoint.tokenData.nft ? {
                capability: outpoint.tokenData.nft.capability,
                commitment: outpoint.tokenData.nft.commitment ? hexToBin(outpoint.tokenData.nft.commitment) : undefined,
              } : undefined
            }
          }

          const formatted = {
            valueSatoshis: BigInt(Math.round(outpoint.value * 100_000_000)),
            lockingBytecode: hexToBin(outpoint.scriptPubKey.hex),
            token,
          }

          return formatted;
        },

        // NOTE: Other callbacks may be supported in future (e.g. Block Height).
      },

      // Wallet-related callbacks.
      wallet: {
        // Get the unspents available for this wallet.
        getUnspents: async () => {
          const wallet = store.wallet;
          if (!wallet) return;

          const utxos = await wallet.getUtxos();

          const privateKey = await getPrivateKey();

          const lockingBytecode = cashAddressToLockingBytecode(wallet.cashaddr as string);

          if (typeof lockingBytecode === 'string') {
            throw new Error('Failed to convert CashAddr to Locking Bytecode');
          }

          const transformed = utxos.map((utxo) => {
            let token:any;

            if (utxo.token) {
              token = {
                amount: BigInt(utxo.token.amount),
                category: hexToBin(utxo.token.tokenId),
              }

              if (utxo.token.capability || utxo.token.commitment) {
                token.nft = {
                  capability: utxo.token.capability,
                  commitment: hexToBin(utxo.token.commitment as string),
                }
              }
            }

            return {
              outpointTransactionHash: hexToBin(utxo.txid),
              outpointIndex: utxo.vout,
              lockingBytecode: lockingBytecode.bytecode,
              unlockingBytecode: {
                template: authenticationTemplateP2pkhNonHd,
                valueSatoshis: BigInt(utxo.satoshis),
                script: 'unlock',
                data: {
                  keys: {
                    privateKeys: {
                      key: privateKey,
                    },
                  },
                },
                token,
              }
            }
          })

          return transformed;
        },

        // Get the LibAuth change template for this wallet.
        getChangeTemplate: async () => {
          return {
            template: authenticationTemplateP2pkhNonHd,
            data: {
              keys: {
                privateKeys: {
                  key: await getPrivateKey()
                }
              }
            }
          }
        },
      },
    },
  )

  // Start cashConnectService
  await cashConnectService.start();
</script>

<template>
  <fieldset class="item">
    <legend>WalletConnect</legend>

    Connect New dApp:

    <input placeholder="Wallet Connect URI" style="margin-bottom: 10px;">
    <div style="display: flex; flex-wrap: wrap; justify-content: center; gap: 2rem;">
      <input @click="() => {}" type="button" class="primaryButton" id="connect" value="Connect New dApp">
      <input @click="() => {}" type="button" class="primaryButton" id="send" value="Scan QR Code">
    </div>
    

    <br/><br/>

    Active Sessions:
    <cashconnectSessions :sessions="sessions" :disconnectSession="disconnectSession"/>
  </fieldset>
</template>