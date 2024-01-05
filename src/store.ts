import { defineStore } from "pinia"
import { ref, computed } from 'vue'
import { Wallet, TestNetWallet, BaseWallet, Config } from "mainnet-js"
import { IndexedDBProvider } from "@mainnet-cash/indexeddb-storage"
import type { TokenData } from "./interfaces/interfaces"

// set mainnet-js config
Config.EnforceCashTokenReceiptAddresses = true;
// @ts-ignore
BaseWallet.StorageProvider = IndexedDBProvider;

const defaultChaingraph = "https://gql.chaingraph.pat.mn/v1/graphql";
const dafaultIpfsGateway = "https://ipfs.io/ipfs/";
const explorerUrlMainnet = "https://explorer.bitcoinunlimited.info";
const explorerUrlChipnet = "https://chipnet.chaingraph.cash";

export const useStore = defineStore('store', () => {
  // Wallet State
  const wallet = ref(null as (Wallet |TestNetWallet | null));
  const network = computed(() => wallet.value?.network == "mainnet" ? "mainnet" : "chipnet")
  let explorerUrl = computed(() => network.value == "mainnet" ? explorerUrlMainnet : explorerUrlChipnet);
  const tokenList = ref(null as (Array<TokenData> | null))

  // Global settings
  const bchUnit = ref("bch" as ("bch" | "sat"));
  const chaingraph = ref(defaultChaingraph);
  const ipfsGateway = ref(dafaultIpfsGateway);
  const darkMode  = ref(false);

  async function updateTokenList(resultGetFungibleTokens: any, resultGetNFTs: any){
    if(!wallet.value) return // should never happen
    // Option to fetch new tokenlist in advance or not
    if(!resultGetFungibleTokens || !resultGetNFTs){
      const promiseGetFungibleTokens = wallet.value?.getAllTokenBalances();
      const promiseGetNFTs = wallet.value?.getAllNftTokenBalances();
      const balancePromises: any[] = [promiseGetFungibleTokens, promiseGetNFTs];
      [resultGetFungibleTokens, resultGetNFTs] = await Promise.all(balancePromises);
    }
    // Get NFT data
    const arrayTokens:TokenData[] = [];
    for (const tokenId of Object.keys(resultGetFungibleTokens)) {
      arrayTokens.push({ tokenId, amount: resultGetFungibleTokens[tokenId] });
    }
    console.time('Utxo Promises');
    const nftUtxoPromises = [];
    for (const tokenId of Object.keys(resultGetNFTs)) {
      nftUtxoPromises.push(wallet.value.getTokenUtxos(tokenId));
    }
    const nftUtxoResults = await Promise.all(nftUtxoPromises);
    for (const nftUtxos of nftUtxoResults) {
      const tokenId = nftUtxos[0].token?.tokenId;
      if(!tokenId) return // should never happen
      arrayTokens.push({ tokenId, nfts: nftUtxos });
    }
    console.timeEnd('Utxo Promises');
    tokenList.value = arrayTokens;
  }

  return { wallet, network, explorerUrl, tokenList, updateTokenList, bchUnit, chaingraph, ipfsGateway, darkMode }
})